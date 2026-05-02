import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Slider,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Searchbar, Card, Chip, IconButton, SegmentedButtons, Button } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { spaceService } from '../../services/api';
import useLocationStore from '../../store/locationStore';
import { rankSpaces } from '../../utils/ranking';
import { cacheMiddleware } from '../../utils/cache';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  // Location & Search State
  const {
    userLocation,
    searchMode,
    selectedDestination,
    searchFilters,
    nearbySpaces,
    isLoading,
    error,
    setUserLocation,
    setSearchMode,
    setSelectedDestination,
    setSearchFilters,
    setNearbySpaces,
  } = useLocationStore();

  // Local State
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [pagination, setPagination] = useState({ skip: 0, limit: 20 });
  const [localError, setLocalError] = useState(null);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [destinationInput, setDestinationInput] = useState('');
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const autoCompleteTimeoutRef = useRef(null);

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
  }, []);

  // Search when location or filters change
  useEffect(() => {
    if (searchMode === 'current_location' && userLocation) {
      searchNearby();
    }
  }, [searchMode, userLocation, searchFilters]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby spaces');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Location error:', error);
      setLocalError('Failed to get location');
    }
  };

  const searchNearby = async () => {
    if (!userLocation) return;

    try {
      setLocalError(null);
      
      const searchParams = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: searchFilters.radius_km,
        vehicle_type: searchFilters.vehicle_type === 'all' ? null : searchFilters.vehicle_type,
        sort_by: searchFilters.sort_by,
        limit: pagination.limit,
        skip: pagination.skip,
      };

      // Use cache middleware
      const results = await cacheMiddleware(
        searchParams,
        () => spaceService.getNearby(searchParams),
        { useCache: pagination.skip === 0 } // Only cache first page
      );

      // Apply ranking algorithm
      let spaces = results.data || [];
      if (pagination.skip === 0) {
        spaces = rankSpaces(spaces, {
          distanceKm: searchFilters.radius_km,
          userVehicleType: searchFilters.vehicle_type,
        });
      }

      setNearbySpaces(spaces);
    } catch (error) {
      console.error('Search error:', error);
      setLocalError(error.response?.data?.message || 'Search failed');
    }
  };

  const searchByDestination = async () => {
    if (!destinationInput.trim()) {
      setLocalError('Please enter a destination');
      return;
    }

    try {
      setLocalError(null);
      const results = await spaceService.searchByDestination({
        destination: destinationInput,
        radius: searchFilters.radius_km,
        vehicle_type: searchFilters.vehicle_type === 'all' ? null : searchFilters.vehicle_type,
        limit: pagination.limit,
        skip: pagination.skip,
      });
      setNearbySpaces(results.data || []);
      setSelectedDestination({
        address: destinationInput,
        latitude: results.destination?.latitude,
        longitude: results.destination?.longitude,
      });
      setShowAutoComplete(false);
    } catch (error) {
      console.error('Search error:', error);
      setLocalError(error.response?.data?.message || 'Search failed');
    }
  };

  const handleDestinationChange = (text) => {
    setDestinationInput(text);

    // Clear previous timeout
    if (autoCompleteTimeoutRef.current) {
      clearTimeout(autoCompleteTimeoutRef.current);
    }

    if (text.length > 2) {
      // Debounce autocomplete suggestions
      autoCompleteTimeoutRef.current = setTimeout(async () => {
        try {
          // Mock autocomplete - in production, use actual API
          const suggestions = [
            'Delhi Mall',
            'Connaught Place',
            'India Gate',
            'Mall of India',
            'Noida City Center',
          ].filter(s => s.toLowerCase().includes(text.toLowerCase()));
          setDestinationSuggestions(suggestions);
          setShowAutoComplete(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
        }
      }, 300);
    } else {
      setDestinationSuggestions([]);
      setShowAutoComplete(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPagination({ skip: 0, limit: 20 });
    if (searchMode === 'current_location') {
      await searchNearby();
    } else if (selectedDestination) {
      await searchByDestination();
    }
    setRefreshing(false);
  };

  const loadMoreSpaces = () => {
    setPagination(prev => ({ ...prev, skip: prev.skip + prev.limit }));
    if (searchMode === 'current_location') {
      searchNearby();
    } else {
      searchByDestination();
    }
  };

  const handleModeChange = (mode) => {
    setSearchMode(mode);
    setPagination({ skip: 0, limit: 20 });
    setLocalError(null);
  };

  const renderSpaceCard = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('SpaceDetails', { spaceId: item._id || item.id })}
    >
      <Card.Cover
        source={{ uri: item.images_url?.[0] || 'https://via.placeholder.com/400x200' }}
      />
      <Card.Content>
        <Text style={styles.spaceName}>{item.name}</Text>
        <Text style={styles.spaceAddress} numberOfLines={2}>
          {item.address}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>
              {item.available_spots || item.available_slots}/{item.total_capacity || item.total_slots}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{item.price_per_day || item.price_per_hour * 24}/day</Text>
          </View>
          {item.distance_km && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>{item.distance_km} km</Text>
            </View>
          )}
        </View>

        {item.amenities && item.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {item.amenities.slice(0, 3).map((amenity, index) => (
              <Chip key={index} style={styles.amenityChip} textStyle={styles.amenityText}>
                {amenity}
              </Chip>
            ))}
            {item.amenities.length > 3 && (
              <Chip style={styles.amenityChip} textStyle={styles.amenityText}>
                +{item.amenities.length - 3} more
              </Chip>
            )}
          </View>
        )}

        {item.relevance_score && (
          <Text style={styles.relevanceScore}>
            ✓ Match Score: {item.relevance_score}/100
          </Text>
        )}
      </Card.Content>

      <Card.Actions>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Booking', { spaceId: item._id || item.id })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );

  if (isLoading && pagination.skip === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Mode Toggle */}
      <View style={styles.modeContainer}>
        <SegmentedButtons
          value={searchMode}
          onValueChange={handleModeChange}
          buttons={[
            {
              value: 'current_location',
              label: 'Current Location',
              icon: 'map-marker',
            },
            {
              value: 'destination',
              label: 'Destination',
              icon: 'map-search',
            },
          ]}
          style={styles.modeButtons}
        />
      </View>

      {/* Search Input */}
      {searchMode === 'current_location' ? (
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Current location search..."
            editable={false}
            value={userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'Getting location...'}
            style={styles.searchbar}
            icon="map-marker"
            iconColor="#4A90E2"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <IconButton icon="filter-variant" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.searchContainer}>
          <View style={styles.destinationSearchContainer}>
            <Searchbar
              placeholder="Enter destination (mall, landmark)..."
              onChangeText={handleDestinationChange}
              value={destinationInput}
              style={styles.searchbar}
              icon="map-search"
              iconColor="#4A90E2"
              onSubmitEditing={searchByDestination}
            />
            {destinationInput && (
              <TouchableOpacity
                onPress={() => setDestinationInput('')}
                style={styles.clearButton}
              >
                <IconButton icon="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Autocomplete Suggestions */}
          {showAutoComplete && destinationSuggestions.length > 0 && (
            <View style={styles.autoCompleteContainer}>
              {destinationSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setDestinationInput(suggestion);
                    setShowAutoComplete(false);
                  }}
                >
                  <IconButton icon="map-marker" size={18} color="#999" />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterVisible(!filterVisible)}
          >
            <IconButton icon="filter-variant" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      )}

      {/* Filters */}
      {filterVisible && (
        <ScrollView style={styles.filterContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Radius: {searchFilters.radius_km} km</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={searchMode === 'current_location' ? 20 : 15}
              step={1}
              value={searchFilters.radius_km}
              onValueChange={(value) =>
                setSearchFilters({ ...searchFilters, radius_km: value })
              }
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Vehicle Type</Text>
            <View style={styles.filterChips}>
              {['all', 'car', 'bike', 'truck'].map((type) => (
                <Chip
                  key={type}
                  selected={searchFilters.vehicle_type === type}
                  onPress={() =>
                    setSearchFilters({ ...searchFilters, vehicle_type: type })
                  }
                  style={styles.filterChip}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort By</Text>
            <View style={styles.filterChips}>
              {['distance', 'rating', 'price', 'availability'].map((sort) => (
                <Chip
                  key={sort}
                  selected={searchFilters.sort_by === sort}
                  onPress={() =>
                    setSearchFilters({ ...searchFilters, sort_by: sort })
                  }
                  style={styles.filterChip}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Chip>
              ))}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={() => {
              setFilterVisible(false);
              searchMode === 'current_location' ? searchNearby() : searchByDestination();
            }}
            style={styles.applyButton}
          >
            Apply Filters
          </Button>
        </ScrollView>
      )}

      {/* Error Display */}
      {(error || localError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || localError}</Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={nearbySpaces}
        renderItem={renderSpaceCard}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreSpaces}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && pagination.skip > 0 ? (
            <ActivityIndicator size="small" color="#4A90E2" style={styles.loadingFooter} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchMode === 'current_location'
                  ? 'No parking spaces nearby'
                  : 'Enter a destination to search'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modeButtons: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  destinationSearchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchbar: {
    flex: 1,
    elevation: 2,
  },
  clearButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  autoCompleteContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: -8,
  },
  filterButton: {
    marginLeft: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 350,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  applyButton: {
    marginTop: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
  },
  listContainer: {
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  spaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  spaceAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityChip: {
    marginRight: 5,
    backgroundColor: '#e3f2fd',
  },
  amenityText: {
    fontSize: 12,
    color: '#4A90E2',
  },
  relevanceScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
});
