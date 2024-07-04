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
  const [buildingConfig, setBuildingConfig] = useState({ floors: 0, maxElevators: 0 });
  const [elevators, setElevators] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingElevator, setEditingElevator] = useState(null);
  const [newElevator, setNewElevator] = useState({ initialFloor: 0, capacity: 10 });
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [bulkCapacity, setBulkCapacity] = useState(10);

  useEffect(() => {
    fetchBuildingConfig();
    fetchElevators();
  }, []);

  const fetchBuildingConfig = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/building`);
      setBuildingConfig(response.data);
    } catch (error) {
      console.error("Error fetching building configuration:", error);
    }
  };

  const fetchElevators = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/elevators/status`);
      console.log("Fetched elevators:", response.data);
      setElevators(response.data);
    } catch (error) {
      console.error("Error fetching elevators:", error);
    }
  };

  const handleBuildingDialogOpen = () => {
    setBuildingDialogOpen(true);
  };

  const handleBuildingDialogClose = () => {
    setBuildingDialogOpen(false);
  };

  const handleBuildingSave = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/building`, buildingConfig);
      fetchBuildingConfig();
      handleBuildingDialogClose();
    } catch (error) {
      console.error("Error saving building configuration:", error);
    }
  };

  const handleInputChange = (setter) => (event) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setter(Number(value));
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
        if (elevators.length < buildingConfig.maxElevators) {
          await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/elevator`, { ...newElevator, id: elevators.length + 1 });
          fetchElevators();
        } else {
          alert("Maximum number of elevators reached");
        }
      }
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

  const handleGenerateMaxElevators = async () => {
    try {
      const existingElevators = elevators.length;
      const remainingElevators = buildingConfig.maxElevators - existingElevators;
      for (let i = 0; i < remainingElevators; i++) {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/elevator`, {
          initialFloor: 0,
          capacity: bulkCapacity,
          id: existingElevators + i + 1
        });
      }
      fetchElevators();
    } catch (error) {
      console.error("Error generating elevators:", error);
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
          <Typography>Floors: {buildingConfig.floors}</Typography>
          <Typography>Max Elevators: {buildingConfig.maxElevators}</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleBuildingDialogOpen}
        >
          Edit Building Configuration
        </Button>
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
        <Button
          variant="contained"
          color="secondary"
          onClick={handleGenerateMaxElevators}
          sx={{ ml: 2 }}
        >
          Generate Max Elevators
        </Button>
        <TextField
          margin="dense"
          label="Elevator Capacity"
          type="text"
          fullWidth
          value={bulkCapacity}
          onChange={handleInputChange(setBulkCapacity)}
          sx={{ mt: 2 }}
        />
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
      <Dialog open={buildingDialogOpen} onClose={handleBuildingDialogClose}>
        <DialogTitle>Edit Building Configuration</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Number of Floors"
            type="text"
            fullWidth
            value={buildingConfig.floors}
            onChange={handleInputChange((value) => setBuildingConfig({ ...buildingConfig, floors: value }))}
          />
          <TextField
            margin="dense"
            label="Max Elevators"
            type="text"
            fullWidth
            value={buildingConfig.maxElevators}
            onChange={handleInputChange((value) => setBuildingConfig({ ...buildingConfig, maxElevators: value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBuildingDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleBuildingSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>{editingElevator ? "Edit Elevator" : "Add Elevator"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Initial Floor"
            type="text"
            fullWidth
            value={newElevator.initialFloor}
            onChange={handleInputChange((value) => setNewElevator({ ...newElevator, initialFloor: value }))}
          />
          <TextField
            margin="dense"
            label="Capacity"
            type="text"
            fullWidth
            value={newElevator.capacity}
            onChange={handleInputChange((value) => setNewElevator({ ...newElevator, capacity: value }))}
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
