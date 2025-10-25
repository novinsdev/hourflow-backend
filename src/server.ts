import mongoose from 'mongoose';
import app from './app';
import { env } from './config/env';

async function main() {
  await mongoose.connect(env.mongoUri);
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
