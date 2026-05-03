import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import { Card, Button, IconButton, Chip } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { spaceService } from '../services/api';
import useLocationStore from '../store/locationStore';

export default function SpaceDetailsScreen({ navigation, route }) {
  const { spaceId } = route.params;
  const { userLocation } = useLocationStore();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(userLocation);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    loadSpaceDetails();
    calculateDistance();
  }, [spaceId]);

  const loadSpaceDetails = async () => {
    try {
      setLoading(true);
      const data = await spaceService.getById(spaceId);
      setSpace(data.data || data);
    } catch (error) {
      console.error('Error loading space:', error);
      Alert.alert('Error', 'Failed to load space details');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async () => {
    try {
      if (!userLoc) {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLoc({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      if (userLoc && space) {
        const R = 6371; // Earth's radius in km
        const dLat = ((space.location.latitude - userLoc.latitude) * Math.PI) / 180;
        const dLng = ((space.location.longitude - userLoc.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLoc.latitude * Math.PI) / 180) *
            Math.cos((space.location.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;
        const durationMin = Math.round((distanceKm / 50) * 60); // Assuming 50 km/h avg speed

        setDistance(distanceKm.toFixed(2));
        setDuration(durationMin);
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
    }
  };

  const handleGetDirections = () => {
    if (!space) return;

    const label = encodeURIComponent(space.name);
    const url = `https://maps.google.com/?q=${label}@${space.location.latitude},${space.location.longitude}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps');
    });
  };

  const handleBookNow = () => {
    navigation.navigate('Booking', { spaceId });
  };

  const renderReview = ({ item }) => (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewUser}>{item.user}</Text>
          <Text style={styles.reviewRating}>{'⭐'.repeat(item.rating)}</Text>
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
        <Text style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!space) {
    return (
      <View style={styles.centerContainer}>
        <Text>Space not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Image */}
      {space.images?.[0] && (
        <Card.Cover
          source={{ uri: space.images[0] }}
          style={styles.image}
        />
      )}

      {/* Basic Info */}
      <View style={styles.header}>
        <Text style={styles.title}>{space.name}</Text>
        <Text style={styles.address}>{space.location.address}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {space.rating}/5</Text>
          <Text style={styles.reviewCount}>({space.reviews_count} reviews)</Text>
        </View>
      </View>

      {/* Map View */}
      <Card style={styles.section}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(space.location.latitude),
              longitude: parseFloat(space.location.longitude),
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            {/* User Location */}
            {userLoc && (
              <Marker
                coordinate={{
                  latitude: userLoc.latitude,
                  longitude: userLoc.longitude,
                }}
                title="Your Location"
                pinColor="blue"
              />
            )}

            {/* Space Location */}
            <Marker
              coordinate={{
                latitude: parseFloat(space.location.latitude),
                longitude: parseFloat(space.location.longitude),
              }}
              title={space.name}
              pinColor="red"
            />
          </MapView>
        </View>
      </Card>

      {/* Distance & Duration Card */}
      {distance && (
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.distanceRow}>
              <View style={styles.distanceItem}>
                <IconButton icon="map-marker-distance" size={24} color="#4A90E2" />
                <Text style={styles.distanceLabel}>Distance</Text>
                <Text style={styles.distanceValue}>{distance} km</Text>
              </View>
              <View style={styles.distanceDivider} />
              <View style={styles.distanceItem}>
                <IconButton icon="clock-outline" size={24} color="#4A90E2" />
                <Text style={styles.distanceLabel}>Avg Travel</Text>
                <Text style={styles.distanceValue}>{duration} min</Text>
              </View>
              <View style={styles.distanceDivider} />
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={handleGetDirections}
              >
                <IconButton icon="directions" size={24} color="#fff" />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Pricing */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Per Hour</Text>
              <Text style={styles.priceValue}>₹{space.price_per_hour}/hr</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Per Day</Text>
              <Text style={styles.priceValue}>₹{space.price_per_day}/day</Text>
            </View>
            {space.price_per_month && (
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Per Month</Text>
                <Text style={styles.priceValue}>₹{space.price_per_month}/mo</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Capacity & Availability */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityItem}>
              <Text style={styles.availabilityLabel}>Total Capacity</Text>
              <Text style={styles.availabilityValue}>{space.capacity} spots</Text>
            </View>
            <View style={styles.availabilityItem}>
              <Text style={styles.availabilityLabel}>Available Now</Text>
              <Text style={[styles.availabilityValue, { color: '#4CAF50' }]}>
                {space.available_spots} spots
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(space.available_spots / space.capacity) * 100}%`,
                },
              ]}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Vehicle Types */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Vehicle Types Allowed</Text>
          <View style={styles.chipsRow}>
            {space.vehicle_types?.map((type) => (
              <Chip key={type} style={styles.typeChip}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Amenities */}
      {space.amenities && space.amenities.length > 0 && (
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {space.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityItem}>
                  <IconButton
                    icon={getAmenityIcon(amenity)}
                    size={20}
                    color="#4A90E2"
                  />
                  <Text style={styles.amenityLabel}>
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Description */}
      {space.description && (
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{space.description}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Reviews */}
      {space.reviews && space.reviews.length > 0 && (
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Reviews ({space.reviews_count})
            </Text>
            <FlatList
              data={space.reviews}
              renderItem={renderReview}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleBookNow}
          style={styles.bookButton}
          contentStyle={styles.buttonContent}
        >
          Book Now
        </Button>
        <Button
          mode="outlined"
          onPress={handleGetDirections}
          style={styles.directionsButtonAlt}
          contentStyle={styles.buttonContent}
        >
          Get Directions
        </Button>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function getAmenityIcon(amenity) {
  const iconMap = {
    covered: 'home-roof',
    security: 'shield-check',
    washing: 'water-wash',
    maintenance: 'hammer-wrench',
    charging: 'ev-station',
    lighting: 'lightbulb',
    cctv: 'cctv',
    '24h': 'clock-24',
  };
  return iconMap[amenity] || 'check-circle';
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
  image: {
    height: 250,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  reviewCount: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    margin: 12,
    elevation: 2,
  },
  mapContainer: {
    height: 250,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  distanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  distanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  directionsButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  directionsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginTop: -8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  availabilityItem: {
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  availabilityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#e3f2fd',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  amenityItem: {
    alignItems: 'center',
    width: '33.33%',
    marginVertical: 12,
  },
  amenityLabel: {
    fontSize: 11,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reviewCard: {
    marginBottom: 12,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  directionsButtonAlt: {
    flex: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  bottomPadding: {
    height: 20,
  },
});
