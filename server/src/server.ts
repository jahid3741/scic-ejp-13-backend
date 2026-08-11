import { Server } from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

let server: Server;

async function main() {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected successfully');

    server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    console.error('Failed to connect database or start server:', error);
    process.exit(1);
  }
}

const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await prisma.$disconnect();
      console.log('Database disconnected.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
