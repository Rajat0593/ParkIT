# QUICK START GUIDE - ParkIT Backend

## 🚀 Quick Installation (5 minutes)

### Step 1: Install Dependencies
```bash
cd parkit-backend
npm install
```

### Step 2: Setup PostgreSQL Database
```bash
# Create database
createdb parkIT_db

# Or via psql
psql -U postgres
CREATE DATABASE parkIT_db;
\q
```

### Step 3: Configure Environment
```bash
cp .env.example .env

# Edit .env and update:
# DB_PASSWORD=your_postgres_password
# Other credentials as needed
```

### Step 4: Start Server
```bash
npm run dev
```

Server will start at: **http://localhost:5000**

---

## 📋 API Testing

### Test Health Endpoint
```bash
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

### Register New User
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

Response: You'll get an `otpId` - check your email for OTP (in development, check logs)

### Verify OTP & Complete Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otp_id": "xxx",
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

Response: You'll get `token` and `refreshToken`

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

## 🔧 Development Workflow

### Run Development Server
```bash
npm run dev
```

### Check Code Quality
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

### Run Tests
```bash
npm test
```

---

## 📝 Project Status

✅ **Completed:**
- Project structure
- Configuration setup
- Database models (User, ParkingSpace, Booking, Vehicle, Review, Transaction)
- Authentication service (Register, OTP, Login, Refresh Token)
- Error handling middleware
- Validation middleware
- Email service
- Logger setup
- API routes (placeholder)

⏳ **Next (Week 2):**
- User profile management
- KYC verification
- File uploads

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start PostgreSQL
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change port in `.env` or kill process on port 5000
```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Module Not Found
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 API Documentation

Full API documentation coming soon (Swagger/OpenAPI)

### Current Endpoints

**Authentication**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/resend-otp` - Resend OTP
- `POST /api/v1/auth/logout` - Logout user

**Health Check**
- `GET /api/v1/health` - API health status

---

## 🔐 Security Notes

- Never commit `.env` file to Git
- Rotate JWT secrets in production
- Enable HTTPS in production
- Use strong PostgreSQL password
- Implement rate limiting for production

---

## 📞 Support

For issues or questions, refer to the main README.md or IMPLEMENTATION_PLAN.md
