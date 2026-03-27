import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    // Only connect if a user is logged in
    if (!user || !token) {
      // If user logs out, disconnect the socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to the backend socket server
    const socket = io('http://localhost:5000', { transports: ['websocket'] });
    socketRef.current = socket;

    // Tell the server which user this socket belongs to
    socket.on('connect', () => {
      socket.emit('register', user.id);
    });

    // When a 'notification' event arrives, add it to state
    // This triggers an instant UI update — no polling needed
    socket.on('notification', (notification) => {
      setLiveNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ liveNotifications, setLiveNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}