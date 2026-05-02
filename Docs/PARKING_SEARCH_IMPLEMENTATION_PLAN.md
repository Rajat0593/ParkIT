# Location-Based Parking Search Implementation Plan

## Overview

This document outlines the comprehensive implementation strategy for the location-based parking discovery feature, enabling users to find optimal parking spots near their current location or a specified destination with best efficiency and optimization.

**Timeline:** 14-20 days (6 phases)  
**Complexity Level:** High (Geospatial queries, real-time location tracking, optimization algorithms)

---

## 1. Architecture Overview

### Two-Mode Search System

#### Mode 1: Current Location Search
- Uses GPS coordinates from user's device
- Searches within configurable radius (1-20 km)
- Real-time updates every 30 seconds
- Optimized for battery consumption with geofencing

#### Mode 2: Destination Search
- User enters destination address/landmark
- Geocoding converts address to coordinates via Google Maps API
- Searches within specified radius of destination
- Static search (no continuous updates needed)

### Search Result Ranking Algorithm

The system ranks parking spaces using a weighted multi-factor scoring system:

```
Score = (Distance_Score × 0.30) +
         (Availability_Score × 0.25) +
         (Rating_Score × 0.20) +
         (Price_Score × 0.15) +
         (Type_Match_Score × 0.10)

Weights Distribution:
- Distance: 30% (closer spots prioritized)
- Availability: 25% (more available spaces prioritized)
- Rating: 20% (higher-rated spots prioritized)
- Price: 15% (budget-friendly spots prioritized)
- Type Match: 10% (user's preferred parking type prioritized)
```

### Optimization Strategies

#### 1. Caching
- **TTL (Time-To-Live):** 10 minutes
- Search results cached with location + radius as key
- Reduces redundant database queries
- Auto-refresh when TTL expires or user moves >500m

#### 2. Location Update Strategy
- **Current Frequency:** Every 30 seconds (not per-second)
- **Trigger Point:** Only search when user moves >500m from last search
- **Battery Impact:** Minimal with geofencing approach
- **Background Updates:** Use Expo's `startLocationUpdatesAsync()` for background tracking

#### 3. Database Indexing
- **Geospatial Index:** 2dsphere index on `location` field
- **Compound Indexes:** `{location: "2dsphere", availability: -1, rating: -1}`
- **Text Index:** Address fields for landmark-based search
- Enables fast spatial queries without full collection scans

---

## 2. Database Schema

### MongoDB Space Model

```javascript
{
  _id: ObjectId,
  
  // Basic Information
  name: String,                    // e.g., "Mall Parking A"
  description: String,
  type: String,                    // "commercial" | "residential" | "user_uploaded"
  uploadedBy: ObjectId,            // Reference to User, null if commercial
  
  // Location Data (GeoJSON Format)
  location: {
    type: "Point",
    coordinates: [longitude, latitude]  // IMPORTANT: [lng, lat] NOT [lat, lng]
  },
  
  // Address Components
  address: String,                 // Full address
  address_components: {
    street: String,
    city: String,
    state: String,
    landmark: String,              // e.g., "Near XYZ Mall"
    postalCode: String
  },
  
  // Capacity & Availability
  capacity: Number,                // Total spaces
  available_spots: Number,         // Currently available
  vehicle_types: [String],         // ["car", "bike", "truck"]
  
  // Pricing
  price_per_hour: Number,
  price_per_day: Number,
  price_per_month: Number,
  
  // Reviews & Ratings
  rating: Number,                  // 0-5
  reviews_count: Number,
  
  // Features & Amenities
  amenities: [String],             // ["covered", "surveillance", "charging", "24h"]
  verified: Boolean,               // By admin
  active: Boolean,
  
  // Metadata
  created_at: Date,
  updated_at: Date,
  lastVerified: Date
}
```

### Required Database Indexes

```javascript
// Geospatial index for location-based queries
db.spaces.createIndex({ location: "2dsphere" });

// Compound indexes for optimized queries
db.spaces.createIndex({ 
  location: "2dsphere", 
  available_spots: -1, 
  rating: -1 
});

// Text index for address/landmark search
db.spaces.createIndex({
  "address": "text",
  "address_components.landmark": "text",
  "name": "text"
});
```

---

## 3. Backend API Endpoints

### Endpoint 1: Nearby Spaces Search

**GET** `/api/spaces/nearby`

