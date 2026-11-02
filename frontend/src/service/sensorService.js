import { SENSOR_TYPES } from '../type/sensor.js';

export const sensorTypes = SENSOR_TYPES;

export const sensorRows = [
  ['1095', 'Temperature', '28.4 °C', '2024-10-13 19:40:00'],
  ['1094', 'Humidity', '65.2 %', '2024-10-13 19:40:00'],
  ['1093', 'Light', '480 nits', '2024-10-13 19:40:00'],
  ['1092', 'Temperature', '32.1 °C', '2024-10-13 19:38:00'],
  ['1091', 'Humidity', '88.4 %', '2024-10-13 19:38:00'],
  ['1090', 'Light', '450 nits', '2024-10-13 19:38:00'],
  ['1089', 'Temperature', '27.9 °C', '2024-10-13 19:35:00'],
  ['1088', 'Humidity', '64.1 %', '2024-10-13 19:35:00'],
  ['1087', 'Light', '510 nits', '2024-10-13 19:35:00'],
  ['1086', 'Temperature', '29.2 °C', '2024-10-13 19:32:00'],
  ['1085', 'Humidity', '72.5 %', '2024-10-13 19:32:00'],
  ['1084', 'Light', '430 nits', '2024-10-13 19:32:00'],
];

export const initialSensorLogs = [
  { time: '09:00:00', fullTime: '13/10/2024 09:00:00', temp: '28.5°C', hum: '82%', light: '320 nits', tempY: 124, humY: 73, lightY: 145 },
  { time: '09:00:02', fullTime: '13/10/2024 09:00:02', temp: '29.2°C', hum: '84%', light: '360 nits', tempY: 115, humY: 69, lightY: 130 },
  { time: '09:00:04', fullTime: '13/10/2024 09:00:04', temp: '29.8°C', hum: '80%', light: '390 nits', tempY: 108, humY: 78, lightY: 122 },
  { time: '09:00:06', fullTime: '13/10/2024 09:00:06', temp: '31.0°C', hum: '77%', light: '430 nits', tempY: 93, humY: 85, lightY: 107 },
  { time: '09:00:08', fullTime: '13/10/2024 09:00:08', temp: '30.5°C', hum: '68%', light: '510 nits', tempY: 97, humY: 108, lightY: 83 },
  { time: '09:00:10', fullTime: '13/10/2024 09:00:10', temp: '32.4°C', hum: '62%', light: '580 nits', tempY: 78, humY: 119, lightY: 64 },
  { time: '09:00:12', fullTime: '13/10/2024 09:00:12', temp: '33.0°C', hum: '59%', light: '600 nits', tempY: 71, humY: 125, lightY: 58 },
  { time: '09:00:14', fullTime: '13/10/2024 09:00:14', temp: '32.6°C', hum: '65%', light: '520 nits', tempY: 76, humY: 115, lightY: 80 },
  { time: '09:00:16', fullTime: '13/10/2024 09:00:16', temp: '31.8°C', hum: '72%', light: '440 nits', tempY: 84, humY: 101, lightY: 106 },
  { time: '09:00:18', fullTime: '13/10/2024 09:00:18', temp: '30.5°C', hum: '74%', light: '350 nits', tempY: 97, humY: 98, lightY: 132 },
  { time: '09:00:20', fullTime: '13/10/2024 09:00:20', temp: '30.8°C', hum: '76%', light: '330 nits', tempY: 94, humY: 94, lightY: 139 },
];

export function normalizeSensorReading(reading) {
  const temp = Number(reading.temp);
  const hum = Number(reading.hum);
  const light = Number(reading.light);
  const receivedAt = reading.receivedAt ? new Date(reading.receivedAt) : new Date();

  return {
    time: receivedAt.toLocaleTimeString('en-GB', { hour12: false }),
    fullTime: receivedAt.toLocaleString('en-GB', { hour12: false }),
    temp: `${temp.toFixed(1)}°C`,
    hum: `${hum.toFixed(1)}%`,
    light: `${light} nits`,
    tempY: toChartY(temp, 0, 50),
    humY: toChartY(hum, 0, 100),
    lightY: toChartY(light, 0, 1024),
  };
}

export function filterSensorRows(rows, query, type) {
  const text = query.trim().toLowerCase();

  return rows.filter(row => {
    const matchesType = type === 'All sensors'
      || (type === 'Time' ? row[3].toLowerCase().includes(text) : row[1] === type);

    if (!matchesType) return false;
    if (!text || type === 'Time') return true;

    const searchableText = type === 'All sensors' ? row.join(' ') : `${row[1]} ${row[2]}`;
    return searchableText.toLowerCase().includes(text);
  });
}

export function toChartY(value, min, max) {
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(145 - ((clamped - min) / (max - min)) * 90);
}

export function createSensorLog() {
  const now = new Date();
  const temp = Number((27 + Math.random() * 7).toFixed(1));
  const hum = Math.round(55 + Math.random() * 35);
  const light = Math.round(250 + Math.random() * 400);

  return {
    time: now.toLocaleTimeString('en-GB', { hour12: false }),
    fullTime: now.toLocaleString('en-GB', { hour12: false }),
    temp: `${temp.toFixed(1)}°C`,
    hum: `${hum}%`,
    light: `${light} nits`,
    tempY: toChartY(temp, 27, 34),
    humY: toChartY(hum, 55, 90),
    lightY: toChartY(light, 250, 650),
  };
}
