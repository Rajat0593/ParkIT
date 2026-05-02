import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function MyBookingsScreen() {
  return (
    <View style={styles.container}>
      <Text>My Bookings Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
