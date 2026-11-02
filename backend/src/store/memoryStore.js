const MAX_ITEMS = 100;

export function createMemoryStore(database) {
  const sensors = [];
  const actions = [];
  const listeners = new Set();
  let latestResponse = null;
  let ledState = { led1: 'OFF', led2: 'OFF' };

  const publish = event => listeners.forEach(listener => listener(event));

  return {
    async addSensor(reading) {
      sensors.push(reading);
      if (sensors.length > MAX_ITEMS) sensors.shift();
      if (database) {
        try {
          await database.saveSensor(reading);
        } catch (error) {
          console.error('[DB] Sensor save failed:', error.message);
        }
      }
      publish({ type: 'sensor', data: reading });
    },
    async getSensors() {
      return database ? database.listSensors(MAX_ITEMS) : [...sensors].reverse();
    },
    async addAction(action) {
      actions.unshift(action);
      if (actions.length > MAX_ITEMS) actions.pop();
      if (database) {
        try {
          action.id = await database.saveAction(action);
        } catch (error) {
          console.error('[DB] Action save failed:', error.message);
        }
      }
      publish({ type: 'action', data: action });
    },
    async getActions() {
      return database ? database.listActions() : [...actions];
    },
    resolveLatestAction(status) {
      const action = actions.find(item => item.status === 'Pending');
      if (!action) return;
      action.status = status;
      void database?.updateActionStatus(action.id, status)
        .catch(error => console.error('[DB] Action update failed:', error.message));
      publish({ type: 'action', data: action });
    },
    setLatestResponse(response) {
      latestResponse = response;
      ledState = { led1: response.led1 || 'OFF', led2: response.led2 || 'OFF' };
      void database?.saveLedState(ledState.led1, ledState.led2)
        .catch(error => console.error('[DB] LED state save failed:', error.message));
      void database?.resolvePendingActions(ledState.led1, ledState.led2)
        .catch(error => console.error('[DB] Pending action update failed:', error.message));
      publish({ type: 'response', data: response });
    },
    async initialize() {
      if (database) ledState = await database.getLedState();
    },
    getLedState() {
      return ledState;
    },
    getLatestResponse() {
      return latestResponse;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
