/**
 * MenuBoard.jsx — full-viewport wall / kiosk menu: static categories and sample prices,
 * toppings blurb. Styled with inline objects (`s`); no API calls.
 */

// Brand palette (warm browns + cream) for header, cards, and footer.
const BROWN = '#4a2c0a';
const CREAM = '#fdf6ec';
const ACCENT = '#c8773a';
const LIGHT = '#fff8f0';

/**
 * Category grid source: names align with the customer-facing menu; `items` are display
 * strings (name — price). Edit here to change what the board shows; live POS may differ.
 */
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

// Single line shown next to “Add-ons” in the footer.
const TOPPINGS_LINE =
  'Boba, grass jelly, egg pudding, aloe, lychee jelly, red bean, crystal boba, cheese foam — ask for prices at the counter.';

/** Inline styles: one object keeps the board self-contained without a separate CSS file. */
const s = {
  // --- Page shell (100dvh, no document scroll) ---
  root: {
    height: '100dvh',
    maxHeight: '100dvh',
    background: CREAM,
    fontFamily: "'Georgia', serif",
    color: BROWN,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  // --- Top bar: shop name and tagline ---
  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    padding: '0.35rem 0.65rem',
    background: BROWN,
    color: '#fff',
  },
  headerLeft: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.05rem',
  },
  logo: {
    margin: 0,
    fontSize: 'clamp(0.85rem, 2.2vw, 1.1rem)',
    fontWeight: 'bold',
    letterSpacing: '0.04em',
    lineHeight: 1.15,
  },
  tagline: {
    margin: 0,
    fontSize: 'clamp(0.58rem, 1.35vw, 0.72rem)',
    color: '#e8d5c4',
    fontStyle: 'italic',
    lineHeight: 1.2,
  },
  // --- Main grid area: two rows (4 cols, then 3); flex rows share vertical space ---
  board: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    padding: '0.25rem 0.35rem',
    overflow: 'hidden',
  },
  // CSS grid row; `row4` / `row3` spread in sets the column count.
  row: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gap: '0.2rem',
    overflow: 'hidden',
  },
  // First band: Milk Tea, Fruit Tea, Fresh Milk, Brewed Tea.
  row4: {
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  },
  // Second band: Ice Blended, Mojito, Seasonal.
  row3: {
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  },
  // One category card: title + flex column list; `minWidth: 0` avoids grid overflow.
  column: {
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid #e8d5b7`,
    borderRadius: '6px',
    background: LIGHT,
    padding: '0.2rem 0.3rem',
    overflow: 'hidden',
  },
  colTitle: {
    margin: '0 0 0.15rem',
    fontSize: 'clamp(0.58rem, 1.25vw, 0.72rem)',
    fontWeight: 'bold',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: BROWN,
    borderBottom: `1px solid #e8d5b7`,
    paddingBottom: '0.1rem',
    lineHeight: 1.15,
    flexShrink: 0,
  },
  // Item list: `flex: 1` fills card under the title; `gap` spaces each `<li>`.
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 'clamp(0.2rem, 0.7vw, 0.55rem)',
  },
  line: {
    fontSize: 'clamp(0.52rem, 1.05vw, 0.68rem)',
    lineHeight: 1.35,
    padding: 'clamp(0.1rem, 0.45vw, 0.32rem) 0',
    borderBottom: '1px solid #f0e0cc',
    wordBreak: 'break-word',
    hyphens: 'auto',
  },
  // --- Bottom strip: toppings copy + ordering hints ---
  footer: {
    flexShrink: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
    gap: '0.35rem',
    alignItems: 'start',
    padding: '0.25rem 0.4rem',
    borderTop: `2px solid ${ACCENT}`,
    background: '#fff',
    fontSize: 'clamp(0.55rem, 1.1vw, 0.7rem)',
    lineHeight: 1.25,
  },
  toppingsLabel: {
    fontWeight: 'bold',
    color: BROWN,
    marginRight: '0.25rem',
  },
  footnote: {
    margin: 0,
    color: '#6b4b2c',
    fontStyle: 'italic',
  },
  priceHint: { color: ACCENT, fontWeight: 'bold' },
};

/**
 * Renders one MENU_SECTIONS entry: accessible heading + list of price lines.
 * @param {{ section: { name: string; emoji: string; items: string[] } }} props
 */
function Column({ section }) {
  return (
    <section style={s.column} aria-labelledby={`menu-${section.name}`}>
      <h2 id={`menu-${section.name}`} style={s.colTitle}>
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
  );
}

export default function MenuBoard() {
  // Split sections to match the 4+3 column layout (see `row4` / `row3`).
  const rowA = MENU_SECTIONS.slice(0, 4);
  const rowB = MENU_SECTIONS.slice(4);

  return (
    <div style={s.root}>
      {/* Brand + Portal */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <h1 style={s.logo}>Reveille Boba</h1>
          <p style={s.tagline}>
            Menu board — kiosk or cashier. Sample prices; register has today&apos;s totals.
          </p>
        </div>
      </header>

      {/* Category grids */}
      <div style={s.board}>
        <div style={{ ...s.row, ...s.row4 }}>
          {rowA.map((section) => (
            <Column key={section.name} section={section} />
          ))}
        </div>
        <div style={{ ...s.row, ...s.row3 }}>
          {rowB.map((section) => (
            <Column key={section.name} section={section} />
          ))}
        </div>
      </div>

      {/* Add-ons line + sweetness / ice reminder */}
      <footer style={s.footer}>
        <div>
          <span style={s.toppingsLabel}>Add-ons</span>
          {TOPPINGS_LINE}
        </div>
        <p style={s.footnote}>
          Sweetness <span style={s.priceHint}>0% / 50% / 100%</span> and ice{' '}
          <span style={s.priceHint}>no / less / regular</span> when ordering.
        </p>
      </footer>
    </div>
  );
}
