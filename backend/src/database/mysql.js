import mysql from 'mysql2/promise';

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
        CREATE TABLE IF NOT EXISTS sensor_readings (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          temperature DECIMAL(8,2) NOT NULL,
          humidity DECIMAL(8,2) NOT NULL,
          light INT NOT NULL,
          received_at DATETIME(3) NOT NULL,
          PRIMARY KEY (id),
          INDEX idx_sensor_received_at (received_at)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS device_actions (
          id VARCHAR(64) NOT NULL,
          command VARCHAR(32) NOT NULL,
          status VARCHAR(16) NOT NULL,
          actor VARCHAR(64) NOT NULL,
          created_at DATETIME(3) NOT NULL,
          PRIMARY KEY (id),
          INDEX idx_action_created_at (created_at)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS device_states (
          device VARCHAR(32) NOT NULL,
          state VARCHAR(8) NOT NULL,
          updated_at DATETIME(3) NOT NULL,
          PRIMARY KEY (device)
        )
      `);
      await pool.query("UPDATE device_actions SET actor = 'Admin' WHERE actor IS NULL OR actor = '' OR actor = 'dashboard'");
    },
    async saveSensor(reading) {
      await pool.execute(
        'INSERT INTO sensor_readings (temperature, humidity, light, received_at) VALUES (?, ?, ?, ?)',
        [reading.temp, reading.hum, reading.light, new Date(reading.receivedAt)],
      );
    },
    async listSensors(limit) {
      const [rows] = await pool.execute(
        'SELECT id, temperature AS temp, humidity AS hum, light, received_at AS receivedAt FROM sensor_readings ORDER BY received_at DESC LIMIT ?',
        [limit],
      );
      return rows;
    },
    async saveAction(action) {
      await pool.execute(
        'INSERT INTO device_actions (id, command, status, actor, created_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)',
        [action.id, action.command, action.status, action.actor || 'Admin', new Date(action.time)],
      );
    },
    async updateActionStatus(id, status) {
      await pool.execute('UPDATE device_actions SET status = ? WHERE id = ?', [status, id]);
    },
    async resolvePendingActions(led1, led2) {
      await pool.execute(
        'UPDATE device_actions SET status = CASE WHEN command = ? THEN ? ELSE ? END WHERE status = ? AND command IN (?, ?)',
        [led1 === 'ON' ? 'LED1_ON' : 'LED1_OFF', 'Success', 'Failed', 'Pending', 'LED1_ON', 'LED1_OFF'],
      );
      await pool.execute(
        'UPDATE device_actions SET status = CASE WHEN command = ? THEN ? ELSE ? END WHERE status = ? AND command IN (?, ?)',
        [led2 === 'ON' ? 'LED2_ON' : 'LED2_OFF', 'Success', 'Failed', 'Pending', 'LED2_ON', 'LED2_OFF'],
      );
    },
    async saveLedState(led1, led2) {
      for (const [device, state] of [['LED Control 1', led1], ['LED Control 2', led2]]) {
        await pool.execute(
          'INSERT INTO device_states (device, state, updated_at) VALUES (?, ?, NOW(3)) ON DUPLICATE KEY UPDATE state = VALUES(state), updated_at = VALUES(updated_at)',
          [device, state],
        );
      }
    },
    async getLedState() {
      const [rows] = await pool.execute('SELECT device, state FROM device_states');
      return {
        led1: rows.find(row => row.device === 'LED Control 1')?.state || 'OFF',
        led2: rows.find(row => row.device === 'LED Control 2')?.state || 'OFF',
      };
    },
    async listActions() {
      const [rows] = await pool.execute(
        'SELECT id, command, status, actor, created_at AS time FROM device_actions ORDER BY created_at DESC LIMIT 100',
      );
      return rows;
    },
    async close() {
      await pool.end();
    },
  };
}
