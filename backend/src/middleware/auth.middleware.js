import jwt from 'jsonwebtoken';
import { ENV } from '../lib/env.js';
import prisma from '../lib/db.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!decoded) return res.status(401).json({ message: 'Unauthorized: Invalid token' });

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, fullName: true, profilePic: true, createdAt: true, updatedAt: true },
        });
        if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });

        req.user = user;
        next();

    } catch (error) {
        console.log('Error in protectRoute middleware:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }
}