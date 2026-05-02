# ParkIT Frontend Setup Guide

Complete guide to set up and run both the React Native mobile app and React.js admin dashboard.

## Quick Overview

### Projects Created

1. **parkit-mobile** - React Native mobile app (iOS/Android)
   - Location: `/Users/rajatsharma/ParkIT/parkit-mobile`
   - Port: Expo development server

2. **parkit-admin-web** - React.js admin dashboard
   - Location: `/Users/rajatsharma/ParkIT/parkit-admin-web`
   - Port: 3000 (http://localhost:3000)

### Prerequisites

- **Node.js** v18+ (for both projects)
- **npm** or **yarn**
- **Expo CLI** (for mobile app)
- Backend API running on `http://localhost:5000`

---

## Mobile App Setup (React Native)

### Installation

```bash
cd parkit-mobile
npm install
```

### Start Development Server

```bash
npm start
```

This will open the Expo CLI with a QR code.

### Run on Simulators

**iOS Simulator (macOS only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Web Browser:**
```bash
npm run web
```

### Project Structure

```
parkit-mobile/
├── src/
│   ├── screens/              # All app screens
│   │   ├── LoginScreen.js         (Login form)
│   │   ├── RegisterScreen.js       (Registration with validation)
│   │   ├── OTPVerificationScreen.js (Email OTP verification)
│   │   ├── HomeScreen.js           (Search & browse spaces)
│   │   ├── BookingScreen.js        (Booking form & payment)
│   │   ├── ProfileScreen.js        (User profile & settings)
│   │   ├── SpaceDetailsScreen.js   (Space details)
│   │   ├── MyBookingsScreen.js     (Booking history)
│   │   └── AddVehicleScreen.js     (Add/manage vehicles)
│   ├── components/           # Reusable components
│   ├── navigation/           # Navigation setup
│   │   └── AppNavigator.js   (Route configuration)
│   ├── services/
│   │   └── api.js            (API client with interceptors)
│   ├── store/
│   │   └── authStore.js      (Zustand auth state)
│   └── utils/                # Helper utilities
├── App.js                    # Entry point
├── app.json                  # Expo configuration
├── package.json
└── README.md
```

### Key Features

✅ **Authentication**
- User registration
- Email OTP verification
- Login/logout
- Secure token storage

✅ **Parking Spaces**
- Search and filter spaces
- View space details
- Location-based search

✅ **Bookings**
- Book parking spaces
- Select dates and times
- Manage vehicles
- View booking history

✅ **User Profile**
- Profile management
- Vehicle management
- Booking history
- Settings and preferences

### Development Notes

- Uses React Navigation v6 for routing
- Zustand for state management
- React Hook Form + Yup for validation
- React Native Paper for UI components
- Axios for API calls with JWT auth

---

## Admin Dashboard Setup (React.js)

### Installation

```bash
cd parkit-admin-web
npm install
```

### Start Development Server

```bash
npm run dev
```

Dashboard will be available at `http://localhost:3000`

### Default Login Credentials

```
Email: admin@parkit.com
Password: (Set up in backend)
```

### Project Structure

```
parkit-admin-web/
├── src/
│   ├── pages/                # Admin pages
│   │   ├── Login.jsx              (Admin login)
│   │   ├── Dashboard.jsx          (Overview & metrics)
│   │   ├── Users.jsx              (User management)
│   │   ├── Spaces.jsx             (Space verification)
│   │   ├── Bookings.jsx           (Booking management)
│   │   └── Analytics.jsx          (Reports & trends)
│   ├── components/
│   │   └── Layout.jsx        (Navigation sidebar)
│   ├── services/
│   │   └── api.js            (API client)
│   ├── App.jsx               # Main app
│   └── main.jsx              # Entry point
├── index.html                # HTML template
├── vite.config.js            # Vite config
├── package.json
└── README.md
```

### Key Features

✅ **Dashboard**
- Real-time statistics
- Recent bookings display
- Key metrics (users, spaces, bookings, revenue)

✅ **User Management**
- View all users
- KYC verification (approve/reject)
- User ratings and details
- Delete user accounts

✅ **Space Management**
- View all parking spaces
- Verify space listings
- Approve/reject spaces
- Delete spaces

✅ **Booking Management**
- View all bookings
- Track booking status
- Cancel bookings
- Payment status monitoring

✅ **Analytics**
- Revenue trends (30-day)
- Booking trends
- Occupancy rates
- Average booking values

### Build for Production

```bash
npm run build
```

Output will be in the `dist` folder.

---

## API Integration

Both projects communicate with the ParkIT backend API.

### Required Backend Endpoints

**Authentication**
- `POST /auth/register` - User registration
- `POST /auth/login` - User/admin login
- `POST /auth/verify-otp` - OTP verification
- `POST /auth/refresh` - Token refresh

**Users**
- `GET /users` - Get all users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `POST /users/:id/kyc` - Verify KYC

**Spaces**
- `GET /spaces` - Get all spaces
- `GET /spaces/:id` - Get space details
- `GET /spaces/search` - Search spaces
- `POST /spaces/:id/verify` - Verify space

**Bookings**
- `GET /bookings` - Get all bookings
- `POST /bookings` - Create booking
- `POST /bookings/:id/cancel` - Cancel booking

**Admin**
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/analytics` - Analytics data

---

## Environment Variables

### Mobile App (.env in parkit-mobile)

```env
API_URL=http://localhost:5000/api
```

### Admin Dashboard (.env in parkit-admin-web)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running Both Projects

### Terminal 1 - Start Backend
```bash
cd parkit-backend
npm start
```

### Terminal 2 - Start Mobile App
```bash
cd parkit-mobile
npm start
```

### Terminal 3 - Start Admin Dashboard
```bash
cd parkit-admin-web
npm run dev
```

---

## Testing Workflow

### Mobile App Testing

1. **Registration**
   - Create account as car owner or space provider
   - Verify email with OTP
   - Login with credentials

2. **Search & Browse**
   - Browse available parking spaces
   - Use filters (vehicle type, price range)
   - View space details

3. **Booking**
   - Select dates and times
   - Choose vehicle
   - Confirm booking

4. **Profile**
   - View user information
   - Manage vehicles
   - View booking history

### Admin Dashboard Testing

1. **Login**
   - Access admin dashboard
   - Verify authentication

2. **User Verification**
   - Review pending KYC verifications
   - Approve/reject users

3. **Space Verification**
   - Review pending space listings
   - Approve/reject spaces

4. **Monitoring**
   - View dashboard statistics
   - Check analytics and trends

---

## Common Issues & Solutions

### Mobile App Issues

**Problem**: Expo Metro bundler not starting
```bash
npm start -- --reset-cache
```

**Problem**: Port already in use
```bash
lsof -i :19000  # Find process
kill -9 <PID>   # Kill process
```

### Admin Dashboard Issues

**Problem**: Vite port 3000 in use
```bash
npm run dev -- --port 3001
```

**Problem**: API connection error
- Ensure backend is running on `localhost:5000`
- Check CORS settings in backend

### General Issues

**Problem**: Node modules conflict
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

1. **Mobile App Enhancements**
   - Implement full space details screen
   - Add payment gateway integration
   - Implement push notifications
   - Add offline mode support

2. **Admin Dashboard Enhancements**
   - Add advanced search and filters
   - Export reports (CSV/PDF)
   - Real-time notifications
   - Dispute resolution system

3. **Backend Integrations**
   - Complete CRUD endpoints
   - Payment gateway (Razorpay/Stripe)
   - Real-time WebSocket updates
   - Email notifications

---

## Documentation Links

- **Backend**: See `/parkit-backend/README.md`
- **Mobile App**: See `/parkit-mobile/README.md`
- **Admin Dashboard**: See `/parkit-admin-web/README.md`

---

## Support

For issues or questions, refer to:
- Individual project READMEs
- Backend documentation
- Implementation plan document
