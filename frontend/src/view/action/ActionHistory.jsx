import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getActions, openEventStream } from '../../api/iotApi.js';
import { actionChoices, filterActionRows } from '../../service/actionService.js';
import Pager from '../common/Pager.jsx';
import SelectMenu from '../common/SelectMenu.jsx';

const PAGE_SIZE_OPTIONS = ['5', '10', '20'];

function toActionRow(item) {
  const device = item.device || (item.command.startsWith('LED2') ? 'LED Control 2' : 'LED Control 1');
  const action = item.action || (item.command.endsWith('ON') ? 'TURN ON' : 'TURN OFF');
  return [
    item.id,
    device,
    action,
    item.status,
    new Date(item.time).toLocaleString('en-GB'),
    item.actor || 'Admin',
  ];
}

function toActionRows(items) {
  return items.map(toActionRow);
}

export default function ActionHistory() {
  const [query, setQuery] = useState('');
  const [device, setDevice] = useState(actionChoices.devices[0]);
  const [action, setAction] = useState(actionChoices.actions[0]);
  const [status, setStatus] = useState(actionChoices.statuses[0]);
  const [applied, setApplied] = useState({ query: '', device: actionChoices.devices[0], action: actionChoices.actions[0], status: actionChoices.statuses[0] });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [actionRows, setActionRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    getActions()
      .then(({ items }) => setActionRows(toActionRows(items)))
      .catch(() => setError('Unable to load action history from backend.'));
    const stream = openEventStream((type, data) => {
      if (type === 'action') {
        getActions()
          .then(({ items }) => setActionRows(toActionRows(items)))
          .catch(() => setError('Unable to refresh action history.'));
      }
      if (type === 'response') {
        getActions().then(({ items }) => setActionRows(toActionRows(items))).catch(() => {});
      }
    });
    stream.onerror = () => setError('Unable to receive live action history.');
    return () => stream.close();
  }, []);
  const filteredRows = useMemo(() => filterActionRows(actionRows, applied), [actionRows, applied]);
  const maxPage = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, maxPage);
  const currentRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    setApplied({ query, device, action, status });
    setPage(1);
  }, [query, device, action, status]);

  return (
    <div className="table-page history-page">
      {error && <p role="alert" className="connection-error">{error}</p>}
      <div className="table-card">
        <div className="history-toolbar">
          <div className="history-search-row">
            <label className="search"><Search size={15} /><input placeholder="Search" value={query} onChange={event => setQuery(event.target.value)} /></label>
          </div>
          <div className="history-filters">
            <SelectMenu label="Device" value={device} options={actionChoices.devices} onChange={setDevice} />
            <SelectMenu label="Action" value={action} options={actionChoices.actions} onChange={setAction} />
            <SelectMenu label="Status" value={status} options={actionChoices.statuses} onChange={setStatus} />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>ID</th><th>Device</th><th>Action</th><th>Status</th><th>Time</th><th>Actor</th></tr></thead>
            <tbody>
              {currentRows.length > 0 ? currentRows.map(row => <tr key={row[0]}><td><b>{row[0]}</b></td><td>{row[1]}</td><td><b>{row[2]}</b></td><td><b className={row[3] === 'Failed' ? 'failed' : ''}>{row[3]}</b></td><td>{row[4]}</td><td>{row[5]}</td></tr>) : <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>No actions found</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer-row">
          <div className="page-size-selector"><span>Show:</span><SelectMenu label="Rows per page" direction="up" value={`${pageSize}`} options={PAGE_SIZE_OPTIONS} onChange={value => { setPageSize(Number(value)); setPage(1); }} /><span>items / page</span></div>
          <Pager page={currentPage} setPage={setPage} max={maxPage} />
        </div>
      </div>
    </div>
  );
}
