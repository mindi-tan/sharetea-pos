import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toApiUrl = (path) => `${API_BASE}${path}`;

const CASHIER_PIN = '1234';

const SUGAR_LEVELS = [
  { label: '0%', value: '0' },
  { label: '50%', value: '50' },
  { label: '100%', value: '100' },
];

const ICE_LEVELS = [
  { label: 'No Ice', value: 'NO_ICE' },
  { label: 'Less Ice', value: 'LESS_ICE' },
  { label: 'Regular', value: 'NORMAL_ICE' },
];

const SIZE_LEVELS = [
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' },
];

/** Menu `base_price` is medium; S = 80%, M = 100%, L = 120% on the drink only (toppings full price). */
const SIZE_MULTIPLIERS = { S: 0.8, M: 1.0, L: 1.2 };

export default function Cashier() {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [apiError, setApiError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [ticket, setTicket] = useState([]);
  const [modal, setModal] = useState(null);
  const [customization, setCustomization] = useState({
    sugar: '100',
    ice: 'NORMAL_ICE',
    size: 'M',
    toppings: [],
  });

  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    const loadMenu = async () => {
      try {
        setLoadingMenu(true);
        setApiError('');
        const [categoriesRes, drinksRes, toppingsRes] = await Promise.all([
          fetch(toApiUrl('/api/customer/categories')),
          fetch(toApiUrl('/api/customer/drinks')),
          fetch(toApiUrl('/api/customer/toppings')),
        ]);
        if (!categoriesRes.ok || !drinksRes.ok || !toppingsRes.ok) {
          throw new Error('Failed to load menu');
        }
        const [categoriesData, drinksData, toppingsData] = await Promise.all([
          categoriesRes.json(),
          drinksRes.json(),
          toppingsRes.json(),
        ]);
        setCategories(categoriesData);
        setDrinks(drinksData);
        setToppings(toppingsData);
      } catch (err) {
        console.error(err);
        setApiError('Could not load menu.');
      } finally {
        setLoadingMenu(false);
      }
    };
    loadMenu();
  }, [unlocked]);

  const submitPin = (e) => {
    e.preventDefault();
    if (pinInput === CASHIER_PIN) {
      setUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Invalid PIN');
    }
  };

  const getSubtotal = (drink, selectedToppingIds, size = 'M') => {
    const sizeKey = size && SIZE_MULTIPLIERS[size] != null ? size : 'M';
    const toppingCost = selectedToppingIds.reduce((sum, tid) => {
      const t = toppings.find((x) => x.topping_id === tid);
      return sum + (t ? parseFloat(t.topping_price) : 0);
    }, 0);
    return parseFloat(drink.base_price) * SIZE_MULTIPLIERS[sizeKey] + toppingCost;
  };

  const filteredDrinks = selectedCategory
    ? drinks.filter((d) => d.category_id === selectedCategory)
    : drinks;

  const openModal = (drink) => {
    setModal(drink);
    setCustomization({ sugar: '100', ice: 'NORMAL_ICE', size: 'M', toppings: [] });
  };

  const toggleTopping = (id) => {
    setCustomization((prev) => ({
      ...prev,
      toppings: prev.toppings.includes(id)
        ? prev.toppings.filter((t) => t !== id)
        : [...prev.toppings, id],
    }));
  };

  const addToTicket = () => {
    if (!modal) return;
    const total = getSubtotal(modal, customization.toppings, customization.size);
    setTicket((prev) => [
      ...prev,
      {
        id: Date.now(),
        drink: modal,
        qty: 1,
        sweetness_level: customization.sugar,
        ice_level: customization.ice,
        size: customization.size,
        toppings: customization.toppings,
        total_price: total,
      },
    ]);
    setModal(null);
  };

  const incrementQty = (id) => {
    setTicket((prev) =>
      prev.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line))
    );
  };

  const decrementQty = (id) => {
    setTicket((prev) => {
      const line = prev.find((l) => l.id === id);
      if (!line) return prev;
      if (line.qty <= 1) {
        return prev.filter((l) => l.id !== id);
      }
      return prev.map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l));
    });
  };

  const removeLine = (id) => {
    setTicket((prev) => prev.filter((l) => l.id !== id));
  };

  const ticketTotal = ticket.reduce((sum, i) => sum + i.total_price * i.qty, 0);

  const placeOrder = async () => {
    if (ticket.length === 0 || placingOrder) return;
    try {
      setPlacingOrder(true);
      setApiError('');
      const payload = {
        user_id: 1,
        items: ticket.map((item) => ({
          drink_id: item.drink.drink_id,
          qty: item.qty,
          sweetness_level: item.sweetness_level,
          ice_level: item.ice_level,
          drink_size: item.size && ['S', 'M', 'L'].includes(item.size) ? item.size : 'M',
          drink_unit_price: Number(Number(item.total_price).toFixed(2)),
          toppings: item.toppings,
          total_price: Number((item.total_price * item.qty).toFixed(2)),
        })),
      };
      const res = await fetch(toApiUrl('/api/customer/order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Order failed');
      setTicket([]);
    } catch (err) {
      console.error(err);
      setApiError('Could not send order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getSugarLabel = (val) => SUGAR_LEVELS.find((s) => s.value === val)?.label || val;
  const getIceLabel = (val) => ICE_LEVELS.find((i) => i.value === val)?.label || val;

  if (!unlocked) {
    return (
      <div style={styles.lockScreen}>
        <form style={styles.pinCard} onSubmit={submitPin}>
          <h1 style={styles.h1}>Cashier</h1>
          <p style={styles.muted}>Enter PIN to open register</p>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setPinError('');
            }}
            style={styles.pinInput}
            placeholder="••••"
            aria-label="Cashier PIN"
          />
          {pinError ? (
            <p style={styles.err} role="alert">
              {pinError}
            </p>
          ) : null}
          <button type="submit" style={styles.btnPrimary}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <header style={styles.topBar}>
        <h1 style={styles.title}>🧾 Cashier</h1>
        <p style={styles.mutedSmall}>Reveille Boba POS</p>
      </header>

      {apiError ? (
        <p style={styles.errBanner} role="alert">
          {apiError}
        </p>
      ) : null}

      <div style={styles.split}>
        <section style={styles.menuPanel} aria-label="Menu">
          {loadingMenu ? (
            <p>Loading menu…</p>
          ) : (
            <>
              <div style={styles.catRow}>
                <button
                  type="button"
                  style={styles.catBtn}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.category_id}
                    style={{
                      ...styles.catBtn,
                      ...(selectedCategory === c.category_id ? styles.catBtnOn : {}),
                    }}
                    onClick={() => setSelectedCategory(c.category_id)}
                  >
                    {c.category_name}
                  </button>
                ))}
              </div>
              <div style={styles.drinkGrid}>
                {filteredDrinks.map((d) => (
                  <button
                    type="button"
                    key={d.drink_id}
                    style={styles.drinkCard}
                    onClick={() => openModal(d)}
                  >
                    <span style={styles.drinkName}>{d.drink_name}</span>
                    <span style={styles.drinkMeta}>{d.category_name}</span>
                    <span style={styles.drinkPrice}>${parseFloat(d.base_price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <aside style={styles.ticketPanel} aria-label="Ticket">
          <h2 style={styles.ticketHeading}>Ticket</h2>
          {ticket.length === 0 ? (
            <p style={styles.muted}>No items yet. Add drinks from the menu.</p>
          ) : (
            <ul style={styles.ticketList}>
              {ticket.map((line) => (
                <li key={line.id} style={styles.ticketLine}>
                  <div style={styles.lineMain}>
                    <div style={styles.lineTitle}>{line.drink.drink_name}</div>
                    <div style={styles.lineSub}>
                      Size {line.size ?? 'M'} · {getSugarLabel(line.sweetness_level)} sugar ·{' '}
                      {getIceLabel(line.ice_level)}
                      {line.toppings.length > 0 ? (
                        <>
                          {' '}
                          · +{' '}
                          {line.toppings
                            .map((tid) => toppings.find((t) => t.topping_id === tid)?.topping_name)
                            .filter(Boolean)
                            .join(', ')}
                        </>
                      ) : null}
                    </div>
                    <div style={styles.linePrice}>
                      ${(line.total_price * line.qty).toFixed(2)}
                    </div>
                  </div>
                  <div style={styles.qtyRow}>
                    <button
                      type="button"
                      style={styles.qtyBtn}
                      onClick={() => decrementQty(line.id)}
                      aria-label={`Decrease quantity of ${line.drink.drink_name}`}
                    >
                      −
                    </button>
                    <span style={styles.qtyValue} aria-live="polite">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      style={styles.qtyBtn}
                      onClick={() => incrementQty(line.id)}
                      aria-label={`Increase quantity of ${line.drink.drink_name}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => removeLine(line.id)}
                      aria-label={`Remove ${line.drink.drink_name} from ticket`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={styles.ticketFooter}>
            <div style={styles.totalRow}>
              <span>Total</span>
              <span style={styles.totalAmt}>${ticketTotal.toFixed(2)}</span>
            </div>
            <button
              type="button"
              style={styles.sendOrder}
              disabled={ticket.length === 0 || placingOrder}
              onClick={placeOrder}
            >
              {placingOrder ? 'Sending…' : 'Send order'}
            </button>
          </div>
        </aside>
      </div>

      {modal ? (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cashier-modal-title">
          <div style={styles.modalBox}>
            <h2 id="cashier-modal-title" style={styles.modalTitle}>
              {modal.drink_name}
            </h2>
            <p style={styles.muted}>Customize, then add to ticket</p>

            <p style={styles.sectionLabel}>Size (M = listed price)</p>
            <div style={styles.optRow}>
              {SIZE_LEVELS.map((sz) => (
                <button
                  type="button"
                  key={sz.value}
                  style={{
                    ...styles.optBtn,
                    ...(customization.size === sz.value ? styles.optOn : {}),
                  }}
                  onClick={() => setCustomization((p) => ({ ...p, size: sz.value }))}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            <p style={styles.sectionLabel}>Sweetness</p>
            <div style={styles.optRow}>
              {SUGAR_LEVELS.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  style={{
                    ...styles.optBtn,
                    ...(customization.sugar === s.value ? styles.optOn : {}),
                  }}
                  onClick={() => setCustomization((p) => ({ ...p, sugar: s.value }))}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p style={styles.sectionLabel}>Ice</p>
            <div style={styles.optRow}>
              {ICE_LEVELS.map((i) => (
                <button
                  type="button"
                  key={i.value}
                  style={{
                    ...styles.optBtn,
                    ...(customization.ice === i.value ? styles.optOn : {}),
                  }}
                  onClick={() => setCustomization((p) => ({ ...p, ice: i.value }))}
                >
                  {i.label}
                </button>
              ))}
            </div>

            <p style={styles.sectionLabel}>Toppings</p>
            <div style={styles.toppingGrid}>
              {toppings.map((t) => (
                <button
                  type="button"
                  key={t.topping_id}
                  style={{
                    ...styles.toppingBtn,
                    ...(customization.toppings.includes(t.topping_id) ? styles.toppingOn : {}),
                  }}
                  onClick={() => toggleTopping(t.topping_id)}
                >
                  {t.topping_name} (+${parseFloat(t.topping_price).toFixed(2)})
                </button>
              ))}
            </div>

            <p style={styles.subtotalLine}>
              Line subtotal: ${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)} each
            </p>
            <div style={styles.modalActions}>
              <button type="button" style={styles.btnGhost} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="button" style={styles.btnPrimary} onClick={addToTicket}>
                Add to ticket
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const CREAM = '#faf6f0';
const BROWN = '#3d2914';
const ACCENT = '#c45c26';

const styles = {
  lockScreen: {
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: CREAM,
    fontFamily: 'system-ui, sans-serif',
  },
  pinCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2rem 2.5rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '360px',
  },
  h1: { margin: '0 0 0.5rem', color: BROWN, fontSize: '1.75rem' },
  muted: { color: '#666', margin: '0 0 1rem' },
  mutedSmall: { color: '#666', margin: 0, fontSize: '0.9rem' },
  pinInput: {
    width: '100%',
    fontSize: '1.5rem',
    textAlign: 'center',
    letterSpacing: '0.3em',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '2px solid #ddd',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  err: { color: '#b91c1c', fontSize: '0.9rem', margin: '0 0 0.5rem' },
  errBanner: { background: '#fee2e2', color: '#991b1b', padding: '0.5rem 1rem', margin: 0, borderRadius: 8 },
  layout: {
    minHeight: '100svh',
    background: CREAM,
    fontFamily: 'system-ui, sans-serif',
    color: BROWN,
  },
  topBar: {
    padding: '1rem 1.25rem',
    borderBottom: '2px solid #e8d5b7',
    background: '#fff',
  },
  title: { margin: 0, fontSize: '1.4rem' },
  split: {
    display: 'grid',
    gridTemplateColumns: '1fr min(420px, 100%)',
    gap: 0,
    minHeight: 'calc(100svh - 80px)',
  },
  menuPanel: {
    padding: '1rem',
    overflowY: 'auto',
  },
  ticketPanel: {
    background: '#fff',
    borderLeft: '2px solid #e8d5b7',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  ticketHeading: { margin: '0 0 0.75rem', fontSize: '1.15rem' },
  catRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  catBtn: {
    padding: '0.4rem 0.9rem',
    borderRadius: '999px',
    border: '2px solid #e8d5b7',
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  catBtnOn: { background: BROWN, color: '#fff', borderColor: BROWN },
  drinkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.65rem',
  },
  drinkCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.25rem',
    padding: '0.75rem',
    borderRadius: '12px',
    border: '2px solid #e8d5b7',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  drinkName: { fontWeight: 600, fontSize: '0.95rem' },
  drinkMeta: { fontSize: '0.75rem', color: '#666' },
  drinkPrice: { color: ACCENT, fontWeight: 700 },
  ticketList: { listStyle: 'none', margin: 0, padding: 0, flex: 1, overflowY: 'auto' },
  ticketLine: {
    borderBottom: '1px solid #eee',
    padding: '0.75rem 0',
  },
  lineMain: { marginBottom: '0.5rem' },
  lineTitle: { fontWeight: 600 },
  lineSub: { fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' },
  linePrice: { fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  qtyBtn: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '8px',
    border: '2px solid ' + BROWN,
    background: '#fff',
    color: BROWN,
    fontSize: '1.25rem',
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1,
  },
  qtyValue: {
    minWidth: '2rem',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  removeBtn: {
    marginLeft: 'auto',
    fontSize: '0.8rem',
    color: '#999',
    background: 'none',
    border: 'none',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  ticketFooter: {
    marginTop: 'auto',
    paddingTop: '1rem',
    borderTop: '2px solid #e8d5b7',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.15rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
  },
  totalAmt: { color: ACCENT },
  sendOrder: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '10px',
    border: 'none',
    background: BROWN,
    color: '#fff',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '1rem',
  },
  modalBox: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    maxWidth: '480px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: { margin: '0 0 0.5rem' },
  sectionLabel: { fontSize: '0.8rem', fontWeight: 600, margin: '0.75rem 0 0.35rem' },
  optRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  optBtn: {
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    border: '2px solid #e8d5b7',
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  optOn: { background: BROWN, color: '#fff', borderColor: BROWN },
  toppingGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  toppingBtn: {
    padding: '0.35rem 0.6rem',
    fontSize: '0.85rem',
    borderRadius: '999px',
    border: '2px solid #e8d5b7',
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  toppingOn: { background: ACCENT, color: '#fff', borderColor: ACCENT },
  subtotalLine: { marginTop: '0.75rem', fontSize: '0.9rem' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  btnGhost: {
    padding: '0.6rem 1rem',
    borderRadius: 8,
    border: '2px solid #ccc',
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    padding: '0.6rem 1.2rem',
    borderRadius: 8,
    border: 'none',
    background: BROWN,
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
