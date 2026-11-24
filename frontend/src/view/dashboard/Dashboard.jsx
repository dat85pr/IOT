import React, { useEffect, useState } from 'react';
import {
  Droplets,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { normalizeSensorReading } from '../../service/sensorService.js';
import {
  getControlState,
  getSensors,
  openEventStream,
  sendControl,
} from '../../api/iotApi.js';

const emptyReading = {
  time: '--:--',
  fullTime: 'Waiting for sensor data',
  temp: '--',
  hum: '--',
  light: '--',
  co2: '--',
  tempY: 120,
  humY: 120,
  lightY: 120,
  co2Y: 120,
};

function MiniChart({
  title,
  value,
  unit,
  color,
  logs,
  field,
  Icon,
}) {
  const [hovered, setHovered] = useState(null);

  const getPointX = (index) => (
    logs.length < 2
      ? 50
      : 5 + (index * 90) / (logs.length - 1)
  );

  const coords = logs
    .map((item, index) => (
      `${getPointX(index)},${item[`${field}Y`] || 120}`
    ))
    .join(' ');

  const ticks = Array.from({ length: 5 }, (_, tick) => {
    if (!logs.length) return '--:--';

    const index = Math.round(tick * (logs.length - 1) / 4);
    return logs[index].time;
  });

  const tooltipLeft = hovered === null
    ? 50
    : logs.length < 2
      ? 50
      : 10 + (hovered * 80) / Math.max(1, logs.length - 1);

  return (
    <section className={`mini-chart ${color}`}>
      <header>
        <b><i />{title}</b>
        <span>{unit}</span>
      </header>

      <div className="mini-chart-value">
        <Icon size={15} />
        {value}
      </div>

      <svg
        viewBox="0 0 100 150"
        preserveAspectRatio="none"
        onMouseLeave={() => setHovered(null)}
      >
        <g className="mini-grid" aria-hidden="true">
          {[55, 78, 101, 124].map(y => (
            <line key={y} x1="5" x2="95" y1={y} y2={y} />
          ))}
        </g>

        <polyline points={coords} />

        {logs.map((item, index) => {
          const x = getPointX(index);
          const y = item[`${field}Y`] || 120;

          return (
            <g key={`${item.fullTime}-${index}`}>
              {hovered === index && (
                <line
                  className="hover-guide"
                  x1={x}
                  x2={x}
                  y1="55"
                  y2="145"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={hovered === index ? 3.2 : 2.1}
              />
              <rect
                x={Math.max(1, x - 5)}
                y="45"
                width="10"
                height="100"
                fill="transparent"
                tabIndex="0"
                aria-label={`${title}: ${item[field]} at ${item.fullTime}`}
                onMouseEnter={() => setHovered(index)}
                onMouseMove={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                onTouchStart={() => setHovered(index)}
              />
            </g>
          );
        })}
      </svg>

      <div className="chart-times">
        {ticks.map((time, index) => (
          <span key={`${index}-${time}`}>{time}</span>
        ))}
      </div>

      {hovered !== null && logs[hovered] && (
        <div
          className="chart-tooltip"
          style={{ left: `${tooltipLeft}%` }}
        >
          <b>{logs[hovered].fullTime}</b>
          <span>{title}: {logs[hovered][field]}</span>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [led, setLed] = useState([false, false, false, false]);
  const [pendingLed, setPendingLed] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    getControlState()
      .then(state => {
        setLed([1, 2, 3, 4].map(id => state[`led${id}`] === 'ON'));
      })
      .catch(() => setConnectionError(true));

    getSensors()
      .then(({ items }) => {
        const readings = items
          .slice()
          .reverse()
          .slice(-11)
          .map(item => normalizeSensorReading(item));
        setLogs(readings);
      })
      .catch(() => {});

    const stream = openEventStream((type, data) => {
      setConnectionError(false);

      if (type === 'sensor') {
        setLogs(items => [
          ...items.slice(-10),
          normalizeSensorReading({
            ...data,
            co2: data.co2 ?? 450 + Math.floor(Math.random() * 650),
          }),
        ]);
      }

      if (type === 'response' && data.status === 'SUCCESS') {
        setLed([1, 2, 3, 4].map(
          id => data[`led${id}`] === 'ON',
        ));
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

  const latest = logs[logs.length - 1] || emptyReading;
  const charts = [
    ['Temperature', latest.temp, '°C', 'red', 'temp', Thermometer],
    ['Humidity', latest.hum, '%', 'blue', 'hum', Droplets],
    ['Light', latest.light, 'nits', 'yellow', 'light', Sun],
    ['CO₂ concentration', latest.co2, 'ppm', 'purple', 'co2', Wind],
  ];

  return (
    <div className="dashboard reference-dashboard">
      {connectionError && (
        <p role="alert" className="connection-error">
          Backend/MQTT connection unavailable.
        </p>
      )}

      <header className="dashboard-heading">
        <div>
          <h1>Sensor Overview</h1>
          <p>Monitor temperature, humidity, light and CO₂</p>
        </div>  
      </header>

      <div className="chart-grid">
        {charts.map(([
          title,
          value,
          unit,
          color,
          field,
          Icon,
        ]) => (
          <MiniChart
            key={field}
            title={title}
            value={value}
            unit={unit}
            color={color}
            logs={logs}
            field={field}
            Icon={Icon}
          />
        ))}
      </div>

      <div className="dashboard-sections">
        <section>
          <div className="section-heading">
            <h2>Latest values</h2>
            <span>{latest.time}</span>
          </div>

          <div className="latest-grid">
            {charts.map(([
              title,
              value,
              unit,
              color,
              field,
            ]) => (
              <div className={`latest-card ${color}`} key={field}>
                <span><i />{title}</span>
                <b>{value} <small>{unit}</small></b>
                {field === 'co2'}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-heading">
            <h2>LED control</h2>
            <span>4 independent switches</span>
          </div>

          <div className="led-grid">
            {led.map((active, index) => (
              <div className="led-card" key={index}>
                <div>
                  <span className={active ? 'dot active' : 'dot'} />
                  <b>LED {index + 1}</b>
                </div>
                <p className={active ? 'state-on' : ''}>
                  {active ? 'ON · On' : 'OFF · Off'}
                </p>
                <button
                  aria-label={`Toggle LED ${index + 1}`}
                  aria-pressed={active}
                  disabled={pendingLed !== null}
                  className={active ? 'on' : ''}
                  onClick={() => toggleLed(index)}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
