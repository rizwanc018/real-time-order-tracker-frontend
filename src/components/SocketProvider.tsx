"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

// Define the shape of the context value
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

// Create context with an initial undefined value
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Custom hook to access the socket context
export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}

// Provider component
export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        const newSocket: Socket = io(backendUrl);

        newSocket.on("connect", () => {
            setIsConnected(true);
            console.log("Connected to server");
        });

        newSocket.on("disconnect", () => {
            setIsConnected(false);
            console.log("Disconnected from server");
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect(); // properly close connection
        };
    }, []);

    const value: SocketContextType = {
        socket,
        isConnected,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
