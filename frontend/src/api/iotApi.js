const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`);
  return response.json();
}

export const getSensors = () => request('/sensors?limit=100');
export const getActions = () => request('/actions');
export const getControlState = () => request('/controls/state');
export const sendControl = command => request('/controls', {
  method: 'POST',
  body: JSON.stringify({ command }),
});
export const openEventStream = onEvent => {
  const stream = new EventSource(`${API_URL}/events`);
  stream.addEventListener('sensor', event => onEvent('sensor', JSON.parse(event.data)));
  stream.addEventListener('response', event => onEvent('response', JSON.parse(event.data)));
  stream.addEventListener('action', event => onEvent('action', JSON.parse(event.data)));
  return stream;
};
