# ParkIT - Phase 1 Week-by-Week Implementation Roadmap

**Stack**: Node.js + Express.js | PostgreSQL | React Native (future)  
**Environment**: Local development first  
**Start Date**: May 1, 2026  

---

## IMPLEMENTATION PRIORITY ORDER

### Week 1-2: Foundation & Backend Setup ⚙️

#### 1️⃣ **MOST CRITICAL - Start Here**

**Task 1.1: Backend Project Structure Setup** (Day 1-2)
```
parkit-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   ├── environment.js       # ENV variables
│   │   └── constants.js         # App constants
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── errorHandler.js      # Error handling
│   │   └── validation.js        # Request validation
│   ├── routes/
│   │   ├── auth.routes.js       # Auth endpoints
│   │   ├── users.routes.js      # User endpoints
│   │   ├── spaces.routes.js     # Parking space endpoints
│   │   └── index.js             # Route aggregator
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── userController.js    # User logic
│   │   └── spaceController.js   # Space logic
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── ParkingSpace.js      # Space model
│   │   └── Booking.js           # Booking model
│   ├── services/
│   │   ├── authService.js       # Auth business logic
│   │   ├── emailService.js      # Email/OTP sending
│   │   └── paymentService.js    # Payment integration
│   ├── utils/
│   │   ├── logger.js            # Logging
│   │   ├── validators.js        # Input validation
│   │   └── helpers.js           # Utility functions
│   ├── database/
│   │   └── migrations/
│   │       └── 001_initial.sql  # DB schema
│   └── app.js                   # Express app setup
├── .env                         # Environment variables
├── .env.example                 # Template
├── package.json
├── server.js                    # Entry point
└── README.md
```

**Task 1.2: PostgreSQL Database Setup** (Day 2-3)
- Install PostgreSQL locally (or Docker)
- Create `parkIT_db` database
- Run initial migration (schema from plan)
- Set up pgAdmin for database management

**Task 1.3: Node.js Project Initialization** (Day 3)
```
npm init -y
npm install express dotenv pg sequelize bcryptjs jsonwebtoken cors helmet
npm install --save-dev nodemon eslint prettier
```

**Files to Create First**:
1. `package.json` - Dependencies
2. `server.js` - Entry point
3. `src/app.js` - Express app config
4. `src/config/environment.js` - ENV setup
5. `.env` & `.env.example` - Configuration

---

### ✅ **FIRST SPRINT (Days 1-5): Core Authentication**

**Priority 1: Authentication Service**

**1. User Registration Endpoint**
```
POST /api/v1/auth/register
Body: {
  email: "user@example.com",
  phone: "+91XXXXXXXXXX",
  password: "hashedPassword",
  first_name: "John",
  last_name: "Doe",
  user_type: "car_owner"  // or "space_provider"
}
Response: {
  success: true,
  message: "OTP sent to email/phone",
  otp_id: "xxx"
}
```

**2. OTP Verification Endpoint**
```
POST /api/v1/auth/verify-otp
Body: {
  otp_id: "xxx",
  otp: "123456"
}
Response: {
  success: true,
  token: "jwt_token",
  refresh_token: "refresh_token",
  user: { id, email, phone, user_type }
}
```

**3. Login Endpoint**
```
POST /api/v1/auth/login
Body: {
  email_or_phone: "user@example.com",
  password: "password"
}
Response: {
  token: "jwt_token",
  refresh_token: "refresh_token",
  user: {}
}
```

**4. Token Refresh Endpoint**
```
POST /api/v1/auth/refresh-token
Body: {
  refresh_token: "xxx"
}
Response: {
  token: "new_jwt_token"
}
```

**Required Services**:
- `authService.js` - Password hashing, JWT generation, OTP logic
- `emailService.js` - Send OTP via email (use Nodemailer)
- JWT Middleware - Verify tokens on protected routes

---

### ✅ **SECOND SPRINT (Days 6-10): User Management**

**Priority 2: User Profile & KYC**

**Endpoints to Implement**:
```
GET  /api/v1/users/{id}                 # Get user profile
PUT  /api/v1/users/{id}                 # Update profile
POST /api/v1/users/{id}/kyc/upload      # Upload KYC documents
GET  /api/v1/users/{id}/kyc-status      # Check KYC verification
POST /api/v1/users/logout               # Logout
```

**User Model Fields**:
- Basic: id, email, phone, password_hash, first_name, last_name
- KYC: kyc_verified, kyc_document_url
- Rating: rating, review_count
- Status: is_active, created_at, updated_at

**File Upload Integration**:
- Use Multer for file uploads
- Store files locally (later: AWS S3)

---

### ✅ **THIRD SPRINT (Days 11-15): Parking Spaces Service**

**Priority 3: Parking Space CRUD**

**Endpoints**:
```
POST   /api/v1/spaces                   # Provider: Create space listing
GET    /api/v1/spaces                   # User: Search/list spaces (with filters)
GET    /api/v1/spaces/{id}              # Get space details
PUT    /api/v1/spaces/{id}              # Provider: Update space
DELETE /api/v1/spaces/{id}              # Provider: Delete space
```

**Search Filters**:
- Location (latitude, longitude, radius)
- Price range (price_per_day)
- Amenities (parking, covered, security, washing)
- Vehicle type (car, bike, truck)
- Available slots

