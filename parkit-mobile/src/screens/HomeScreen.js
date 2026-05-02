import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Searchbar, Card, Chip, IconButton } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { spaceService } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    vehicleType: 'all',
    priceRange: 'all',
  });

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const data = await spaceService.getAll();
      setSpaces(data);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSpaces();
    setRefreshing(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await spaceService.search(query);
        setSpaces(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      loadSpaces();
    }
  };

  const renderSpaceCard = ({ item }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('SpaceDetails', { spaceId: item.id })}>
      <Card.Cover source={{ uri: item.images_url?.[0] || 'https://via.placeholder.com/400x200' }} />
      <Card.Content>
        <Text style={styles.spaceName}>{item.name}</Text>
        <Text style={styles.spaceAddress} numberOfLines={2}>
          {item.address}
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>{item.available_slots}/{item.total_slots}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{item.price_per_day}/day</Text>
          </View>
        </View>
        <View style={styles.amenitiesRow}>
          {item.amenities?.slice(0, 3).map((amenity, index) => (
            <Chip key={index} style={styles.amenityChip} textStyle={styles.amenityText}>
              {amenity}
            </Chip>
          ))}
          {item.amenities?.length > 3 && (
            <Chip style={styles.amenityChip} textStyle={styles.amenityText}>
              +{item.amenities.length - 3} more
            </Chip>
          )}
        </View>
      </Card.Content>
      <Card.Actions>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Booking', { spaceId: item.id })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search parking spaces..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#4A90E2"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <IconButton icon="filter-variant" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {filterVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Vehicle Type:</Text>
          <View style={styles.filterChips}>
            {['all', 'car', 'bike', 'truck'].map((type) => (
              <Chip
                key={type}
                selected={selectedFilters.vehicleType === type}
                onPress={() =>
                  setSelectedFilters({ ...selectedFilters, vehicleType: type })
                }
                style={styles.filterChip}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={spaces}
        renderItem={renderSpaceCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No parking spaces found</Text>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    elevation: 2,
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
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
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
});
