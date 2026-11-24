const TOKEN_KEY = 'iot-auth-token';

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const saveToken = token => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);
