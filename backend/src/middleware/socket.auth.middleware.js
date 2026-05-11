import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import { ENV } from '../lib/env.js';

export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.headers.cookie
            ?.split("; ")
            .find((row) => row.startsWith("jwt="))
            ?.split("=")[1];

        if (!token) {
            console.log("Socket connection rejected: No token provided");
            return next(new Error("Unauthorized - No Token Provided"));
        }

        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!decoded) {
            console.log("Socket connection rejected: Invalid token");
            return next(new Error("Unauthorized - Invalid Token"));
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, fullName: true, profilePic: true, createdAt: true, updatedAt: true },
        });
        if (!user) {
            console.log("Socket connection rejected: User not found");
            return next(new Error("User not found"));
        }

        socket.user = user;
        socket.userId = user.id;

        console.log(`Socket authenticated for user: ${user.fullName} (${user.id})`);

        next();
    } catch (error) {
        console.log("Error in socket authentication:", error.message);
        next(new Error("Unauthorized - Authentication failed"));
    }
};