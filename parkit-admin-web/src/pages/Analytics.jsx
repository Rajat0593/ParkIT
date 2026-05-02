import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { adminDashboardService } from '../services/api';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getAnalytics('30d');
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Bookings Trend (30 Days)
              </Typography>
              {analyticsData?.bookingsTrend && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.bookingsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bookings" stroke="#4A90E2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Revenue Trend (30 Days)
              </Typography>
              {analyticsData?.revenueTrend && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4CAF50" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Key Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Bookings (30d)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {analyticsData?.metrics?.totalBookings || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue (30d)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      ₹{analyticsData?.metrics?.totalRevenue || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Booking Value
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      ₹{analyticsData?.metrics?.avgBookingValue || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Occupancy Rate
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {analyticsData?.metrics?.occupancyRate || 0}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
