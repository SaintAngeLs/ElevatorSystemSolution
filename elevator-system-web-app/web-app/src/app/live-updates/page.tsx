"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LiveUpdates = () => {
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [buildingConfig, setBuildingConfig] = useState({ floors: 0, maxElevators: 0 });
  const [elevators, setElevators] = useState([]);
  const buildingRef = useRef(null);
  const ws = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      const updates = JSON.parse(event.data);
      setRealTimeUpdates((prev) => [...prev, ...updates]);
      setElevators((prevElevators) => {
        const updatedElevators = updates.map(update => {
          const existing = prevElevators.find(elevator => elevator.id === update.id);
          return existing ? { ...existing, ...update } : update;
        });
        return updatedElevators;
      });
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = (event) => {
      console.warn('WebSocket connection closed. Reconnecting...');
      setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
    };
  };

  useEffect(() => {
    fetchBuildingConfig();
    fetchElevators();
    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  useEffect(() => {
    if (buildingRef.current) {
      renderBuilding();
    }
  }, [buildingConfig]);

  useEffect(() => {
    elevators.forEach(elevator => {
      moveElevator(elevator.id, elevator.currentFloor);
    });
  }, [elevators]);

  const fetchBuildingConfig = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/building`);
      setBuildingConfig(response.data);
    } catch (error) {
      console.error('Error fetching building configuration:', error);
    }
  };

  const fetchElevators = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/elevators/status`);
      setElevators(response.data);
    } catch (error) {
      console.error('Error fetching elevators:', error);
    }
  };

  const moveElevator = (id, targetFloor) => {
    const elevatorEl = document.getElementById(`elevator-${id}`);
    if (!elevatorEl) return;

    const floorHeight = 1; // Adjust based on your layout
    const targetY = (buildingConfig.floors - targetFloor - 1) * floorHeight;

    elevatorEl.style.transform = `translateY(${targetY}px)`;
  };

  const callElevator = async (floor) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pickup`, {
        floor,
        direction: 1 // Assuming direction 1 means "up", adjust as needed
      });
    } catch (error) {
      console.error('Failed to call elevator:', error);
    }
  };

  const renderBuilding = () => {
    const floors = [];
    for (let i = 0; i < buildingConfig.floors; i++) {
      floors.push(
        <div
          key={i}
          className="floor flex items-center border-b border-gray-300 p-2"
          onClick={() => callElevator(buildingConfig.floors - i - 1)}
          style={{ height: '60px', cursor: 'pointer', position: 'relative', display: 'flex', justifyContent: 'space-between' }}
        >
          <span>Floor {buildingConfig.floors - i - 1}</span>
          {Array.from({ length: buildingConfig.maxElevators }).map((_, elevatorIndex) => (
            <div key={elevatorIndex} style={{ width: '40px', height: '40px', position: 'relative' }}>
              {renderElevator(elevatorIndex, buildingConfig.floors - i - 1)}
            </div>
          ))}
        </div>
      );
    }
    return floors;
  };

  const renderElevator = (elevatorIndex, floor) => {
    const elevator = elevators.find(e => e.id === elevatorIndex + 1);
    if (elevator && elevator.currentFloor === floor) {
      return (
        <div
          id={`elevator-${elevator.id}`}
          className={`elevator bg-blue-500 text-white flex items-center justify-center rounded ${elevator.status}`}
          style={{
            width: '40px',
            height: '40px',
            position: 'absolute',
            top: 0,
            transition: 'transform 1s ease-in-out'
          }}
        >
          {elevator.id}
        </div>
      );
    }
    return null;
  };

  const renderControlPanel = () => {
    const buttons = [];
    for (let i = 0; i < buildingConfig.floors; i++) {
      buttons.push(
        <button
          key={i}
          className="control-button bg-blue-500 text-white p-2 rounded m-1"
          onClick={() => callElevator(buildingConfig.floors - i - 1)}
        >
          Call to Floor {buildingConfig.floors - i - 1}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Building Schema</h1>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Control Panel</h2>
        <div className="control-panel flex flex-wrap justify-center">
          {renderControlPanel()}
        </div>
      </div>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Building Overview</h2>
        <div ref={buildingRef} className="building-schema" style={{ border: '1px solid black', position: 'relative' }}>
          {renderBuilding()}
        </div>
      </div>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Real-Time Updates</h2>
        <ul className="space-y-2 max-h-64 overflow-y-auto">
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
