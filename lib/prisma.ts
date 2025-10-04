// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Define Zod schema for Novel creation
const NovelCreateInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
});

const prisma = new PrismaClient().$extends({
  query: {
    novel: {
      async create({ args, query }) {
        // Validate data using Zod
        args.data = NovelCreateInputSchema.parse(args.data);
        return query(args);
      },
      async update({ args, query }) {
        // Validate data using Zod
        if (args.data) {
          args.data = NovelCreateInputSchema.partial().parse(args.data);
        }
        return query(args);
      },
    },
  },
});

export default prisma;