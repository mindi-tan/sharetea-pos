/**
 * Kitchen.jsx — prep display: lists pending orders from `/api/kitchen/orders`, refreshes on
 * an interval, and PATCHes `/api/kitchen/orders/:id/complete` when staff marks an order done.
 */
import { useEffect, useState, useCallback } from 'react';

// Vite: `VITE_API_URL` in client/.env (no trailing slash).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toApiUrl = (path) => `${API_BASE}${path}`;

// Maps API enums to readable strings on each line item (same values as cashier/customer).
const SUGAR_LABEL = { '0': 'No Sugar', '50': '50% Sugar', '100': 'Full Sugar' };
const ICE_LABEL = { NO_ICE: 'No Ice', LESS_ICE: 'Less Ice', NORMAL_ICE: 'Regular Ice' };

/** Short clock label for `order_ts` (placed time). */
function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Accent for wait-time strip + clock; thresholds unchanged (5 / 10 minutes). */
function urgencyColor(dateStr) {
  const mins = (Date.now() - new Date(dateStr)) / 60000;
  if (mins >= 10) return '#e11d48';
  if (mins >= 5) return '#f59e0b';
  return '#10b981';
}

/** Subtle card gradient tint; mirrors `urgencyColor` thresholds using `created_at`. */
function urgencySoftTint(dateStr) {
  const mins = (Date.now() - new Date(dateStr)) / 60000;
  if (mins >= 10) return 'rgba(225, 29, 72, 0.08)';
  if (mins >= 5) return 'rgba(245, 158, 11, 0.1)';
  return 'rgba(16, 185, 129, 0.08)';
}

/**
 * Hover / focus / loading animations for `.kitchen-complete-btn` and `.kitchen-dots`.
 * Scoped under `.kitchen-root` so rules do not leak to the rest of the app.
 */
const scopedCss = `
  @keyframes kitchen-pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 1; }
  }
  .kitchen-root .kitchen-dots span {
    animation: kitchen-pulse 1s ease-in-out infinite;
  }
  .kitchen-root .kitchen-dots span:nth-child(2) { animation-delay: 0.15s; }
  .kitchen-root .kitchen-dots span:nth-child(3) { animation-delay: 0.3s; }
  .kitchen-root .kitchen-complete-btn:not(:disabled):hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }
  .kitchen-root .kitchen-complete-btn:not(:disabled):active {
    transform: translateY(0);
    filter: brightness(0.96);
  }
  .kitchen-root .kitchen-complete-btn:focus-visible {
    outline: 2px solid #6ee7b7;
    outline-offset: 3px;
  }
  .kitchen-root .kitchen-complete-btn:disabled {
    cursor: not-allowed;
    transform: none;
  }
`;

