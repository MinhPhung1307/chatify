import prisma from '../lib/db.js';

export const Message = {
    async find(conditions) {
        return await prisma.message.findMany({
            where: conditions,
            orderBy: { createdAt: 'asc' },
        });
    },

    async create(data) {
        return await prisma.message.create({
            data,
        });
    },

    async findMany(conditions) {
        return await prisma.message.findMany({
            where: conditions,
        });
    },
};

export default Message;