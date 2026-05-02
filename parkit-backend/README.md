# ParkIT Backend API

Complete Node.js + Express backend for ParkIT parking marketplace application.

## Features

- ✅ User authentication with OTP verification
- ✅ JWT token-based authorization
- ✅ Role-based access control (Car owners, Space providers, Admins)
- ✅ PostgreSQL database with Sequelize ORM
- ✅ Email service for OTP sending
- ✅ Error handling and validation middleware
- ✅ Comprehensive logging
- ✅ RESTful API endpoints

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator, Joi
- **Email**: Nodemailer
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston

## Project Structure

```
parkit-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # Database connection
│   │   ├── environment.js   # Environment variables
│   │   └── constants.js     # App constants
│   ├── middleware/          # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/              # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── space.routes.js
│   │   ├── booking.routes.js
│   │   └── vehicle.routes.js
│   ├── controllers/         # Request handlers
│   │   └── authController.js
│   ├── models/              # Sequelize models
│   │   ├── User.js
│   │   ├── ParkingSpace.js
│   │   ├── Booking.js
│   │   ├── Vehicle.js
│   │   ├── Review.js
│   │   └── Transaction.js
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   └── emailService.js
│   ├── utils/               # Utility functions
│   │   ├── logger.js
│   │   └── helpers.js
│   ├── database/
│   │   ├── init.js
│   │   └── migrations/
│   ├── app.js               # Express app setup
│   └── database/
├── server.js                # Entry point
├── package.json
├── .env                     # Environment variables
├── .env.example             # Template for env vars
└── .gitignore

```

## Installation

### Prerequisites

- Node.js v18 or higher
- PostgreSQL 13 or higher
- npm or yarn

### Setup Steps

1. **Navigate to backend directory**
   ```bash
   cd parkit-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create PostgreSQL database**
   ```bash
   createdb parkIT_db
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations**
   ```bash
   npm run migrate  # (when scripts are added)
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

#### Register
```
POST /api/v1/auth/register
Body: {
  email: "user@example.com",
  phone: "+91XXXXXXXXXX",
  password: "SecurePass123",
  first_name: "John",
  last_name: "Doe",
  user_type: "car_owner"
}
Response: {
  success: true,
  message: "OTP sent to your email",
  otpId: "xxx",
  registrationData: {...}
}
```

#### Verify OTP
```
POST /api/v1/auth/verify-otp
Body: {
  otp_id: "xxx",
  otp: "123456",
  registration_data: {...}
}
Response: {
  success: true,
  token: "jwt_token",
  refreshToken: "refresh_token",
  user: {...}
}
```

#### Login
```
POST /api/v1/auth/login
Body: {
  email_or_phone: "user@example.com",
  password: "SecurePass123"
}
Response: {
  success: true,
  token: "jwt_token",
  refreshToken: "refresh_token",
  user: {...}
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh-token
Body: {
  refresh_token: "xxx"
}
Response: {
  success: true,
  token: "new_jwt_token",
  refreshToken: "new_refresh_token"
}
```

#### Logout
```
POST /api/v1/auth/logout
Response: {
  success: true,
  message: "Logged out successfully"
}
```

#### Resend OTP
```
POST /api/v1/auth/resend-otp
Body: {
  email: "user@example.com"
}
Response: {
  success: true,
  message: "OTP resent successfully",
  otpId: "xxx"
}
```

### Health Check
```
GET /api/v1/health
Response: {
  status: "success",
  message: "ParkIT API is running",
  timestamp: "2024-05-01T10:30:00Z"
}
```

## Environment Variables

See `.env.example` for all available configuration options:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parkIT_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

### Code Formatting
```bash
npm run format
```

### Testing
```bash
npm test
```

## Database Models

### User
- id (UUID)
- email
- phone
- password_hash
- first_name, last_name
- user_type (car_owner, space_provider, admin)
- kyc_verified, kyc_document_url
- rating
- is_active, created_at, updated_at

### ParkingSpace
- id (UUID)
- provider_id (FK to User)
- name, description, address
- latitude, longitude
- total_slots, available_slots
- price_per_day, price_per_month
- vehicle_types (JSON array)
- amenities (JSON array)
- operating_hours (JSON)
- images_url (JSON array)
- rating, verification_status
- is_active, created_at, updated_at

### Booking
- id (UUID)
- user_id, space_id, vehicle_id (FKs)
- check_in_date, check_out_date
- booking_type (hourly, daily, monthly)
- status (pending, confirmed, active, completed, cancelled)
- total_price, payment_id, payment_status
- created_at, updated_at

### Vehicle
- id (UUID)
- user_id (FK to User)
- vehicle_type (car, bike, truck)
- registration_number (unique)
- make, model, year, color
- nfc_tag_id (unique)
- vehicle_image_url
- created_at, updated_at

### Review
- id (UUID)
- booking_id, reviewer_id, reviewee_id (FKs)
- rating (1-5)
- comment
- category (space, provider, user)
- created_at, updated_at

### Transaction
- id (UUID)
- booking_id, user_id (FKs)
- amount, transaction_type
- payment_method, payment_gateway_id
- status
- created_at, updated_at

## Error Handling

API returns standardized error responses:

```json
{
  "status": "error",
  "message": "Error message here",
  "errorCode": "ERROR_CODE",
  "stack": "Stack trace (development only)"
}
```

Common error codes:
- `INVALID_CREDENTIALS` - Wrong email/password
- `USER_NOT_FOUND` - User doesn't exist
- `USER_ALREADY_EXISTS` - Email/phone already registered
- `INVALID_OTP` - Incorrect OTP
- `OTP_EXPIRED` - OTP validity expired
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed

## Authentication

The API uses JWT for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire based on `JWT_EXPIRE` setting (default: 24 hours).
Use the refresh token to obtain a new access token.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## Next Steps

1. ✅ Authentication system (Week 1)
2. User management (Week 2)
3. Parking space management (Week 3)
4. Booking system (Week 4)
5. Payment integration (Week 5)

## License

ISC

## Support

For issues and questions, contact the development team.
