import prisma from "../lib/db.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await prisma.user.findMany({
            where: { id: { not: loggedInUserId } },
            select: { id: true, email: true, fullName: true, profilePic: true, createdAt: true, updatedAt: true },
        });

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log('Error in getAllContacts:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getMessagesByUserId = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: userToChatId },
                    { senderId: userToChatId, receiverId: myId }
                ],
            },
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log('Error in getMessagesByUserId:', error.message);
        res.status(500).json({ message: 'Interval Server Error' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: 'Message text or image is required' });
        }
        if (senderId === receiverId) {
            return res.status(400).json({ message: 'You cannot send message to yourself' });
        }
        const receiverExists = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true },
        });
        if (!receiverExists) {
            return res.status(404).json({ message: 'Receiver user not found' });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(201).json(newMessage);
    } catch (error) {
        console.log('Error in sendMessage:', error.message);
        res.status(500).json({ message: 'Interval Server Error' });
    }
};

export const getChatPartners = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const messages = await prisma.message.findMany({
            where: {
                OR: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
            },
        });

        const chatPartnerIds = [
            ...new Set(
                messages.map(msg =>
                    msg.senderId === loggedInUserId ? msg.receiverId : msg.senderId
                )
            ),
        ];

        const chatPartners = await prisma.user.findMany({
            where: { id: { in: chatPartnerIds } },
            select: { id: true, email: true, fullName: true, profilePic: true, createdAt: true, updatedAt: true },
        });
        res.status(200).json(chatPartners);
    } catch (error) {
        console.log('Error in getChatPartners:', error);
        res.status(500).json({ message: 'Interval Server Error' });
    }
};