/**
 * Cashier.jsx — staff register: PIN gate (validated against user_account.password),
 * browse `/api/cashier/*` menu, customize drinks (sweetness / ice / toppings / qty),
 * build a ticket, POST order to `/api/cashier/order`.
 */
import { useEffect, useMemo, useState } from 'react';

// Base URL for API calls (Vite: `VITE_API_URL` in client/.env, no trailing slash).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toApiUrl = (path) => `${API_BASE}${path}`;

// Values must match what `/api/cashier/order` expects (same enums as customer flow).
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

const PIN_MAX_LENGTH = 4;

export default function Cashier() {
  // --- PIN screen ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // --- Menu data from cashier API routes ---
  const [categories, setCategories] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlacedMessage, setOrderPlacedMessage] = useState('');

  // Category filter for the drink list; null = all categories.
  const [selectedCategory, setSelectedCategory] = useState(null);
  // When set, the customize modal is open for this drink object.
  const [selectedDrink, setSelectedDrink] = useState(null);

  // Modal-only state; reset when opening a new drink or closing the modal.
  const [customization, setCustomization] = useState({
    sugar: '100',
    ice: 'NORMAL_ICE',
    toppings: [],
    qty: 1,
  });

  // Line items for the current sale (each has a local `id` until submitted).
  const [ticketItems, setTicketItems] = useState([]);
  const [drinkSearch, setDrinkSearch] = useState('');
  // Stack layout to one column on narrow viewports.
  const [isCompact, setIsCompact] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1100 : false,
  );

  // Load menu + recent orders once the cashier has unlocked the screen.
  useEffect(() => {
    if (isAuthenticated) {
      loadCashierData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /** Fetches categories, drinks, toppings, and recent orders in parallel from cashier routes. */
  const loadCashierData = async () => {
    try {
      setLoading(true);
      setApiError('');

      const [categoriesRes, drinksRes, toppingsRes, recentOrdersRes] = await Promise.all([
        fetch(toApiUrl('/api/cashier/categories')),
        fetch(toApiUrl('/api/cashier/drinks')),
        fetch(toApiUrl('/api/cashier/toppings')),
        fetch(toApiUrl('/api/cashier/recent-orders')),
      ]);

      if (!categoriesRes.ok || !drinksRes.ok || !toppingsRes.ok || !recentOrdersRes.ok) {
        throw new Error('Failed to load cashier data');
      }

      const [categoriesData, drinksData, toppingsData, recentOrdersData] = await Promise.all([
        categoriesRes.json(),
        drinksRes.json(),
        toppingsRes.json(),
        recentOrdersRes.json(),
      ]);

      setCategories(categoriesData);
      setDrinks(drinksData);
      setToppings(toppingsData);
      setRecentOrders(recentOrdersData);
    } catch (err) {
      console.error(err);
      setApiError('Could not load cashier screen. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Applies category chip + search text to the full drink list from the server.
  const filteredDrinks = useMemo(() => {
    const normalizedSearch = drinkSearch.trim().toLowerCase();

    return drinks.filter((drink) => {
      const categoryMatch = selectedCategory === null || drink.category_id === selectedCategory;
      if (!categoryMatch) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        drink.drink_name.toLowerCase().includes(normalizedSearch)
        || drink.category_name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [drinks, selectedCategory, drinkSearch]);

  /** Default customization when opening a drink or closing without adding. */
  const resetCustomization = () => {
    setCustomization({
      sugar: '100',
      ice: 'NORMAL_ICE',
      toppings: [],
      qty: 1,
    });
  };

  /** Opens the modal and clears prior sugar/ice/topping/qty choices for the new drink. */
  const handleDrinkSelect = (drink) => {
    setSelectedDrink(drink);
    resetCustomization();
  };

  /** Dismiss modal without adding (clears `selectedDrink` and customization). */
  const closeCustomizer = () => {
    setSelectedDrink(null);
    resetCustomization();
  };

  /** Multi-select toppings by `topping_id` for the open drink only. */
  const toggleTopping = (toppingId) => {
    setCustomization((prev) => ({
      ...prev,
      toppings: prev.toppings.includes(toppingId)
        ? prev.toppings.filter((id) => id !== toppingId)
        : [...prev.toppings, toppingId],
    }));
  };

  /** Base drink price plus sum of selected topping prices (for preview and ticket line). */
  const getSingleDrinkPrice = (drink, selectedToppingIds) => {
    if (!drink) {
      return 0;
    }

    const toppingTotal = selectedToppingIds.reduce((sum, toppingId) => {
      const topping = toppings.find((t) => t.topping_id === toppingId);
      return sum + (topping ? Number(topping.topping_price) : 0);
    }, 0);

    return Number(drink.base_price) + toppingTotal;
  };

  const currentItemUnitPrice = getSingleDrinkPrice(selectedDrink, customization.toppings);
  const currentItemTotal = currentItemUnitPrice * customization.qty;

  /** Appends one ticket row using the same shape the order POST expects. */
  const addToTicket = () => {
    if (!selectedDrink) {
      return;
    }

    const unitPrice = getSingleDrinkPrice(selectedDrink, customization.toppings);
    const qty = Number(customization.qty);

    const newItem = {
      id: Date.now(),
      drink: selectedDrink,
      qty,
      sweetness_level: customization.sugar,
      ice_level: customization.ice,
      toppings: customization.toppings,
      drink_unit_price: Number(selectedDrink.base_price),
      total_price: Number((unitPrice * qty).toFixed(2)),
    };

    setTicketItems((prev) => [...prev, newItem]);
    setSelectedDrink(null);
    resetCustomization();
  };

  const removeTicketItem = (itemId) => {
    setTicketItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  /** Unit price (base + toppings) for one drink on a ticket line — used when changing qty in the ticket. */
  const getLineUnitPrice = (item) => getSingleDrinkPrice(item.drink, item.toppings);

  const incrementTicketQty = (itemId) => {
    setTicketItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const unit = getLineUnitPrice(item);
        const q = item.qty + 1;
        return {
          ...item,
          qty: q,
          total_price: Number((unit * q).toFixed(2)),
        };
      })
    );
  };

  const decrementTicketQty = (itemId) => {
    setTicketItems((prev) => {
      const row = prev.find((i) => i.id === itemId);
      if (!row) return prev;
      if (row.qty <= 1) {
        return prev.filter((i) => i.id !== itemId);
      }
      const unit = getLineUnitPrice(row);
      const q = row.qty - 1;
      return prev.map((i) =>
        i.id === itemId ? { ...i, qty: q, total_price: Number((unit * q).toFixed(2)) } : i
      );
    });
  };

  const clearTicket = () => {
    setTicketItems([]);
    setSelectedDrink(null);
    resetCustomization();
  };

  const ticketTotal = useMemo(() => {
    return ticketItems.reduce((sum, item) => sum + Number(item.total_price), 0);
  }, [ticketItems]);

  /** Comma-separated topping names for ticket display (IDs stored on the line item). */
  const getToppingNames = (toppingIds) => {
    return toppingIds
      .map((id) => toppings.find((t) => t.topping_id === id)?.topping_name)
      .filter(Boolean)
      .join(', ');
  };

  const getSugarLabel = (value) => {
    return SUGAR_LEVELS.find((level) => level.value === value)?.label || value;
  };

  const getIceLabel = (value) => {
    return ICE_LEVELS.find((level) => level.value === value)?.label || value;
  };

  /**
   * Submits the whole ticket as one order. `sweetness_level` / `ice_level` must stay
   * aligned with server validation (same string values as customer API).
   * Attributes the order to the logged-in cashier's user_id.
   */
  const placeOrder = async () => {
    if (ticketItems.length === 0 || placingOrder) {
      return;
    }

    try {
      setPlacingOrder(true);
      setApiError('');

      const payload = {
        user_id: loggedInUser?.user_id ?? 1,
        items: ticketItems.map((item) => ({
          drink_id: item.drink.drink_id,
          qty: item.qty,
          sweetness_level: item.sweetness_level,
          ice_level: item.ice_level,
          drink_unit_price: Number(item.drink_unit_price),
          toppings: item.toppings,
          total_price: Number(item.total_price.toFixed(2)),
        })),
      };

      const response = await fetch(toApiUrl('/api/cashier/order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();

      setOrderPlacedMessage(`Order #${data.order_id} sent successfully`);
      setTicketItems([]);
      setSelectedDrink(null);
      resetCustomization();

      await loadCashierData();

      window.setTimeout(() => {
        setOrderPlacedMessage('');
      }, 4000);
    } catch (err) {
      console.error(err);
      setApiError('Could not submit order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // --- PIN keypad handlers (client-side check only) ---
  const addPinDigit = (digit) => {
    setPinError('');
    setPinInput((prev) => {
      if (prev.length >= PIN_MAX_LENGTH) {
        return prev;
      }
      return `${prev}${digit}`;
    });
  };

  const backspacePin = () => {
    setPinError('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const clearPin = () => {
    setPinError('');
    setPinInput('');
  };

  /**
   * Sends the entered PIN to /api/cashier/login, which validates it against
   * user_account.password. On success, stores the returned user (without password)
   * in `loggedInUser` and unlocks the register.
   */
  const submitPin = async () => {
    if (pinInput.length !== PIN_MAX_LENGTH || authenticating) {
      return;
    }

    try {
      setAuthenticating(true);
      setPinError('');

      const response = await fetch(toApiUrl('/api/cashier/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pinInput }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPinError(data.error || 'Incorrect PIN. Please try again.');
        setPinInput('');
        return;
      }

      setLoggedInUser(data.user);
      setIsAuthenticated(true);
      setPinInput('');
    } catch (err) {
      console.error(err);
      setPinError('Could not reach server. Try again.');
      setPinInput('');
    } finally {
      setAuthenticating(false);
    }
  };

  /** Clears auth state, ticket, and any open modal — returns to PIN screen. */
  const logout = () => {
    setIsAuthenticated(false);
    setLoggedInUser(null);
    setTicketItems([]);
    setSelectedDrink(null);
    resetCustomization();
    setApiError('');
    setOrderPlacedMessage('');
  };

  // Gate: no menu fetch until PIN succeeds.
  if (!isAuthenticated) {
    return (
      <div style={styles.pinPage}>
        <section style={styles.pinCard}>
          <h1 style={styles.pinTitle}>Cashier login</h1>
          <p style={styles.pinSubtitle}>4-digit PIN</p>

          <div style={styles.pinDots} aria-label={`PIN length ${pinInput.length} of ${PIN_MAX_LENGTH}`}>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                style={{
                  ...styles.pinDot,
                  ...(index < pinInput.length ? styles.pinDotFilled : {}),
                }}
              />
            ))}
          </div>

          {pinError && (
            <p style={styles.pinError} role="alert">
              {pinError}
            </p>
          )}

          <div style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                style={styles.keypadButton}
                onClick={() => addPinDigit(String(digit))}
              >
                {digit}
              </button>
            ))}

            <button type="button" style={styles.keypadActionButton} onClick={clearPin}>
              Clear
            </button>
            <button type="button" style={styles.keypadButton} onClick={() => addPinDigit('0')}>
              0
            </button>
            <button type="button" style={styles.keypadActionButton} onClick={backspacePin}>
              Back
            </button>
          </div>

          <button
            type="button"
            style={{
              ...styles.unlockButton,
              ...(pinInput.length !== PIN_MAX_LENGTH || authenticating ? styles.unlockButtonDisabled : {}),
            }}
            onClick={submitPin}
            disabled={pinInput.length !== PIN_MAX_LENGTH || authenticating}
          >
            {authenticating ? 'Checking…' : 'Unlock'}
          </button>
        </section>
      </div>
    );
  }

  // Main register: left = browse/add drinks, right = ticket + submit + recent orders.
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <h1 style={styles.title}>Cashier</h1>
            <p style={styles.subtitle}>
              {loggedInUser
                ? `Signed in as ${loggedInUser.username} (${loggedInUser.role})`
                : 'Order entry'}
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button type="button" style={styles.dangerButton} onClick={clearTicket}>
            Clear ticket
          </button>
          <button type="button" style={styles.logoutButton} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {loading && <p style={styles.statusText}>Loading menu…</p>}
      {apiError && <p style={styles.errorText}>{apiError}</p>}
      {orderPlacedMessage && <p style={styles.successText}>{orderPlacedMessage}</p>}

      <div style={{ ...styles.layout, ...(isCompact ? styles.layoutCompact : {}) }}>
        <section style={styles.menuPanel} aria-label="Drink picker">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Drinks</h2>
            <p style={styles.sectionNote}>Pick a drink to set options.</p>
          </div>

          <div style={styles.categoryBar} aria-label="Drink categories">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              style={{
                ...styles.categoryButton,
                ...(selectedCategory === null ? styles.categoryButtonActive : {}),
              }}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.category_id}
                type="button"
                onClick={() => setSelectedCategory(category.category_id)}
                style={{
                  ...styles.categoryButton,
                  ...(selectedCategory === category.category_id ? styles.categoryButtonActive : {}),
                }}
              >
                {category.category_name}
              </button>
            ))}
          </div>

          <div style={styles.drinkGrid}>
            {filteredDrinks.length === 0 ? (
              <div style={styles.emptyBuilder}>No matches.</div>
            ) : (
              filteredDrinks.map((drink) => (
                <button
                  key={drink.drink_id}
                  type="button"
                  onClick={() => handleDrinkSelect(drink)}
                  style={styles.drinkCard}
                >
                  <div style={styles.drinkCardMain}>
                    <div style={styles.drinkName}>{drink.drink_name}</div>
                    <div style={styles.drinkCategory}>{drink.category_name}</div>
                  </div>
                  <div style={styles.drinkPrice}>
                    ${Number(drink.base_price).toFixed(2)}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section
          style={{ ...styles.ticketPanel, ...(isCompact ? styles.ticketPanelCompact : {}) }}
          aria-label="Ticket and recent orders"
        >
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Ticket</h2>
            <p style={styles.sectionNote}>Submit when ready.</p>
          </div>

          {ticketItems.length === 0 ? (
            <div style={styles.emptyTicket}>No line items.</div>
          ) : (
            <div style={styles.ticketList}>
              {ticketItems.map((item) => (
                <div key={item.id} style={styles.ticketItem}>
                  <div style={styles.ticketItemTop}>
                    <div style={styles.ticketItemLeftCol}>
                      <div style={styles.ticketItemName}>{item.drink.drink_name}</div>
                      <div style={styles.ticketItemMeta}>
                        {getSugarLabel(item.sweetness_level)} sweet, {getIceLabel(item.ice_level)}
                      </div>
                      {item.toppings.length > 0 && (
                        <div style={styles.ticketItemMeta}>
                          {getToppingNames(item.toppings)}
                        </div>
                      )}
                    </div>

                    <div style={styles.ticketItemRight}>
                      <div style={styles.ticketItemPrice}>${Number(item.total_price).toFixed(2)}</div>
                      <div style={styles.ticketQtyRow} aria-label="Line quantity">
                        <button
                          type="button"
                          style={styles.ticketQtyBtn}
                          onClick={() => decrementTicketQty(item.id)}
                          aria-label={`Decrease quantity of ${item.drink.drink_name}`}
                        >
                          −
                        </button>
                        <span style={styles.ticketQtyValue} aria-live="polite">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          style={styles.ticketQtyBtn}
                          onClick={() => incrementTicketQty(item.id)}
                          aria-label={`Increase quantity of ${item.drink.drink_name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeTicketItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.ticketFooter}>
            <div style={styles.summaryRow}>
              <span>Total</span>
              <strong>${ticketTotal.toFixed(2)}</strong>
            </div>
            <button
              type="button"
              style={styles.submitButton}
              onClick={placeOrder}
              disabled={ticketItems.length === 0 || placingOrder}
            >
              {placingOrder ? 'Submitting…' : 'Submit order'}
            </button>
          </div>

          <div style={styles.sectionHeaderCompact}>
            <h3 style={styles.sectionTitle}>Recent orders</h3>
          </div>

          <div style={styles.recentOrdersBox}>
            {recentOrders.length === 0 ? (
              <p style={styles.recentOrderEmpty}>None</p>
            ) : (
              <div style={styles.recentOrdersList}>
                {recentOrders.map((order) => (
                  <div key={order.order_id} style={styles.recentOrderRow}>
                    <div>
                      <div style={styles.recentOrderId}>Order #{order.order_id}</div>
                      <div style={styles.recentOrderMeta}>
                        {new Date(order.order_ts).toLocaleString()}
                      </div>
                    </div>
                    <div style={styles.recentOrderRight}>
                      <div style={styles.recentOrderStatus}>{order.order_status}</div>
                      <div style={styles.recentOrderTotal}>
                        ${Number(order.order_total).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal: quantity, sugar, ice, toppings — same fields persisted on each ticket line. */}
      {selectedDrink && (
        <div style={styles.modalOverlay} onClick={closeCustomizer}>
          <section style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Customize</h2>
                <p style={styles.modalSubtitle}>
                  {selectedDrink.drink_name} — ${Number(selectedDrink.base_price).toFixed(2)} base
                </p>
              </div>
              <button type="button" style={styles.modalClose} onClick={closeCustomizer}>
                Close
              </button>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Quantity</label>
              <div style={styles.qtyRow}>
                <button
                  type="button"
                  style={styles.qtyButton}
                  onClick={() =>
                    setCustomization((prev) => ({
                      ...prev,
                      qty: Math.max(1, prev.qty - 1),
                    }))
                  }
                >
                  -
                </button>
                <div style={styles.qtyValue}>{customization.qty}</div>
                <button
                  type="button"
                  style={styles.qtyButton}
                  onClick={() =>
                    setCustomization((prev) => ({
                      ...prev,
                      qty: prev.qty + 1,
                    }))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Sweetness</label>
              <div style={styles.optionRow}>
                {SUGAR_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    style={{
                      ...styles.optionButton,
                      ...(customization.sugar === level.value ? styles.optionButtonActive : {}),
                    }}
                    onClick={() =>
                      setCustomization((prev) => ({
                        ...prev,
                        sugar: level.value,
                      }))
                    }
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Ice</label>
              <div style={styles.optionRow}>
                {ICE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    style={{
                      ...styles.optionButton,
                      ...(customization.ice === level.value ? styles.optionButtonActive : {}),
                    }}
                    onClick={() =>
                      setCustomization((prev) => ({
                        ...prev,
                        ice: level.value,
                      }))
                    }
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Toppings</label>
              <div style={styles.toppingGrid}>
                {toppings.map((topping) => (
                  <button
                    key={topping.topping_id}
                    type="button"
                    style={{
                      ...styles.toppingButton,
                      ...(customization.toppings.includes(topping.topping_id)
                        ? styles.toppingButtonActive
                        : {}),
                    }}
                    onClick={() => toggleTopping(topping.topping_id)}
                  >
                    {topping.topping_name} (+${Number(topping.topping_price).toFixed(2)})
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>Item Total</span>
                <strong>${currentItemTotal.toFixed(2)}</strong>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryButton} onClick={closeCustomizer}>
                  Cancel
                </button>
                <button type="button" style={styles.primaryButton} onClick={addToTicket}>
                  Add to Ticket
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// --- Inline theme (register uses cool blues; separate from customer cream theme) ---
const NAVY = '#13293d';
const BLUE = '#1b4965';
const SKY = '#eaf4fb';
const TEAL = '#4a90a4';
const WHITE = '#ffffff';
const RED = '#b3261e';
const GREEN = '#1f7a5c';
const BORDER = '#c9dbe7';
const TEXT = '#0d1b2a';
const MUTED = '#374151';

const styles = {
  pinPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #0f2740 0%, #1b4965 70%, #4a90a4 100%)',
    padding: '1rem',
  },
  pinCard: {
    width: 'min(420px, 100%)',
    background: WHITE,
    borderRadius: '24px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 20px 40px rgba(7,20,36,0.35)',
    padding: '1.3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  pinTitle: {
    margin: 0,
    color: BLUE,
    fontSize: '1.7rem',
    fontWeight: 900,
    textAlign: 'center',
  },
  pinSubtitle: {
    margin: 0,
    color: MUTED,
    textAlign: 'center',
    fontSize: '0.95rem',
  },
  pinDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.65rem',
    marginTop: '0.1rem',
  },
  pinDot: {
    width: '0.95rem',
    height: '0.95rem',
    borderRadius: '999px',
    border: `2px solid ${BLUE}`,
    background: '#d7eaf5',
  },
  pinDotFilled: {
    background: BLUE,
  },
  pinError: {
    margin: 0,
    color: RED,
    fontWeight: 700,
    textAlign: 'center',
    minHeight: '1.1rem',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.55rem',
  },
  keypadButton: {
    minHeight: '4.1rem',
    border: `1px solid ${BORDER}`,
    borderRadius: '14px',
    background: '#f2f8fc',
    color: BLUE,
    fontSize: '1.45rem',
    fontWeight: 900,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  keypadActionButton: {
    minHeight: '4.1rem',
    border: `1px solid ${BORDER}`,
    borderRadius: '14px',
    background: '#e3eff6',
    color: BLUE,
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  unlockButton: {
    border: 'none',
    background: GREEN,
    color: WHITE,
    borderRadius: '14px',
    padding: '0.95rem 1rem',
    fontWeight: 900,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.25rem',
    touchAction: 'manipulation',
  },
  unlockButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  page: {
    minHeight: '100vh',
    background: '#f5f9fc',
    color: TEXT,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    paddingBottom: '2rem',
  },
  header: {
    background: NAVY,
    color: WHITE,
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 800,
  },
  subtitle: {
    margin: '0.2rem 0 0',
    color: '#d9ebf6',
    fontSize: '0.95rem',
  },
  statusText: {
    margin: '1rem 1.5rem 0',
    color: MUTED,
  },
  errorText: {
    margin: '1rem 1.5rem 0',
    color: RED,
    fontWeight: 700,
  },
  successText: {
    margin: '1rem 1.5rem 0',
    color: GREEN,
    fontWeight: 700,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    alignItems: 'start',
  },
  layoutCompact: {
    gridTemplateColumns: '1fr',
  },
  menuPanel: {
    background: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: '18px',
    padding: '0.75rem',
    boxShadow: '0 2px 10px rgba(19,41,61,0.05)',
  },
  ticketPanel: {
    background: WHITE,
    border: `1px solid ${BORDER}`,
    borderRadius: '18px',
    padding: '0.75rem',
    boxShadow: '0 2px 10px rgba(19,41,61,0.05)',
    position: 'sticky',
    top: '5rem',
  },
  ticketPanelCompact: {
    position: 'static',
    top: 'auto',
  },
  sectionHeaderCompact: {
    marginTop: '0.9rem',
    marginBottom: '0.55rem',
  },
  sectionHeader: {
    marginBottom: '0.6rem',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 800,
    color: BLUE,
  },
  sectionNote: {
    margin: '0.15rem 0 0',
    color: MUTED,
    fontSize: '0.75rem',
  },
  categoryBar: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
  },

  categoryButton: {
    border: `1px solid ${BORDER}`,
    background: SKY,
    color: BLUE,
    borderRadius: '999px',
    padding: '0.65rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  categoryButtonActive: {
    background: BLUE,
    color: WHITE,
    borderColor: BLUE,
  },
  drinkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '0.6rem',
    maxHeight: 'calc(100vh - 220px)',
    overflowY: 'auto',
  },
  drinkCard: {
    border: `1px solid ${BORDER}`,
    background: WHITE,
    borderRadius: '10px',
    padding: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    textAlign: 'center',
    justifyContent: 'flex-start',
  },
  drinkCardMain: {
    flex: 1,
    textAlign: 'center',
    minWidth: 0,
    width: '100%',
  },
  drinkName: {
    fontWeight: 800,
    fontSize: '0.9rem',
    color: BLUE,
    flex: 1,
  },
  drinkCategory: {
    fontSize: '0.7rem',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  drinkPrice: {
    fontWeight: 800,
    color: BLUE,
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  emptyBuilder: {
    padding: '1rem',
    borderRadius: '12px',
    background: SKY,
    color: MUTED,
  },
  controlGroup: {
    marginBottom: '0.7rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.35rem',
    fontWeight: 700,
    fontSize: '0.85rem',
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  optionButton: {
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: TEXT,
    borderRadius: '999px',
    padding: '0.4rem 0.6rem',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  optionButtonActive: {
    background: BLUE,
    color: WHITE,
    borderColor: BLUE,
  },
  toppingGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.45rem',
  },
  toppingButton: {
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: TEXT,
    borderRadius: '999px',
    padding: '0.35rem 0.6rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
  },
  toppingButtonActive: {
    background: TEAL,
    color: WHITE,
    borderColor: TEAL,
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  qtyButton: {
    width: '2rem',
    height: '2rem',
    borderRadius: '12px',
    border: `1px solid ${BLUE}`,
    background: BLUE,
    color: WHITE,
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  qtyValue: {
    minWidth: '2rem',
    textAlign: 'center',
    fontWeight: 800,
    fontSize: '0.9rem',
  },
  summaryBox: {
    borderTop: `1px solid ${BORDER}`,
    paddingTop: '0.7rem',
    marginTop: '0.7rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.6rem',
    fontSize: '0.85rem',
  },
  primaryButton: {
    width: '100%',
    border: 'none',
    background: BLUE,
    color: WHITE,
    borderRadius: '10px',
    padding: '0.6rem 0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  secondaryButton: {
    border: `1px solid #7fb1c7`,
    background: '#e8f5fb',
    color: BLUE,
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  dangerButton: {
    border: 'none',
    background: '#fbe9e7',
    color: RED,
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  logoutButton: {
    border: `1px solid #d9ebf6`,
    background: 'transparent',
    color: WHITE,
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyTicket: {
    padding: '1rem',
    background: SKY,
    borderRadius: '12px',
    color: MUTED,
  },
  ticketList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '0.2rem',
  },
  ticketItem: {
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    padding: '0.6rem',
    background: '#fcfeff',
    fontSize: '0.8rem',
  },
  ticketItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  ticketItemName: {
    fontWeight: 800,
    color: BLUE,
    fontSize: '0.8rem',
  },
  ticketItemMeta: {
    marginTop: '0.1rem',
    color: MUTED,
    fontSize: '0.7rem',
  },
  ticketItemLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  ticketQtyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.45rem',
  },
  ticketQtyBtn: {
    width: '2.1rem',
    height: '2.1rem',
    borderRadius: '6px',
    border: `1px solid ${BORDER}`,
    background: WHITE,
    color: TEXT,
    fontSize: '1.05rem',
    fontWeight: 800,
    cursor: 'pointer',
    lineHeight: 1,
  },
  ticketQtyValue: {
    minWidth: '1.6rem',
    textAlign: 'center',
    fontWeight: 800,
    fontSize: '0.9rem',
  },
  ticketItemRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.35rem',
    minWidth: '118px',
    textAlign: 'right',
  },
  ticketItemPrice: {
    fontWeight: 800,
    color: BLUE,
    marginBottom: 0,
  },
  removeButton: {
    border: 'none',
    background: 'transparent',
    color: RED,
    cursor: 'pointer',
    fontWeight: 700,
  },
  ticketFooter: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${BORDER}`,
  },
  submitButton: {
    width: '100%',
    border: 'none',
    background: GREEN,
    color: WHITE,
    borderRadius: '10px',
    padding: '0.7rem 0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  recentOrdersBox: {
    marginTop: '0.1rem',
  },
  recentOrderEmpty: {
    color: MUTED,
    margin: 0,
  },
  recentOrdersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '0.2rem',
  },
  recentOrderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.5rem',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '0.5rem',
    background: '#fafcff',
    fontSize: '0.75rem',
  },
  recentOrderId: {
    fontWeight: 800,
    color: BLUE,
  },
  recentOrderMeta: {
    color: MUTED,
    fontSize: '0.7rem',
    marginTop: '0.1rem',
  },
  recentOrderRight: {
    textAlign: 'right',
  },
  recentOrderStatus: {
    textTransform: 'capitalize',
    color: MUTED,
    fontSize: '0.82rem',
    marginBottom: '0.2rem',
  },
  recentOrderTotal: {
    fontWeight: 800,
    color: BLUE,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(13,27,42,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 120,
  },
  modalCard: {
    width: 'min(680px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: WHITE,
    borderRadius: '16px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 24px 40px rgba(13,27,42,0.24)',
    padding: '0.9rem',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.8rem',
    marginBottom: '0.7rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 800,
    color: BLUE,
  },
  modalSubtitle: {
    margin: '0.2rem 0 0',
    fontSize: '0.78rem',
    color: MUTED,
  },
  modalClose: {
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    background: WHITE,
    color: MUTED,
    cursor: 'pointer',
    fontWeight: 700,
    padding: '0.5rem 0.75rem',
  },
  modalActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
};
