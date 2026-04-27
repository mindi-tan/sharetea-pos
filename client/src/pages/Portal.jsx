// Import Link so this component can navigate to other routes in the app
import { Link } from 'react-router-dom';

// Object containing inline styles for the page
const styles = {
  // Styles for the main page container
  body: {
    fontFamily: 'sans-serif',      // Use a simple sans-serif font
    display: 'flex',               // Use flexbox layout
    flexDirection: 'column',       // Stack children vertically
    alignItems: 'center',          // Center children horizontally
    justifyContent: 'center',      // Center children vertically
    minHeight: '100vh',            // Make container fill full viewport height
    margin: 0,                     // Remove default margin
  },

  // Styles for the page heading
  h1: {
    marginBottom: 'clamp(1.25rem, 4vmin, 2rem)',
    fontSize: 'clamp(1.75rem, 5vmin + 1vw, 2.5rem)',
  },

  // Styles for the container holding the navigation buttons
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(0.75rem, 2vmin, 1.25rem)',
    width: 'min(22rem, 90vw)',
  },

  // Styles applied to each Link so it looks like a button
  link: {
    padding: 'clamp(0.85rem, 2.2vmin, 1.15rem) clamp(1.5rem, 4vw, 2.5rem)',
    fontSize: 'clamp(1.05rem, 2.5vmin + 0.5vw, 1.35rem)',
    textAlign: 'center',
    textDecoration: 'none',
    color: 'white',
    background: '#333',
    borderRadius: '10px',
    minHeight: 'clamp(2.75rem, 8vmin, 3.4rem)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
  },
};

// Main portal component
export default function Portal() {
  return (
    // Main container for the page
    <div style={styles.body}>
      {/* Page title */}
      <h1 style={styles.h1}>Portal</h1>

      {/* Container for navigation links */}
      <div style={styles.buttons}>
        {/* Link to manager page */}
        <Link to="/manager" style={styles.link}>Manager</Link>

        {/* Link to cashier page */}
        <Link to="/cashier" style={styles.link}>Cashier</Link>

        {/* Link to customer page */}
        <Link to="/customer" style={styles.link}>Customer</Link>

        {/* Link to menu board page */}
        <Link to="/menu-board" style={styles.link}>Menu Board</Link>

        {/* Link to kitchen page */}
        <Link to="/kitchen" style={styles.link}>Kitchen</Link>
      </div>
    </div>
  );
}