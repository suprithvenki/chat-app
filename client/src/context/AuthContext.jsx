/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);

    // Check authentication
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Login function
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                const authHeader = `Bearer ${data.token}`;
                axios.defaults.headers.common["Authorization"] = authHeader;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error.message);
            toast.error(error.message);
        }
    };

    // Update profile function
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            toast.error("Error in updating profile");
            console.error("Error in updating profile", error.message);
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        delete axios.defaults.headers.common["Authorization"];
        toast.success("Logged out successfully");
        if (socket) socket.disconnect();
    };

    // Socket connection
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds);
        });
    };

    // Setup token and check auth
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
        checkAuth();
    }, [token]);

    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
