import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { adminBookingService } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await adminBookingService.getAll();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await adminBookingService.cancel(bookingId);
        toast.success('Booking cancelled successfully');
        loadBookings();
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

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

  const getPaymentStatusChip = (status) => {
    const colors = {
      pending: 'warning',
      completed: 'success',
      failed: 'error',
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Bookings Management
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Space</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.id.slice(0, 8)}</TableCell>
                    <TableCell>{booking.user_name}</TableCell>
                    <TableCell>{booking.space_name}</TableCell>
                    <TableCell>
                      {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>₹{booking.total_price}</TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell>{getPaymentStatusChip(booking.payment_status)}</TableCell>
                    <TableCell>
                      {booking.status !== 'cancelled' && (
                        <IconButton
                          size="small"
                          onClick={() => handleCancelBooking(booking.id)}
                          color="error"
                          title="Cancel Booking"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                    </TableCell>
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
