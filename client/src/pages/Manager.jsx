import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const toApiUrl = (path) => `${API_BASE}${path}`;
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// These values must match the user_account.role CHECK constraint in PostgreSQL.
const EMPLOYEE_ROLE_OPTIONS = [
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'MANAGER', label: 'Manager' },
];

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value ?? '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(ts);
  }
}

export default function Manager() {
  const googleBtnRef = useRef(null);

  // Google manager sign-in state.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [managerUser, setManagerUser] = useState(null);

  // Dashboard/order state.
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Manager reports/charts state.
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [reportStart, setReportStart] = useState(today);
  const [reportEnd, setReportEnd] = useState(tomorrow);
  const [salesByItem, setSalesByItem] = useState([]);
  const [productUsage, setProductUsage] = useState([]);
  const [xReport, setXReport] = useState([]);
  const [restockReport, setRestockReport] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Drink recipe editing state.
  // A recipe connects one drink to inventory items through drink_recipe.
  const [selectedRecipeDrinkId, setSelectedRecipeDrinkId] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [newRecipeItem, setNewRecipeItem] = useState({
    inv_item_id: '',
    qty_needed: '',
  });
  const [recipeUpdating, setRecipeUpdating] = useState(false);

  // state for collapsable menus
  const [openSections, setOpenSections] = useState({
    employees: false,
    menu: false,
    inventory: true,
    restockHistory: false,
    reports: true,
    orders: false,
  });

  // Inventory management state.
  // This uses the inventory_item table.
  const [inventory, setInventory] = useState([]);
  const [newInventoryItem, setNewInventoryItem] = useState({
    inv_item_name: '',
    inv_item_type: 'INGREDIENT',
    unit: '',
    current_qty: '',
  });
  const [inventoryAdding, setInventoryAdding] = useState(false);
  const [inventoryUpdatingId, setInventoryUpdatingId] = useState(null);

  // Supply/restock history state.
  // This reads from the supply_order table.
  const [supplyOrders, setSupplyOrders] = useState([]);

  // Employee management state.
  // In the database, employees are stored in the user_account table.
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    password: '',
    role: 'CASHIER',
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [employeeDraft, setEmployeeDraft] = useState({
    username: '',
    password: '',
    role: 'CASHIER',
  });
  const [employeeSavingId, setEmployeeSavingId] = useState(null);

  const [drinks, setDrinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newDrink, setNewDrink] = useState({
    drink_name: '',
    category_id: '',
    base_price: '',
  });
  const [menuUpdating, setMenuUpdating] = useState(false);

  const handleGoogleCredential = useCallback(async (googleResponse) => {
    const idToken = googleResponse?.credential;
    if (!idToken) {
      setAuthError('Google sign-in did not return a token. Please try again.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch(toApiUrl('/api/manager/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Google sign-in failed');
      }

      setManagerUser(data.user || null);
      setIsAuthenticated(true);
    } catch (err) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setAuthError('Missing VITE_GOOGLE_CLIENT_ID in client environment settings.');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      setGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.id) {
        setAuthError('Google OAuth script loaded but sign-in is unavailable.');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      setGoogleReady(true);
    };

    script.onerror = () => {
      setAuthError('Failed to load Google OAuth script. Check your connection and try again.');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [handleGoogleCredential]);

  useEffect(() => {
    if (!googleReady || isAuthenticated || !googleBtnRef.current || !window.google?.accounts?.id) {
      return;
    }

    googleBtnRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 320,
    });
  }, [googleReady, isAuthenticated]);

  const loadData = useCallback(async () => {
    setError('');

    try {
      const [sumRes, ordRes, empRes, drinksRes, categoriesRes, inventoryRes, supplyOrdersRes] = await Promise.all([
        fetch(toApiUrl('/api/manager/summary')),
        fetch(toApiUrl('/api/manager/orders')),
        fetch(toApiUrl('/api/manager/employees')),
        fetch(toApiUrl('/api/manager/drinks')),
        fetch(toApiUrl('/api/customer/categories')),
        fetch(toApiUrl('/api/manager/inventory')),
        fetch(toApiUrl('/api/manager/supply-orders')),
      ]);

      if (!sumRes.ok) throw new Error('Could not load summary');
      if (!ordRes.ok) throw new Error('Could not load orders');
      if (!empRes.ok) throw new Error('Could not load employees');
      if (!drinksRes.ok) throw new Error('Could not load drinks');
      if (!categoriesRes.ok) throw new Error('Could not load categories');
      if (!inventoryRes.ok) throw new Error('Could not load inventory');
      if (!supplyOrdersRes.ok) throw new Error('Could not load supply orders');

      const [sumData, ordData, empData, drinksData, categoriesData, inventoryData, supplyOrdersData] = await Promise.all([
        sumRes.json(),
        ordRes.json(),
        empRes.json(),
        drinksRes.json(),
        categoriesRes.json(),
        inventoryRes.json(),
        supplyOrdersRes.json(),
      ]);

      setSummary(sumData);
      setOrders(Array.isArray(ordData) ? ordData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
      setDrinks(Array.isArray(drinksData) ? drinksData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setSupplyOrders(Array.isArray(supplyOrdersData) ? supplyOrdersData : []);
    } catch (e) {
      setError(e.message || 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    loadData();
  }, [isAuthenticated, loadData]);

  async function handleStatusChange(orderId, order_status) {
    setUpdatingId(orderId);
    setError('');

    try {
      const res = await fetch(toApiUrl(`/api/manager/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Update failed');
      }

      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  // Create a new employee row in user_account.
  async function handleAddEmployee(event) {
    event.preventDefault();
    setError('');

    try {
      const res = await fetch(toApiUrl('/api/manager/employees'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add employee');
      }

      setNewEmployee({ username: '', password: '', role: 'CASHIER' });
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to add employee');
    }
  }

  function startEditingEmployee(employee) {
    setEditingEmployeeId(employee.user_id);
    setEmployeeDraft({
      username: employee.username || '',
      password: '',
      role: employee.role || 'CASHIER',
    });
  }

  function cancelEditingEmployee() {
    setEditingEmployeeId(null);
    setEmployeeDraft({ username: '', password: '', role: 'CASHIER' });
  }

  // Update username, role, and optionally password for an existing user_account row.
  async function handleUpdateEmployee(userId) {
    setEmployeeSavingId(userId);
    setError('');

    try {
      const payload = {
        username: employeeDraft.username,
        role: employeeDraft.role,
      };

      // Blank password means "leave password unchanged".
      if (employeeDraft.password.trim()) {
        payload.password = employeeDraft.password;
      }

      const res = await fetch(toApiUrl(`/api/manager/employees/${userId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update employee');
      }

      cancelEditingEmployee();
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to update employee');
    } finally {
      setEmployeeSavingId(null);
    }
  }

  async function handleDeleteEmployee(userId) {
    const confirmed = window.confirm(
      'Remove this employee? This may fail if the employee is linked to orders or supply orders.'
    );

    if (!confirmed) return;

    setEmployeeSavingId(userId);
    setError('');

    try {
      const res = await fetch(toApiUrl(`/api/manager/employees/${userId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to remove employee');
      }

      if (editingEmployeeId === userId) {
        cancelEditingEmployee();
      }

      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to remove employee');
    } finally {
      setEmployeeSavingId(null);
    }
  }

  async function handleAddDrink(e) {
    e.preventDefault();
    setError('');

    const drinkName = newDrink.drink_name.trim();
    const categoryId = Number(newDrink.category_id);
    const basePrice = Number(newDrink.base_price);

    if (!drinkName || !categoryId || Number.isNaN(basePrice) || basePrice < 0) {
      setError('Enter a drink name, category, and valid non-negative price.');
      return;
    }

    setMenuUpdating(true);

    try {
      const res = await fetch(toApiUrl('/api/manager/drinks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drink_name: drinkName,
          category_id: categoryId,
          base_price: basePrice,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not add drink');
      }

      setNewDrink({ drink_name: '', category_id: '', base_price: '' });
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to add drink');
    } finally {
      setMenuUpdating(false);
    }
  }

  async function handleDeleteDrink(drinkId, drinkName) {
    const confirmed = window.confirm(
      `Remove ${drinkName || 'this drink'} from the menu?`
    );

    if (!confirmed) return;

    setError('');
    setMenuUpdating(true);

    try {
      const res = await fetch(toApiUrl(`/api/manager/drinks/${drinkId}`), {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not delete drink');
      }

      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to delete drink');
    } finally {
      setMenuUpdating(false);
    }
  }

  // Add a new row to the inventory_item table.
  // Load the recipe for the selected drink.
  async function loadDrinkRecipe(drinkId) {
    if (!drinkId) {
      setRecipeItems([]);
      return;
    }

    setError('');

    try {
      const res = await fetch(toApiUrl(`/api/manager/drinks/${drinkId}/recipe`));

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not load drink recipe');
      }

      const data = await res.json();
      setRecipeItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load drink recipe');
    }
  }

  // Add or update one inventory item in the selected drink recipe.
  async function handleSaveRecipeItem(e) {
    e.preventDefault();
    setError('');

    const drinkId = Number(selectedRecipeDrinkId);
    const invItemId = Number(newRecipeItem.inv_item_id);
    const qtyNeeded = Number(newRecipeItem.qty_needed);

    if (!drinkId || !invItemId || Number.isNaN(qtyNeeded) || qtyNeeded <= 0) {
      setError('Select a drink, select an inventory item, and enter a quantity greater than 0.');
      return;
    }

    setRecipeUpdating(true);

    try {
      const res = await fetch(toApiUrl(`/api/manager/drinks/${drinkId}/recipe`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inv_item_id: invItemId,
          qty_needed: qtyNeeded,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save recipe item');
      }

      setNewRecipeItem({ inv_item_id: '', qty_needed: '' });
      await loadDrinkRecipe(drinkId);
    } catch (e) {
      setError(e.message || 'Failed to save recipe item');
    } finally {
      setRecipeUpdating(false);
    }
  }

  // Remove one inventory item from the selected drink recipe.
  async function handleDeleteRecipeItem(invItemId) {
    const drinkId = Number(selectedRecipeDrinkId);

    if (!drinkId || !invItemId) {
      setError('Select a drink before removing recipe items.');
      return;
    }

    const confirmed = window.confirm('Remove this item from the drink recipe?');
    if (!confirmed) return;

    setRecipeUpdating(true);
    setError('');

    try {
      const res = await fetch(
        toApiUrl(`/api/manager/drinks/${drinkId}/recipe/${invItemId}`),
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not remove recipe item');
      }

      await loadDrinkRecipe(drinkId);
    } catch (e) {
      setError(e.message || 'Failed to remove recipe item');
    } finally {
      setRecipeUpdating(false);
    }
  }
  async function handleAddInventoryItem(e) {
    e.preventDefault();
    setError('');

    const itemName = newInventoryItem.inv_item_name.trim();
    const itemType = newInventoryItem.inv_item_type;
    const unit = newInventoryItem.unit.trim();
    const qty = Number(newInventoryItem.current_qty);

    if (!itemName || !itemType || !unit || Number.isNaN(qty) || qty < 0) {
      setError('Enter an item name, type, unit, and valid non-negative quantity.');
      return;
    }

    setInventoryAdding(true);

    try {
      const res = await fetch(toApiUrl('/api/manager/inventory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inv_item_name: itemName,
          inv_item_type: itemType,
          unit,
          current_qty: qty,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not add inventory item');
      }

      setNewInventoryItem({
        inv_item_name: '',
        inv_item_type: 'INGREDIENT',
        unit: '',
        current_qty: '',
      });

      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to add inventory item');
    } finally {
      setInventoryAdding(false);
    }
  }

  // Update only the quantity for an existing inventory item.
  async function handleUpdateInventoryQty(invItemId, currentQty) {
    setError('');

    const qty = Number(currentQty);

    if (Number.isNaN(qty) || qty < 0) {
      setError('Inventory quantity must be a valid non-negative number.');
      return;
    }

    setInventoryUpdatingId(invItemId);

    try {
      const res = await fetch(toApiUrl(`/api/manager/inventory/${invItemId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_qty: qty }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not update inventory quantity');
      }

      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to update inventory quantity');
    } finally {
      setInventoryUpdatingId(null);
    }
  }

  async function loadReports() {
    setError('');
    setReportsLoading(true);

    try {
      const [salesRes, usageRes, xRes, restockRes] = await Promise.all([
        fetch(toApiUrl(`/api/manager/reports/sales-by-item?start=${reportStart}&end=${reportEnd}`)),
        fetch(toApiUrl(`/api/manager/reports/product-usage?start=${reportStart}&end=${reportEnd}`)),
        fetch(toApiUrl('/api/manager/reports/x-report')),
        fetch(toApiUrl('/api/manager/reports/restock?threshold=1000')),
      ]);

      if (!salesRes.ok) throw new Error('Could not load sales report');
      if (!usageRes.ok) throw new Error('Could not load product usage report');
      if (!xRes.ok) throw new Error('Could not load X-report');
      if (!restockRes.ok) throw new Error('Could not load restock report');

      const [salesData, usageData, xData, restockData] = await Promise.all([
        salesRes.json(),
        usageRes.json(),
        xRes.json(),
        restockRes.json(),
      ]);

      setSalesByItem(Array.isArray(salesData) ? salesData : []);
      setProductUsage(Array.isArray(usageData) ? usageData : []);
      setXReport(Array.isArray(xData) ? xData : []);
      setRestockReport(Array.isArray(restockData) ? restockData : []);
    } catch (e) {
      setError(e.message || 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }
    useEffect(() => {
    if (!isAuthenticated) return;
    loadReports();
  }, [isAuthenticated]);

  // Inventory overview data for manager reporting.
  // The old JavaFX manager view had a "By Type" pie chart and a "Lowest Stock" bar chart.
  const inventoryTypeTotals = inventory.reduce((totals, item) => {
    const type = item.inv_item_type || 'UNKNOWN';
    const qty = Number(item.current_qty) || 0;

    return {
      ...totals,
      [type]: (totals[type] || 0) + qty,
    };
  }, {});

  const inventoryTypeRows = Object.entries(inventoryTypeTotals);

  const lowestStockItems = [...inventory]
    .sort((a, b) => Number(a.current_qty) - Number(b.current_qty))
    .slice(0, 5);

  const maxLowestStockQty = Math.max(
    1,
    ...lowestStockItems.map((item) => Number(item.current_qty) || 0)
  );

  function toggleSection(sectionName) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  }

  const maxSalesByItemQty = Math.max(
    1,
    ...salesByItem.map((row) => Number(row.qty_sold) || 0)
  );

  const maxUsageQty = Math.max(
    1,
    ...productUsage.map((row) => Number(row.used_qty) || 0)
  );

  const maxHourlySales = Math.max(
    1,
    ...xReport.map((row) => Number(row.sales) || 0)
  );

  const shell = {
    sectionHeaderButton: {
      width: '100%',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      background: 'var(--code-bg)',
      color: 'var(--text-h)',
      padding: '0.85rem 1rem',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: 700,
      fontSize: '1rem',
      marginBottom: '0.75rem',
    },
    authPage: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      boxSizing: 'border-box',
      background: 'radial-gradient(circle at top right, #e9f4ff, #f7fbff 45%, #ffffff)',
    },
    authCard: {
      width: 'min(460px, 100%)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      padding: '1.5rem',
      background: 'var(--bg)',
      boxShadow: 'var(--shadow)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    authTitle: {
      margin: 0,
      fontFamily: 'var(--heading)',
      color: 'var(--text-h)',
      fontSize: '1.65rem',
    },
    authText: {
      margin: 0,
      color: 'var(--text)',
      lineHeight: 1.45,
    },
    authError: {
      margin: 0,
      borderRadius: '8px',
      padding: '0.7rem 0.85rem',
      background: 'rgba(220, 38, 38, 0.12)',
      border: '1px solid rgba(220, 38, 38, 0.35)',
      color: 'var(--text-h)',
      fontSize: '0.9rem',
    },
    authMeta: {
      margin: 0,
      color: 'var(--text)',
      fontSize: '0.85rem',
      opacity: 0.85,
    },
    authLoading: {
      color: 'var(--text)',
      fontSize: '0.92rem',
      margin: 0,
    },
    outer: {
      width: '100%',
      maxWidth: '1120px',
      margin: '0 auto',
      padding: '1.5rem 1.25rem 3rem',
      textAlign: 'left',
      boxSizing: 'border-box',
    },
    title: {
      fontFamily: 'var(--heading)',
      color: 'var(--text-h)',
      fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
      fontWeight: 600,
      margin: '0 0 0.75rem',
    },
    subtitle: {
      color: 'var(--text)',
      margin: '0 0 1.75rem',
      fontSize: '0.95rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    card: {
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '1rem 1.15rem',
      background: 'var(--code-bg)',
      boxShadow: 'var(--shadow)',
    },
    cardLabel: {
      fontSize: '0.8rem',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text)',
      marginBottom: '0.35rem',
    },
    cardValue: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: 'var(--text-h)',
      fontFamily: 'var(--mono)',
    },
    section: {
      marginBottom: '2rem',
    },
    sectionTopRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '0.75rem',
      flexWrap: 'wrap',
    },
    sectionHint: {
      margin: 0,
      color: 'var(--text)',
      fontSize: '0.88rem',
    },
    tableWrap: {
      overflowX: 'auto',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      marginTop: '0.75rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.9rem',
    },
    th: {
      textAlign: 'left',
      padding: '0.65rem 0.75rem',
      borderBottom: '1px solid var(--border)',
      background: 'var(--code-bg)',
      color: 'var(--text-h)',
      fontWeight: 600,
    },
    td: {
      padding: '0.65rem 0.75rem',
      borderBottom: '1px solid var(--border)',
      verticalAlign: 'top',
    },
    select: {
      padding: '0.4rem 0.5rem',
      borderRadius: '6px',
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--text-h)',
      fontSize: '0.85rem',
      minWidth: '9rem',
    },
    input: {
      padding: '0.45rem 0.55rem',
      borderRadius: '6px',
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--text-h)',
      fontSize: '0.85rem',
      minWidth: '10rem',
      boxSizing: 'border-box',
    },
    formRow: {
      display: 'flex',
      gap: '0.65rem',
      flexWrap: 'wrap',
      alignItems: 'center',
      padding: '0.85rem',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      background: 'var(--code-bg)',
    },
    primaryButton: {
      border: '1px solid var(--border)',
      borderRadius: '8px',
      background: 'var(--text-h)',
      color: 'var(--bg)',
      fontWeight: 700,
      padding: '0.48rem 0.8rem',
      cursor: 'pointer',
    },
    secondaryButton: {
      border: '1px solid var(--border)',
      borderRadius: '8px',
      background: 'var(--code-bg)',
      color: 'var(--text-h)',
      fontWeight: 600,
      padding: '0.42rem 0.7rem',
      cursor: 'pointer',
      marginRight: '0.35rem',
    },
    dangerButton: {
      border: '1px solid rgba(220, 38, 38, 0.35)',
      borderRadius: '8px',
      background: 'rgba(220, 38, 38, 0.12)',
      color: 'var(--text-h)',
      fontWeight: 600,
      padding: '0.42rem 0.7rem',
      cursor: 'pointer',
    },
    err: {
      background: 'rgba(220, 38, 38, 0.12)',
      border: '1px solid rgba(220, 38, 38, 0.35)',
      color: 'var(--text-h)',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
    items: {
      margin: '0.25rem 0 0',
      paddingLeft: '1.1rem',
      color: 'var(--text)',
      fontSize: '0.85rem',
    },
    authTopRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      marginBottom: '1rem',
      flexWrap: 'wrap',
    },
    signOutButton: {
      border: '1px solid var(--border)',
      borderRadius: '8px',
      background: 'var(--code-bg)',
      color: 'var(--text-h)',
      fontWeight: 600,
      padding: '0.45rem 0.75rem',
      cursor: 'pointer',
    },
    authBadge: {
      margin: 0,
      color: 'var(--text)',
      fontSize: '0.9rem',
    },
    menuForm: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '1rem',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      background: 'var(--code-bg)',
    },
    menuInput: {
      padding: '0.5rem 0.6rem',
      borderRadius: '6px',
      border: '1px solid var(--border)',
      background: 'var(--bg)',
      color: 'var(--text-h)',
      fontSize: '0.9rem',
      minWidth: '11rem',
    },
    menuButton: {
      border: '1px solid var(--border)',
      borderRadius: '8px',
      background: 'var(--text-h)',
      color: 'var(--bg)',
      fontWeight: 600,
      padding: '0.5rem 0.8rem',
      cursor: 'pointer',
    },
    deleteButton: {
      border: '1px solid rgba(220, 38, 38, 0.45)',
      borderRadius: '8px',
      background: 'rgba(220, 38, 38, 0.12)',
      color: 'var(--text-h)',
      fontWeight: 600,
      padding: '0.4rem 0.65rem',
      cursor: 'pointer',
    },
  };

  if (!isAuthenticated) {
    return (
      <main style={shell.authPage}>
        <section style={shell.authCard}>
          <h1 style={shell.authTitle}>Manager Sign-In</h1>
          <p style={shell.authText}>
            Sign in with Google to access the manager dashboard.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div ref={googleBtnRef} />
          </div>

          {authLoading ? <p style={shell.authLoading}>Signing in…</p> : null}
          {authError ? <p style={shell.authError} role="alert">{authError}</p> : null}
          <p style={shell.authMeta}>Only approved manager Gmail accounts can continue.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={shell.outer} id="manager-dashboard">
      <div style={shell.authTopRow}>
        {managerUser?.email ? (
          <p style={shell.authBadge}>Signed in as {managerUser.email}</p>
        ) : (
          <p style={shell.authBadge}>Signed in</p>
        )}

        <button
          type="button"
          style={shell.signOutButton}
          onClick={() => {
            setIsAuthenticated(false);
            setManagerUser(null);
            setSummary(null);
            setOrders([]);
            setEmployees([]);
            setDrinks([]);
            setCategories([]);
            setNewDrink({ drink_name: '', category_id: '', base_price: '' });
            setSelectedRecipeDrinkId('');
            setRecipeItems([]);
            setNewRecipeItem({ inv_item_id: '', qty_needed: '' });
            setInventory([]);
            setSupplyOrders([]);
            setNewInventoryItem({
              inv_item_name: '',
              inv_item_type: 'INGREDIENT',
              unit: '',
              current_qty: '',
            });
            setError('');
            setAuthError('');

            if (window.google?.accounts?.id) {
              window.google.accounts.id.disableAutoSelect();
            }
          }}
        >
          Sign Out
        </button>
      </div>

      <h1 style={shell.title}>Manager</h1>
      <p style={shell.subtitle}>
        Desktop overview: today&apos;s sales, queue, order status, employee accounts, and menu items.
      </p>

      {error ? (
        <div style={shell.err} role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p aria-live="polite">Loading dashboard…</p>
      ) : (
        <>
          <section style={shell.grid} aria-label="Today’s summary">
            <div style={shell.card}>
              <div style={shell.cardLabel}>Revenue today</div>
              <div style={shell.cardValue}>
                {summary ? formatMoney(summary.revenue_today) : '—'}
              </div>
            </div>

            <div style={shell.card}>
              <div style={shell.cardLabel}>Orders today</div>
              <div style={shell.cardValue}>{summary?.orders_today ?? '—'}</div>
            </div>

            <div style={shell.card}>
              <div style={shell.cardLabel}>Pending</div>
              <div style={shell.cardValue}>{summary?.pending_orders ?? '—'}</div>
            </div>
          </section>

          <section aria-labelledby="employees-heading" style={shell.section}>
            <button
              type="button"
              style={shell.sectionHeaderButton}
              onClick={() => toggleSection('employees')}
            >
              <span>Employee Management</span>
              <span>{openSections.employees ? '▲' : '▼'}</span>
                </button>

                {openSections.employees ? (
                  <>
                <div style={shell.sectionTopRow}>
                  <div>
                    <h2
                      id="employees-heading"
                      style={{ ...shell.title, fontSize: '1.25rem', marginBottom: '0.2rem' }}
                    >
                      Employee Management
                    </h2>
                    <p style={shell.sectionHint}>
                      Add, update, or remove manager/cashier accounts stored in user_account.
                    </p>
                  </div>
                </div>

                <form style={shell.formRow} onSubmit={handleAddEmployee}>
                  <input
                    style={shell.input}
                    type="text"
                    placeholder="Username"
                    value={newEmployee.username}
                    onChange={(e) =>
                      setNewEmployee((prev) => ({ ...prev, username: e.target.value }))
                    }
                    required
                  />

                  <input
                    style={shell.input}
                    type="text"
                    placeholder="Password"
                    value={newEmployee.password}
                    onChange={(e) =>
                      setNewEmployee((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />

                  <select
                    style={shell.select}
                    value={newEmployee.role}
                    onChange={(e) =>
                      setNewEmployee((prev) => ({ ...prev, role: e.target.value }))
                    }
                    required
                  >
                    {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <button type="submit" style={shell.primaryButton}>
                    Add Employee
                  </button>
                </form>

                <div style={shell.tableWrap}>
                  <table style={shell.table}>
                    <thead>
                      <tr>
                        <th style={shell.th}>User ID</th>
                        <th style={shell.th}>Username</th>
                        <th style={shell.th}>Password</th>
                        <th style={shell.th}>Role</th>
                        <th style={shell.th}>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {employees.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                            No employees found.
                          </td>
                        </tr>
                      ) : (
                        employees.map((employee) => {
                          const isEditing = editingEmployeeId === employee.user_id;

                          return (
                            <tr key={employee.user_id}>
                              <td style={shell.td}>#{employee.user_id}</td>

                              <td style={shell.td}>
                                {isEditing ? (
                                  <input
                                    style={shell.input}
                                    type="text"
                                    value={employeeDraft.username}
                                    onChange={(e) =>
                                      setEmployeeDraft((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                ) : (
                                  employee.username
                                )}
                              </td>

                              <td style={shell.td}>
                                {isEditing ? (
                                  <input
                                    style={shell.input}
                                    type="text"
                                    placeholder="Leave blank to keep current password"
                                    value={employeeDraft.password}
                                    onChange={(e) =>
                                      setEmployeeDraft((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                      }))
                                    }
                                  />
                                ) : (
                                  <span style={{ opacity: 0.75 }}>Hidden</span>
                                )}
                              </td>

                              <td style={shell.td}>
                                {isEditing ? (
                                  <select
                                    style={shell.select}
                                    value={employeeDraft.role}
                                    onChange={(e) =>
                                      setEmployeeDraft((prev) => ({
                                        ...prev,
                                        role: e.target.value,
                                      }))
                                    }
                                  >
                                    {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                                      <option key={role.value} value={role.value}>
                                        {role.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  employee.role
                                )}
                              </td>

                              <td style={shell.td}>
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      style={shell.primaryButton}
                                      disabled={employeeSavingId === employee.user_id}
                                      onClick={() => handleUpdateEmployee(employee.user_id)}
                                    >
                                      {employeeSavingId === employee.user_id ? 'Saving…' : 'Save'}
                                    </button>{' '}

                                    <button
                                      type="button"
                                      style={shell.secondaryButton}
                                      onClick={cancelEditingEmployee}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      style={shell.secondaryButton}
                                      onClick={() => startEditingEmployee(employee)}
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      style={shell.dangerButton}
                                      disabled={employeeSavingId === employee.user_id}
                                      onClick={() => handleDeleteEmployee(employee.user_id)}
                                    >
                                      {employeeSavingId === employee.user_id ? 'Removing…' : 'Remove'}
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>

          <section aria-labelledby="menu-heading" style={shell.section}>
            <button
              type="button"
              style={shell.sectionHeaderButton}
              onClick={() => toggleSection('menu')}
            >
              <span>Manage Menu</span>
              <span>{openSections.menu ? '▲' : '▼'}</span>
            </button>

            {openSections.menu ? (
              <>
                <form style={shell.menuForm} onSubmit={handleAddDrink}>
                  <input
                    style={shell.menuInput}
                    type="text"
                    placeholder="Drink name"
                    value={newDrink.drink_name}
                    onChange={(e) =>
                      setNewDrink((prev) => ({ ...prev, drink_name: e.target.value }))
                    }
                    required
                  />

                  <select
                    style={{ ...shell.select, minWidth: '11rem' }}
                    value={newDrink.category_id}
                    onChange={(e) =>
                      setNewDrink((prev) => ({ ...prev, category_id: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>

                  <input
                    style={shell.menuInput}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    value={newDrink.base_price}
                    onChange={(e) =>
                      setNewDrink((prev) => ({ ...prev, base_price: e.target.value }))
                    }
                    required
                  />

                  <button type="submit" style={shell.menuButton} disabled={menuUpdating}>
                    {menuUpdating ? 'Saving…' : 'Add Drink'}
                  </button>
                </form>

                <div style={shell.tableWrap}>
                  <table style={shell.table}>
                    <thead>
                      <tr>
                        <th style={shell.th}>Drink</th>
                        <th style={shell.th}>Category</th>
                        <th style={shell.th}>Price</th>
                        <th style={shell.th}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {drinks.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                            No drinks found.
                          </td>
                        </tr>
                      ) : (
                        drinks.map((drink) => (
                          <tr key={drink.drink_id}>
                            <td style={shell.td}>{drink.drink_name}</td>
                            <td style={shell.td}>{drink.category_name}</td>
                            <td style={shell.td}>{formatMoney(drink.base_price)}</td>
                            <td style={shell.td}>
                              <button
                                type="button"
                                style={shell.deleteButton}
                                disabled={menuUpdating}
                                onClick={() => handleDeleteDrink(drink.drink_id, drink.drink_name)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                                <div style={{ ...shell.card, marginTop: '1rem' }}>
                  <div style={shell.cardLabel}>Drink Recipe Editor</div>
                  <p style={shell.sectionHint}>
                    Select a drink, then add the inventory items and quantities needed to make it.
                  </p>

                  <form style={shell.formRow} onSubmit={handleSaveRecipeItem}>
                    <select
                      style={shell.select}
                      value={selectedRecipeDrinkId}
                      onChange={(e) => {
                        const drinkId = e.target.value;
                        setSelectedRecipeDrinkId(drinkId);
                        setNewRecipeItem({ inv_item_id: '', qty_needed: '' });
                        loadDrinkRecipe(drinkId);
                      }}
                      required
                    >
                      <option value="">Select drink</option>
                      {drinks.map((drink) => (
                        <option key={drink.drink_id} value={drink.drink_id}>
                          {drink.drink_name}
                        </option>
                      ))}
                    </select>

                    <select
                      style={shell.select}
                      value={newRecipeItem.inv_item_id}
                      onChange={(e) =>
                        setNewRecipeItem((prev) => ({
                          ...prev,
                          inv_item_id: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select inventory item</option>
                      {inventory.map((item) => (
                        <option key={item.inv_item_id} value={item.inv_item_id}>
                          {item.inv_item_name} ({item.unit})
                        </option>
                      ))}
                    </select>

                    <input
                      style={shell.input}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Qty needed"
                      value={newRecipeItem.qty_needed}
                      onChange={(e) =>
                        setNewRecipeItem((prev) => ({
                          ...prev,
                          qty_needed: e.target.value,
                        }))
                      }
                      required
                    />

                    <button type="submit" style={shell.primaryButton} disabled={recipeUpdating}>
                      {recipeUpdating ? 'Saving…' : 'Add/Update Ingredient'}
                    </button>
                  </form>

                  <div style={shell.tableWrap}>
                    <table style={shell.table}>
                      <thead>
                        <tr>
                          <th style={shell.th}>Ingredient</th>
                          <th style={shell.th}>Qty Needed</th>
                          <th style={shell.th}>Unit</th>
                          <th style={shell.th}>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {!selectedRecipeDrinkId ? (
                          <tr>
                            <td colSpan={4} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                              Select a drink to view its recipe.
                            </td>
                          </tr>
                        ) : recipeItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                              No recipe items for this drink yet.
                            </td>
                          </tr>
                        ) : (
                          recipeItems.map((item) => (
                            <tr key={item.inv_item_id}>
                              <td style={shell.td}>{item.inv_item_name}</td>
                              <td style={shell.td}>{Number(item.qty_needed).toLocaleString()}</td>
                              <td style={shell.td}>{item.unit}</td>
                              <td style={shell.td}>
                                <button
                                  type="button"
                                  style={shell.dangerButton}
                                  disabled={recipeUpdating}
                                  onClick={() => handleDeleteRecipeItem(item.inv_item_id)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                </>
            ) : null}
          </section>

          <section aria-labelledby="inventory-heading" style={shell.section}>
            <button
              type="button"
              style={shell.sectionHeaderButton}
              onClick={() => toggleSection('inventory')}
            >
              <span>Inventory Management</span>
              <span>{openSections.inventory ? '▲' : '▼'}</span>
            </button>

            {openSections.inventory ? (
              <>
                <div style={shell.sectionTopRow}>
                  <div>
                    <h2
                      id="inventory-heading"
                      style={{ ...shell.title, fontSize: '1.25rem', marginBottom: '0.2rem' }}
                    >
                      Inventory Management
                    </h2>
                    <p style={shell.sectionHint}>
                      View inventory items, add new inventory, and update current quantities.
                    </p>
                  </div>
                </div>

                <form style={shell.formRow} onSubmit={handleAddInventoryItem}>
                  <input
                    style={shell.input}
                    type="text"
                    placeholder="Item name"
                    value={newInventoryItem.inv_item_name}
                    onChange={(e) =>
                      setNewInventoryItem((prev) => ({
                        ...prev,
                        inv_item_name: e.target.value,
                      }))
                    }
                    required
                  />

                  <select
                    style={shell.select}
                    value={newInventoryItem.inv_item_type}
                    onChange={(e) =>
                      setNewInventoryItem((prev) => ({
                        ...prev,
                        inv_item_type: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="INGREDIENT">Ingredient</option>
                    <option value="PACKAGING">Packaging</option>
                  </select>

                  <input
                    style={shell.input}
                    type="text"
                    placeholder="Unit, like g or ml"
                    value={newInventoryItem.unit}
                    onChange={(e) =>
                      setNewInventoryItem((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    required
                  />

                  <input
                    style={shell.input}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Quantity"
                    value={newInventoryItem.current_qty}
                    onChange={(e) =>
                      setNewInventoryItem((prev) => ({
                        ...prev,
                        current_qty: e.target.value,
                      }))
                    }
                    required
                  />

                  <button type="submit" style={shell.primaryButton} disabled={inventoryAdding}>
                    {inventoryAdding ? 'Adding…' : 'Add Inventory Item'}
                  </button>
                </form>

                {/* Inventory overview reports copied from the old manager layout:
                - By Type summary
                - Lowest Stock chart
                */}
                <div style={shell.grid}>
                  <div style={shell.card}>
                    <div style={shell.cardLabel}>Inventory by type</div>

                    {inventoryTypeRows.length === 0 ? (
                      <p style={shell.sectionHint}>No inventory loaded.</p>
                    ) : (
                      inventoryTypeRows.map(([type, qty]) => (
                        <div key={type} style={{ marginBottom: '0.75rem' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>
                              {type}
                            </span>
                            <span style={{ color: 'var(--text)' }}>
                              {Number(qty).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={shell.card}>
                    <div style={shell.cardLabel}>Lowest stock</div>

                    {lowestStockItems.length === 0 ? (
                      <p style={shell.sectionHint}>No inventory loaded.</p>
                    ) : (
                      lowestStockItems.map((item) => {
                        const qty = Number(item.current_qty) || 0;
                        const width = `${Math.max(4, (qty / maxLowestStockQty) * 100)}%`;

                        return (
                          <div key={item.inv_item_id} style={{ marginBottom: '0.75rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                marginBottom: '0.25rem',
                                fontSize: '0.85rem',
                              }}
                            >
                              <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>
                                {item.inv_item_name}
                              </span>
                              <span style={{ color: 'var(--text)' }}>
                                {qty.toLocaleString()} {item.unit}
                              </span>
                            </div>

                            <div
                              style={{
                                height: '0.55rem',
                                borderRadius: '999px',
                                background: 'rgba(148, 163, 184, 0.25)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width,
                                  height: '100%',
                                  borderRadius: '999px',
                                  background: 'var(--text-h)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={shell.tableWrap}>
                  <table style={shell.table}>
                    <thead>
                      <tr>
                        <th style={shell.th}>ID</th>
                        <th style={shell.th}>Item</th>
                        <th style={shell.th}>Type</th>
                        <th style={shell.th}>Unit</th>
                        <th style={shell.th}>Current Quantity</th>
                        <th style={shell.th}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                            No inventory items found.
                          </td>
                        </tr>
                      ) : (
                        inventory.map((item) => (
                          <tr key={item.inv_item_id}>
                            <td style={shell.td}>#{item.inv_item_id}</td>
                            <td style={shell.td}>{item.inv_item_name}</td>
                            <td style={shell.td}>{item.inv_item_type}</td>
                            <td style={shell.td}>{item.unit}</td>
                            <td style={shell.td}>
                              <input
                                style={shell.input}
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.current_qty}
                                onChange={(e) => {
                                  const nextQty = e.target.value;
                                  setInventory((prev) =>
                                    prev.map((inv) =>
                                      inv.inv_item_id === item.inv_item_id
                                        ? { ...inv, current_qty: nextQty }
                                        : inv
                                    )
                                  );
                                }}
                              />
                            </td>
                            <td style={shell.td}>
                              <button
                                type="button"
                                style={shell.secondaryButton}
                                disabled={inventoryUpdatingId === item.inv_item_id}
                                onClick={() => handleUpdateInventoryQty(item.inv_item_id, item.current_qty)}
                              >
                                {inventoryUpdatingId === item.inv_item_id ? 'Saving…' : 'Save Qty'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </>
            ) : null}
          </section>

          <section aria-labelledby="reports-heading" style={shell.section}>
            <button
              type="button"
              style={shell.sectionHeaderButton}
              onClick={() => toggleSection('reports')}
            >
              <span>Manager Reports</span>
              <span>{openSections.reports ? '▲' : '▼'}</span>
            </button>

            {openSections.reports ? (
              <>
                <div style={shell.sectionTopRow}>
                  <div>
                    <h2
                      id="reports-heading"
                      style={{ ...shell.title, fontSize: '1.25rem', marginBottom: '0.2rem' }}
                    >
                      Manager Reports
                    </h2>
                    <p style={shell.sectionHint}>
                      View sales, product usage, X-report activity, and restock needs.
                    </p>
                  </div>
                </div>

                <form
                  style={shell.formRow}
                  onSubmit={(e) => {
                    e.preventDefault();
                    loadReports();
                  }}
                >
                  <label style={shell.sectionHint}>
                    Start:{' '}
                    <input
                      style={shell.input}
                      type="date"
                      value={reportStart}
                      onChange={(e) => setReportStart(e.target.value)}
                      required
                    />
                  </label>

                  <label style={shell.sectionHint}>
                    End:{' '}
                    <input
                      style={shell.input}
                      type="date"
                      value={reportEnd}
                      onChange={(e) => setReportEnd(e.target.value)}
                      required
                    />
                  </label>

                  <button type="submit" style={shell.primaryButton} disabled={reportsLoading}>
                    {reportsLoading ? 'Loading…' : 'Run Reports'}
                  </button>
                </form>

                <div style={shell.grid}>
                  <div style={shell.card}>
                    <div style={shell.cardLabel}>Sales Report by Item</div>

                    {salesByItem.length === 0 ? (
                      <p style={shell.sectionHint}>No sales found for this period.</p>
                    ) : (
                      salesByItem.slice(0, 8).map((row) => {
                        const qty = Number(row.qty_sold) || 0;
                        const width = `${Math.max(4, (qty / maxSalesByItemQty) * 100)}%`;

                        return (
                          <div key={row.drink_id} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{row.drink_name}</span>
                              <span style={{ color: 'var(--text)' }}>{qty} sold</span>
                            </div>

                            <div style={{ height: '0.55rem', borderRadius: '999px', background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                              <div style={{ width, height: '100%', borderRadius: '999px', background: 'var(--text-h)' }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={shell.card}>
                    <div style={shell.cardLabel}>Product Usage Chart</div>

                    {productUsage.length === 0 ? (
                      <p style={shell.sectionHint}>No inventory usage found for this period.</p>
                    ) : (
                      productUsage.slice(0, 8).map((row) => {
                        const qty = Number(row.used_qty) || 0;
                        const width = `${Math.max(4, (qty / maxUsageQty) * 100)}%`;

                        return (
                          <div key={row.inv_item_id} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{row.inv_item_name}</span>
                              <span style={{ color: 'var(--text)' }}>{qty.toLocaleString()} {row.unit}</span>
                            </div>

                            <div style={{ height: '0.55rem', borderRadius: '999px', background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                              <div style={{ width, height: '100%', borderRadius: '999px', background: 'var(--text-h)' }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={shell.grid}>
                  <div style={shell.card}>
                    <div style={shell.cardLabel}>X-Report: Sales by Hour Today</div>

                    {xReport.length === 0 ? (
                      <p style={shell.sectionHint}>No sales activity today.</p>
                    ) : (
                      xReport.map((row) => {
                        const sales = Number(row.sales) || 0;
                        const width = `${Math.max(4, (sales / maxHourlySales) * 100)}%`;

                        return (
                          <div key={row.hour} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>
                                {String(row.hour).padStart(2, '0')}:00
                              </span>
                              <span style={{ color: 'var(--text)' }}>
                                {formatMoney(row.sales)} / {row.order_count} orders
                              </span>
                            </div>

                            <div style={{ height: '0.55rem', borderRadius: '999px', background: 'rgba(148, 163, 184, 0.25)', overflow: 'hidden' }}>
                              <div style={{ width, height: '100%', borderRadius: '999px', background: 'var(--text-h)' }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={shell.card}>
                    <div style={shell.cardLabel}>Restock Report</div>

                    {restockReport.length === 0 ? (
                      <p style={shell.sectionHint}>No items below restock threshold.</p>
                    ) : (
                      restockReport.slice(0, 10).map((item) => (
                        <div
                          key={item.inv_item_id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            marginBottom: '0.65rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>
                            {item.inv_item_name}
                          </span>
                          <span style={{ color: 'var(--text)' }}>
                            {Number(item.current_qty).toLocaleString()} {item.unit}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <section aria-labelledby="supply-orders-heading" style={shell.section}>
            <button
              type="button"
              style={shell.sectionHeaderButton}
              onClick={() => toggleSection('restockHistory')}
            >
              <span>Restock History</span>
              <span>{openSections.restockHistory ? '▲' : '▼'}</span>
                </button>

                {openSections.restockHistory ? (
                  <>
                    <div style={shell.sectionTopRow}>
                  <div>
                    <h2
                      id="supply-orders-heading"
                      style={{ ...shell.title, fontSize: '1.25rem', marginBottom: '0.2rem' }}
                    >
                      Restock History
                    </h2>
                    <p style={shell.sectionHint}>
                      Quantity increases saved by managers are recorded here as supply orders.
                    </p>
                  </div>
                </div>

                <div style={shell.tableWrap}>
                  <table style={shell.table}>
                    <thead>
                      <tr>
                        <th style={shell.th}>Supply Order ID</th>
                        <th style={shell.th}>Date</th>
                        <th style={shell.th}>Item</th>
                        <th style={shell.th}>Quantity Added</th>
                        <th style={shell.th}>Unit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {supplyOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                            No restock history found.
                          </td>
                        </tr>
                      ) : (
                        supplyOrders.map((order) => (
                          <tr key={order.supply_order_id}>
                            <td style={shell.td}>#{order.supply_order_id}</td>
                            <td style={shell.td}>{formatTime(order.created_ts)}</td>
                            <td style={shell.td}>{order.inv_item_name}</td>
                            <td style={shell.td}>
                              {Number(order.qty_requested).toLocaleString()}
                            </td>
                            <td style={shell.td}>{order.unit}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>          

          <section aria-labelledby="orders-heading" style={shell.section}>
            <button
              type="button"
              style={shell.sectionHeaderButton}
              onClick={() => toggleSection('orders')}
            >
              <span>Recent Orders</span>
              <span>{openSections.orders ? '▲' : '▼'}</span>
            </button>

            {openSections.orders ? (
              <>
                <div style={shell.tableWrap}>
                  <table style={shell.table}>
                    <thead>
                      <tr>
                        <th style={shell.th}>Order</th>
                        <th style={shell.th}>Time</th>
                        <th style={shell.th}>Total</th>
                        <th style={shell.th}>Items</th>
                        <th style={shell.th}>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ ...shell.td, textAlign: 'center', color: 'var(--text)' }}>
                            No orders yet.
                          </td>
                        </tr>
                      ) : (
                        orders.map((o) => (
                          <tr key={o.order_id}>
                            <td style={shell.td}>#{o.order_id}</td>
                            <td style={shell.td}>{formatTime(o.order_ts)}</td>
                            <td style={shell.td}>{formatMoney(o.order_total)}</td>
                            <td style={shell.td}>
                              <ul style={shell.items}>
                                {(o.items || []).map((it) => (
                                  <li key={it.order_item_id}>
                                    {it.qty}× {it.drink_name || 'Drink'}{' '}
                                    <span style={{ opacity: 0.85 }}>
                                      ({it.sweetness_level}% sugar, {String(it.ice_level || '').replace(/_/g, ' ')})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>

                            <td style={shell.td}>
                              <select
                                id={`status-${o.order_id}`}
                                style={shell.select}
                                aria-label={`Order ${o.order_id} status`}
                                value={
                                  STATUS_OPTIONS.some((s) => s.value === o.order_status)
                                    ? o.order_status
                                    : 'pending'
                                }
                                disabled={updatingId === o.order_id}
                                onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}