import { Router } from 'express';

const allowedCommands = new Set(['LED_ON', 'LED_OFF', ...[1, 2, 3, 4].flatMap(id => [`LED${id}_ON`, `LED${id}_OFF`])]);

export function createIotRouter({ store, mqttService, auth }) {
  const router = Router();

  router.post('/auth/login', (request, response) => {
    const { username, password } = request.body || {};
    if (!auth.authenticate(username, password)) {
      return response.status(401).json({ error: 'Invalid username or password' });
    }
    response.json({ token: auth.createToken(), tokenType: 'Bearer', expiresIn: 28800 });
  });

  router.use(auth.requireAuth);
  router.get('/health', (_request, response) => response.json({ status: 'ok' }));
  router.get('/controls/state', (_request, response) => response.json(store.getLedState()));

  router.get('/sensors', async (request, response, next) => {
    const limit = Math.min(Number(request.query.limit) || 50, 100);
    try {
      response.json({ items: (await store.getSensors()).slice(0, limit) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/actions', async (request, response, next) => {
    const date = request.query.time || request.query.date;
    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return response.status(400).json({ error: 'time must use YYYY-MM-DD format' });
    }
    try {
      response.json({ items: await store.getActions(date) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/events', (request, response) => {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();
    response.write('event: ready\ndata: {}\n\n');

    const unsubscribe = store.subscribe(event => {
      response.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
    });
    request.on('close', unsubscribe);
  });

  router.post('/controls', async (request, response) => {
    const command = typeof request.body?.command === 'string'
      ? request.body.command.trim().toUpperCase()
      : '';
    if (!allowedCommands.has(command)) {
      return response.status(400).json({ error: 'Unsupported control command' });
    }

    const action = {
      id: `${Date.now()}`,
      command,
      status: 'Pending',
      time: new Date().toISOString(),
      actor: 'Admin',
    };
    await store.addAction(action);

    try {
      await mqttService.publishControl(command);
      response.status(202).json(action);
    } catch (error) {
      const failedAction = { ...action, status: 'Failed' };
      await store.addAction(failedAction);
      response.status(503).json({ error: 'Unable to publish MQTT command' });
    }
  });

  return router;
}

