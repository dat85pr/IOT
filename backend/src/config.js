import 'dotenv/config';

const required = name => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT || 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  mqtt: {
    url: required('MQTT_URL'),
    username: required('MQTT_USERNAME'),
    password: required('MQTT_PASSWORD'),
    clientId: process.env.MQTT_CLIENT_ID || `iot-dashboard-${Date.now()}`,
    sensorTopic: process.env.MQTT_SENSOR_TOPIC || 'sensor_data',
    controlTopic: process.env.MQTT_CONTROL_TOPIC || 'device_control',
    responseTopic: process.env.MQTT_RESPONSE_TOPIC || 'device_response',
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '123456',
    database: process.env.MYSQL_DATABASE || 'iot_dashboard',
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  },
};
