import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const toApiUrl = (path) => `${API_BASE}${path}`;

const SUGAR_LEVELS = [
  { label: '0%',   value: '0'   },
  { label: '50%',  value: '50'  },
  { label: '100%', value: '100' },
];

const ICE_LEVELS = [
  { label: 'No Ice',   value: 'NO_ICE'    },
  { label: 'Less Ice', value: 'LESS_ICE'  },
  { label: 'Regular',  value: 'NORMAL_ICE' },
];

const categoryEmojis = {
  'Milk Tea':    '🧋',
  'Fruit Tea':   '🍓',
  'Fresh Milk':  '🥛',
  'Brewed Tea':  '🍵',
  'Ice Blended': '🧊',
  'Mojito':      '🌿',
  'Seasonal':    '🌸',
};

export default function Customer() {
  const [categories, setCategories]               = useState([]);
  const [drinks, setDrinks]                       = useState([]);
  const [toppings, setToppings]                   = useState([]);
  const [loadingMenu, setLoadingMenu]             = useState(true);
  const [apiError, setApiError]                   = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart]                         = useState([]);
  const [modal, setModal]                       = useState(null);
  const [customization, setCustomization]       = useState({ sugar: '100', ice: 'NORMAL_ICE', toppings: [] });
  const [showCart, setShowCart]                 = useState(false);
  const [orderPlaced, setOrderPlaced]           = useState(false);
  const [placingOrder, setPlacingOrder]         = useState(false);

  useEffect(() => {
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
          throw new Error('Failed to load menu from server');
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
        setApiError('Could not load menu data. Please try again.');
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenu();
  }, []);

  const filteredDrinks = selectedCategory
    ? drinks.filter(d => d.category_id === selectedCategory)
    : drinks;

  const openModal = (drink) => {
    setModal(drink);
    setCustomization({ sugar: '100', ice: 'NORMAL_ICE', toppings: [] });
  };

  const toggleTopping = (id) => {
    setCustomization(prev => ({
      ...prev,
      toppings: prev.toppings.includes(id)
        ? prev.toppings.filter(t => t !== id)
        : [...prev.toppings, id],
    }));
  };

  const getSubtotal = (drink, selectedToppingIds) => {
    const toppingCost = selectedToppingIds.reduce((sum, tid) => {
      const t = toppings.find(t => t.topping_id === tid);
      return sum + (t ? parseFloat(t.topping_price) : 0);
    }, 0);
    return parseFloat(drink.base_price) + toppingCost;
  };

  const addToCart = () => {
    const total = getSubtotal(modal, customization.toppings);
    setCart(prev => [...prev, {
      id:              Date.now(),
      drink:           modal,
      qty:             1,
      sweetness_level: customization.sugar,
      ice_level:       customization.ice,
      toppings:        customization.toppings,
      total_price:     total,
    }]);
    setModal(null);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const cartTotal = cart.reduce((sum, i) => sum + i.total_price * i.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0 || placingOrder) {
      return;
    }

    try {
      setPlacingOrder(true);
      setApiError('');

      const payload = {
        user_id: 1,
        items: cart.map(item => ({
          drink_id: item.drink.drink_id,
          qty: item.qty,
          sweetness_level: item.sweetness_level,
          ice_level: item.ice_level,
          drink_unit_price: Number(item.drink.base_price),
          toppings: item.toppings,
          total_price: Number((item.total_price * item.qty).toFixed(2)),
        })),
      };

      const res = await fetch(toApiUrl('/api/customer/order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to place order');
      }

      setCart([]);
      setShowCart(false);
      setOrderPlaced(true);
      setTimeout(() => setOrderPlaced(false), 4000);
    } catch (err) {
      console.error(err);
      setApiError('Could not place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const getSugarLabel = (val) => SUGAR_LEVELS.find(s => s.value === val)?.label || val;
  const getIceLabel   = (val) => ICE_LEVELS.find(i => i.value === val)?.label   || val;

  const currentCategoryName = selectedCategory === null
    ? 'All categories'
    : categories.find(c => c.category_id === selectedCategory)?.category_name || 'Selected category';

  return (
    <div style={s.root}>
      <header style={s.header}>
        <h1 style={s.logo}>🧋 Reveille Boba</h1>
        <div style={s.headerActions}>
          <button
            style={s.cartBtn}
            onClick={() => setShowCart(true)}
            aria-label={`Open cart with ${cart.length} item${cart.length === 1 ? '' : 's'}`}
          >
            🛒 Cart {cart.length > 0 && <span style={s.cartBadge}>{cart.length}</span>}
          </button>
        </div>
      </header>

      <p style={s.visuallyHidden} role="status" aria-live="polite">
        Showing {filteredDrinks.length} drinks in {currentCategoryName}. Cart has {cart.length} item{cart.length === 1 ? '' : 's'}.
      </p>

      {loadingMenu && <p style={s.statusMessage}>Loading menu...</p>}
      {apiError && <p style={s.errorMessage}>{apiError}</p>}

      <nav style={s.categoryBar} aria-label="Drink categories">
        <button
          style={{ ...s.catBtn, ...(selectedCategory === null ? s.catBtnActive : {}) }}
          onClick={() => setSelectedCategory(null)}
          aria-pressed={selectedCategory === null}
          aria-label="Show all categories"
        >All</button>
        {categories.map(cat => (
          <button
            key={cat.category_id}
            style={{ ...s.catBtn, ...(selectedCategory === cat.category_id ? s.catBtnActive : {}) }}
            onClick={() => setSelectedCategory(cat.category_id)}
            aria-pressed={selectedCategory === cat.category_id}
            aria-label={`Show ${cat.category_name} drinks`}
          >
            {categoryEmojis[cat.category_name] || '🍹'} {cat.category_name}
          </button>
        ))}
      </nav>

      <main id="drink-grid" style={s.grid} aria-label={`${currentCategoryName} drink menu`}>
        {filteredDrinks.map(drink => (
          <button
            key={drink.drink_id}
            style={s.drinkCard}
            onClick={() => openModal(drink)}
            aria-label={`${drink.drink_name}, ${drink.category_name}, ${parseFloat(drink.base_price).toFixed(2)} dollars. Open customization.`}
          >
            <div style={s.drinkEmoji}>{categoryEmojis[drink.category_name] || '🍹'}</div>
            <div style={s.drinkName}>{drink.drink_name}</div>
            <div style={s.drinkCategory}>{drink.category_name}</div>
            <div style={s.drinkPrice}>${parseFloat(drink.base_price).toFixed(2)}</div>
          </button>
        ))}
      </main>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div
            style={s.modalBox}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customize-drink-title"
          >
            <div style={{ fontSize: '3rem', textAlign: 'center' }}>{categoryEmojis[modal.category_name] || '🍹'}</div>
            <h2 id="customize-drink-title" style={s.modalTitle}>{modal.drink_name}</h2>
            <p style={s.modalCategory}>{modal.category_name}</p>

            <div style={s.section}>
              <p style={s.sectionLabel}>Sweetness Level</p>
              <div style={s.optionRow} role="group" aria-label="Sweetness level">
                {SUGAR_LEVELS.map(({ label, value }) => (
                  <button key={value}
                    style={{ ...s.optBtn, ...(customization.sugar === value ? s.optBtnActive : {}) }}
                    onClick={() => setCustomization(prev => ({ ...prev, sugar: value }))}
                    aria-pressed={customization.sugar === value}
                    aria-label={`Set sweetness to ${label}`}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div style={s.section}>
              <p style={s.sectionLabel}>Ice Level</p>
              <div style={s.optionRow} role="group" aria-label="Ice level">
                {ICE_LEVELS.map(({ label, value }) => (
                  <button key={value}
                    style={{ ...s.optBtn, ...(customization.ice === value ? s.optBtnActive : {}) }}
                    onClick={() => setCustomization(prev => ({ ...prev, ice: value }))}
                    aria-pressed={customization.ice === value}
                    aria-label={`Set ice level to ${label}`}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div style={s.section}>
              <p style={s.sectionLabel}>Toppings <span style={s.toppingNote}>(prices from DB)</span></p>
              <div style={s.toppingGrid} role="group" aria-label="Toppings">
                {toppings.map(t => (
                  <button key={t.topping_id}
                    style={{ ...s.toppingBtn, ...(customization.toppings.includes(t.topping_id) ? s.toppingBtnActive : {}) }}
                    onClick={() => toggleTopping(t.topping_id)}
                    aria-pressed={customization.toppings.includes(t.topping_id)}
                    aria-label={`Add ${t.topping_name} topping`}
                  >{t.topping_name} (+${parseFloat(t.topping_price).toFixed(2)})</button>
                ))}
              </div>
            </div>

            <div style={s.modalFooter}>
              <span style={s.modalTotal}>${getSubtotal(modal, customization.toppings).toFixed(2)}</span>
              <button style={s.addBtn} onClick={addToCart} aria-label={`Add ${modal.drink_name} to cart`}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div style={s.overlay} onClick={() => setShowCart(false)}>
          <div
            style={s.cartDrawer}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <h2 id="cart-title" style={s.cartTitle}>Your Order</h2>
            {cart.length === 0 ? (
              <p style={s.emptyCart}>Your cart is empty.</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={s.cartItem}>
                    <div style={s.cartItemInfo}>
                      <div style={s.cartItemName}>{item.drink.drink_name}</div>
                      <div style={s.cartItemMeta}>
                        {getSugarLabel(item.sweetness_level)} sweet · {getIceLabel(item.ice_level)}
                        {item.toppings.length > 0 && (
                          <> · {item.toppings.map(tid => toppings.find(t => t.topping_id === tid)?.topping_name).filter(Boolean).join(', ')}</>
                        )}
                      </div>
                    </div>
                    <div style={s.cartItemRight}>
                      <span style={s.cartItemPrice}>${(item.total_price * item.qty).toFixed(2)}</span>
                      <button
                        style={s.removeBtn}
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.drink.drink_name} from cart`}
                      >✕</button>
                    </div>
                  </div>
                ))}
                <div style={s.cartTotalRow}>
                  <span>Total</span>
                  <span style={s.cartTotalAmt}>${cartTotal.toFixed(2)}</span>
                </div>
                <button style={s.placeOrderBtn} onClick={placeOrder} aria-label="Place order" disabled={placingOrder}>
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {orderPlaced && (
        <div style={s.toast} role="status" aria-live="polite">✅ Order placed! Thank you!</div>
      )}
    </div>
  );
}

const BROWN  = '#4a2c0a';
const CREAM  = '#fdf6ec';
const ACCENT = '#c8773a';
const LIGHT  = '#fff8f0';

const s = {
  root:             { minHeight: '100vh', background: CREAM, fontFamily: "'Georgia', serif", color: BROWN },
  header:           { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem', background: BROWN, color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  headerActions:    { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logo:             { fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 },
  visuallyHidden:   { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 },
  statusMessage:    { margin: '1rem 2rem 0', color: BROWN, fontSize: '0.95rem' },
  errorMessage:     { margin: '1rem 2rem 0', color: '#b00020', fontSize: '0.95rem', fontWeight: 'bold' },
  cartBtn:          { background: ACCENT, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.6rem 1.4rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  cartBadge:        { background: '#fff', color: ACCENT, borderRadius: '50%', padding: '0 6px', fontSize: '0.8rem', fontWeight: 'bold' },
  categoryBar:      { display: 'flex', flexWrap: 'nowrap', gap: '0.75rem', padding: '1rem 2rem', overflowX: 'auto', background: LIGHT, borderBottom: '2px solid #e8d5b7' },
  catBtn:           { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.6rem 1.2rem', fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  catBtnActive:     { background: BROWN, color: '#fff', border: `2px solid ${BROWN}` },
  grid:             { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.2rem', padding: '2rem' },
  drinkCard:        { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '16px', padding: '1.5rem 1rem', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(74,44,10,0.08)' },
  drinkEmoji:       { fontSize: '2.5rem' },
  drinkName:        { fontSize: '0.95rem', fontWeight: 'bold', color: BROWN, lineHeight: 1.3 },
  drinkCategory:    { fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' },
  drinkPrice:       { fontSize: '1.1rem', color: ACCENT, fontWeight: 'bold', marginTop: '0.25rem' },
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalBox:         { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle:       { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: '0.5rem 0 0.25rem' },
  modalCategory:    { fontSize: '0.85rem', color: '#999', textAlign: 'center', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  section:          { marginBottom: '1.25rem' },
  sectionLabel:     { fontWeight: 'bold', color: BROWN, marginBottom: '0.5rem', fontSize: '0.95rem' },
  toppingNote:      { color: '#aaa', fontWeight: 'normal', fontSize: '0.8rem' },
  optionRow:        { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  optBtn:           { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  optBtnActive:     { background: BROWN, color: '#fff', border: `2px solid ${BROWN}` },
  toppingGrid:      { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  toppingBtn:       { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  toppingBtnActive: { background: ACCENT, color: '#fff', border: `2px solid ${ACCENT}` },
  modalFooter:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e8d5b7' },
  modalTotal:       { fontSize: '1.4rem', fontWeight: 'bold', color: ACCENT },
  addBtn:           { background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.7rem 1.8rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  cartDrawer:       { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' },
  cartTitle:        { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, marginBottom: '1.5rem' },
  emptyCart:        { color: '#999', textAlign: 'center', padding: '2rem 0' },
  cartItem:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f0e0cc' },
  cartItemInfo:     { flex: 1 },
  cartItemName:     { fontWeight: 'bold', color: BROWN, fontSize: '0.95rem' },
  cartItemMeta:     { fontSize: '0.78rem', color: '#999', marginTop: '0.25rem' },
  cartItemRight:    { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' },
  cartItemPrice:    { fontWeight: 'bold', color: ACCENT },
  removeBtn:        { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' },
  cartTotalRow:     { display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: BROWN },
  cartTotalAmt:     { color: ACCENT, fontSize: '1.2rem' },
  placeOrderBtn:    { width: '100%', background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '1rem', fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginTop: '0.5rem' },
  toast:            { position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#2d6a4f', color: '#fff', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1rem', fontWeight: 'bold', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
};
