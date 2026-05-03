import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Button, TextInput, Avatar } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import { userService } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
      });
      loadUserBookings();
    }
  }, [user]);

  const loadUserData = async () => {
    await loadUser();
  };

  const loadUserBookings = async () => {
    try {
      const data = await userService.getBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleUpdateProfile = async (data) => {
    try {
      setLoading(true);
      const updatedUser = await userService.updateProfile(data);
      updateUser(updatedUser);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`}
          style={styles.avatar}
        />
        <Text style={styles.userName}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.userType}>
          {user.user_type === 'car_owner' ? 'Car Owner' : 'Space Provider'}
        </Text>
        {user.kyc_verified ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        ) : (
          <View style={styles.notVerifiedBadge}>
            <Text style={styles.notVerifiedText}>Not Verified</Text>
          </View>
        )}
      </View>

      <Card style={styles.section}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!editMode && (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editMode ? (
            <>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="First Name"
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    style={styles.input}
                  />
                )}
              />

              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Last Name"
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    style={styles.input}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Phone"
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                )}
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => setEditMode(false)}
                  style={styles.button}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit(handleUpdateProfile)}
                  style={styles.button}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rating:</Text>
                <Text style={styles.infoValue}>⭐ {user.rating || 'N/A'}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          {bookings.length > 0 ? (
            bookings.slice(0, 5).map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingItem}
                onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              >
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingSpace}>{booking.space_name}</Text>
                  <Text style={styles.bookingDate}>
                    {booking.check_in_date} - {booking.check_out_date}
                  </Text>
                </View>
                <View style={[styles.statusBadge, styles[`status${booking.status}`]]}>
                  <Text style={styles.statusText}>{booking.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No bookings yet</Text>
          )}
          {bookings.length > 0 && (
            <Button
              mode="text"
              onPress={() => navigation.navigate('MyBookings')}
              style={styles.viewAllButton}
            >
              View All Bookings
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Payment Methods</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>About ParkIT</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

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
    backgroundColor: '#4A90E2',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userType: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 10,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  verifiedText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  notVerifiedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  notVerifiedText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    margin: 15,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingSpace: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  bookingDate: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusconfirmed: {
    backgroundColor: '#E8F5E9',
  },
  statusactive: {
    backgroundColor: '#E3F2FD',
  },
  statuscompleted: {
    backgroundColor: '#F5F5F5',
  },
  statuscancelled: {
    backgroundColor: '#FFEBEE',
  },
  statuspending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllButton: {
    marginTop: 10,
  },
  settingItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 15,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    marginTop: 20,
    borderRadius: 8,
  },
  logoutButtonContent: {
    paddingVertical: 10,
  },
  bottomPadding: {
    height: 30,
  },
});