**Query Parameters:**
```
latitude (required):    Number    - User's latitude
longitude (required):   Number    - User's longitude
radius (optional):      Number    - Search radius in km (default: 5, max: 20)
vehicle_type (optional): String   - Filter by vehicle type
sort_by (optional):     String    - "distance" | "rating" | "price" | "availability"
limit (optional):       Number    - Results limit (default: 20, max: 50)
skip (optional):        Number    - Pagination offset (default: 0)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "space_id",
      "name": "Mall Parking A",
      "distance_km": 0.5,
      "duration_minutes": 3,
      "available_spots": 12,
      "rating": 4.5,
      "price_per_hour": 50,
      "amenities": ["covered", "surveillance"],
      "relevance_score": 92.5
    }
  ],
  "total": 15,
  "timestamp": "2026-05-02T10:30:00Z"
}
```

**Backend Implementation:**
```javascript
db.spaces.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: radius * 1000  // Convert km to meters
    }
  },
  available_spots: { $gt: 0 },
  active: true
}).sort(sortCriteria).limit(limit).skip(skip);
```

---

### Endpoint 2: Destination-Based Search

**GET** `/api/spaces/search-destination`

**Query Parameters:**
```
destination (required): String    - Address or landmark name
radius (optional):      Number    - Search radius in km (default: 3, max: 15)
vehicle_type (optional): String   - Filter by vehicle type
limit (optional):       Number    - Results limit (default: 20)
```

**Process Flow:**
1. Geocode destination address using Google Maps API → Get coordinates
2. Execute nearby search with those coordinates
3. Cache results for 10 minutes

**Response:** Same as `/api/spaces/nearby`

---

### Endpoint 3: Space Details with Map Data

