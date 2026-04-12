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
    marginBottom: '2rem',          // Add space below the title
  },

  // Styles for the container holding the navigation buttons
  buttons: {
    display: 'flex',               // Use flexbox layout
    flexDirection: 'column',       // Stack links vertically
    gap: '1rem',                   // Add space between links
  },

  // Styles applied to each Link so it looks like a button
  link: {
    padding: '0.75rem 2rem',       // Add inner spacing
    fontSize: '1.1rem',            // Make text slightly larger
    textAlign: 'center',           // Center the link text
    textDecoration: 'none',        // Remove underline
    color: 'white',                // Set text color
    background: '#333',            // Dark background color
    borderRadius: '6px',           // Rounded corners
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