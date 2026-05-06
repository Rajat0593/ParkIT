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
  Animated,
} from 'react-native';
import { Searchbar, Card, Chip, IconButton, SegmentedButtons, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { spaceService } from '../services/api';
import useLocationStore from '../store/locationStore';
import { rankSpaces } from '../utils/ranking';
import { cacheMiddleware } from '../utils/cache';

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

  // Animation values
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const searchFadeAnim = useRef(new Animated.Value(0)).current;
  const filterSlideAnim = useRef(new Animated.Value(-300)).current;

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();
    // Start entrance animations
    Animated.stagger(200, [
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(searchFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Search when location or filters change
  useEffect(() => {
    if (searchMode === 'current_location' && userLocation) {
      searchNearby();
    }
  }, [searchMode, userLocation, searchFilters]);

  // Animate filter modal
  useEffect(() => {
    Animated.timing(filterSlideAnim, {
      toValue: filterVisible ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [filterVisible]);

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
      
      // Provide mock data when API is not available
      if (pagination.skip === 0) {
        const mockSpaces = [
          {
            _id: '1',
            name: 'Delhi Mall Parking',
            address: 'Delhi Mall, Rohini, New Delhi',
            latitude: userLocation.latitude + 0.01,
            longitude: userLocation.longitude + 0.01,
            distance_km: 1.2,
            price_per_day: 50,
            rating: 4.2,
            available_spots: 25,
            total_spots: 30,
            amenities: ['covered', 'security', '24/7'],
            vehicle_types: ['car', 'bike'],
            relevance_score: 85,
          },
          {
            _id: '2',
            name: 'Connaught Place Multi-Level',
            address: 'Connaught Place, New Delhi',
            latitude: userLocation.latitude - 0.005,
            longitude: userLocation.longitude + 0.008,
            distance_km: 2.5,
            price_per_day: 75,
            rating: 4.5,
            available_spots: 15,
            total_spots: 20,
            amenities: ['covered', 'security', 'valet'],
            vehicle_types: ['car'],
            relevance_score: 78,
          },
          {
            _id: '3',
            name: 'Mall of India Basement',
            address: 'Mall of India, Noida',
            latitude: userLocation.latitude + 0.015,
            longitude: userLocation.longitude - 0.012,
            distance_km: 3.1,
            price_per_day: 40,
            rating: 3.8,
            available_spots: 40,
            total_spots: 50,
            amenities: ['covered', 'security'],
            vehicle_types: ['car', 'bike', 'truck'],
            relevance_score: 72,
          },
        ];
        
        setNearbySpaces(mockSpaces);
        setLocalError('Using demo data - Backend API not available');
      } else {
        setLocalError(error.response?.data?.message || 'Search failed');
      }
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
      
      // Provide mock data when API is not available
      if (pagination.skip === 0) {
        const mockSpaces = [
          {
            _id: '4',
            name: `${destinationInput} Central Parking`,
            address: `${destinationInput}, New Delhi`,
            latitude: 28.6139,
            longitude: 77.2090,
            distance_km: 0.8,
            price_per_day: 60,
            rating: 4.0,
            available_spots: 20,
            total_spots: 25,
            amenities: ['covered', 'security'],
            vehicle_types: ['car', 'bike'],
            relevance_score: 80,
          },
          {
            _id: '5',
            name: `${destinationInput} Plaza Parking`,
            address: `${destinationInput} Plaza, New Delhi`,
            latitude: 28.6139 + 0.002,
            longitude: 77.2090 + 0.002,
            distance_km: 1.5,
            price_per_day: 45,
            rating: 3.9,
            available_spots: 35,
            total_spots: 40,
            amenities: ['covered'],
            vehicle_types: ['car', 'bike', 'truck'],
            relevance_score: 75,
          },
        ];
        
        setNearbySpaces(mockSpaces);
        setSelectedDestination({
          address: destinationInput,
          latitude: 28.6139,
          longitude: 77.2090,
        });
        setShowAutoComplete(false);
        setLocalError('Using demo data - Backend API not available');
      } else {
        setLocalError(error.response?.data?.message || 'Search failed');
      }
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

  const renderSpaceCard = ({ item, index }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.cardGradient}
        >
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('SpaceDetails', { spaceId: item._id || item.id })}
          >
            <Card.Cover
              source={{ uri: item.images_url?.[0] || 'https://via.placeholder.com/400x200/4A90E2/ffffff?text=Parking' }}
              style={styles.cardCover}
            />
            <View style={styles.cardOverlay}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.overlayGradient}
              >
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>₹{item.price_per_day || item.price_per_hour * 24}</Text>
                  <Text style={styles.priceSubtext}>per day</Text>
                </View>
              </LinearGradient>
            </View>

            <Card.Content style={styles.cardContent}>
              <Text style={styles.spaceName}>{item.name}</Text>
              <Text style={styles.spaceAddress} numberOfLines={2}>
                {item.address}
              </Text>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Available</Text>
                  <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                    {item.available_spots || item.available_slots}/{item.total_capacity || item.total_slots}
                  </Text>
                </View>
                {item.distance_km && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>{item.distance_km} km</Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rating</Text>
                  <Text style={styles.detailValue}>⭐ {item.rating || '4.2'}</Text>
                </View>
              </View>

              {item.amenities && item.amenities.length > 0 && (
                <View style={styles.amenitiesRow}>
                  {item.amenities.slice(0, 3).map((amenity, index) => (
                    <Chip
                      key={index}
                      style={styles.amenityChip}
                      textStyle={styles.amenityText}
                      icon={getAmenityIcon(amenity)}
                    >
                      {amenity}
                    </Chip>
                  ))}
                  {item.amenities.length > 3 && (
                    <Chip style={styles.amenityChip} textStyle={styles.amenityText}>
                      +{item.amenities.length - 3}
                    </Chip>
                  )}
                </View>
              )}

              {item.relevance_score && (
                <View style={styles.relevanceContainer}>
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.relevanceBadge}
                  >
                    <Text style={styles.relevanceScore}>
                      ✓ {item.relevance_score}/100 Match
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </Card.Content>

            <Card.Actions style={styles.cardActions}>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate('Booking', { spaceId: item._id || item.id })}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.bookButtonGradient}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Card.Actions>
          </Card>
        </LinearGradient>
      </Animated.View>
    );
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      'covered': 'car-brake-parking',
      'security': 'shield-check',
      '24/7': 'clock-outline',
      'valet': 'account-tie',
      'electric': 'lightning-bolt',
      'disabled': 'wheelchair-accessibility',
    };
    return icons[amenity.toLowerCase()] || 'check-circle';
  };

  if (isLoading && pagination.skip === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f8f9fa', '#e9ecef', '#dee2e6']}
      style={styles.container}
    >
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            transform: [
              {
                translateY: headerFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>ParkIT</Text>
            <Text style={styles.headerSubtitle}>Find your perfect parking spot</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Mode Toggle */}
      <Animated.View
        style={[
          styles.modeContainer,
          {
            opacity: searchFadeAnim,
            transform: [
              {
                translateY: searchFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
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
      <Animated.View
        style={[
          styles.filterModal,
          {
            transform: [{ translateX: filterSlideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.filterContainer}
        >
          <View style={styles.filterHeader}>
            <Text style={styles.filterHeaderTitle}>Filters</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setFilterVisible(false)}
              style={styles.closeButton}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Search Radius</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{searchFilters.radius_km} km</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={searchMode === 'current_location' ? 20 : 15}
                  step={1}
                  value={searchFilters.radius_km}
                  onValueChange={(value) =>
                    setSearchFilters({ ...searchFilters, radius_km: value })
                  }
                  minimumTrackTintColor="#667eea"
                  maximumTrackTintColor="#e0e0e0"
                  thumbStyle={styles.sliderThumb}
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Vehicle Type</Text>
              <View style={styles.filterChips}>
                {[
                  { key: 'all', label: 'All Vehicles', icon: 'car-multiple' },
                  { key: 'car', label: 'Car', icon: 'car' },
                  { key: 'bike', label: 'Bike', icon: 'motorbike' },
                  { key: 'truck', label: 'Truck', icon: 'truck' },
                ].map((type) => (
                  <Chip
                    key={type.key}
                    selected={searchFilters.vehicle_type === type.key}
                    onPress={() =>
                      setSearchFilters({ ...searchFilters, vehicle_type: type.key })
                    }
                    style={[
                      styles.filterChip,
                      searchFilters.vehicle_type === type.key && styles.selectedChip,
                    ]}
                    textStyle={styles.filterChipText}
                    icon={type.icon}
                  >
                    {type.label}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Sort By</Text>
              <View style={styles.filterChips}>
                {[
                  { key: 'distance', label: 'Distance', icon: 'map-marker-distance' },
                  { key: 'rating', label: 'Rating', icon: 'star' },
                  { key: 'price', label: 'Price', icon: 'cash' },
                  { key: 'availability', label: 'Availability', icon: 'parking' },
                ].map((sort) => (
                  <Chip
                    key={sort.key}
                    selected={searchFilters.sort_by === sort.key}
                    onPress={() =>
                      setSearchFilters({ ...searchFilters, sort_by: sort.key })
                    }
                    style={[
                      styles.filterChip,
                      searchFilters.sort_by === sort.key && styles.selectedChip,
                    ]}
                    textStyle={styles.filterChipText}
                    icon={sort.icon}
                  >
                    {sort.label}
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
              contentStyle={styles.applyButtonContent}
            >
              Apply Filters
            </Button>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  header: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },
  modeContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeButtons: {
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  destinationSearchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchbar: {
    flex: 1,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  clearButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  autoCompleteContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    elevation: 2,
  },
  filterModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    zIndex: 1000,
  },
  filterContainer: {
    flex: 1,
    paddingTop: 50,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    margin: 0,
  },
  filterSection: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#667eea',
    borderWidth: 2,
    borderColor: '#fff',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    marginRight: 0,
    marginBottom: 0,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedChip: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterChipText: {
    color: '#666',
  },
  applyButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#667eea',
    borderRadius: 12,
    elevation: 4,
  },
  applyButtonContent: {
    paddingVertical: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    elevation: 2,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  cardContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  cardGradient: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  card: {
    borderRadius: 16,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  cardCover: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 150,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  overlayGradient: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
  },
  priceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priceSubtext: {
    fontSize: 10,
    color: '#666',
  },
  cardContent: {
    padding: 16,
  },
  spaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  spaceAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  amenityChip: {
    backgroundColor: '#e3f2fd',
    borderWidth: 0,
  },
  amenityText: {
    color: '#1976d2',
    fontSize: 12,
  },
  relevanceContainer: {
    alignItems: 'flex-start',
  },
  relevanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  relevanceScore: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardActions: {
    padding: 16,
    paddingTop: 0,
  },
  bookButton: {
    flex: 1,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingFooter: {
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
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
