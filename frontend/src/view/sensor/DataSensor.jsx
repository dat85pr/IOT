import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { getSensors, openEventStream } from '../../api/iotApi.js';
import { filterSensorRows, sensorTypes } from '../../service/sensorService.js';
import CopyableTime from '../common/CopyableTime.jsx';
import Pager from '../common/Pager.jsx';
import SelectMenu from '../common/SelectMenu.jsx';

const PAGE_SIZE_OPTIONS = ['5', '10', '20'];

function toSensorRows(item, id) {
  const time = new Date(item.receivedAt).toLocaleString('en-GB');
  const sequence = String(id).padStart(4, '0');
  return [
    [item.temperatureId || `T${sequence}`, 'Temperature', `${item.temp} °C`, time],
    [item.humidityId || `H${sequence}`, 'Humidity', `${item.hum} %`, time],
    [item.lightId || `L${sequence}`, 'Light', `${item.light} nits`, time],
  ];
}

export default function DataSensor() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All sensors');
  const [applied, setApplied] = useState({ query: '', type: 'All sensors' });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sensorRows, setSensorRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    getSensors()
      .then(({ items }) => setSensorRows(items.flatMap((item, index) => toSensorRows(item, items.length - index - 1))))
      .catch(() => setError('Unable to load sensor data from backend.'));
    const stream = openEventStream((type, data) => {
      if (type === 'sensor') {
        setSensorRows(rows => [...rows, ...toSensorRows(data, rows.length / 3)]);
      }
    });
    stream.onerror = () => setError('Unable to receive live sensor data.');
    return () => stream.close();
  }, []);
  const rows = useMemo(() => filterSensorRows(sensorRows, applied.query, applied.type), [sensorRows, applied]);
  const maxPage = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, maxPage);
  const currentRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const search = () => {
    setApplied({ query, type });
    setPage(1);
  };
  const clearSearch = () => {
    setQuery('');
    setType('All sensors');
    setApplied({ query: '', type: 'All sensors' });
    setPage(1);
  };

  return (
    <div className="table-page">
      {error && <p role="alert" className="connection-error">{error}</p>}
      <div className="filters sensor-filters">
        <label className="search">
          <Search size={15} />
          <input placeholder="Search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') search(); }} />
        </label>
        <SelectMenu label="Filter field" value={type} options={sensorTypes} onChange={setType} />
        <button type="button" className="history-search-btn" onClick={search}><Search size={14} /><span>Search</span></button>
        <button type="button" className="sensor-clear-btn" onClick={clearSearch}><RotateCcw size={14} /><span>Clear</span></button>
      </div>
      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>ID</th><th>Sensor Type</th><th>Value</th><th>Time</th></tr></thead>
            <tbody>
              {currentRows.length > 0 ? currentRows.map(row => (
                <tr key={row[0]}><td><b>{row[0]}</b></td><td>{row[1]}</td><td><b>{row[2]}</b></td><td><CopyableTime value={row[3]} /></td></tr>
              )) : <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>No sensors found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer-row">
          <div className="page-size-selector">
            <span>Show:</span>
            <SelectMenu label="Rows per page" direction="up" value={`${pageSize}`} options={PAGE_SIZE_OPTIONS} onChange={value => { setPageSize(Number(value)); setPage(1); }} />
            <span>items / page</span>
          </div>
          <Pager page={currentPage} setPage={setPage} max={maxPage} />
        </div>
      </div>
    </div>
  );
}
