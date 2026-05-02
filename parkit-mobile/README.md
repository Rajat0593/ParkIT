# ParkIT Mobile App

React Native mobile application for ParkIT parking marketplace.

## Features

- ✅ User authentication (Login, Register, OTP verification)
- ✅ Search and discover parking spaces
- ✅ Book parking spaces (daily/monthly)
- ✅ User profile management
- ✅ View booking history
- ✅ Vehicle management
- ✅ Map integration for location-based search
- ✅ Modern UI with React Native Paper

## Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Forms**: React Hook Form + Yup validation
- **HTTP Client**: Axios
- **Maps**: React Native Maps
- **Storage**: Expo SecureStore, AsyncStorage
- **Date Handling**: date-fns

## Project Structure

```
parkit-mobile/
├── src/
│   ├── screens/           # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── OTPVerificationScreen.js
│   │   ├── HomeScreen.js
│   │   ├── BookingScreen.js
│   │   ├── ProfileScreen.js
│   │   └── ...
│   ├── components/        # Reusable components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API services
│   ├── store/             # State management
│   └── utils/             # Utility functions
├── assets/                # Images and static files
├── App.js                 # Main entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
cd parkit-mobile
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### Environment Configuration

Create a `.env` file in the root directory:

```env
API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm test` - Run tests

## API Integration

The app connects to the ParkIT backend API at `http://localhost:5000/api`.

### Authentication Flow

1. User registers with email/password
2. OTP sent to email for verification
3. After verification, user can login
4. JWT tokens stored securely in SecureStore
5. Automatic token refresh on expiration

### Key Services

- **authService**: Login, register, OTP verification
- **spaceService**: Search, view, create parking spaces
- **bookingService**: Create, view, cancel bookings
- **vehicleService**: Manage user vehicles
- **userService**: Profile management

## Screens

### Authentication
- **Login**: Email/password login
- **Register**: User registration with validation
- **OTP Verification**: Email verification code

### Main App
- **Home**: Search and browse parking spaces
- **Space Details**: View space information and amenities
- **Booking**: Book a parking space with date/time selection
- **Profile**: User profile, settings, and booking history
- **My Bookings**: View all bookings

## State Management

Uses Zustand for global state management:
- User authentication state
- User profile data
- Loading states
- Error handling

## Styling

- React Native StyleSheet
- React Native Paper components
- Consistent color scheme (#4A90E2 primary)
- Responsive design for different screen sizes

## Testing

```bash
npm test
```

## Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Troubleshooting

### Common Issues

1. **Metro bundler not starting**: Clear cache with `npm start -- --reset-cache`
2. **Dependencies issues**: Delete node_modules and reinstall
3. **iOS build errors**: Run `cd ios && pod install`

## Next Steps

- [ ] Implement push notifications
- [ ] Add payment gateway integration
- [ ] Implement real-time booking updates
- [ ] Add offline mode support
- [ ] Implement NFC scanning for vehicles
- [ ] Add image upload for vehicles/spaces

## License

MIT
