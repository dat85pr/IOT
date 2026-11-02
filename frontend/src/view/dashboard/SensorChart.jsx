import React, { useState } from 'react';

const levels = {
  temperature: ['34', '32', '30', '28', '27'],
  humidity: ['90', '82', '73', '64', '55'],
  light: ['650', '550', '450', '350', '250'],
};

export default function SensorChart({ logs, latestLog }) {
  const [hovered, setHovered] = useState(null);
  const points = {
    temp: logs
      .map((item, index) => `${22 + index * 46},${item.tempY}`)
      .join(' '),
    hum: logs
      .map((item, index) => `${22 + index * 46},${item.humY}`)
      .join(' '),
    light: logs
      .map((item, index) => `${22 + index * 46},${item.lightY}`)
      .join(' '),
  };

  return (
    <section className="chart-card">
      <header>
        <b>Live Sensor Logs</b>
        <div className="legend">
          <span className="red">● Temperature</span>
          <span className="blue">● Humidity</span>
          <span className="yellow">● Light</span>
        </div>
      </header>
      <div className="chart-body">
        <div className="chart-side-values chart-side-left">
          <span className="red chart-side-title">Temperature (°C)</span>
          <strong className="red">{latestLog.temp}</strong>
        </div>
        <svg
          viewBox="0 0 590 190"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Sensor readings over time"
          onMouseLeave={() => setHovered(null)}
        >
          <g className="grid">
            {[15, 55, 95, 135, 175].map(y => (
              <line
                key={y}
                x1="0"
                x2="520"
                y1={y}
                y2={y}
              />
            ))}
          </g>
          <g className="chart-levels" aria-hidden="true">
            {[15, 55, 95, 135, 175].map((y, index) => (
              <text
                key={`temp-${y}`}
                x="2"
                y={y - 2}
                className={`chart-level-temp${
                  index === 0 ? ' chart-level-primary' : ''
                }`}
              >
                {levels.temperature[index]}°
              </text>
            ))}
            {[15, 55, 95, 135, 175].map((y, index) => (
              <text
                key={`humidity-${y}`}
                x="524"
                y={y - 2}
                className={`chart-level-humidity${
                  index === 0 ? ' chart-level-primary' : ''
                }`}
              >
                {levels.humidity[index]}
              </text>
            ))}
            {[15, 55, 95, 135, 175].map((y, index) => (
              <text
                key={`light-${y}`}
                x="557"
                y={y - 2}
                className={`chart-level-light${
                  index === 0 ? ' chart-level-primary' : ''
                }`}
              >
                {levels.light[index]}
              </text>
            ))}
          </g>
          <polyline points={points.temp} />
          <polyline className="line-blue" points={points.hum} />
          <polyline className="line-yellow" points={points.light} />
          <g className="labels">
            {logs.map((item, index) => (
              <text
                key={`${item.time}-${index}`}
                x={22 + index * 46}
                y="187"
                textAnchor="middle"
                fontSize="8"
              >
                {item.time}
              </text>
            ))}
          </g>
          {logs.map((_, index) => (
            <rect
              key={index}
              x={22 + index * 46 - 23}
              y="10"
              width="46"
              height="165"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(index)}
            />
          ))}
          {hovered !== null && (() => {
            const item = logs[hovered];
            const x = 22 + hovered * 46;
            const tooltipWidth = 114;
            const tooltipX = x > 380
              ? x - tooltipWidth - 8
              : x + 8;
            const tooltipY = 20;
            return (
              <g pointerEvents="none">
                <line
                  x1={x}
                  y1="15"
                  x2={x}
                  y2="155"
                  stroke="#bbb"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={x}
                  cy={item.tempY}
                  r="3.5"
                  fill="#fa443c"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={item.humY}
                  r="3.5"
                  fill="#2999ef"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={item.lightY}
                  r="3.5"
                  fill="#f0b300"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height="62"
                  rx="5"
                  fill="#fff"
                  stroke="#d5d5d5"
                  strokeWidth="1"
                />
                <text
                  x={tooltipX + 7}
                  y={tooltipY + 12}
                  fontSize="7.5"
                  fontWeight="bold"
                  fill="#111"
                >
                  {item.fullTime}
                </text>
                <text
                  x={tooltipX + 7}
                  y={tooltipY + 25}
                  fontSize="7.5"
                  fill="#fa443c"
                >
                  ● Temp: {item.temp}
                </text>
                <text
                  x={tooltipX + 7}
                  y={tooltipY + 38}
                  fontSize="7.5"
                  fill="#2999ef"
                >
                  ● Humidity: {item.hum}
                </text>
                <text
                  x={tooltipX + 7}
                  y={tooltipY + 51}
                  fontSize="7.5"
                  fill="#d89e00"
                >
                  ● Light: {item.light}
                </text>
              </g>
            );
          })()}
        </svg>
        <div className="chart-side-values chart-side-right">
          <span className="blue chart-side-title">Humidity (%)</span>
          <strong className="blue">{latestLog.hum}</strong>
          <span className="yellow chart-side-title">Light (nits)</span>
          <strong className="yellow">{latestLog.light}</strong>
        </div>
      </div>
    </section>
  );
}
