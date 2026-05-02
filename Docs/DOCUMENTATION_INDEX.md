# ParkIT Documentation Index

**Docs home**: `README.md`  
**Last updated**: 2026-05-02

---

## Start here

1. **[README.md](./README.md)** - Canonical docs entrypoint
2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Run everything quickly
3. **[FRONTEND_SETUP_GUIDE.md](./FRONTEND_SETUP_GUIDE.md)** / **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** - Step-by-step setup

---

## Projects

### Mobile App (React Native)
- **Location**: `/parkit-mobile`
- **[parkit-mobile/README.md](./parkit-mobile/README.md)** - Mobile app overview
- **Quick Start**: `cd parkit-mobile && npm install && npm start`
- **Key Files**:
  - `App.js` - Entry point
  - `src/screens/` - 9 UI screens
  - `src/services/api.js` - API client
  - `src/store/authStore.js` - State management
  - `src/navigation/AppNavigator.js` - Navigation setup

### Admin Dashboard (React.js)
- **Location**: `/parkit-admin-web`
- **[parkit-admin-web/README.md](./parkit-admin-web/README.md)** - Admin app overview
- **Quick Start**: `cd parkit-admin-web && npm install && npm run dev`
- **Key Files**:
  - `src/main.jsx` - Entry point
  - `src/pages/` - 6 admin pages
  - `src/services/api.js` - API client
  - `src/components/Layout.jsx` - Navigation

---

## Backend API (Node.js)

- **Location**: `/parkit-backend`
- **[parkit-backend/README.md](./parkit-backend/README.md)** - Backend overview
- **[parkit-backend/QUICK_START.md](./parkit-backend/QUICK_START.md)** - Backend quick start
- **Quick Start**: `cd parkit-backend && npm install && npm start`
- **Key Files**:
  - `server.js` - Entry point
  - `src/models/` - 6 database models
  - `src/routes/` - 5 API route files
  - `src/services/` - Business logic
  - `src/middleware/` - Auth & validation

---

## Setup & installation

- **Frontend**: [FRONTEND_SETUP_GUIDE.md](./FRONTEND_SETUP_GUIDE.md)
- **Backend**: [BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)

---

## Product & delivery docs

- **What was implemented**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Roadmap / next work**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Implementation notes**: [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md)

---

## Project structure

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Full directory tree and key files

---

## Operations & testing

- **Deployment & operations**: [DEPLOYMENT_OPERATIONS_GUIDE.md](./DEPLOYMENT_OPERATIONS_GUIDE.md)
- **Testing guide**: [PHASE_7_TESTING_GUIDE.md](./PHASE_7_TESTING_GUIDE.md)

---

## Quick commands

### All in One
```bash
# Terminal 1: Backend
cd parkit-backend && npm install && npm start

# Terminal 2: Mobile
cd parkit-mobile && npm install && npm start

# Terminal 3: Admin
cd parkit-admin-web && npm install && npm run dev
```

---

## Minimal verification checklist

- [ ] Backend running
- [ ] Mobile app starts (Expo)
- [ ] Admin app starts
- [ ] Can log in and hit at least one API from each client

