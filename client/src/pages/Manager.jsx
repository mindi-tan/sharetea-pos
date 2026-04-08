import { useCallback, useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toApiUrl = (path) => `${API_BASE}${path}`;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value ?? '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(ts);
  }
}

export default function Manager() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [sumRes, ordRes] = await Promise.all([
        fetch(toApiUrl('/api/manager/summary')),
        fetch(toApiUrl('/api/manager/orders')),
      ]);
      if (!sumRes.ok) throw new Error('Could not load summary');
      if (!ordRes.ok) throw new Error('Could not load orders');
      const [sumData, ordData] = await Promise.all([sumRes.json(), ordRes.json()]);
      setSummary(sumData);
      setOrders(Array.isArray(ordData) ? ordData : []);
    } catch (e) {
      setError(e.message || 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStatusChange(orderId, order_status) {
    setUpdatingId(orderId);
    setError('');
    try {
      const res = await fetch(toApiUrl(`/api/manager/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Update failed');
      }
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  const shell = {
    outer: {
      width: '100%',
      maxWidth: '1120px',
      margin: '0 auto',
      padding: '1.5rem 1.25rem 3rem',
      textAlign: 'left',
      boxSizing: 'border-box',
    },
    title: {
      fontFamily: 'var(--heading)',
      color: 'var(--text-h)',
      fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
      fontWeight: 600,
      margin: '0 0 0.25rem',
    },
    subtitle: {
      color: 'var(--text)',
      margin: '0 0 1.75rem',
      fontSize: '0.95rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    card: {
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '1rem 1.15rem',
      background: 'var(--code-bg)',
      boxShadow: 'var(--shadow)',
    },
    cardLabel: {
      fontSize: '0.8rem',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text)',
      marginBottom: '0.35rem',
    },
    cardValue: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: 'var(--text-h)',
      fontFamily: 'var(--mono)',
    },
    tableWrap: {
      overflowX: 'auto',
      border: '1px solid var(--border)',
      borderRadius: '10px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.9rem',
    },
    th: {
      textAlign: 'left',
      padding: '0.65rem 0.75rem',
      borderBottom: '1px solid var(--border)',
      background: 'var(--code-bg)',
      color: 'var(--text-h)',
      fontWeight: 600,
    },
    td: {
      padding: '0.65rem 0.75rem',
      borderBottom: '1px solid var(--border)',
      verticalAlign: 'top',
    },
    select: {
      padding: '0.4rem 0.5rem',
      borderRadius: '6px',
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--text-h)',
      fontSize: '0.85rem',
      minWidth: '9rem',
    },
    err: {
      background: 'rgba(220, 38, 38, 0.12)',
      border: '1px solid rgba(220, 38, 38, 0.35)',
      color: 'var(--text-h)',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
    items: {
      margin: '0.25rem 0 0',
      paddingLeft: '1.1rem',
      color: 'var(--text)',
      fontSize: '0.85rem',
    },
  };

  return (
    <main style={shell.outer} id="manager-dashboard">
      <h1 style={shell.title}>Manager</h1>
      <p style={shell.subtitle}>
        Desktop overview: today&apos;s sales, queue, and order status. Open the portal in another tab to
        switch roles (this view does not link back).
      </p>

      {error ? (
        <div style={shell.err} role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p aria-live="polite">Loading dashboard…</p>
      ) : (
        <>
          <section style={shell.grid} aria-label="Today’s summary">
            <div style={shell.card}>
              <div style={shell.cardLabel}>Revenue today</div>
              <div style={shell.cardValue}>
                {summary ? formatMoney(summary.revenue_today) : '—'}
              </div>
            </div>
            <div style={shell.card}>
              <div style={shell.cardLabel}>Orders today</div>
              <div style={shell.cardValue}>{summary?.orders_today ?? '—'}</div>
            </div>
            <div style={shell.card}>
              <div style={shell.cardLabel}>Pending</div>
              <div style={shell.cardValue}>{summary?.pending_orders ?? '—'}</div>
            </div>
          </section>

          <section aria-labelledby="orders-heading">
            <h2 id="orders-heading" style={{ ...shell.title, fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              Recent orders
            </h2>
            <div style={shell.tableWrap}>
              <table style={shell.table}>
                <thead>
                  <tr>
                    <th style={shell.th}>Order</th>
                    <th style={shell.th}>Time</th>
                    <th style={shell.th}>Total</th>
                    <th style={shell.th}>Items</th>
                    <th style={shell.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                        No orders yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.order_id}>
                        <td style={shell.td}>#{o.order_id}</td>
                        <td style={shell.td}>{formatTime(o.order_ts)}</td>
                        <td style={shell.td}>{formatMoney(o.order_total)}</td>
                        <td style={shell.td}>
                          <ul style={shell.items}>
                            {(o.items || []).map((it) => (
                              <li key={it.order_item_id}>
                                {it.qty}× {it.drink_name || 'Drink'}{' '}
                                <span style={{ opacity: 0.85 }}>
                                  ({it.sweetness_level}% sugar, {String(it.ice_level || '').replace(/_/g, ' ')})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td style={shell.td}>
                          <select
                            id={`status-${o.order_id}`}
                            style={shell.select}
                            aria-label={`Order ${o.order_id} status`}
                            value={STATUS_OPTIONS.some((s) => s.value === o.order_status) ? o.order_status : 'pending'}
                            disabled={updatingId === o.order_id}
                            onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
