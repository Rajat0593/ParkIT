import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AddVehicleScreen() {
  return (
    <View style={styles.container}>
      <Text>Add Vehicle Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