**GET** `/api/spaces/:id/details`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "space_id",
    "name": "Mall Parking A",
    "description": "Covered parking with 24/7 surveillance",
    "location": {
      "latitude": 28.5355,
      "longitude": 77.2707,
      "address": "123 Main St, City"
    },
    "capacity": 50,
    "available_spots": 12,
    "rating": 4.5,
    "reviews_count": 120,
    "price_per_hour": 50,
    "amenities": ["covered", "surveillance", "24h", "charging"],
    "verified": true,
    "reviews": [
      {
        "user": "John Doe",
        "rating": 5,
        "comment": "Great spot!",
        "created_at": "2026-05-01T10:30:00Z"
      }
    ],
    "directions": {
      "route_url": "google.com/maps/...",
      "duration_minutes": 5,
      "distance_km": 2.3
    }
  }
}
```

---

### Endpoint 4: Trending/Popular Spaces

**GET** `/api/spaces/trending`

**Query Parameters:**
```
limit (optional):  Number  - Results limit (default: 10)
period (optional): String  - "today" | "week" | "month" (default: "week")
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "space_id",
      "name": "Popular Parking",
      "bookings_count": 120,
      "average_rating": 4.7,
      "location": { "address": "..." }
    }
  ]
}
```

---

## 4. Mobile Frontend Implementation

### 4.1 State Management (Zustand Store)

**File:** `src/store/authStore.js` (Enhancement)

```javascript
// Add to existing store:
export const useLocationStore = create((set) => ({
  // User Location
  userLocation: {
    latitude: null,
    longitude: null,
    accuracy: null,
    lastUpdated: null
  },
  
  // Search State
  searchMode: 'current_location',  // 'current_location' or 'destination'
  selectedDestination: null,
  searchFilters: {
    radius_km: 5,
    vehicle_type: 'car',
    sort_by: 'distance'
  },
  
  // Results
  nearbySpaces: [],
  isLoading: false,
  error: null,
  
  // Cache
  searchCache: {},
  cacheExpiry: {},
  
  // Actions
  setUserLocation: (location) => set({ userLocation: location }),
  setSearchMode: (mode) => set({ searchMode: mode }),
  setSelectedDestination: (destination) => set({ selectedDestination: destination }),
  setSearchFilters: (filters) => set((state) => ({
    searchFilters: { ...state.searchFilters, ...filters }
  })),
  setNearbySpaces: (spaces) => set({ nearbySpaces: spaces }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setCachedSearch: (key, data) => set((state) => ({
    searchCache: { ...state.searchCache, [key]: data },
    cacheExpiry: { ...state.cacheExpiry, [key]: Date.now() + 600000 } // 10 min TTL
  })),
  getCachedSearch: (key) => {
    // Return null if expired or not found
  }
}));
```

### 4.2 HomeScreen Implementation

**File:** `src/screens/HomeScreen.js` (Complete Rewrite)

**Key Components:**
- Search Mode Toggle (Current Location / Destination)
- Destination Search Input with Autocomplete
- Radius Slider (1-20 km)
- Vehicle Type Filter
- Results List with Distance/Duration
- Map Preview Button

**Features:**
- Request location permissions on mount
- Start background location updates (every 30 seconds)
- Show current location on map
- Display nearby spaces with relevance scores
- Implement result caching with 10-min TTL
- Pagination for large result sets

### 4.3 SpaceDetailsScreen Enhancement

**File:** `src/screens/SpaceDetailsScreen.js`

**New Additions:**
- MapView showing:
  - User's current location (blue dot)
  - Parking space location (red marker)
  - Route line between them
- Distance and estimated travel time card
- "Get Directions" button (opens Google Maps)
- Amenities list with icons
- User reviews section
- Booking button

---

## 5. Admin Dashboard Enhancements

### 5.1 Analytics Page - Location Heatmap

**File:** `src/pages/Analytics.jsx`

**New Components:**
- Location Heatmap: Visual representation of booking density across city
- Top 5 Busiest Parking Areas: Pie/bar chart
- Geographical clustering analysis
- Time-based density patterns (peak hours analysis)

### 5.2 Spaces Management Page

**File:** `src/pages/Spaces.jsx`

**Enhancements:**
- Add location column with address/landmark
- Add map preview (small map thumbnail)
- Add clustering indicators (number of nearby spaces)
- Add verification status indicator
- Advanced filtering by location/area

---

## 6. Google Maps API Integration

### Setup Steps

1. **Get API Key:**
   - Go to Google Cloud Console
   - Create new project
   - Enable Maps SDK for Android, Maps SDK for Web, Geocoding API
   - Create API key

2. **Mobile Integration (React Native):**
   - Already have `react-native-maps` in dependencies
   - Configure with Google Maps API key in `AndroidManifest.xml`
   - Use Expo's built-in location services

3. **Backend Integration:**
   - Add `@mapbox/mapbox-sdk` or `google-maps` npm package
   - Use Geocoding API for address → coordinates conversion

---

## 7. Implementation Phases

### Phase 1: Backend Foundation (Days 1-3)
- [ ] Update Space model with GeoJSON location field
- [ ] Create geospatial indexes in MongoDB
- [ ] Implement `/api/spaces/nearby` endpoint
- [ ] Implement `/api/spaces/search-destination` endpoint (with geocoding)
- [ ] Implement `/api/spaces/:id/details` endpoint
- [ ] Implement `/api/spaces/trending` endpoint
- [ ] Test all endpoints with Postman

**Deliverable:** 4 working API endpoints with geospatial queries

---

### Phase 2: Mobile Location Setup (Days 4-5)
- [ ] Request location permissions
- [ ] Implement `Expo.Location` integration
- [ ] Create location state management (Zustand store)
- [ ] Implement background location updates
- [ ] Add caching mechanism

**Deliverable:** Working location tracking with background updates

---

### Phase 3: Mobile Search UI (Days 6-8)
- [ ] Rewrite HomeScreen with dual-mode search UI
- [ ] Implement destination search input with autocomplete
- [ ] Add radius slider and filters
- [ ] Integrate with backend search endpoints
- [ ] Implement result caching and pagination
- [ ] Add loading and error states

**Deliverable:** Fully functional search screen with both modes

---

### Phase 4: Mobile Maps Integration (Days 9-10)
- [ ] Enhance SpaceDetailsScreen with MapView
- [ ] Show user location + parking space on map
- [ ] Integrate directions functionality
- [ ] Add distance/duration calculations
- [ ] Implement "Get Directions" button

**Deliverable:** Interactive map view with directions

---

### Phase 5: Ranking & Optimization (Days 11-12)
- [ ] Implement ranking algorithm in backend
- [ ] Fine-tune scoring weights
- [ ] Optimize database queries
- [ ] Implement caching layer
- [ ] Battery optimization testing

**Deliverable:** Optimized search results with smart ranking

---

### Phase 6: Admin & Testing (Days 13-14)
- [ ] Add location heatmap to Analytics page
- [ ] Enhance Spaces management with location features
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation

**Deliverable:** Complete feature with admin visibility

---

## 8. File Modification Summary

### Backend Files
- `models/Space.js` - Add GeoJSON location field + indexes
- `controllers/spaceController.js` - Add 4 new geospatial methods
- `routes/spaces.js` - Add 4 new endpoints
- `services/authService.js` - Add geocoding service (Google Maps integration)

### Mobile Files
- `src/store/authStore.js` - Add location state management
- `src/screens/HomeScreen.js` - Complete rewrite with dual-mode search
- `src/screens/SpaceDetailsScreen.js` - Add MapView + directions
- `src/services/api.js` - Add searchNearby(), searchByDestination(), geocodeDestination()
- `src/utils/cache.js` - Create new caching utility (if not exists)

### Admin Files
- `src/pages/Analytics.jsx` - Add LocationHeatmap component
- `src/pages/Spaces.jsx` - Add location features
- `src/components/LocationHeatmap.jsx` - Create new component

---

## 9. Technology Stack Summary

### Database
- **Primary:** MongoDB with 2dsphere geospatial indexing
- **Alternative:** PostGIS (PostgreSQL) if needed

### Location Services
- Expo.Location API (mobile)
- Google Maps Geocoding API (address conversion)

### Libraries
- `react-native-maps` (already included)
- `@mapbox/mapbox-sdk` or `google-maps` npm (backend)
- Zustand (state management - already included)

### APIs
- 4 new REST endpoints with geospatial queries
- Google Maps Geocoding API for address resolution

---

## 10. Performance Metrics & Monitoring

### Target Performance
- Nearby search response time: <500ms
- Destination search response time: <2s (including geocoding)
- Caching hit rate: >60% for repeat searches
- Battery drain: <2% per 10 minutes of active use

### Monitoring Points
- API response times per endpoint
- Cache hit/miss ratio
- Geospatial query execution time
- Location update frequency vs. battery usage
- User search patterns (for optimization feedback)

---

## 11. Security Considerations

1. **Location Data Privacy:**
   - Store user location history only if explicitly permitted
   - Implement location data retention limits (auto-delete after 30 days)
   - Encrypt location data in transit and at rest

2. **API Security:**
   - Rate limit geospatial queries (prevent DoS)
   - Validate radius parameter (max 20 km)
   - Authenticate all search requests

3. **User Data:**
   - Honor location permission revocation immediately
   - Provide location history deletion option
   - GDPR compliance for EU users

---

## 12. Testing Strategy

### Backend Testing
- Unit tests for ranking algorithm
- Integration tests for geospatial queries
- Load testing for concurrent searches
- API endpoint validation with various parameters

### Mobile Testing
- Location permission flow testing
- Background location tracking testing
- Caching mechanism validation
- Battery consumption testing
- Map integration testing

### Integration Testing
- End-to-end search flow (both modes)
- Real-time location updates with search
- Result ranking accuracy
- Cache expiration and refresh

---

## 13. Known Limitations & Future Enhancements

### Current Limitations
1. Ranking algorithm uses fixed weights (can be made dynamic)
2. Real-time availability updates not fully implemented
3. Offline mode not supported

### Future Enhancements
1. Machine learning-based ranking (user preference learning)
2. Real-time parking occupancy updates via IoT sensors
3. Offline map caching
4. Predictive availability (ML-based occupancy prediction)
5. Integration with popular mapping services (Apple Maps, etc.)
6. Social features (save favorite spots, share recommendations)

---

## 14. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|-----------|
| Google Maps API quota exceeded | High | Medium | Implement rate limiting, fallback to cached data |
| GPS accuracy issues | High | Medium | Show accuracy radius, allow manual location adjustment |
| Database performance degradation | High | Low | Proper indexing, query optimization, load balancing |
| Battery drain from location tracking | Medium | High | Implement geofencing, 30-sec update interval |
| User location privacy concerns | High | Medium | Clear privacy policy, granular permissions, data encryption |

---

## 15. Sign-Off & Approval

**Status:** Ready for Implementation  
**Reviewed By:** Development Team  
**Approval Date:** May 2, 2026  
**Last Updated:** May 2, 2026

---

## Next Steps

1. **Backend Lead:** Proceed with Phase 1 - Database schema setup + API endpoints
2. **Mobile Lead:** Prepare for Phase 2 - Location permissions and state management
3. **DevOps:** Set up geospatial indexing in production MongoDB
4. **Admin Lead:** Prepare analytics dashboard for Phase 6 enhancements

**Ready to begin implementation?** Confirm Phase 1 start date and team assignment.
