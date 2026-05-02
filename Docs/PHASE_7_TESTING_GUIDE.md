# ParkIT Platform - End-to-End Testing Guide (Phase 7)

## Overview
This document provides comprehensive testing procedures for the ParkIT platform covering all phases (Phases 1-6), including unit tests, integration tests, and end-to-end test scenarios.

## Table of Contents
1. [Testing Architecture](#testing-architecture)
2. [Backend Testing](#backend-testing)
3. [Mobile Testing](#mobile-testing)
4. [Admin Dashboard Testing](#admin-dashboard-testing)
5. [Integration Testing](#integration-testing)
6. [Performance Testing](#performance-testing)

---

## Testing Architecture

### Test Framework Stack
- **Backend**: Jest + Supertest (Node.js)
- **Mobile**: Jest + React Native Testing Library
- **Admin Web**: Jest + React Testing Library + Cypress (E2E)
- **API Testing**: Postman Collections

### Test Coverage Goals
- Backend: 80%+ unit + integration coverage
- Mobile: 70%+ component coverage
- Admin: 60%+ critical path coverage

---

## Backend Testing

### 1. Authentication Testing

#### Test Case 1.1: User Registration
```javascript
// tests/auth.test.js
describe('User Registration', () => {
  test('should register new user with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        phone: '+919876543210'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('john@example.com');
    expect(response.body.data.token).toBeDefined();
  });

  test('should reject registration with existing email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'john@example.com',
        password: 'SecurePass123!'
      })
      .expect(409);
  });

  test('should validate password strength', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john2@example.com',
        password: '123' // Too weak
      })
      .expect(400);

    expect(response.body.message).toContain('password');
  });
});
```

#### Test Case 1.2: Login & Token Refresh
```javascript
describe('User Login', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'SecurePass123!'
      })
      .expect(200);

    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  test('should refresh access token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'SecurePass123!'
      });

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginRes.body.data.refreshToken })
      .expect(200);

    expect(response.body.data.token).toBeDefined();
  });
});
```

### 2. Geospatial Query Testing

#### Test Case 2.1: Nearby Spaces Search
```javascript
describe('Geospatial Queries', () => {
  test('should find nearby spaces within radius', async () => {
    const response = await request(app)
      .get('/api/spaces/search/nearby')
      .query({
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 5,
        limit: 20
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    response.body.data.forEach(space => {
      expect(space.distance_km).toBeLessThanOrEqual(5);
      expect(space.relevance_score).toBeDefined();
    });
  });

  test('should order results by distance', async () => {
    const response = await request(app)
      .get('/api/spaces/search/nearby?latitude=28.6139&longitude=77.2090&radius=10&sort_by=distance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const distances = response.body.data.map(s => s.distance_km);
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  test('should apply vehicle type filter', async () => {
    const response = await request(app)
      .get('/api/spaces/search/nearby')
      .query({
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 5,
        vehicle_type: 'bike'
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    response.body.data.forEach(space => {
      expect(space.supported_vehicle_types).toContain('bike');
    });
  });
});
```

#### Test Case 2.2: Destination Search
```javascript
describe('Destination Search', () => {
  test('should search parking near destination', async () => {
    const response = await request(app)
      .get('/api/spaces/search/destination')
      .query({
        destination: 'India Gate, Delhi',
        radius: 3,
        limit: 20
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
  });

  test('should geocode destination address', async () => {
    const response = await request(app)
      .get('/api/spaces/search/destination')
      .query({
        destination: 'Connaught Place, Delhi'
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data[0].latitude).toBeDefined();
    expect(response.body.data[0].longitude).toBeDefined();
  });
});
```

### 3. Booking Management Testing

#### Test Case 3.1: Booking Creation
```javascript
describe('Booking Management', () => {
  test('should create booking with valid data', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        space_id: spaceId,
        vehicle_id: vehicleId,
        check_in_time: new Date().toISOString(),
        check_out_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        total_price: 500
      })
      .expect(201);

    expect(response.body.data.booking_id).toBeDefined();
    expect(response.body.data.status).toBe('confirmed');
  });

  test('should reject booking if space unavailable', async () => {
    // First booking
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        space_id: spaceId,
        vehicle_id: vehicleId,
        check_in_time: new Date().toISOString(),
        check_out_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        total_price: 500
      });

    // Second conflicting booking
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        space_id: spaceId,
        vehicle_id: vehicleId2,
        check_in_time: new Date().toISOString(),
        check_out_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        total_price: 500
      })
      .expect(409);

    expect(response.body.message).toContain('unavailable');
  });
});
```

### 4. Database Index Testing

#### Test Case 4.1: Index Performance
```javascript
describe('Database Performance', () => {
  test('geospatial query should use index', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/spaces/search/nearby')
      .query({
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 5
      })
      .set('Authorization', `Bearer ${token}`);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500); // Should be fast with index
  });

  test('compound index should optimize filtered search', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/spaces/search/nearby')
      .query({
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 5,
        min_rating: 4,
        vehicle_type: 'car'
      })
      .set('Authorization', `Bearer ${token}`);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(700);
  });
});
```

---

## Mobile Testing

### 1. Location Permission Testing

#### Test Case 1.1: Location Permission Flow
```javascript
// __tests__/screens/HomeScreen.test.js
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../src/screens/HomeScreen';
import * as Location from 'expo-location';

jest.mock('expo-location');

describe('HomeScreen Location Permissions', () => {
  test('should request location permission on mount', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted'
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  test('should show error if permission denied', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'denied'
    });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText(/permission denied/i)).toBeTruthy();
    });
  });

  test('should get current location after permission granted', async () => {
    Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      status: 'granted'
    });
    Location.getCurrentPositionAsync.mockResolvedValueOnce({
      coords: {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 10
      }
    });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });
  });
});
```

### 2. Search Functionality Testing

#### Test Case 2.1: Search Mode Toggle
```javascript
describe('Search Mode', () => {
  test('should toggle between current location and destination modes', async () => {
    const { getByText } = render(<HomeScreen />);
    
    fireEvent.press(getByText('By Destination'));
    
    await waitFor(() => {
      expect(getByText(/enter destination/i)).toBeTruthy();
    });
  });

  test('should display search results', async () => {
    const mockResults = [
      {
        id: 1,
        name: 'Parking A',
        distance_km: 2.5,
        relevance_score: 85
      },
      {
        id: 2,
        name: 'Parking B',
        distance_km: 3.2,
        relevance_score: 78
      }
    ];

    jest.mock('../../src/services/api', () => ({
      spaceService: {
        getNearby: jest.fn().mockResolvedValueOnce({ data: mockResults })
      }
    }));

    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('Search'));

    await waitFor(() => {
      expect(getByText('Parking A')).toBeTruthy();
      expect(getByText('Parking B')).toBeTruthy();
    });
  });
});
```

### 3. Caching Testing

#### Test Case 3.1: Cache Hit/Miss
```javascript
describe('Search Caching', () => {
  test('should return cached results on second search', async () => {
    const mockResults = [
      { id: 1, name: 'Parking A', distance_km: 2.5 }
    ];

    const getNearby = jest.fn().mockResolvedValueOnce({ data: mockResults });

    // First search
    await getNearby({ latitude: 28.6139, longitude: 77.2090 });
    expect(getNearby).toHaveBeenCalledTimes(1);

    // Second identical search (should use cache)
    const cached = await getCachedSearch({ latitude: 28.6139, longitude: 77.2090 });
    expect(cached).toEqual(mockResults);
    expect(getNearby).toHaveBeenCalledTimes(1); // Still 1, not 2
  });

  test('should expire cache after TTL', async () => {
    jest.useFakeTimers();
    
    const searchParams = { latitude: 28.6139, longitude: 77.2090 };
    const mockResults = [{ id: 1, name: 'Parking A' }];

    await setCachedSearch(searchParams, mockResults);
    
    // Skip 11 minutes (TTL is 10 minutes)
    jest.advanceTimersByTime(11 * 60 * 1000);

    const cached = await getCachedSearch(searchParams);
    expect(cached).toBeNull();

    jest.useRealTimers();
  });
});
```

### 4. Ranking Algorithm Testing

#### Test Case 4.1: Relevance Score Calculation
```javascript
import { rankSpaces } from '../../src/utils/ranking';

describe('Ranking Algorithm', () => {
  test('should calculate correct relevance scores', () => {
    const spaces = [
      {
        id: 1,
        name: 'Space A',
        distance_km: 1,
        available_slots: 5,
        total_slots: 10,
        rating: 4.8,
        price_per_day: 500,
        supported_vehicle_types: ['car', 'bike']
      },
      {
        id: 2,
        name: 'Space B',
        distance_km: 5,
        available_slots: 1,
        total_slots: 10,
        rating: 3.5,
        price_per_day: 800,
        supported_vehicle_types: ['car']
      }
    ];

    const userFilters = {
      distanceKm: 5,
      userVehicleType: 'car'
    };

    const ranked = rankSpaces(spaces, userFilters);
    
    expect(ranked[0].relevance_score).toBeGreaterThan(ranked[1].relevance_score);
    expect(ranked[0].id).toBe(1); // Closer, better rating
  });

  test('should weight factors correctly', () => {
    // Test: Distance 30%, Availability 25%, Rating 20%, Price 15%, Type 10%
    const spaces = [{
      id: 1,
      name: 'Space A',
      distance_km: 2,
      available_slots: 10,
      total_slots: 10,
      rating: 5,
      price_per_day: 500,
      supported_vehicle_types: ['car']
    }];

    const ranked = rankSpaces(spaces, { distanceKm: 10, userVehicleType: 'car' });
    
    // Should be a good score (close, available, high rating)
    expect(ranked[0].relevance_score).toBeGreaterThan(80);
  });
});
```

---

## Admin Dashboard Testing

### 1. Heatmap Visualization Testing

#### Test Case 1.1: Heatmap Data Processing
```javascript
import LocationHeatmap, { HeatmapGrid } from '../../src/components/LocationHeatmap';

describe('Location Heatmap', () => {
  test('should process booking data into heatmap', () => {
    const mockBookings = [
      {
        space: {
          address: '123 MG Road, Bangalore',
          latitude: 13.0827,
          longitude: 80.2707,
          rating: 4.5
        },
        total_price: 500,
        check_in_time: new Date().toISOString()
      },
      {
        space: {
          address: '456 MG Road, Bangalore',
          latitude: 13.0830,
          longitude: 80.2710,
          rating: 4.2
        },
        total_price: 450,
        check_in_time: new Date().toISOString()
      }
    ];

    const { heatmapData } = LocationHeatmap({ data: mockBookings });

    expect(heatmapData.length).toBeGreaterThan(0);
    expect(heatmapData[0]).toHaveProperty('area');
    expect(heatmapData[0]).toHaveProperty('bookings');
    expect(heatmapData[0]).toHaveProperty('density');
  });

  test('should calculate density percentage', () => {
    const mockData = [
      { area: 'Area A', bookings: 100 },
      { area: 'Area B', bookings: 50 },
      { area: 'Area C', bookings: 25 }
    ];

    const { heatmapData } = LocationHeatmap({ data: mockData });
    
    // Area A should have highest density
    expect(heatmapData[0].density).toBe(100);
    expect(heatmapData[1].density).toBe(50);
  });
});
```

### 2. Spaces Management Testing

#### Test Case 2.1: Space Edit Form
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Spaces from '../../src/pages/Spaces';

describe('Spaces Management', () => {
  test('should open edit dialog on edit button click', async () => {
    const mockSpace = {
      id: 1,
      name: 'Test Parking',
      address: '123 Main St',
      latitude: 28.6139,
      longitude: 77.2090
    };

    render(<Spaces spaces={[mockSpace]} />);

    fireEvent.click(screen.getByTitle('Edit'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Parking')).toBeTruthy();
    });
  });

  test('should validate coordinates', async () => {
    render(<Spaces />);

    fireEvent.click(screen.getByText('Edit'));

    const latInput = screen.getByLabelText('Latitude');
    fireEvent.change(latInput, { target: { value: 'invalid' } });

    expect(latInput.value).toBe('0'); // Should be number field
  });
});
```

---

## Integration Testing

### Test Case 1: Complete Booking Flow
```javascript
describe('End-to-End: Complete Booking', () => {
  test('user registers -> searches -> books -> receives confirmation', async () => {
    // 1. Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
        phone: '+919876543210'
      })
      .expect(201);

    const token = registerRes.body.data.token;

    // 2. Get user location (mocked)
    const userLocation = { latitude: 28.6139, longitude: 77.2090 };

    // 3. Search nearby spaces
    const searchRes = await request(app)
      .get('/api/spaces/search/nearby')
      .query({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: 5
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(searchRes.body.data.length).toBeGreaterThan(0);
    const spaceId = searchRes.body.data[0].id;

    // 4. Create booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        space_id: spaceId,
        vehicle_id: 'vehicle-123',
        check_in_time: new Date().toISOString(),
        check_out_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        total_price: 500
      })
      .expect(201);

    // 5. Verify booking confirmation
    expect(bookingRes.body.data.status).toBe('confirmed');
    expect(bookingRes.body.data.booking_id).toBeDefined();
  });
});
```

---

## Performance Testing

### Load Testing with Artillery
```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Ramp up'
    - duration: 60
      arrivalRate: 100
      name: 'Spike'

scenarios:
  - name: 'Search Flow'
    flow:
      - get:
          url: '/api/spaces/search/nearby?latitude=28.6139&longitude=77.2090&radius=5'
          headers:
            Authorization: 'Bearer {{ token }}'
      - think: 5
      - get:
          url: '/api/spaces/{{ spaceId }}/details'
          headers:
            Authorization: 'Bearer {{ token }}'
```

### Running Performance Tests
```bash
# Backend API load testing
artillery run load-test.yml

# Mobile app performance
npm test -- --coverage
```

---

## Checklist for QA

### Backend
- [ ] All authentication endpoints tested
- [ ] Geospatial queries return correct results
- [ ] Database indexes are being used
- [ ] Error handling covers all edge cases
- [ ] API response times < 500ms
- [ ] Concurrent bookings handled correctly

### Mobile
- [ ] Location permission flow works
- [ ] Search results display correctly
- [ ] Caching reduces API calls
- [ ] Ranking scores are accurate
- [ ] Maps display correctly
- [ ] Navigation between screens works

### Admin Dashboard
- [ ] Heatmap displays correctly
- [ ] Analytics data accurate
- [ ] Space editing saves correctly
- [ ] Filters work on spaces list
- [ ] Charts render without errors

### Integration
- [ ] Complete booking flow works
- [ ] Real-time updates propagate
- [ ] Data consistency maintained
- [ ] No data loss on app crash

---

## Deployment Checklist

- [ ] All tests pass locally
- [ ] Code coverage > 70%
- [ ] No console errors/warnings
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] SSL/TLS enabled
- [ ] Error logging configured
- [ ] Monitoring alerts set
- [ ] Backup strategy verified

