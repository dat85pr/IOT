/**
 * @typedef {[string, string, string, string]} SensorRow
 */

/**
 * @typedef {{
 *   time: string,
 *   fullTime: string,
 *   temp: string,
 *   hum: string,
 *   light: string,
 *   tempY: number,
 *   humY: number,
 *   lightY: number
 * }} SensorLog
 */

export const SENSOR_TYPES = ['All sensors', 'Temperature', 'Humidity', 'Light', 'Time'];
