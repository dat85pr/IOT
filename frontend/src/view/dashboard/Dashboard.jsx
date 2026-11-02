import React, { useEffect, useState } from 'react';
import { Droplets, Sun, Thermometer } from 'lucide-react';
import { normalizeSensorReading } from '../../service/sensorService.js';
import { getControlState, openEventStream, sendControl } from '../../api/iotApi.js';
import LedSwitch from './LedSwitch.jsx';
import Metric from './Metric.jsx';
import SensorChart from './SensorChart.jsx';

const CHART_POINT_COUNT = 11;
const emptyReading = {
  time: '--:--:--',
  fullTime: 'Waiting for sensor data',
  temp: '--',
  hum: '--',
  light: '--',
  tempY: 145,
  humY: 145,
  lightY: 145,
};

export default function Dashboard() {
  const [led, setLed] = useState([false, false]);
  const [pendingLed, setPendingLed] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    getControlState()
      .then(state => setLed([state.led1 === 'ON', state.led2 === 'ON']))
      .catch(() => setConnectionError(true));
    const stream = openEventStream((type, data) => {
      setConnectionError(false);
      if (type === 'sensor') {
        setLogs(items => [...items.slice(-(CHART_POINT_COUNT - 1)), normalizeSensorReading(data)]);
      }
      if (type === 'response' && data.status === 'SUCCESS') {
        setLed([data.led1 === 'ON', data.led2 === 'ON']);
        setPendingLed(null);
      }
    });
    stream.onerror = () => setConnectionError(true);
    return () => stream.close();
  }, []);

  const toggleLed = async index => {
    if (pendingLed !== null) return;
    setPendingLed(index);
    try {
      await sendControl(`LED${index + 1}_${led[index] ? 'OFF' : 'ON'}`);
    } catch {
      setConnectionError(true);
      setPendingLed(null);
    }
  };

  const latestLog = logs[logs.length - 1] || emptyReading;
  return (
    <div className="dashboard">
      {connectionError && <p role="alert" className="connection-error">Backend/MQTT connection unavailable.</p>}
      <div className="metrics">
        <Metric Icon={Thermometer} title="Temperature" value={latestLog.temp} color="red" />
        <Metric Icon={Droplets} title="Humidity" value={latestLog.hum} color="blue" />
        <Metric Icon={Sun} title="Light Level" value={latestLog.light} color="yellow" />
      </div>
      <div className="dash-content">
        <SensorChart logs={logs} latestLog={latestLog} />
        <section className="switches">
          {led.map((active, index) => (
            <LedSwitch key={index} index={index} active={active} pending={pendingLed === index} onToggle={() => toggleLed(index)} />
          ))}
        </section>
      </div>
    </div>
  );
}
