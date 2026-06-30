import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;

export const useSocket = () => {
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user && user.role === 'admin') {
      if (!socket) {
        socket = io('http://localhost:5000', {
          withCredentials: true,
        });

        socket.on('connect', () => {
          console.log('Socket connecté');
          socket?.emit('join_admin');
        });

        socket.on('new_complaint', (data) => {
          // Don't show notification if current admin submitted the complaint
          const currentUser = useAuthStore.getState().user;
          if (data.clientId && currentUser?._id && data.clientId === currentUser._id) {
            window.dispatchEvent(new Event('refresh_complaints'));
            return;
          }
          toast.success(`Nouvelle réclamation: ${data.type}`, {
            icon: '🔔',
            duration: 3000,
          });
          // Refresh data event
          window.dispatchEvent(new Event('refresh_complaints'));
        });

        socket.on('disconnect', () => {
          console.log('Socket déconnecté');
        });
      }
    }

    return () => {
      // Don't disconnect on every re-render, keep it alive while admin is logged in
      // Disconnection should happen on logout
    };
  }, [user]);

  return socket;
};
