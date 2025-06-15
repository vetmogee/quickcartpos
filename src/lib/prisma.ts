// Import PrismaClient from the generated Prisma client
import { PrismaClient } from "@/generated/prisma";

// Create a global type for the Prisma client to avoid multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Export a singleton instance of PrismaClient
export const prisma =
  globalForPrisma.prisma || new PrismaClient();

// In development, store the Prisma client in the global object to prevent multiple instances
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;