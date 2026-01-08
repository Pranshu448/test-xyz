import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  // ✅ Use state to store socket so context updates reactively when socket is created/disconnected
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 🚫 NO USER → NO SOCKET
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null); // ✅ Update state to trigger context re-render
      }
      return;
    }

    // ✅ USER EXISTS → CREATE SOCKET
    const token = localStorage.getItem("token");
    if (!token) {
      setSocket(null);
      return;
    }

    socketRef.current = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket"], // avoids polling noise
    });

    // ✅ Update state so context provides the socket value
    setSocket(socketRef.current);

    socketRef.current.on("connect", () => {
      console.log("🟢 Frontend socket connected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("🔴 Socket connect error:", err.message);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null); // ✅ Clear socket state on cleanup
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
