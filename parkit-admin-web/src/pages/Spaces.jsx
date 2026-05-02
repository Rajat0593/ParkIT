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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { adminSpaceService } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    total_capacity: 0,
    price_per_hour: 0,
    price_per_day: 0,
    amenities: [],
    parking_type: 'outdoor',
  });

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const data = await adminSpaceService.getAll();
      setSpaces(data);
    } catch (error) {
      console.error('Error loading spaces:', error);
      toast.error('Failed to load spaces');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySpace = async (spaceId, status) => {
    try {
      await adminSpaceService.verify(spaceId, status);
      toast.success(`Space ${status === 'verified' ? 'approved' : 'rejected'}`);
      loadSpaces();
    } catch (error) {
      toast.error('Failed to update space status');
    }
  };

  const handleEditSpace = (space) => {
    setSelectedSpace(space);
    setEditFormData({
      name: space.name,
      address: space.address,
      latitude: space.latitude,
      longitude: space.longitude,
      total_capacity: space.total_capacity || space.total_slots,
      price_per_hour: space.price_per_hour,
      price_per_day: space.price_per_day,
      amenities: space.amenities || [],
      parking_type: space.parking_type || 'outdoor',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (selectedSpace) {
        await adminSpaceService.update(selectedSpace._id, editFormData);
        toast.success('Space updated successfully');
        setEditDialogOpen(false);
        loadSpaces();
      }
    } catch (error) {
      console.error('Error updating space:', error);
      toast.error('Failed to update space');
    }
  };

  const handleDelete = async (spaceId) => {
    if (window.confirm('Are you sure you want to delete this space?')) {
      try {
        await adminSpaceService.delete(spaceId);
        toast.success('Space deleted successfully');
        loadSpaces();
      } catch (error) {
        toast.error('Failed to delete space');
      }
    }
  };

  const getVerificationStatusChip = (status) => {
    const colors = {
      pending: 'warning',
      verified: 'success',
      rejected: 'error',
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Parking Spaces Management
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Slots</TableCell>
                  <TableCell>Price/Day</TableCell>
                  <TableCell>Amenities</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {spaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{space.name}</TableCell>
                    <TableCell>{space.provider_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>
                      {space.address?.substring(0, 25)}...
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {space.latitude?.toFixed(3)}, {space.longitude?.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      {space.available_slots}/{space.total_slots}
                    </TableCell>
                    <TableCell>₹{space.price_per_day}</TableCell>
                    <TableCell>
                      {space.amenities && space.amenities.length > 0 ? (
                        <Chip
                          label={`${space.amenities.length} items`}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getVerificationStatusChip(space.verification_status)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditSpace(space)}
                        color="primary"
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      {space.verification_status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleVerifySpace(space.id, 'verified')}
                            color="success"
                            title="Approve"
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleVerifySpace(space.id, 'rejected')}
                            color="error"
                            title="Reject"
                          >
                            <CloseIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(space.id)}
                        color="error"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Space Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Parking Space</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Space Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Address"
            value={editFormData.address}
            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
            sx={{ mb: 2 }}
            multiline
            rows={2}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                inputProps={{ step: '0.0001' }}
                value={editFormData.latitude}
                onChange={(e) => setEditFormData({ ...editFormData, latitude: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                inputProps={{ step: '0.0001' }}
                value={editFormData.longitude}
                onChange={(e) => setEditFormData({ ...editFormData, longitude: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Total Capacity"
            type="number"
            value={editFormData.total_capacity}
            onChange={(e) => setEditFormData({ ...editFormData, total_capacity: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Price/Hour (₹)"
                type="number"
                inputProps={{ step: '0.01' }}
                value={editFormData.price_per_hour}
                onChange={(e) => setEditFormData({ ...editFormData, price_per_hour: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Price/Day (₹)"
                type="number"
                inputProps={{ step: '0.01' }}
                value={editFormData.price_per_day}
                onChange={(e) => setEditFormData({ ...editFormData, price_per_day: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Parking Type</InputLabel>
            <Select
              value={editFormData.parking_type}
              label="Parking Type"
              onChange={(e) => setEditFormData({ ...editFormData, parking_type: e.target.value })}
            >
              <MenuItem value="outdoor">Outdoor</MenuItem>
              <MenuItem value="covered">Covered</MenuItem>
              <MenuItem value="underground">Underground</MenuItem>
              <MenuItem value="multistorey">Multistorey</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