export default function Kitchen() {
  // --- Queue data ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // `order_id`s currently sending PATCH (disables button + shows “Completing…”).
  const [completing, setCompleting] = useState(new Set());
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(toApiUrl('/api/kitchen/orders'));
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
      setError('');
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setError('Could not load orders. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + poll every 8s so the board stays current without manual refresh.
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  /** Removes the order from the list after a successful PATCH. */
  const markComplete = async (orderId) => {
    setCompleting((prev) => new Set([...prev, orderId]));
    try {
      const res = await fetch(toApiUrl(`/api/kitchen/orders/${orderId}/complete`), {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to complete order');
      setOrders((prev) => prev.filter((o) => o.order_id !== orderId));
    } catch (err) {
      console.error(err);
      setError('Failed to mark order complete. Try again.');
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  return (
    <div className="kitchen-root" style={s.root}>
      <style>{scopedCss}</style>

      {/* Title row + pending count / last poll time */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.brandMark} aria-hidden />
          <div>
            <h1 style={s.title}>Kitchen</h1>
            <p style={s.subtitle}>Live queue · auto-refresh</p>
          </div>
        </div>
        <div style={s.headerRight}>
          {lastRefresh && (
            <span style={s.refreshLabel}>
              Every 8s · updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <div
            style={{
              ...s.queueBadge,
              ...(orders.length > 0 ? s.queueBadgeBusy : s.queueBadgeClear),
            }}
          >
            <span style={s.queueBadgeNum}>{orders.length}</span>
            <span style={s.queueBadgeLabel}>pending</span>
          </div>
        </div>
      </header>

      {/* Fetch or complete failures */}
      {error && (
        <div style={s.errorBanner} role="alert">
          <span style={s.errorIcon} aria-hidden />
          {error}
        </div>
      )}

      {/* First paint vs ready vs cards */}
      {loading ? (
        <div style={s.loadingWrap}>
          <div style={s.loadingCard}>
            <p style={s.loadingText}>Loading queue</p>
            <div className="kitchen-dots" style={s.dots}>
              <span style={s.dot} />
              <span style={s.dot} />
              <span style={s.dot} />
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyCircle} aria-hidden>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p style={s.emptyTitle}>All caught up</p>
          <p style={s.emptyText}>No pending orders right now.</p>
        </div>
      ) : (
        <main style={s.grid}>
          {orders.map((order) => {
            const isCompleting = completing.has(order.order_id);
            // `created_at` drives wait-time color; `order_ts` is shown as clock text.
            const urg = urgencyColor(order.created_at);
            const tint = urgencySoftTint(order.created_at);
            return (
              <article
                key={order.order_id}
                style={{
                  ...s.card,
                  borderTopColor: urg,
                  background: `linear-gradient(180deg, ${tint} 0%, ${s.card.background} 42%)`,
                }}
              >
                <div style={s.cardHeader}>
                  <div>
                    <span style={s.orderLabel}>Order</span>
                    <span style={s.orderId}>#{order.order_id}</span>
                  </div>
                  <time style={{ ...s.timePill, color: urg, borderColor: `${urg}55` }} dateTime={order.order_ts}>
                    {formatTime(order.order_ts)}
                  </time>
                </div>

                <ul style={s.itemList}>
                  {order.items.map((item) => (
                    <li key={item.order_item_id} style={s.item}>
                      <div style={s.itemTop}>
                        <span style={s.qty}>×{item.qty}</span>
                        <span style={s.drinkName}>{item.drink_name}</span>
                      </div>
                      <div style={s.itemMeta}>
                        {`Size ${item.drink_size ?? 'M'}`}
                        <span style={s.metaSep}>·</span>
                        {SUGAR_LABEL[item.sweetness_level] || item.sweetness_level}
                        <span style={s.metaSep}>·</span>
                        {ICE_LABEL[item.ice_level] || item.ice_level}
                        {item.toppings && item.toppings.length > 0 && (
                          <>
                            <span style={s.metaSep}>·</span>
                            {item.toppings.join(', ')}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="kitchen-complete-btn"
                  style={{ ...s.completeBtn, opacity: isCompleting ? 0.65 : 1 }}
                  onClick={() => markComplete(order.order_id)}
                  disabled={isCompleting}
                  aria-label={`Mark order ${order.order_id} as complete`}
                >
                  {isCompleting ? 'Completing…' : 'Mark complete'}
                </button>
              </article>
            );
          })}
        </main>
      )}
    </div>
  );
}

// --- Theme tokens (dark kitchen board) ---
const BG = '#0f1419';
const SURFACE = '#151c24';
const RAIL = '#1e2832';
const CARD_BG = '#1a222d';
const TEXT = '#e8edf4';
const MUTED = '#8b9cb3';
const LINE = 'rgba(148, 163, 184, 0.12)';

/** Inline layout + look; references `BG`, `CARD_BG`, etc. for gradients and borders. */
const s = {
  // --- Page shell ---
  root: {
    minHeight: '100vh',
    background: `linear-gradient(165deg, ${BG} 0%, #0a0e12 50%, ${BG} 100%)`,
    color: TEXT,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  // --- Sticky top bar ---
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    padding: '1rem 1.5rem 1.1rem',
    background: `linear-gradient(180deg, ${SURFACE} 0%, ${RAIL} 100%)`,
    borderBottom: `1px solid ${LINE}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minWidth: 0,
  },
  brandMark: {
    width: '3px',
    height: '2.5rem',
    borderRadius: '2px',
    background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
    flexShrink: 0,
  },
  title: {
    fontSize: 'clamp(1.25rem, 2.5vw, 1.65rem)',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
    color: '#fff',
    lineHeight: 1.15,
  },
  subtitle: {
    margin: '0.2rem 0 0',
    fontSize: '0.8rem',
    color: MUTED,
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  refreshLabel: {
    fontSize: '0.78rem',
    color: MUTED,
    fontVariantNumeric: 'tabular-nums',
  },
  queueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    borderRadius: '999px',
    padding: '0.35rem 0.9rem 0.35rem 0.65rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    borderWidth: '1px',
    borderStyle: 'solid',
    letterSpacing: '0.02em',
  },
  queueBadgeBusy: {
    background: 'rgba(225, 29, 72, 0.15)',
    color: '#fda4af',
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  queueBadgeClear: {
    background: 'rgba(16, 185, 129, 0.12)',
    color: '#6ee7b7',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  queueBadgeNum: {
    fontSize: '1.05rem',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  },
  queueBadgeLabel: { opacity: 0.9, textTransform: 'lowercase' },
  // --- Error / loading / empty ---
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    margin: '0 1.25rem',
    marginTop: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    background: 'rgba(127, 29, 29, 0.35)',
    border: '1px solid rgba(248, 113, 113, 0.25)',
    color: '#fecaca',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  errorIcon: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f87171',
    flexShrink: 0,
    boxShadow: '0 0 12px #f87171',
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 140px)',
    padding: '2rem',
  },
  loadingCard: {
    textAlign: 'center',
    padding: '2rem 2.5rem',
    borderRadius: '16px',
    background: CARD_BG,
    border: `1px solid ${LINE}`,
    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
  },
  loadingText: {
    margin: '0 0 1rem',
    fontSize: '1rem',
    color: MUTED,
    fontWeight: 500,
  },
  dots: { display: 'flex', justifyContent: 'center', gap: '0.45rem' },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#34d399',
    display: 'inline-block',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 160px)',
    gap: '0.35rem',
    padding: '2rem',
  },
  emptyCircle: {
    width: '4.5rem',
    height: '4.5rem',
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.12)',
    border: `1px solid rgba(52, 211, 153, 0.25)`,
    color: '#34d399',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: TEXT,
    letterSpacing: '-0.02em',
  },
  emptyText: {
    margin: 0,
    fontSize: '0.95rem',
    color: MUTED,
    fontWeight: 500,
  },
  // --- Order cards + line items ---
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: '1.25rem',
    padding: '1.25rem 1.5rem 2rem',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  card: {
    background: CARD_BG,
    borderRadius: '14px',
    padding: '1.1rem 1.15rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    border: `1px solid ${LINE}`,
    borderTop: '4px solid',
    borderTopColor: '#10b981',
    boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    paddingBottom: '0.65rem',
    borderBottom: `1px solid ${LINE}`,
  },
  orderLabel: {
    display: 'block',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: MUTED,
    fontWeight: 600,
    marginBottom: '0.15rem',
  },
  orderId: {
    fontSize: '1.35rem',
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
    color: '#fff',
  },
  timePill: {
    fontSize: '0.85rem',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    padding: '0.35rem 0.65rem',
    borderRadius: '8px',
    border: '1px solid',
    background: 'rgba(0,0,0,0.2)',
    flexShrink: 0,
  },
  itemList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  item: {
    padding: '0.65rem 0.75rem',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.18)',
    border: `1px solid ${LINE}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  itemTop: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.55rem',
    flexWrap: 'wrap',
  },
  qty: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: '#fcd34d',
    background: 'rgba(251, 191, 36, 0.12)',
    padding: '0.15rem 0.45rem',
    borderRadius: '6px',
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  drinkName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: TEXT,
    lineHeight: 1.35,
  },
  itemMeta: {
    fontSize: '0.8rem',
    color: MUTED,
    lineHeight: 1.45,
  },
  metaSep: { margin: '0 0.2rem', opacity: 0.5 },
  // Primary action per card (PATCH complete).
  completeBtn: {
    marginTop: '0.25rem',
    background: 'linear-gradient(180deg, #059669 0%, #047857 100%)',
    color: '#fff',
    border: '1px solid rgba(52, 211, 153, 0.35)',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
  },
};
