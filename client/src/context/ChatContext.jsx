/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { useContext } from 'react';
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    //function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/user");
            // console.log("Response data from backend:", data);
            if (data.Success) {
                setUsers(data.users)

                const initialUnseen = {};
                data.users.forEach(user => {
                    initialUnseen[user._id] = data.unseenMessages[user._id] || 0;
                });
                setUnseenMessages(initialUnseen);

            } else {
                console.error("Failed to fetch users:", data.message);

            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.Success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //function to send msg for selected user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            console.log("Send Message Response:", data);

            if (data.Success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            } else {
                toast.error(data.Message);
            }
        } catch (error) {
            toast.error(error.Message);
        }
    }

    //function to subscribe to messages for selected user
    const subscribeToMessages = async () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);

                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: 0
                }));
            } else {
                setUnseenMessages((prev) => ({
                    ...prev, [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }))
            }
        })
    }

    useEffect(() => {
        if (selectedUser) {
            setUnseenMessages(prev => ({
                ...prev,
                [selectedUser._id]: 0
            }));
        }
    }, [selectedUser]);

    //function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if (socket) socket.off("newMessage");
    }

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        getMessages
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}