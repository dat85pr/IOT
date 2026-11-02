import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { createMemoryStore } from './store/memoryStore.js';
import { createDatabase } from './database/mysql.js';
import { createMqttService } from './mqtt/mqttService.js';
import { createIotRouter } from './routes/iotRoutes.js';

const app = express();
const database = createDatabase(config.mysql);
const store = createMemoryStore(database);
const mqttService = createMqttService({ config, store });

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());
app.use('/api', createIotRouter({ store, mqttService }));

const server = await (async () => {
  try {
    await database.initialize();
    await store.initialize();
    const httpServer = await new Promise((resolve, reject) => {
      const instance = app.listen(config.port);
      instance.once('listening', () => resolve(instance));
      instance.once('error', reject);
    });
    console.log('[DB] MySQL initialized');
    console.log(`[HTTP] IoT backend listening on http://localhost:${config.port}`);
    return httpServer;
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`[HTTP] Port ${config.port} is already in use. Stop the existing backend or change PORT in backend/.env.`);
    } else {
      console.error('[DB] Initialization failed:', error.message);
    }
    await database.close();
    process.exit(1);
  }
})();

const shutdown = () => {
  mqttService.close();
  void database.close();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
