import mongoose from 'mongoose';
import env from './config/env';
import app from './app';

async function start() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    const server = app.listen(env.PORT, () => {
      console.log(`Server listening on :${env.PORT} (${env.NODE_ENV})`);
    });

    // graceful shutdown
    const shutdown = () => server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Boot error', err);
    process.exit(1);
  }
}

start();
