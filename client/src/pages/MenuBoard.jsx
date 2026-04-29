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
  // --- Top bar: centered shop name ---
  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(0.35rem, 1vmin, 0.65rem) clamp(0.5rem, 1.2vmin, 0.85rem)',
    background: BROWN,
    color: '#fff',
  },
  logo: {
    margin: 0,
    fontSize: 'clamp(1.1rem, 2.8vmin + 1.8vw, 2rem)',
    fontWeight: 'bold',
    letterSpacing: '0.04em',
    lineHeight: 1.12,
    textAlign: 'center',
  },
  // --- Main grid area: two rows (4 cols, then 3); flex rows share vertical space ---
  board: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(0.2rem, 0.6vmin, 0.45rem)',
    padding: 'clamp(0.2rem, 0.8vmin, 0.5rem) clamp(0.3rem, 1vmin, 0.65rem)',
    overflow: 'hidden',
  },
  // Top band usually has more lines so it gets slightly more vertical flex than the second row.
  rowUpper: {
    flex: 1.06,
    minHeight: 0,
    display: 'grid',
    gap: 'clamp(0.2rem, 0.6vmin, 0.45rem)',
    overflow: 'hidden',
  },
  rowLower: {
    flex: 0.94,
    minHeight: 0,
    display: 'grid',
    gap: 'clamp(0.2rem, 0.6vmin, 0.45rem)',
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
    borderRadius: '8px',
    background: LIGHT,
    padding: 'clamp(0.25rem, 0.9vmin, 0.5rem) clamp(0.3rem, 1vmin, 0.55rem)',
    overflow: 'hidden',
  },
  colTitle: {
    margin: '0 0 clamp(0.1rem, 0.4vmin, 0.2rem)',
    fontSize: 'clamp(0.72rem, 1.5vmin + 0.85vw, 1.2rem)',
    fontWeight: 'bold',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: BROWN,
    borderBottom: `1px solid #e8d5b7`,
    paddingBottom: 'clamp(0.08rem, 0.35vmin, 0.18rem)',
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
    gap: 'clamp(0.08rem, 0.45vmin, 0.28rem)',
  },
  line: {
    fontSize: 'clamp(0.7rem, 1.35vmin + 0.55vw, 1.08rem)',
    lineHeight: 1.28,
    padding: 'clamp(0.05rem, 0.35vmin, 0.18rem) 0',
    borderBottom: '1px solid #f0e0cc',
    wordBreak: 'break-word',
    hyphens: 'auto',
  },
  // --- Bottom strip: toppings copy + ordering hints ---
  footer: {
    flexShrink: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
    gap: 'clamp(0.25rem, 0.8vmin, 0.45rem)',
    alignItems: 'start',
    padding: 'clamp(0.3rem, 0.9vmin, 0.55rem) clamp(0.35rem, 1vmin, 0.65rem)',
    borderTop: `2px solid ${ACCENT}`,
    background: '#fff',
    fontSize: 'clamp(0.68rem, 1.2vmin + 0.45vw, 0.95rem)',
    lineHeight: 1.3,
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
      {/* Centered brand */}
      <header style={s.header}>
        <h1 style={s.logo}>Reveille Boba</h1>
      </header>

      {/* Category grids */}
      <div style={s.board}>
        <div style={{ ...s.rowUpper, ...s.row4 }}>
          {rowA.map((section) => (
            <Column key={section.name} section={section} />
          ))}
        </div>
        <div style={{ ...s.rowLower, ...s.row3 }}>
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
