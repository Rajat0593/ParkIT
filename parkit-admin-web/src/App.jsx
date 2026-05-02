import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Spaces from './pages/Spaces';
import Bookings from './pages/Bookings';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import { adminAuthService } from './services/api';

function PrivateRoute({ children }) {
  return adminAuthService.isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="spaces" element={<Spaces />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
