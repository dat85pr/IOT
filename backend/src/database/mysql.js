import mysql from 'mysql2/promise';

const DEFAULT_USER_ID = 1;
const SENSOR_DEFINITIONS = [
  ['Nhiệt độ', 'temperature', '°C', 'T', 'active'],
  ['Độ ẩm', 'humidity', '%', 'H', 'active'],
  ['Ánh sáng', 'light', 'lux', 'L', 'active'],
];
const DEVICE_DEFINITIONS = [
  ['Đèn 1', 'LED', 'LED1', 'OFF'],
  ['Đèn 2', 'LED', 'LED2', 'OFF'],
];

export function createDatabase(config) {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: config.connectionLimit,
    dateStrings: true,
  });

  return {
    async initialize() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          username VARCHAR(50) NOT NULL,
          password VARCHAR(255) NOT NULL DEFAULT '',
          fullname VARCHAR(100) NOT NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (user_id),
          UNIQUE KEY uq_users_username (username)
        )
      `);
      await pool.execute(
        `INSERT INTO users (user_id, username, password, fullname)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE fullname = VALUES(fullname)`,
        [DEFAULT_USER_ID, 'admin', '', 'Hoang Dinh Dat'],
      );

      await pool.query(`
        CREATE TABLE IF NOT EXISTS sensors (
          sensor_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          sensor_type VARCHAR(30) NOT NULL,
          unit VARCHAR(15) NOT NULL,
          pin VARCHAR(10) NOT NULL,
          status VARCHAR(10) NOT NULL DEFAULT 'active',
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (sensor_id),
          UNIQUE KEY uq_sensors_type (sensor_type)
        )
      `);
      for (const definition of SENSOR_DEFINITIONS) {
        await pool.execute(
          `INSERT INTO sensors (name, sensor_type, unit, pin, status)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), unit = VALUES(unit), pin = VALUES(pin)`,
          definition,
        );
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS devices (
          device_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id INT UNSIGNED NULL,
          name VARCHAR(100) NOT NULL,
          device_type VARCHAR(30) NOT NULL,
          pin VARCHAR(10) NOT NULL,
          status VARCHAR(10) NOT NULL DEFAULT 'OFF',
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (device_id),
          UNIQUE KEY uq_devices_pin (pin),
          CONSTRAINT fk_devices_user FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
      `);
      for (const definition of DEVICE_DEFINITIONS) {
        await pool.execute(
          `INSERT INTO devices (user_id, name, device_type, pin, status)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), user_id = VALUES(user_id)`,
          [DEFAULT_USER_ID, ...definition],
        );
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS sensors_data (
          data_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          sensor_id INT UNSIGNED NOT NULL,
          value DOUBLE NOT NULL,
          created_at DATETIME(3) NOT NULL,
          PRIMARY KEY (data_id),
          INDEX idx_sensors_data_created_at (created_at),
          CONSTRAINT fk_sensors_data_sensor FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS actions_history (
          action_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          device_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NOT NULL,
          action VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at DATETIME(3) NOT NULL,
          PRIMARY KEY (action_id),
          INDEX idx_actions_history_created_at (created_at),
          CONSTRAINT fk_actions_device FOREIGN KEY (device_id) REFERENCES devices(device_id),
          CONSTRAINT fk_actions_user FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
      `);
    },

    async saveSensor(reading) {
      const [sensors] = await pool.execute(
        'SELECT sensor_id, sensor_type FROM sensors WHERE sensor_type IN (?, ?, ?)',
        ['temperature', 'humidity', 'light'],
      );
      const values = {
        temperature: reading.temp,
        humidity: reading.hum,
        light: reading.light,
      };
      for (const sensor of sensors) {
        await pool.execute(
          'INSERT INTO sensors_data (sensor_id, value, created_at) VALUES (?, ?, ?)',
          [sensor.sensor_id, values[sensor.sensor_type], new Date(reading.receivedAt)],
        );
      }
    },

    async listSensors(limit) {
      const [rows] = await pool.execute(
        `SELECT
          MAX(sd.data_id) AS id,
          MAX(CASE WHEN s.sensor_type = 'temperature' THEN sd.value END) AS temp,
          MAX(CASE WHEN s.sensor_type = 'humidity' THEN sd.value END) AS hum,
          MAX(CASE WHEN s.sensor_type = 'light' THEN sd.value END) AS light,
          MAX(CASE WHEN s.sensor_type = 'temperature' THEN CONCAT('T', LPAD(sd.data_id, 4, '0')) END) AS temperatureId,
          MAX(CASE WHEN s.sensor_type = 'humidity' THEN CONCAT('H', LPAD(sd.data_id, 4, '0')) END) AS humidityId,
          MAX(CASE WHEN s.sensor_type = 'light' THEN CONCAT('L', LPAD(sd.data_id, 4, '0')) END) AS lightId,
          sd.created_at AS receivedAt
        FROM sensors_data sd
        JOIN sensors s ON s.sensor_id = sd.sensor_id
        GROUP BY sd.created_at
        ORDER BY sd.created_at DESC
        LIMIT ?`,
        [limit],
      );
      return rows;
    },

    async saveAction(action) {
      const devicePin = action.command.startsWith('LED2_') ? 'LED2' : 'LED1';
      const actionName = action.command.endsWith('_ON') ? 'TURN ON' : 'TURN OFF';
      const [[device]] = await pool.execute('SELECT device_id FROM devices WHERE pin = ?', [devicePin]);
      if (!device) throw new Error(`Unknown device pin: ${devicePin}`);
      const actionId = Number(action.id);
      if (Number.isInteger(actionId) && actionId > 0) {
        const [existing] = await pool.execute(
          'SELECT action_id FROM actions_history WHERE action_id = ?',
          [actionId],
        );
        if (existing.length > 0) {
          await pool.execute(
            'UPDATE actions_history SET status = ? WHERE action_id = ?',
            [action.status, actionId],
          );
          return String(actionId).padStart(4, '0');
        }
      }
      const [result] = await pool.execute(
        `INSERT INTO actions_history (device_id, user_id, action, status, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [device.device_id, DEFAULT_USER_ID, actionName, action.status, new Date(action.time)],
      );
      return String(result.insertId).padStart(4, '0');
    },

    async updateActionStatus(id, status) {
      await pool.execute('UPDATE actions_history SET status = ? WHERE action_id = ?', [status, Number(id)]);
    },

    async resolvePendingActions(led1, led2) {
      for (const [pin, state] of [['LED1', led1], ['LED2', led2]]) {
        await pool.execute(
          `UPDATE actions_history ah
           JOIN devices d ON d.device_id = ah.device_id
           SET ah.status = CASE
             WHEN (ah.action = 'TURN ON' AND ? = 'ON') OR (ah.action = 'TURN OFF' AND ? = 'OFF')
             THEN 'Success' ELSE 'Failed' END
           WHERE ah.status = 'Pending' AND d.pin = ?`,
          [state, state, pin],
        );
      }
    },

    async saveLedState(led1, led2) {
      for (const [pin, state] of [['LED1', led1], ['LED2', led2]]) {
        await pool.execute(
          'UPDATE devices SET status = ?, updated_at = NOW(3) WHERE pin = ?',
          [state, pin],
        );
      }
    },

    async getLedState() {
      const [rows] = await pool.execute('SELECT pin, status FROM devices WHERE pin IN (?, ?)', ['LED1', 'LED2']);
      return {
        led1: rows.find(row => row.pin === 'LED1')?.status || 'OFF',
        led2: rows.find(row => row.pin === 'LED2')?.status || 'OFF',
      };
    },

    async listActions() {
      const [rows] = await pool.execute(
        `SELECT
          LPAD(ah.action_id, 4, '0') AS id,
          CASE WHEN d.pin = 'LED2' THEN CONCAT('LED2_', IF(ah.action = 'TURN ON', 'ON', 'OFF'))
               ELSE CONCAT('LED1_', IF(ah.action = 'TURN ON', 'ON', 'OFF')) END AS command,
          CASE WHEN d.pin = 'LED2' THEN 'LED Control 2' ELSE 'LED Control 1' END AS device,
          ah.action,
          ah.status,
          u.fullname AS actor,
          ah.created_at AS time
        FROM actions_history ah
        JOIN devices d ON d.device_id = ah.device_id
        JOIN users u ON u.user_id = ah.user_id
        ORDER BY ah.created_at DESC
        LIMIT 100`,
      );
      return rows;
    },

    async close() {
      await pool.end();
    },
  };
}
