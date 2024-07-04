
import React from 'react';

export default function RealTimeUpdates() {
  React.useEffect(() => {
    if (!process.env.NEXT_PUBLIC_WS_URL) {
        console.error('WebSocket URL is not defined');
        return;
      }
      const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
      

    socket.onopen = () => {
      console.log('WebSocket Connected');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Message from server ', message);
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>Real-time updates will appear here.</div>
  );
  
}