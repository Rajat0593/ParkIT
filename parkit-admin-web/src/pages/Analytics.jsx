import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
} from '@mui/material';
import {
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
import LocationHeatmap, { HeatmapGrid, TopAreasChart, PeakHoursAnalysis } from '../components/LocationHeatmap';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminDashboardService.getAnalytics('30d');
      setAnalyticsData(data);
      
      // Process heatmap data from bookings
      if (data?.bookings) {
        const { heatmapData: processedData } = LocationHeatmap({ data: data.bookings });
        setHeatmapData(processedData);
      }
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

        {/* Location Heatmap Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Booking Density Heatmap - Top Areas
              </Typography>
              {heatmapData && heatmapData.length > 0 ? (
                <HeatmapGrid data={heatmapData} />
              ) : (
                <Typography color="text.secondary">No heatmap data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Areas by Bookings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Top Areas - Bookings & Revenue
              </Typography>
              {heatmapData && heatmapData.length > 0 ? (
                <TopAreasChart data={heatmapData} />
              ) : (
                <Typography color="text.secondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Peak Hours Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Peak Hours - Booking Distribution
              </Typography>
              {analyticsData?.bookings && analyticsData.bookings.length > 0 ? (
                <PeakHoursAnalysis bookings={analyticsData.bookings} />
              ) : (
                <Typography color="text.secondary">No booking data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Area Details Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Area Details
              </Typography>
              {heatmapData && heatmapData.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Area</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Bookings</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Revenue</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Avg Rating</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Density %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.slice(0, 10).map((area, idx) => (
                        <tr
                          key={area.id}
                          style={{
                            borderBottom: '1px solid #eee',
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                          }}
                        >
                          <td style={{ padding: '12px' }}>{area.area}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>
                            {area.bookings}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>
                            ₹{area.revenue.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {area.avgRating.toFixed(1)} ⭐
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <Box
                              sx={{
                                backgroundColor: area.density > 60 ? '#FF6B6B' : area.density > 40 ? '#FFC75F' : '#28A745',
                                color: '#fff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                              }}
                            >
                              {area.density.toFixed(0)}%
                            </Box>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Typography color="text.secondary">No area data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
