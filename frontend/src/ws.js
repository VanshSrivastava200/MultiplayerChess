import { io } from "socket.io-client";

export const connectWS = () => {
  const socket = io("https://multiplayerchess-cl7y.onrender.com", {
    withCredentials: true,  // This is CRITICAL
    transports: ['websocket', 'polling']  // Add this for better compatibility
  });
  
  return socket;
};