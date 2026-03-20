import { Link } from 'react-router-dom';

const styles = {
  body: {
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    margin: 0,
  },
  h1: {
    marginBottom: '2rem',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  link: {
    padding: '0.75rem 2rem',
    fontSize: '1.1rem',
    textAlign: 'center',
    textDecoration: 'none',
    color: 'white',
    background: '#333',
    borderRadius: '6px',
  },
};

export default function Portal() {
  return (
    <div style={styles.body}>
      <h1 style={styles.h1}>Portal</h1>
      <div style={styles.buttons}>
        <Link to="/manager" style={styles.link}>Manager</Link>
        <Link to="/cashier" style={styles.link}>Cashier</Link>
        <Link to="/customer" style={styles.link}>Customer</Link>
        <Link to="/menu-board" style={styles.link}>Menu Board</Link>
        <Link to="/kitchen" style={styles.link}>Kitchen</Link>
      </div>
    </div>
  );
}
