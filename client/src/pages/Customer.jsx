import { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api/customer';

// Must match DB check constraints exactly
const SUGAR_LEVELS = [
  { label: '0%',   value: '0'   },
  { label: '50%',  value: '50'  },
  { label: '100%', value: '100' },
];

const ICE_LEVELS = [
  { label: 'No Ice',     value: 'NO_ICE'    },
  { label: 'Less Ice',   value: 'LESS_ICE'  },
  { label: 'Regular',    value: 'NORMAL_ICE' },
];

const categoryEmojis = {
  'Milk Tea':   '🧋',
  'Fruit Tea':  '🍓',
  'Fresh Milk': '🥛',
  'Brewed Tea': '🍵',
  'Ice Blended':'🧊',
  'Mojito':     '🌿',
  'Seasonal':   '🌸',
};

export default function Customer() {
  const [categories, setCategories]         = useState([]);
  const [drinks, setDrinks]                 = useState([]);
  const [toppings, setToppings]             = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart]                     = useState([]);
  const [modal, setModal]                   = useState(null);
  const [customization, setCustomization]   = useState({ sugar: '100', ice: 'NORMAL_ICE', toppings: [] });
  const [showCart, setShowCart]             = useState(false);
  const [orderPlaced, setOrderPlaced]       = useState(false);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/categories`).then(r => r.json()),
      fetch(`${API}/drinks`).then(r => r.json()),
      fetch(`${API}/toppings`).then(r => r.json()),
    ]).then(([cats, drnks, tops]) => {
      setCategories(cats);
      setDrinks(drnks);
      setToppings(tops);
      setLoading(false);
    });
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
    const unitPrice = parseFloat(modal.base_price);
    const total     = getSubtotal(modal, customization.toppings);
    setCart(prev => [...prev, {
      id:               Date.now(),
      drink:            modal,
      qty:              1,
      sweetness_level:  customization.sugar,
      ice_level:        customization.ice,
      toppings:         customization.toppings,
      drink_unit_price: unitPrice,
      total_price:      total,
    }]);
    setModal(null);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const cartTotal = cart.reduce((sum, i) => sum + i.total_price * i.qty, 0);

  const placeOrder = async () => {
    try {
      const items = cart.map(i => ({
        drink_id:         i.drink.drink_id,
        qty:              i.qty,
        sweetness_level:  i.sweetness_level,
        ice_level:        i.ice_level,
        toppings:         i.toppings,
        drink_unit_price: i.drink_unit_price,
        total_price:      i.total_price * i.qty,
      }));
      const res = await fetch(`${API}/order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ items }),
      });
      if (res.ok) {
        setCart([]);
        setShowCart(false);
        setOrderPlaced(true);
        setTimeout(() => setOrderPlaced(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSugarLabel  = (val) => SUGAR_LEVELS.find(s => s.value === val)?.label  || val;
  const getIceLabel    = (val) => ICE_LEVELS.find(i => i.value === val)?.label    || val;

  if (loading) return (
    <div style={s.loadingScreen}>
      <div style={{ fontSize: '4rem' }}>🧋</div>
      <p style={s.loadingText}>Loading menu...</p>
    </div>
  );

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>🧋 Reveille Boba</div>
        <button style={s.cartBtn} onClick={() => setShowCart(true)}>
          🛒 Cart {cart.length > 0 && <span style={s.cartBadge}>{cart.length}</span>}
        </button>
      </header>

      {/* Category Filter */}
      <div style={s.categoryBar}>
        <button
          style={{ ...s.catBtn, ...(selectedCategory === null ? s.catBtnActive : {}) }}
          onClick={() => setSelectedCategory(null)}
        >All</button>
        {categories.map(cat => (
          <button
            key={cat.category_id}
            style={{ ...s.catBtn, ...(selectedCategory === cat.category_id ? s.catBtnActive : {}) }}
            onClick={() => setSelectedCategory(cat.category_id)}
          >
            {categoryEmojis[cat.category_name] || '🍹'} {cat.category_name}
          </button>
        ))}
      </div>

      {/* Drink Grid */}
      <main style={s.grid}>
        {filteredDrinks.map(drink => (
          <button key={drink.drink_id} style={s.drinkCard} onClick={() => openModal(drink)}>
            <div style={s.drinkEmoji}>{categoryEmojis[drink.category_name] || '🍹'}</div>
            <div style={s.drinkName}>{drink.drink_name}</div>
            <div style={s.drinkCategory}>{drink.category_name}</div>
            <div style={s.drinkPrice}>${parseFloat(drink.base_price).toFixed(2)}</div>
          </button>
        ))}
      </main>

      {/* Customization Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', textAlign: 'center' }}>
              {categoryEmojis[modal.category_name] || '🍹'}
            </div>
            <h2 style={s.modalTitle}>{modal.drink_name}</h2>
            <p style={s.modalCategory}>{modal.category_name}</p>

            <div style={s.section}>
              <p style={s.sectionLabel}>Sweetness Level</p>
              <div style={s.optionRow}>
                {SUGAR_LEVELS.map(({ label, value }) => (
                  <button
                    key={value}
                    style={{ ...s.optBtn, ...(customization.sugar === value ? s.optBtnActive : {}) }}
                    onClick={() => setCustomization(prev => ({ ...prev, sugar: value }))}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div style={s.section}>
              <p style={s.sectionLabel}>Ice Level</p>
              <div style={s.optionRow}>
                {ICE_LEVELS.map(({ label, value }) => (
                  <button
                    key={value}
                    style={{ ...s.optBtn, ...(customization.ice === value ? s.optBtnActive : {}) }}
                    onClick={() => setCustomization(prev => ({ ...prev, ice: value }))}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div style={s.section}>
              <p style={s.sectionLabel}>
                Toppings <span style={s.toppingNote}>(+$0.75 each)</span>
              </p>
              <div style={s.toppingGrid}>
                {toppings.map(t => (
                  <button
                    key={t.topping_id}
                    style={{ ...s.toppingBtn, ...(customization.toppings.includes(t.topping_id) ? s.toppingBtnActive : {}) }}
                    onClick={() => toggleTopping(t.topping_id)}
                  >{t.topping_name}</button>
                ))}
              </div>
            </div>

            <div style={s.modalFooter}>
              <span style={s.modalTotal}>
                ${getSubtotal(modal, customization.toppings).toFixed(2)}
              </span>
              <button style={s.addBtn} onClick={addToCart}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div style={s.overlay} onClick={() => setShowCart(false)}>
          <div style={s.cartDrawer} onClick={e => e.stopPropagation()}>
            <h2 style={s.cartTitle}>Your Order</h2>
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
                          <> · {item.toppings.map(tid =>
                            toppings.find(t => t.topping_id === tid)?.topping_name
                          ).join(', ')}</>
                        )}
                      </div>
                    </div>
                    <div style={s.cartItemRight}>
                      <span style={s.cartItemPrice}>${(item.total_price * item.qty).toFixed(2)}</span>
                      <button style={s.removeBtn} onClick={() => removeFromCart(item.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={s.cartTotalRow}>
                  <span>Total</span>
                  <span style={s.cartTotalAmt}>${cartTotal.toFixed(2)}</span>
                </div>
                <button style={s.placeOrderBtn} onClick={placeOrder}>Place Order</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Toast */}
      {orderPlaced && (
        <div style={s.toast}>✅ Order placed! Thank you!</div>
      )}
    </div>
  );
}

const BROWN  = '#4a2c0a';
const CREAM  = '#fdf6ec';
const ACCENT = '#c8773a';
const LIGHT  = '#fff8f0';

const s = {
  root:         { minHeight: '100vh', background: CREAM, fontFamily: "'Georgia', serif", color: BROWN },
  loadingScreen:{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: CREAM },
  loadingText:  { fontSize: '1.2rem', color: ACCENT, marginTop: '1rem' },

  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem', background: BROWN, color: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  logo:      { fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '0.05em' },
  cartBtn:   { background: ACCENT, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.6rem 1.4rem', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  cartBadge: { background: '#fff', color: ACCENT, borderRadius: '50%', padding: '0 6px', fontSize: '0.8rem', fontWeight: 'bold' },

  categoryBar: { display: 'flex', flexWrap: 'nowrap', gap: '0.75rem', padding: '1rem 2rem', overflowX: 'auto', background: LIGHT, borderBottom: '2px solid #e8d5b7' },
  catBtn:        { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.6rem 1.2rem', fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  catBtnActive:  { background: BROWN, color: '#fff', border: `2px solid ${BROWN}` },

  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.2rem', padding: '2rem' },
  drinkCard:     { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '16px', padding: '1.5rem 1rem', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(74,44,10,0.08)' },
  drinkEmoji:    { fontSize: '2.5rem' },
  drinkName:     { fontSize: '0.95rem', fontWeight: 'bold', color: BROWN, lineHeight: 1.3 },
  drinkCategory: { fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' },
  drinkPrice:    { fontSize: '1.1rem', color: ACCENT, fontWeight: 'bold', marginTop: '0.25rem' },

  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalBox:      { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle:    { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: '0.5rem 0 0.25rem' },
  modalCategory: { fontSize: '0.85rem', color: '#999', textAlign: 'center', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' },

  section:       { marginBottom: '1.25rem' },
  sectionLabel:  { fontWeight: 'bold', color: BROWN, marginBottom: '0.5rem', fontSize: '0.95rem' },
  toppingNote:   { color: '#aaa', fontWeight: 'normal', fontSize: '0.8rem' },
  optionRow:     { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  optBtn:        { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  optBtnActive:  { background: BROWN, color: '#fff', border: `2px solid ${BROWN}` },
  toppingGrid:   { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  toppingBtn:    { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  toppingBtnActive: { background: ACCENT, color: '#fff', border: `2px solid ${ACCENT}` },

  modalFooter:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e8d5b7' },
  modalTotal:    { fontSize: '1.4rem', fontWeight: 'bold', color: ACCENT },
  addBtn:        { background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.7rem 1.8rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },

  cartDrawer:    { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' },
  cartTitle:     { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, marginBottom: '1.5rem' },
  emptyCart:     { color: '#999', textAlign: 'center', padding: '2rem 0' },
  cartItem:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f0e0cc' },
  cartItemInfo:  { flex: 1 },
  cartItemName:  { fontWeight: 'bold', color: BROWN, fontSize: '0.95rem' },
  cartItemMeta:  { fontSize: '0.78rem', color: '#999', marginTop: '0.25rem' },
  cartItemRight: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' },
  cartItemPrice: { fontWeight: 'bold', color: ACCENT },
  removeBtn:     { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' },
  cartTotalRow:  { display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: BROWN },
  cartTotalAmt:  { color: ACCENT, fontSize: '1.2rem' },
  placeOrderBtn: { width: '100%', background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '1rem', fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginTop: '0.5rem' },

  toast: { position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#2d6a4f', color: '#fff', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1rem', fontWeight: 'bold', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
};
