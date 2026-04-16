import { useState } from 'react';
import { Link } from 'react-router-dom';

const BROWN = '#4a2c0a';
const CREAM = '#fdf6ec';
const ACCENT = '#c8773a';
const LIGHT = '#fff8f0';

/** Same categories / emojis as the customer ordering view; sample items for the wall menu. */
const MENU_SECTIONS = [
  {
    name: 'Milk Tea',
    emoji: '🧋',
    items: [
      'Classic Milk Tea — $4.75',
      'Brown Sugar Milk Tea — $5.50',
      'Taro Milk Tea — $5.25',
      'Thai Milk Tea — $5.00',
      'Honey Milk Tea — $4.95',
    ],
  },
  {
    name: 'Fruit Tea',
    emoji: '🍓',
    items: [
      'Strawberry Fruit Tea — $5.25',
      'Passion Fruit Green Tea — $5.00',
      'Mango Jasmine Tea — $5.25',
      'Peach Oolong — $4.95',
      'Lychee Black Tea — $5.10',
    ],
  },
  {
    name: 'Fresh Milk',
    emoji: '🥛',
    items: [
      'Brown Sugar Fresh Milk — $5.75',
      'Fresh Milk with Pudding — $5.50',
      'Caramel Fresh Milk — $5.25',
    ],
  },
  {
    name: 'Brewed Tea',
    emoji: '🍵',
    items: [
      'Jasmine Green Tea — $3.75',
      'Assam Black Tea — $3.75',
      'Oolong Tea — $3.95',
      'Wintermelon Tea — $4.25',
    ],
  },
  {
    name: 'Ice Blended',
    emoji: '🧊',
    items: [
      'Mango Smoothie — $6.00',
      'Taro Slush — $5.75',
      'Matcha Frappe — $6.25',
      'Coffee Jelly Frappe — $5.95',
    ],
  },
  {
    name: 'Mojito',
    emoji: '🌿',
    items: [
      'Lime Mojito (no alcohol) — $5.50',
      'Strawberry Mojito — $5.65',
      'Passion Mojito — $5.65',
    ],
  },
  {
    name: 'Seasonal',
    emoji: '🌸',
    items: [
      'Sakura Rose Milk Tea — $5.95',
      'Ube Coconut Latte — $6.10',
    ],
  },
];

const TOPPINGS_LINE =
  'Boba, grass jelly, egg pudding, aloe, lychee jelly, red bean, crystal boba, cheese foam — ask for prices at the counter.';

const s = {
  root: { minHeight: '100vh', background: CREAM, fontFamily: "'Georgia', serif", color: BROWN },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.2rem 2rem',
    background: BROWN,
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  logo: { fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 },
  backBtn: {
    background: '#fff',
    color: BROWN,
    borderRadius: '50%',
    width: '2.2rem',
    height: '2.2rem',
    textDecoration: 'none',
    fontSize: '1.35rem',
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
  },
  backBtnHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
    background: '#f8efe4',
  },
  main: {
    padding: '2rem',
    maxWidth: '42rem',
    margin: '0 auto',
    textAlign: 'left',
  },
  intro: {
    fontSize: '0.95rem',
    color: '#6b4b2c',
    fontStyle: 'italic',
    marginBottom: '1.75rem',
    lineHeight: 1.5,
  },
  section: { marginBottom: '1.75rem' },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 'bold',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: '0 0 0.65rem',
    paddingBottom: '0.35rem',
    borderBottom: `2px solid #e8d5b7`,
    color: BROWN,
  },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  line: {
    padding: '0.35rem 0',
    borderBottom: '1px solid #f0e0cc',
    fontSize: '1rem',
    lineHeight: 1.45,
  },
  toppingsBlock: {
    marginTop: '2rem',
    padding: '1.25rem',
    background: LIGHT,
    border: '2px solid #e8d5b7',
    borderRadius: '12px',
  },
  toppingsTitle: {
    fontSize: '0.95rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 0.5rem',
    color: BROWN,
  },
  toppingsText: { margin: 0, fontSize: '0.95rem', lineHeight: 1.55, color: '#4a3828' },
  footnote: {
    marginTop: '1.75rem',
    fontSize: '0.88rem',
    color: '#8a735c',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  priceHint: { color: ACCENT, fontWeight: 'bold' },
};

export default function MenuBoard() {
  const [backHover, setBackHover] = useState(false);

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <Link
            to="/"
            style={{ ...s.backBtn, ...(backHover ? s.backBtnHover : {}) }}
            aria-label="Back to portal"
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
          >
            ⬅
          </Link>
          <h1 style={s.logo}>🧋 Reveille Boba</h1>
        </div>
      </header>

      <main style={s.main}>
        <p style={s.intro}>
          Menu board — order at the kiosk or with a cashier. Prices are samples; see the register for today&apos;s
          totals.
        </p>

        {MENU_SECTIONS.map((section) => (
          <section key={section.name} style={s.section} aria-labelledby={`menu-${section.name}`}>
            <h2 id={`menu-${section.name}`} style={s.sectionTitle}>
              {section.emoji} {section.name}
            </h2>
            <ul style={s.list}>
              {section.items.map((text) => (
                <li key={text} style={s.line}>
                  {text}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <aside style={s.toppingsBlock} aria-label="Toppings">
          <h3 style={s.toppingsTitle}>Add-ons & toppings</h3>
          <p style={s.toppingsText}>{TOPPINGS_LINE}</p>
        </aside>

        <p style={s.footnote}>
          Sweetness <span style={s.priceHint}>(0% · 50% · 100%)</span> and ice{' '}
          <span style={s.priceHint}>(no · less · regular)</span> are customizable when you order, same as on the
          customer screen.
        </p>
      </main>
    </div>
  );
}
