import prisma from '../lib/db.js';

export const User = {
    async findOne(conditions) {
        return await prisma.user.findFirst({
            where: conditions,
        });
    },

    async findById(id) {
        return await prisma.user.findUnique({
            where: { id },
        });
    },

    async findByIdAndUpdate(id, data, options = {}) {
        return await prisma.user.update({
            where: { id },
            data,
        });
    },

    async find(conditions) {
        return await prisma.user.findMany({
            where: conditions,
        });
    },

    async exists(conditions) {
        const user = await prisma.user.findFirst({
            where: conditions,
            select: { id: true },
        });
        return !!user;
    },

    async create(data) {
        return await prisma.user.create({
            data,
        });
    },
};

export default User;