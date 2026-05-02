import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpaceDetailsScreen({ route }) {
  const { spaceId } = route.params;

  return (
    <View style={styles.container}>
      <Text>Space Details - {spaceId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