**Database Implementation**:
- Geospatial indexing for location search (PostGIS)
- Full-text search for space names/descriptions

---

### ✅ **FOURTH SPRINT (Days 16-20): Booking System**

**Priority 4: Reservation Engine**

**Endpoints**:
```
POST   /api/v1/bookings                 # Create booking
GET    /api/v1/bookings/{id}            # Get booking details
GET    /api/v1/bookings/user/{userId}   # User: My bookings
PUT    /api/v1/bookings/{id}            # Modify booking
DELETE /api/v1/bookings/{id}            # Cancel booking
POST   /api/v1/bookings/{id}/confirm    # Confirm after payment
```

**Booking Logic**:
- Check availability
- Calculate total price
- Reserve slots
- Generate booking confirmation

---

### ✅ **FIFTH SPRINT (Days 21-25): Vehicles & Basic Payments**

**Priority 5: Vehicle Management & Payment Setup**

**Vehicle Endpoints**:
```
POST /api/v1/vehicles                   # Add vehicle
GET  /api/v1/vehicles/{id}              # Get vehicle details
PUT  /api/v1/vehicles/{id}              # Update vehicle
```

**Payment Setup** (Integration only, not logic):
```
POST /api/v1/payments/initiate          # Start Razorpay payment
POST /api/v1/payments/verify            # Verify payment
```

---

## 📋 IMPLEMENTATION CHECKLIST (Week 1-2)

### Day 1-2: Project Setup
- [ ] Create Node.js project structure
- [ ] Install dependencies
- [ ] Set up Express app with middleware
- [ ] Configure environment variables
- [ ] Set up logging

### Day 2-3: Database
- [ ] Install PostgreSQL locally
- [ ] Create `parkIT_db` database
- [ ] Set up Sequelize ORM
- [ ] Create database schema (migration file)
- [ ] Create User, ParkingSpace, Booking models

### Day 3-4: Authentication Foundation
- [ ] Implement auth routes
- [ ] Create authController with registration logic
- [ ] Add password hashing (bcryptjs)
- [ ] Add JWT generation
- [ ] Add email OTP service (Nodemailer)
- [ ] Create auth middleware

### Day 5: User Service
- [ ] User profile endpoints (GET, PUT)
- [ ] KYC upload endpoint (with Multer)
- [ ] User validation

### Day 6-7: Parking Spaces
- [ ] Space creation endpoint (provider)
- [ ] Space search endpoint (with filters)
- [ ] Space details endpoint
- [ ] Space update/delete (provider)

### Day 8-9: Bookings
- [ ] Booking creation logic
- [ ] Availability checking
- [ ] Price calculation
- [ ] Booking confirmation
- [ ] Cancellation logic

### Day 10: Testing & Fixes
- [ ] Test all endpoints with Postman
- [ ] Fix bugs and edge cases
- [ ] Add error handling
- [ ] Add input validation

---

## 🔧 TECH SETUP REQUIRED (Before Starting)

**Install Locally**:
1. **Node.js** (v18 LTS or higher)
   ```bash
   brew install node  # macOS
   ```

2. **PostgreSQL** (v13+)
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

3. **pgAdmin** (Optional GUI)
   ```bash
   brew install pgadmin4
   ```

4. **Git** (Already have it)

5. **Postman** (API testing)
   - Download from postman.com

6. **VS Code Extensions** (Recommended)
   - REST Client (for quick API testing)
   - PostgreSQL Explorer
   - Thunder Client

---

## 📦 npm Dependencies (Final Package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.2",
    "pg": "^8.11.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "nodemailer": "^6.9.7",
    "multer": "^1.4.5-lts.1",
    "joi": "^17.11.0",
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0"
  }
}
```

---

## 🚀 QUICK START COMMANDS

```bash
# Create project
mkdir parkit-backend
cd parkit-backend
npm init -y

# Install dependencies
npm install express sequelize pg bcryptjs jsonwebtoken dotenv cors helmet nodemailer multer joi

# Create folder structure
mkdir -p src/{config,middleware,routes,controllers,models,services,utils,database}

# Create main files
touch server.js src/app.js .env .env.example

# Start development
npm run dev  # (after adding script to package.json)
```

---

## 🎯 FIRST WEEK GOALS

**By End of Week 1**:
✅ Node.js + Express backend running  
✅ PostgreSQL database connected  
✅ User registration with OTP working  
✅ User login with JWT tokens working  
✅ All endpoints callable via Postman  
✅ Basic error handling in place  

**By End of Week 2**:
✅ Complete user management (profile, KYC)  
✅ Parking space CRUD operations  
✅ Booking system logic  
✅ Vehicle management  
✅ Payment integration started  

---

## 📱 Mobile App (Parallel Work)

While backend is being built:
- Keep current Android app as reference
- Don't modify Android yet
- Wait for backend APIs to be ready
- Plan React Native migration after Phase 1 APIs are stable

---

## Next: Specific Implementation Details

Once you confirm you're ready, I can provide:
1. **Complete authentication code** with all edge cases
2. **Database schema SQL** ready to execute
3. **Boilerplate Express app** with all middleware
4. **API endpoint specifications** with request/response examples
5. **Error handling patterns** for consistency

**Ready to start implementing?** Let me know if you need the code files created directly in your workspace.
