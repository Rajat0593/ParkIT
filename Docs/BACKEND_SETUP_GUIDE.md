# Complete Backend Setup Instructions

## 📁 Backend Project Structure Created

Your backend project has been fully scaffolded at: `/Users/rajatsharma/ParkIT/parkit-backend/`

```
parkit-backend/
├── src/
│   ├── config/              ✅ Configuration files
│   ├── middleware/          ✅ Express middleware
│   ├── routes/              ✅ API routes
│   ├── controllers/         ✅ Request handlers (Auth implemented)
│   ├── models/              ✅ Database models (All 6 models)
│   ├── services/            ✅ Business logic (Auth & Email)
│   ├── utils/               ✅ Utilities (helpers, logger)
│   └── database/            ✅ Database initialization
├── package.json             ✅ Dependencies
├── server.js                ✅ Entry point
├── README.md                ✅ Full documentation
├── QUICK_START.md           ✅ Quick setup guide
├── setup.sh                 ✅ Automated setup script
└── .env                     ✅ Environment variables template
```

---

## 🚀 NEXT STEPS TO GET RUNNING

### Step 1: Install Dependencies (1 minute)
```bash
cd /Users/rajatsharma/ParkIT/parkit-backend
npm install
```

This will install:
- express, sequelize, pg (backend framework & database)
- bcryptjs, jsonwebtoken (security)
- nodemailer (email)
- joi, express-validator (validation)
- winston (logging)
- And more...

### Step 2: Setup PostgreSQL Database (2 minutes)
```bash
# Create database
createdb parkIT_db

# Verify it was created
psql -l | grep parkIT_db
```

**Or manually via psql:**
```bash
psql -U postgres
CREATE DATABASE parkIT_db;
\l
\q
```

### Step 3: Configure Environment (1 minute)
```bash
cd parkit-backend
cp .env.example .env

# Edit .env with your PostgreSQL password
nano .env
# or
open .env  # on macOS
```

**Required changes in .env:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parkIT_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password  ← CHANGE THIS
```

### Step 4: Start Server (Instant)
```bash
npm run dev
```

**Expected output:**
```
[INFO] Testing database connection...
[INFO] Database connection established successfully
[INFO] Initializing database models...
[INFO] Database initialized successfully
═══════════════════════════════════════════════════════════════
🚀 ParkIT API Server Started Successfully
📍 Environment: development
🔌 Port: 5000
🌐 URL: http://localhost:5000
═══════════════════════════════════════════════════════════════
```

---

## ✅ Test the API

### Option 1: Using curl
```bash
# Test health endpoint
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "status": "success",
  "message": "ParkIT API is running",
  "timestamp": "2024-05-01T10:30:00Z"
}
```

### Option 2: Using Postman
1. Download Postman from https://www.postman.com/downloads/
2. Import collection: `ParkIT-API.postman_collection.json`
3. Set variable `base_url` to `http://localhost:5000`
4. Test endpoints

### Option 3: Using REST Client (VS Code)
1. Install "REST Client" extension in VS Code
2. Create `test.http` file:
```http
GET http://localhost:5000/api/v1/health
```
3. Click "Send Request"

---

## 🧪 Test Authentication Flow

### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+919876543210",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "car_owner"
  }'
```

Response:
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "otpId": "abc123def456",
  "registrationData": {...}
}
```

**Note**: In development mode, OTP is generated but email sending might fail. Check logs for OTP value.

### 2. Verify OTP (get OTP from logs)
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otp_id": "abc123def456",
    "otp": "123456",
    "registration_data": {
      "email": "user@example.com",
      "phone": "+919876543210",
      "password": "SecurePass123",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "car_owner"
    }
  }'
```

Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "userType": "car_owner"
  }
}
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

## 📊 Database Structure

The following tables are automatically created:
- **users** - User accounts, profiles, ratings
- **parking_spaces** - Available parking locations
- **bookings** - Parking reservations
- **vehicles** - Registered vehicles
- **reviews** - User ratings and comments
- **transactions** - Payment records

View tables in PostgreSQL:
```bash
psql parkIT_db
\dt  # List tables
\d users  # Describe table structure
```

---

## 🛠️ Development Commands

```bash
# Start development server (auto-reload on file changes)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Check code style
npm run lint

# Format code
npm run format

# View logs
tail -f logs/app.log
```

---

## 🐛 Common Issues & Solutions

### 1. "Cannot find module" error
**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. "connect ECONNREFUSED" (PostgreSQL not running)
**Solution**: Start PostgreSQL
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start PostgreSQL
```

### 3. "listen EADDRINUSE" (Port 5000 in use)
**Solution**: Change port in .env or kill the process
```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### 4. Email not sending
**Solution**: This is normal in development. Check logs for OTP:
```bash
tail -f logs/app.log | grep OTP
```

### 5. Database already exists
```bash
dropdb parkIT_db
createdb parkIT_db
```

---

## 📝 What's Implemented

✅ **Authentication System**
- User registration with OTP verification
- Password hashing with bcryptjs
- JWT token generation & refresh
- Login with email or phone
- Error handling & validation

✅ **Database**
- 6 Sequelize models with relationships
- Automatic table creation
- Indexes for performance
- Data validation

✅ **API Infrastructure**
- Express.js server
- CORS enabled
- Error handling middleware
- Request validation
- Logging system
- Security headers (Helmet)

✅ **Services**
- Email service (Nodemailer ready)
- Auth service with OTP logic
- Helper utilities
- Logger

---

## 📋 Next Week's Tasks

After you verify the server is running, the next implementations are:

### Week 2: User Management
- Get/update user profile
- KYC verification
- File uploads
- User ratings

### Week 3: Parking Spaces
- Create space listings (providers)
- Search spaces by location
- Filter by price, amenities
- Space details & images

### Week 4: Booking System
- Create reservations
- Check availability
- Calculate pricing
- Booking confirmations

---

## 📚 Documentation Files

- **README.md** - Full API documentation
- **QUICK_START.md** - Quick reference guide
- **IMPLEMENTATION_PLAN.md** - Full product roadmap
- **This file** - Setup instructions

---

## 🎯 Success Checklist

- [ ] npm install completed
- [ ] PostgreSQL database created
- [ ] .env file configured with DB password
- [ ] `npm run dev` started successfully
- [ ] Health endpoint responds
- [ ] User registration works
- [ ] OTP verification works
- [ ] Login works
- [ ] Token received and valid

---

## 💡 Pro Tips

1. **Use Postman** - Download the collection file for easier API testing
2. **Watch logs** - Keep terminal open to see real-time logs
3. **Database explorer** - Use pgAdmin to inspect database visually
4. **Environment variables** - Never commit .env to Git
5. **Version control** - Commit your changes regularly

---

## 🚀 Ready?

```bash
cd parkit-backend
npm install
npm run dev
```

Your backend will be running! 🎉

If you have any issues, check the logs:
```bash
cat logs/app.log
```

---

**Questions?** Refer to README.md or IMPLEMENTATION_PLAN.md

**Happy Coding!** 🚀
