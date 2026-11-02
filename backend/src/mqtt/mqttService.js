import mqtt from 'mqtt';

const parseJson = payload => {
  try {
    return JSON.parse(payload.toString());
  } catch {
    return null;
  }
};

export function createMqttService({ config, store }) {
  const client = mqtt.connect(config.mqtt.url, {
    username: config.mqtt.username,
    password: config.mqtt.password,
    clientId: config.mqtt.clientId,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log(`[MQTT] Connected: ${config.mqtt.url}`);
    client.subscribe([config.mqtt.sensorTopic, config.mqtt.responseTopic], error => {
      if (error) console.error('[MQTT] Subscribe failed:', error.message);
    });
  });

  client.on('message', (topic, payload) => {
    const data = parseJson(payload);
    if (!data) {
      console.warn(`[MQTT] Ignoring invalid JSON on ${topic}`);
      return;
    }

    if (topic === config.mqtt.sensorTopic) {
      void store.addSensor({ ...data, receivedAt: new Date().toISOString() });
    } else if (topic === config.mqtt.responseTopic) {
      const response = { ...data, receivedAt: new Date().toISOString() };
      store.setLatestResponse(response);
      store.resolveLatestAction(response.status === 'SUCCESS' ? 'Success' : 'Failed');
    }
  });

  client.on('error', error => console.error('[MQTT] Error:', error.message));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));

  return {
    publishControl(message) {
      return new Promise((resolve, reject) => {
        client.publish(config.mqtt.controlTopic, message, error => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
    close() {
      client.end();
    },
  };
}
