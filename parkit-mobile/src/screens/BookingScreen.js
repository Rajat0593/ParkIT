import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Button, TextInput, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import MapView, { Marker } from 'react-native-maps';
import { spaceService, bookingService, vehicleService } from '../services/api';
import { format } from 'date-fns';

export default function BookingScreen({ navigation, route }) {
  const { spaceId } = route.params;
  const [space, setSpace] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState('daily');

  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: '',
      checkInTime: '10:00',
      checkOutTime: '18:00',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [spaceData, vehiclesData] = await Promise.all([
        spaceService.getById(spaceId),
        vehicleService.getAll(),
      ]);
      setSpace(spaceData);
      setVehicles(vehiclesData);
      if (vehiclesData.length > 0) {
        setSelectedVehicle(vehiclesData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!space) return 0;

    const checkIn = new Date(watch('checkInDate'));
    const checkOut = new Date(watch('checkOutDate') || checkIn);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) + 1;

    if (bookingType === 'daily') {
      return space.price_per_day * days;
    } else if (bookingType === 'monthly') {
      return space.price_per_month || space.price_per_day * 30;
    }
    return space.price_per_day;
  };

  const handleBooking = async (data) => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle');
      return;
    }

    try {
      const bookingData = {
        space_id: spaceId,
        vehicle_id: selectedVehicle.id,
        check_in_date: data.checkInDate,
        check_out_date: data.checkOutDate || data.checkInDate,
        check_in_time: data.checkInTime,
        check_out_time: data.checkOutTime,
        booking_type: bookingType,
        total_price: calculateTotalPrice(),
      };

      await bookingService.create(bookingData);
      Alert.alert('Success', 'Booking created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Booking failed');
    }
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Book {space.name}</Text>
        <Text style={styles.address}>{space.address}</Text>
      </View>

      {space.images_url?.[0] && (
        <Card.Cover
          source={{ uri: space.images_url[0] }}
          style={styles.image}
        />
      )}

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: parseFloat(space.latitude),
            longitude: parseFloat(space.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: parseFloat(space.latitude),
              longitude: parseFloat(space.longitude),
            }}
            title={space.name}
          />
        </MapView>
      </View>

      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Booking Type</Text>
          <View style={styles.bookingTypeContainer}>
            <Chip
              selected={bookingType === 'daily'}
              onPress={() => setBookingType('daily')}
              style={styles.typeChip}
            >
              Daily (₹{space.price_per_day}/day)
            </Chip>
            {space.price_per_month && (
              <Chip
                selected={bookingType === 'monthly'}
                onPress={() => setBookingType('monthly')}
                style={styles.typeChip}
              >
                Monthly (₹{space.price_per_month}/month)
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Select Vehicle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.vehicleContainer}>
              {vehicles.map((vehicle) => (
                <Chip
                  key={vehicle.id}
                  selected={selectedVehicle?.id === vehicle.id}
                  onPress={() => setSelectedVehicle(vehicle)}
                  style={styles.vehicleChip}
                >
                  {vehicle.registration_number}
                </Chip>
              ))}
              <TouchableOpacity
                style={styles.addVehicleButton}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Text style={styles.addVehicleText}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Select Dates & Times</Text>
          
          <Controller
            control={control}
            name="checkInDate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Check-in Date"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="checkOutDate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Check-out Date (Optional)"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <View style={styles.timeRow}>
            <Controller
              control={control}
              name="checkInTime"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Check-in Time"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.timeInput}
                />
              )}
            />

            <Controller
              control={control}
              name="checkOutTime"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Check-out Time"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.timeInput}
                />
              )}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.priceSection}>
        <Card.Content>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Price:</Text>
            <Text style={styles.priceValue}>₹{calculateTotalPrice()}</Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSubmit(handleBooking)}
        style={styles.bookButton}
        contentStyle={styles.bookButtonContent}
      >
        Confirm Booking
      </Button>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  image: {
    height: 200,
  },
  mapContainer: {
    height: 200,
    marginVertical: 10,
  },
  map: {
    flex: 1,
  },
  section: {
    margin: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
  },
  vehicleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  vehicleChip: {
    marginRight: 10,
  },
  addVehicleButton: {
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  addVehicleText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  priceSection: {
    margin: 10,
    elevation: 2,
    backgroundColor: '#e3f2fd',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  bookButton: {
    margin: 15,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  bookButtonContent: {
    paddingVertical: 12,
  },
  bottomPadding: {
    height: 30,
  },
});
