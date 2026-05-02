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
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { adminUserService } from '../services/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKYC = async (userId, status) => {
    try {
      await adminUserService.verifyKYC(userId, status);
      toast.success(`User ${status === 'approved' ? 'approved' : 'rejected'}`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update KYC status');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminUserService.delete(userId);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const getUserTypeChip = (type) => {
    const colors = {
      car_owner: 'info',
      space_provider: 'success',
      admin: 'error',
    };
    return <Chip label={type?.replace('_', ' ')} color={colors[type] || 'default'} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        User Management
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>KYC Status</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{getUserTypeChip(user.user_type)}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.kyc_verified ? 'Verified' : 'Pending'}
                        color={user.kyc_verified ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>⭐ {user.rating || 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      {!user.kyc_verified && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleVerifyKYC(user.id, 'approved')}
                            color="success"
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleVerifyKYC(user.id, 'rejected')}
                            color="error"
                          >
                            <CloseIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(user.id)}
                        color="error"
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ minWidth: 400 }}>
              <TextField
                fullWidth
                label="First Name"
                defaultValue={selectedUser.first_name}
                sx={{ mb: 2, mt: 1 }}
              />
              <TextField
                fullWidth
                label="Last Name"
                defaultValue={selectedUser.last_name}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                defaultValue={selectedUser.email}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Phone"
                defaultValue={selectedUser.phone}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
