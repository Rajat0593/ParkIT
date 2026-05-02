import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { adminDashboardService, adminBookingService, adminUserService, adminSpaceService } from '../services/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, bookingsData] = await Promise.all([
        adminDashboardService.getStats(),
        adminBookingService.getAll(),
      ]);
      setStats(statsData);
      setRecentBookings(bookingsData.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#4A90E2',
    },
    {
      title: 'Parking Spaces',
      value: stats?.totalSpaces || 0,
      icon: <LocalParkingIcon sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#FF9800',
    },
    {
      title: 'Revenue',
      value: `₹${stats?.totalRevenue || 0}`,
      icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />,
      color: '#F44336',
    },
  ];

  const getStatusChip = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      active: 'success',
      completed: 'default',
      cancelled: 'error',
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ minWidth: 275, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Recent Bookings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Space</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.id.slice(0, 8)}</TableCell>
                    <TableCell>{booking.user_name}</TableCell>
                    <TableCell>{booking.space_name}</TableCell>
                    <TableCell>
                      {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>₹{booking.total_price}</TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
