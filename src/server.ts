import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { env } from './config/env';

async function main() {
  try {
    // Connect DB
    await mongoose.connect(env.mongoUri, {
      // options can be added here if needed
    });

    const server = http.createServer(app);

    server.listen(env.port, () => {
      console.log(`[server] pid=${process.pid} env=${env.nodeEnv} port=${env.port}`);
    });

    // Graceful shutdown
    const shutdown = (sig: string) => async () => {
      console.log(`[server] received ${sig}, shutting down...`);
      server.close(() => {
        mongoose.connection.close(false).then(() => {
          console.log('[server] closed.');
          process.exit(0);
        });
      });
      // Force-exit safeguard in case something hangs
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig as NodeJS.Signals, shutdown(sig)));
    process.on('unhandledRejection', (err) => {
      console.error('[server] unhandledRejection', err);
    });
    process.on('uncaughtException', (err) => {
      console.error('[server] uncaughtException', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[server] startup error', err);
    process.exit(1);
  }
}

main();
