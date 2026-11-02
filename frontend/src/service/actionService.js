import { ACTION_DEVICES, ACTION_STATUSES, ACTION_TYPES } from '../type/action.js';

export const actionChoices = {
  devices: ACTION_DEVICES,
  actions: ACTION_TYPES,
  statuses: ACTION_STATUSES,
};

export const actionRows = [
  ['995', 'LED Control 1', 'TURN ON', 'Success', '2026-10-13 19:40:02', 'admin'],
  ['994', 'LED Control 2', 'TURN OFF', 'Success', '2026-10-13 19:35:12', 'admin'],
  ['993', 'LED Control 1', 'TURN ON', 'Pending', '2026-10-13 19:28:15', 'admin'],
  ['992', 'LED Control 2', 'TURN OFF', 'Failed', '2026-10-13 19:22:45', 'admin'],
  ['991', 'LED Control 2', 'TURN ON', 'Success', '2026-10-13 19:10:02', 'admin'],
  ['990', 'LED Control 1', 'TURN OFF', 'Failed', '2026-10-13 18:55:30', 'admin'],
  ['989', 'LED Control 2', 'TURN ON', 'Success', '2026-10-13 18:44:11', 'admin'],
  ['988', 'LED Control 1', 'TURN ON', 'Success', '2026-10-13 18:32:00', 'admin'],
  ['987', 'LED Control 1', 'TURN OFF', 'Success', '2026-10-12 21:15:40', 'admin'],
  ['986', 'LED Control 2', 'TURN ON', 'Success', '2026-10-12 20:50:22', 'admin'],
  ['985', 'LED Control 2', 'TURN OFF', 'Pending', '2026-10-12 18:22:01', 'admin'],
  ['984', 'LED Control 1', 'TURN ON', 'Success', '2026-10-12 18:15:44', 'admin'],
  ['983', 'LED Control 2', 'TURN OFF', 'Success', '2026-10-12 17:05:10', 'admin'],
  ['982', 'LED Control 2', 'TURN OFF', 'Success', '2026-10-12 16:30:00', 'admin'],
  ['981', 'LED Control 1', 'TURN ON', 'Success', '2026-10-11 22:12:05', 'admin'],
  ['980', 'LED Control 1', 'TURN ON', 'Failed', '2026-10-11 20:00:19', 'admin'],
  ['979', 'LED Control 2', 'TURN ON', 'Success', '2026-10-11 19:45:33', 'admin'],
  ['978', 'LED Control 2', 'TURN ON', 'Success', '2026-10-11 19:10:45', 'admin'],
  ['977', 'LED Control 1', 'TURN OFF', 'Success', '2026-10-11 18:25:12', 'admin'],
  ['976', 'LED Control 1', 'TURN OFF', 'Success', '2026-10-11 17:40:08', 'admin'],
];

export function filterActionRows(rows, filters) {
  return rows.filter(row => {
    const [id, device, action, status, time] = row;
    if (filters.device !== ACTION_DEVICES[0] && device !== filters.device) return false;
    if (filters.action !== ACTION_TYPES[0] && action !== filters.action) return false;
    if (filters.status !== ACTION_STATUSES[0] && status !== filters.status) return false;

    const datePart = time.slice(0, 10);
    if (filters.startDate && datePart < filters.startDate) return false;
    if (filters.endDate && datePart > filters.endDate) return false;

    const query = filters.query.trim().toLowerCase();
    return !query || row.join(' ').toLowerCase().includes(query);
  });
}
