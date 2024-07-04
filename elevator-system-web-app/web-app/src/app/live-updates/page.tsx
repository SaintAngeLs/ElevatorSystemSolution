// src/app/live-updates/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LiveUpdates = () => {
  const [id, setId] = useState('');
  const [initialFloor, setInitialFloor] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [targetFloor, setTargetFloor] = useState(0);
  const [load, setLoad] = useState(0);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    ws.onmessage = (event) => {
      setRealTimeUpdates(prev => [...prev, JSON.parse(event.data)]);
    };
    return () => ws.close();
  }, []);

  const handleCreateElevator = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/elevator`, {
        id,
        initialFloor,
        capacity
      });
      console.log(response.data);
    } catch (error) {
      console.error('Failed to create elevator:', error);
    }
  };

  const handleUpdateElevator = async () => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/elevator/${id}`, {
        currentFloor,
        targetFloor,
        load
      });
      console.log(response.data);
    } catch (error) {
      console.error('Failed to update elevator:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Elevator Management System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Create Elevator</h2>
          <div className="mb-4">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Elevator ID"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input
              type="number"
              value={initialFloor}
              onChange={(e) => setInitialFloor(Number(e.target.value))}
              placeholder="Initial Floor"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              placeholder="Capacity"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={handleCreateElevator}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Create Elevator
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Update Elevator</h2>
          <div className="mb-4">
            <input
              type="number"
              value={currentFloor}
              onChange={(e) => setCurrentFloor(Number(e.target.value))}
              placeholder="Current Floor"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input
              type="number"
              value={targetFloor}
              onChange={(e) => setTargetFloor(Number(e.target.value))}
              placeholder="Target Floor"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <input
              type="number"
              value={load}
              onChange={(e) => setLoad(Number(e.target.value))}
              placeholder="Load"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            onClick={handleUpdateElevator}
            className="w-full bg-green-500 text-white p-2 rounded"
          >
            Update Elevator
          </button>
        </div>
      </div>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Real-Time Updates</h2>
        <ul className="space-y-2">
          {realTimeUpdates.map((update, index) => (
            <li key={index} className="bg-gray-100 p-2 rounded">
              {JSON.stringify(update)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LiveUpdates;
