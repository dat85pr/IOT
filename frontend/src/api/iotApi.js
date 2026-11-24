import { getToken } from '../auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!response.ok) throw new Error(`Backend request failed (${response.status})`);
  return response.json();
}

export const getSensors = () => request('/sensors?limit=100');
export const getActions = () => request('/actions');
export const getControlState = () => request('/controls/state');
export const login = (username, password) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ username, password }),
});
export const sendControl = command => request('/controls', {
  method: 'POST',
  body: JSON.stringify({ command }),
});
export const openEventStream = onEvent => {
  const controller = new AbortController();
  const token = getToken();
  fetch(`${API_URL}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: controller.signal,
  }).then(async response => {
    if (!response.ok || !response.body) throw new Error(`Backend request failed (${response.status})`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || '';
      messages.forEach(message => {
        const event = message.match(/^event: (\S+)\ndata: (.+)$/s);
        if (event && event[1] !== 'ready') onEvent(event[1], JSON.parse(event[2]));
      });
    }
  }).catch(error => {
    if (error.name !== 'AbortError') console.error('Event stream failed:', error);
  });
  return { close: () => controller.abort() };
};
