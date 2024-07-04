"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";

const Management = () => {
  const [buildingConfig, setBuildingConfig] = useState({ floors: 10 });
  const [elevators, setElevators] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingElevator, setEditingElevator] = useState(null);
  const [newElevator, setNewElevator] = useState({ initialFloor: 0, capacity: 10 });

  useEffect(() => {
    fetchElevators();
  }, []);

  const fetchElevators = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/elevators/status`);
      console.log("Fetched elevators:", response.data);
      setElevators(response.data);
    } catch (error) {
      console.error("Error fetching elevators:", error);
    }
  };

  const handleDialogOpen = (elevator = null) => {
    setEditingElevator(elevator);
    setNewElevator(elevator ? elevator : { initialFloor: 0, capacity: 10 });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingElevator(null);
  };

  const handleSave = async () => {
    try {
      if (editingElevator) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/elevator/${editingElevator.id}`, newElevator);
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/elevator`, { ...newElevator, id: elevators.length + 1 });
      }
      fetchElevators();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving elevator:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/elevator/${id}`);
      fetchElevators();
    } catch (error) {
      console.error("Error deleting elevator:", error);
    }
  };

  return (
    <Container sx={{ borderRadius: 2, backgroundColor: 'white', p: 3, boxShadow: 3 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Building Management</Typography>
        </Toolbar>
      </AppBar>
      <Box my={4}>
        <Typography variant="h5">Current Building Configuration</Typography>
        <Box mt={2}>
          <TextField
            label="Number of Floors"
            type="number"
            value={buildingConfig.floors}
            onChange={(e) => setBuildingConfig({ floors: Number(e.target.value) })}
          />
        </Box>
      </Box>
      <Box my={4}>
        <Typography variant="h5">Elevators</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleDialogOpen()}
        >
          Add Elevator
        </Button>
        <List>
          {elevators.map((elevator) => (
            <ListItem key={elevator.id}>
              <ListItemText
                primary={`Elevator ${elevator.id}`}
                secondary={`Initial Floor: ${elevator.currentFloor}, Capacity: ${elevator.capacity}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDialogOpen(elevator)}>
                  <Edit />
                </IconButton>
                <IconButton edge="end" onClick={() => handleDelete(elevator.id)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>{editingElevator ? "Edit Elevator" : "Add Elevator"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Initial Floor"
            type="number"
            fullWidth
            value={newElevator.initialFloor}
            onChange={(e) => setNewElevator({ ...newElevator, initialFloor: Number(e.target.value) })}
          />
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            value={newElevator.capacity}
            onChange={(e) => setNewElevator({ ...newElevator, capacity: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Management;
