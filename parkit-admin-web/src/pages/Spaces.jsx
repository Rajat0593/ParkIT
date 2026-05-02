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
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { adminSpaceService } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
                  <TableCell>Slots</TableCell>
                  <TableCell>Price/Day</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {spaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{space.name}</TableCell>
                    <TableCell>{space.provider_name}</TableCell>
                    <TableCell>{space.address?.substring(0, 30)}</TableCell>
                    <TableCell>
                      {space.available_slots}/{space.total_slots}
                    </TableCell>
                    <TableCell>₹{space.price_per_day}</TableCell>
                    <TableCell>
                      {getVerificationStatusChip(space.verification_status)}
                    </TableCell>
                    <TableCell>
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
    </Box>
  );
}
