"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LiveUpdates = () => {
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [buildingConfig, setBuildingConfig] = useState({ floors: 0, maxElevators: 0 });
  const [elevators, setElevators] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const buildingRef = useRef(null);
  const ws = useRef(null);

  const connectWebSocket = () => {
    ws.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.current.onmessage = (event) => {
      const updates = JSON.parse(event.data);
      if (updates.type === 'REQUEST_COMPLETED') {
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(updates.payload.floor);
          return newSet;
        });
      } else {
        setRealTimeUpdates((prev) => [...prev, ...updates]);
        setElevators((prevElevators) => {
          const updatedElevators = prevElevators.map(elevator => {
            const update = updates.find(update => update.id === elevator.id);
            if (update) {
              return { ...elevator, ...update };
            }
            return elevator;
          });
          return updatedElevators;
        });
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = (event) => {
      console.warn('WebSocket connection closed. Reconnecting...');
      setTimeout(connectWebSocket, 1000);
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

    const floorHeight = 0.1;
    const targetY = (buildingConfig.floors - targetFloor - 1) * floorHeight;

    elevatorEl.style.transform = `translateY(${targetY}px)`;
  };

  const callElevator = async (floor) => {
    try {
      setPendingRequests(prev => new Set(prev).add(floor));
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pickup`, {
        floor,
        direction: floor
      });
    } catch (error) {
      console.error('Failed to call elevator:', error);
    }
  };

  const renderBuilding = () => {
    const floors = [];
    for (let i = 0; i < buildingConfig.floors; i++) {
      const floorNumber = buildingConfig.floors - i - 1;
      floors.push(
        <div
          key={i}
          className="floor flex items-center border-b border-gray-300 p-2"
          onClick={() => callElevator(floorNumber)}
          style={{ height: '60px', cursor: 'pointer', position: 'relative', display: 'flex', justifyContent: 'space-between' }}
        >
          <span style={{ color: pendingRequests.has(floorNumber) ? 'blue' : 'black' }}>
            Floor {floorNumber}
          </span>
          {Array.from({ length: buildingConfig.maxElevators }).map((_, elevatorIndex) => (
            <div key={elevatorIndex} style={{ width: '40px', height: '40px', position: 'relative' }}>
              {renderElevator(elevatorIndex, floorNumber)}
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
            transition: 'transform 2s ease-in-out'
          }}
        >
          {elevator.targetFloor !== null ? elevator.targetFloor : elevator.currentFloor}
        </div>
      );
    }
    return null;
  };

  const renderControlPanel = () => {
    const buttons = [];
    for (let i = 0; i < buildingConfig.floors; i++) {
      const floorNumber = buildingConfig.floors - i - 1;
      buttons.push(
        <button
          key={i}
          className={`control-button w-10 h-10 flex items-center justify-center rounded-full m-1 ${pendingRequests.has(floorNumber) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => callElevator(floorNumber)}
        >
          {floorNumber}
        </button>
      );
    }
    return buttons;
  };

  const randomCallElevators = () => {
    for (let i = 0; i < buildingConfig.floors; i++) {
      const randomFloor = Math.floor(Math.random() * buildingConfig.floors);
      callElevator(randomFloor);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Building Schema</h1>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Control Panel</h2>
        <div className="control-panel flex flex-wrap justify-center">
          {renderControlPanel()}
          <button
            className="control-button bg-green-500 text-white p-2 rounded m-1"
            onClick={randomCallElevators}
          >
            Random Call Elevators
          </button>
        </div>
      </div>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Building Overview</h2>
        <div ref={buildingRef} className="building-schema" style={{ border: '1px solid black', position: 'relative' }}>
          {renderBuilding()}
        </div>
      </div>
    </div>
  );
};

export default LiveUpdates;
