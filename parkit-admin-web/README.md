# ParkIT Admin Dashboard

React.js web application for ParkIT admin management and analytics.

## Features

- ✅ Admin authentication (Login)
- ✅ Dashboard with key metrics and statistics
- ✅ User management with KYC verification
- ✅ Parking space verification and management
- ✅ Booking management and cancellation
- ✅ Analytics and revenue tracking
- ✅ Real-time statistics
- ✅ Responsive design for all devices

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Components**: Material-UI (MUI)
- **Routing**: React Router v6
- **State Management**: Zustand
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## Project Structure

```
parkit-admin-web/
├── src/
│   ├── pages/            # Admin pages
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Spaces.jsx
│   │   ├── Bookings.jsx
│   │   └── Analytics.jsx
│   ├── components/       # Reusable components
│   │   └── Layout.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── store/            # State management
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd parkit-admin-web
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Pages

### Authentication
- **Login**: Admin login with email and password

### Admin Dashboard
- **Dashboard**: Overview with key metrics and recent bookings
- **Users**: Manage users, KYC verification, view user details
- **Spaces**: Manage parking spaces, verify listings
- **Bookings**: View and manage all bookings
- **Analytics**: Revenue tracking, bookings trends, occupancy metrics

## Features Details

### User Management
- View all registered users
- KYC verification (approve/reject)
- User information and ratings
- Delete user accounts

### Parking Space Verification
- Review pending space listings
- Verify/reject spaces
- View space details and amenities
- Delete listings

### Booking Management
- View all bookings with details
- Track booking status
- Cancel bookings if needed
- Payment status monitoring

### Analytics & Reporting
- 30-day revenue trends
- Booking trends
- Occupancy rates
- Average booking values
- User and space statistics

## API Integration

The admin dashboard connects to the ParkIT backend API.

### Key Endpoints

- `POST /auth/login` - Admin login
- `GET /users` - Get all users
- `POST /users/:id/kyc` - Verify KYC
- `GET /spaces` - Get all spaces
- `POST /spaces/:id/verify` - Verify space
- `GET /bookings` - Get all bookings
- `POST /bookings/:id/cancel` - Cancel booking
- `GET /admin/stats` - Get dashboard stats
- `GET /admin/analytics` - Get analytics data

## Styling

- Material-UI (MUI) components
- Responsive design
- Custom theme with primary color #4A90E2
- Mobile-friendly layout

## Security

- JWT token-based authentication
- Secure token storage in localStorage
- Automatic logout on token expiration
- Role-based access control

## Next Steps

- [ ] Add advanced filters and search
- [ ] Implement export reports (CSV/PDF)
- [ ] Add user activity logs
- [ ] Implement real-time notifications
- [ ] Add dispute resolution system
- [ ] Multi-language support

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure backend is running on `localhost:5000`
2. **Build errors**: Clear cache with `npm install --force`
3. **Port already in use**: Change port in vite.config.js

## License

MIT
