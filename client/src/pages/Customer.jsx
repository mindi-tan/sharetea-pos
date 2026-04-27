// Imports
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

// Maps our short language codes to Google's BCP-47-ish codes. The backend
// uses these when calling the Translate API.
const GOOGLE_TRANSLATE_LANGUAGES = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  hi: 'hi',
  zh: 'zh-CN',
};


// API
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');


const toApiUrl = (path) => `${API_BASE}${path}`;


// Options
const ACHIEVEMENTS = [
  { id: 'firstDrink', icon: '🏆', name: 'First Boba!',       hint: 'Add your first drink to the cart' },
  { id: 'topper',     icon: '⭐', name: 'Topping Explorer!',  hint: 'Add toppings to a drink' },
  { id: 'firstOrder', icon: '🎮', name: 'Order Champion!',    hint: 'Place your first order' },
];

const WIZARD_SUGAR = {
  '0':   { emoji: '🚫', label: 'No Sugar'   },
  '50':  { emoji: '🍬', label: 'A Little'   },
  '100': { emoji: '🍭', label: 'Full Sweet'  },
  '125': { emoji: '🍯', label: 'Extra Sweet' },
};
const WIZARD_ICE = {
  'NO_ICE':     { emoji: '🌡️', label: 'No Ice'   },
  'LESS_ICE':   { emoji: '🧊', label: 'Less Ice'  },
  'NORMAL_ICE': { emoji: '❄️', label: 'Regular'   },
  'HOT':        { emoji: '☕', label: 'Hot'       },
};

const SUGAR_LEVELS = [
  { label: '0%', value: '0' },
  { label: '50%', value: '50' },
  { label: '100%', value: '100' },
  { label: '125%', value: '125' },
];


const ICE_LEVELS = [
  { label: 'No Ice', value: 'NO_ICE' },
  { label: 'Less Ice', value: 'LESS_ICE' },
  { label: 'Regular', value: 'NORMAL_ICE' },
];


const SIZE_LEVELS = [
  { label: 'S', value: 'S' },
  { label: 'M', value: 'M' },
  { label: 'L', value: 'L' },
];

// Size price multipliers: menu base_price is treated as MEDIUM; S/L scale only the drink, not toppings.
const SIZE_MULTIPLIERS = {
  S: 0.8,
  M: 1.0,
  L: 1.2,
};


const categoryEmojis = {
  'Milk Tea': '🧋',
  'Fruit Tea': '🍓',
  'Fresh Milk': '🥛',
  'Brewed Tea': '🍵',
  'Ice Blended': '🧊',
  Mojito: '🌿',
  Seasonal: '🌸',
  'Hot Drinks': '☕',
  Featured: '⭐',
  Caffeinated: '⚡',
};


const assistantStarterMessages = [
  {
    role: 'assistant',
    content:
      'Hi, I can help with menu questions and ordering. Ask me about drinks, toppings, prices, or how to place an order.',
  },
];


const assistantQuickPrompts = [
  'What are your most popular drinks under $6?',
  'Suggest a fruity drink with low sugar',
  'What toppings pair best with brown sugar drinks?',
  'How do I customize sugar and ice levels?',
];


const WHEEL_DEALS = [
  { id: 'off5', label: '5% Off One Drink', short: '5% OFF', type: 'percent', value: 0.05, color: '#ffd670' },
  { id: 'freeTop', label: 'Free Extra Topping', short: 'FREE TOP', type: 'freeTopping', value: 0, color: '#ff9770' },
  { id: 'off10', label: '10% Off One Drink', short: '10% OFF', type: 'percent', value: 0.1, color: '#70d6ff' },
  { id: 'off1', label: '$1 Off One Drink', short: '$1 OFF', type: 'amount', value: 1, color: '#8eecf5' },
];


const INGREDIENT_STYLE_PRESETS = [
  {
    id: 'teaFruit',
    label: 'Tea & fruit styles',

    categoryNames: ['Fruit Tea', 'Brewed Tea', 'Mojito'],
  },
  {
    id: 'creamy',
    label: 'Milk & blended',
    categoryNames: ['Milk Tea', 'Fresh Milk', 'Ice Blended'],
  },
];

// UI text
const DEFAULT_UI_TEXT = {
  title: 'Reveille Boba',
  cart: 'Cart',
  all: 'All',
  browseByCategory: 'Browse by category',
  yourOrder: 'Your Order',
  emptyCart: 'Your cart is empty.',
  placeOrder: 'Place Order',
  placingOrder: 'Placing Order...',
  loadingMenu: 'Loading menu...',
  sweetness: 'Sweetness Level',
  ice: 'Ice Level',
  toppings: 'Toppings',
  pricesFromDb: '(prices from DB)',
  addToCart: 'Add to Cart',
  helperTitle: 'Reveille Boba Helper',
  helperDescription: 'Ask about menu items, toppings, pricing, or ordering steps.',
  helperThinking: 'Thinking...',
  helperPlaceholder: 'Ask something about the menu or ordering...',
  orderPlaced: '✅ Order placed! Thank you!',
  total: 'Total',
  size: 'Size',
  iceLevel: 'Ice Level',
  noIce: 'No Ice',
  lessIce: 'Less Ice',
  regular: 'Regular',
  hot: 'Hot',
  temperature: 'Temperature',
  noSugar: 'No Sugar',
  littleSugar: 'A Little',
  fullSweet: 'Full Sweet',
  extraSweet: 'Extra Sweet',
  howSweet: 'How sweet?',
  howCold: 'How cold?',
  howHot: 'How hot?',
  anyExtras: 'Any extras?',
  back: 'Back',
};


// Page
export default function Customer() {

  // State
  const [speakingId, setSpeakingId] = useState(null);


  const [categories, setCategories] = useState([]);


  const [drinks, setDrinks] = useState([]);


  const [toppings, setToppings] = useState([]);


  const [loadingMenu, setLoadingMenu] = useState(true);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('bobaLanguage') || 'en';
  });
  const [uiText, setUiText] = useState(DEFAULT_UI_TEXT);
  const [translatedCategories, setTranslatedCategories] = useState({});
  const [translatedDrinks, setTranslatedDrinks] = useState({});
  const [translatedToppings, setTranslatedToppings] = useState({});


  const [apiError, setApiError] = useState('');


  const [selectedCategory, setSelectedCategory] = useState(null);


  const [cart, setCart] = useState([]);


  const [modal, setModal] = useState(null);


  const [customization, setCustomization] = useState({
    sugar: '100',
    ice: 'NORMAL_ICE',
    size: 'M',
    toppings: [],
  });


  const [showCart, setShowCart] = useState(false);


  const [orderPlaced, setOrderPlaced] = useState(false);


  const [placingOrder, setPlacingOrder] = useState(false);


  const [showAssistant, setShowAssistant] = useState(false);


  const [assistantMessages, setAssistantMessages] = useState(
    assistantStarterMessages
  );


  const [assistantInput, setAssistantInput] = useState('');


  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError]     = useState('');


  const [weather, setWeather]                   = useState(null);
  const [showFeatureMenu, setShowFeatureMenu]   = useState(false);
  const [showWheel, setShowWheel]               = useState(false);
  const [wheelSpinning, setWheelSpinning]       = useState(false);
  const [wheelRotation, setWheelRotation]       = useState(0);
  const [wheelHasSpunThisLoad, setWheelHasSpunThisLoad] = useState(false);
  const [unclaimedWheelDeal, setUnclaimedWheelDeal] = useState(null);
  const [claimedWheelCoupon, setClaimedWheelCoupon] = useState(null);
  const [couponApplyEnabled, setCouponApplyEnabled] = useState(true);
  const [couponAppliedItemId, setCouponAppliedItemId] = useState(null);
  const [pendingWheelDeal, setPendingWheelDeal] = useState(null);
  const [showAllergyGuide, setShowAllergyGuide] = useState(false);
  const featureMenuRef = useRef(null);
  const assistantInputRef = useRef(null);


  const [funMode, setFunMode] = useState(() => {
    const stored = localStorage.getItem('bobaFunMode');
    return stored === null ? false : stored === 'true';
  });
  const [bobaPoints, setBobaPoints]           = useState(0);
  const [pointsFlash, setPointsFlash]         = useState(false);
  const [wizardStep, setWizardStep]           = useState(0);
  const [achievement, setAchievement]         = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [showAchievements, setShowAchievements] = useState(false);
  const [viewMode, setViewMode] = useState(() =>
    localStorage.getItem('bobaViewMode') || 'grid'
  );
  const [textSize, setTextSize] = useState(() =>
    Number(localStorage.getItem('bobaTextSize') || 0)
  );


  const [ingredientStylePreset, setIngredientStylePreset] = useState(null);

  const [ingredientSearch, setIngredientSearch] = useState('');


  // Load menu
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


  // Weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=College+Station,TX,US&appid=${apiKey}&units=imperial`
        );
        if (!res.ok) return;
        const data = await res.json();
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].main,
          icon: data.weather[0].icon,
        });
      } catch (err) {
        console.error('Weather fetch failed:', err);
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    localStorage.setItem('bobaFunMode', String(funMode));
  }, [funMode]);

  useEffect(() => { localStorage.setItem('bobaViewMode', viewMode);     }, [viewMode]);
  useEffect(() => { localStorage.setItem('bobaTextSize', String(textSize)); }, [textSize]);

  // Persist language choice across reloads
  useEffect(() => {
    localStorage.setItem('bobaLanguage', language);
  }, [language]);

  // Translate menu data and UI strings via our backend whenever the language
  // changes or the menu data lands. English is a no-op (we just clear the
  // translated state and the UI falls back to the original strings via
  // `translatedX[id] || x.name`).
  useEffect(() => {
    if (language === 'en') {
      setUiText(DEFAULT_UI_TEXT);
      setTranslatedCategories({});
      setTranslatedDrinks({});
      setTranslatedToppings({});
      return;
    }

    // Wait until menu data has loaded so we send everything in one batch
    if (categories.length === 0 || drinks.length === 0 || toppings.length === 0) {
      return;
    }

    let cancelled = false;

    const translateAll = async () => {
      // Build one flat array of strings to translate, then slice the response
      // back into the four shape-specific buckets the UI expects. Order
      // matters here — we use index offsets to demux the response.
      const uiKeys = Object.keys(DEFAULT_UI_TEXT);
      const uiValues = uiKeys.map((k) => DEFAULT_UI_TEXT[k]);
      const categoryNames = categories.map((c) => c.category_name);
      const drinkNames = drinks.map((d) => d.drink_name);
      const toppingNames = toppings.map((t) => t.topping_name);

      const allTexts = [
        ...uiValues,
        ...categoryNames,
        ...drinkNames,
        ...toppingNames,
      ];

      try {
        const target = GOOGLE_TRANSLATE_LANGUAGES[language] || language;
        const res = await fetch(toApiUrl('/api/translate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: allTexts, target }),
        });

        if (!res.ok) {
          throw new Error(`Translation request failed: ${res.status}`);
        }

        const data = await res.json();
        const translations = data.translations;

        if (cancelled) return;
        if (!Array.isArray(translations) || translations.length !== allTexts.length) {
          throw new Error('Unexpected translation response shape');
        }

        let offset = 0;

        const newUiText = {};
        uiKeys.forEach((key, i) => {
          newUiText[key] = translations[offset + i];
        });
        offset += uiKeys.length;

        const newCategories = {};
        categories.forEach((c, i) => {
          newCategories[c.category_id] = translations[offset + i];
        });
        offset += categories.length;

        const newDrinks = {};
        drinks.forEach((d, i) => {
          newDrinks[d.drink_id] = translations[offset + i];
        });
        offset += drinks.length;

        const newToppings = {};
        toppings.forEach((t, i) => {
          newToppings[t.topping_id] = translations[offset + i];
        });

        setUiText(newUiText);
        setTranslatedCategories(newCategories);
        setTranslatedDrinks(newDrinks);
        setTranslatedToppings(newToppings);
      } catch (err) {
        console.error('Translation failed, keeping English:', err);
      }
    };

    translateAll();

    return () => {
      cancelled = true;
    };
  }, [language, categories, drinks, toppings]);


  useEffect(() => {
    const closeMenuOnOutsideClick = (event) => {
      if (featureMenuRef.current && !featureMenuRef.current.contains(event.target)) {
        setShowFeatureMenu(false);
      }
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
    };
  }, []);


  // Filters
  const filteredDrinks = selectedCategory
    ? drinks.filter((d) => d.category_id === selectedCategory)
    : drinks;


  const presetCategoryNames = INGREDIENT_STYLE_PRESETS.find(
    (p) => p.id === ingredientStylePreset
  )?.categoryNames;

  const ingredientQuery = ingredientSearch.trim().toLowerCase();

  const displayDrinks = filteredDrinks.filter((d) => {
    if (presetCategoryNames && !presetCategoryNames.includes(d.category_name)) {
      return false;
    }
    if (ingredientQuery) {
      const name = (d.drink_name || '').toLowerCase();
      const cat = (d.category_name || '').toLowerCase();

      if (!name.includes(ingredientQuery) && !cat.includes(ingredientQuery)) {
        return false;
      }
    }
    return true;
  });

  // Speaks `text` using the browser's built-in Web Speech API.
  // Click the same speaker button while it's speaking to stop.
  const speakText = (text, id) => {
    if (!text) return;

    // If user clicked the same button, treat it as stop
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    // Cancel anything currently playing
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Prefer high-quality voices when available; fall back gracefully
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes('Samantha')) ||             // macOS
      voices.find((v) => v.name.includes('Aria')) ||                 // Windows 11
      voices.find((v) => v.name.includes('Jenny')) ||                // Windows 11
      voices.find((v) => v.name.includes('Google US English')) ||    // Chrome
      voices.find((v) => v.lang === 'en-US' && !v.localService) ||   // any cloud en-US
      voices.find((v) => v.lang === 'en-US') ||                      // any en-US
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Pre-load voices on mount (Chrome loads them asynchronously).
  // Also stop any speech if the user navigates away.
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, []);


  const getWeatherRecommendationReason = (drink) => {
    if (!weather) return null;

    const temp = weather.temp;
    const condition = weather.description?.toLowerCase() || '';
    const category = drink.category_name?.toLowerCase() || '';
    const name = drink.drink_name?.toLowerCase() || '';


    if (condition.includes('rain')) {
      if (
        category.includes('milk tea') ||
        category.includes('brewed tea') ||
        name.includes('brown sugar')
      ) {
        return 'Cozy pick for rainy weather';
      }
    }

    if (temp >= 80) {
      if (
        category.includes('fruit') ||
        category.includes('mojito') ||
        category.includes('ice blended')
      ) {
        return 'Recommended for hot weather';
      }
    }

    if (temp <= 60) {
      if (
        category.includes('milk tea') ||
        category.includes('fresh milk') ||
        category.includes('brewed tea')
      ) {
        return 'Recommended for cooler weather';
      }
    }


    if (temp > 60 && temp < 80) {
      if (category.includes('milk tea') || category.includes('fruit tea')) {
        return 'A great pick for today';
      }
    }

    return null;
  };


  const unlockAchievement = (id, icon, text) => {
    setUnlockedAchievements(prev => {
      if (prev.has(id)) return prev;
      setAchievement({ icon, text });
      setTimeout(() => setAchievement(null), 3200);
      return new Set([...prev, id]);
    });
  };


  // Modal
  const openModal = (drink) => {
    setModal(drink);
    setCustomization({ sugar: '100', ice: 'NORMAL_ICE', size: 'M', toppings: [] });
    setWizardStep(0);
  };


  const toggleTopping = (id) => {
    setCustomization((prev) => ({
      ...prev,
      toppings: prev.toppings.includes(id)
        ? prev.toppings.filter((t) => t !== id)
        : [...prev.toppings, id],
    }));
  };


  // Pricing
  const getSubtotal = (drink, selectedToppingIds, size = 'M') => {
    const sizeKey = size && SIZE_MULTIPLIERS[size] != null ? size : 'M';
    const toppingCost = selectedToppingIds.reduce((sum, tid) => {

      const t = toppings.find((t) => t.topping_id === tid);


      return sum + (t ? parseFloat(t.topping_price) : 0);
    }, 0);

    const sizeMultiplier = SIZE_MULTIPLIERS[sizeKey];
    return parseFloat(drink.base_price) * sizeMultiplier + toppingCost;
  };


  const isDealEligibleForItem = (item, deal) => {
    if (!item || !deal) {
      return false;
    }

    if (deal.type === 'freeTopping') {
      const toppingCosts = item.toppings
        .map((tid) => {
          const topping = toppings.find((t) => t.topping_id === tid);
          return topping ? parseFloat(topping.topping_price) : 0;
        })
        .filter((price) => price > 0);

      return toppingCosts.length > 0;
    }

    return true;
  };

  const getDealDiscountForItem = (item, deal) => {
    if (!isDealEligibleForItem(item, deal)) {
      return 0;
    }

    if (deal.type === 'percent') {
      return Number((item.total_price * deal.value).toFixed(2));
    }

    if (deal.type === 'amount') {
      return Number(Math.min(item.total_price, deal.value).toFixed(2));
    }

    if (deal.type === 'freeTopping') {
      const toppingCosts = item.toppings
        .map((tid) => {
          const topping = toppings.find((t) => t.topping_id === tid);
          return topping ? parseFloat(topping.topping_price) : 0;
        })
        .filter((price) => price > 0);

      return toppingCosts.length > 0 ? Number(Math.min(...toppingCosts).toFixed(2)) : 0;
    }

    return 0;
  };

  const getCouponDiscountForItem = (item) => {
    if (!claimedWheelCoupon || !couponApplyEnabled || couponAppliedItemId !== item.id) {
      return 0;
    }

    return getDealDiscountForItem(item, claimedWheelCoupon);
  };

  const getDiscountedUnitPrice = (item) =>
    Math.max(0, item.total_price - getCouponDiscountForItem(item));

  const applyDealToCurrentOrder = (deal) => {
    const eligibleItems = cart.filter((item) => isDealEligibleForItem(item, deal));

    if (eligibleItems.length === 0) {
      setPendingWheelDeal(deal);
      setCouponAppliedItemId(null);
      setCouponApplyEnabled(true);
      return;
    }

    const latestEligible = eligibleItems[eligibleItems.length - 1];
    setCouponAppliedItemId(latestEligible.id);
    setCouponApplyEnabled(true);

    setPendingWheelDeal(null);
  };


  const spinWheel = () => {
    if (wheelSpinning || wheelHasSpunThisLoad) {
      return;
    }

    const wheelSize = WHEEL_DEALS.length;
    const segmentSize = 360 / wheelSize;
    const selectedIndex = Math.floor(Math.random() * wheelSize);
    const segmentCenter = selectedIndex * segmentSize + segmentSize / 2;
    const extraSpins = 5 + Math.floor(Math.random() * 2);
    const newRotation = wheelRotation + extraSpins * 360 + (360 - segmentCenter);

    setUnclaimedWheelDeal(null);
    setWheelSpinning(true);
    setWheelRotation(newRotation);

    setTimeout(() => {
      const winningDeal = WHEEL_DEALS[selectedIndex];
      setUnclaimedWheelDeal(winningDeal);
      setWheelHasSpunThisLoad(true);
      setWheelSpinning(false);
    }, 3200);
  };

  const claimWheelCoupon = () => {
    if (!unclaimedWheelDeal) {
      return;
    }

    setClaimedWheelCoupon(unclaimedWheelDeal);
    applyDealToCurrentOrder(unclaimedWheelDeal);
    setUnclaimedWheelDeal(null);
  };


  // Cart
  const addToCart = () => {
    const total = getSubtotal(modal, customization.toppings, customization.size);

    const baseCartItem = {

      id: Date.now(),


      drink: modal,


      qty: 1,


      sweetness_level: customization.sugar,
      ice_level: customization.ice,
      size: customization.size,
      toppings: customization.toppings,


      total_price: total,
    };

    setCart((prev) => [...prev, baseCartItem]);


    if (funMode) {
      setBobaPoints(prev => prev + 10);
      setPointsFlash(true);
      setTimeout(() => setPointsFlash(false), 600);
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#c8773a', '#4a2c0a', '#fdf6ec', '#f4a462', '#fff8f0'],
      });
      if (cart.length === 0) {
        unlockAchievement('firstDrink', '🏆', 'First Boba!');
      }
      if (customization.toppings.length > 0) {
        unlockAchievement('topper', '⭐', 'Topping Explorer!');
      }
    }
    setModal(null);
  };


  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));


  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => prev.map((item) =>
      item.id === id ? { ...item, qty: newQty } : item
    ));
  };


  const cartTotal = cart.reduce((sum, i) => sum + i.total_price * i.qty, 0);
  const discountedCartTotal = cart.reduce(
    (sum, i) => sum + getDiscountedUnitPrice(i) * i.qty,
    0
  );
  const eligibleCouponItems = claimedWheelCoupon
    ? cart.filter((item) => isDealEligibleForItem(item, claimedWheelCoupon))
    : [];


  useEffect(() => {
    if (!claimedWheelCoupon) {
      return;
    }

    const latestEligible = eligibleCouponItems[eligibleCouponItems.length - 1];

    if (pendingWheelDeal) {
      if (latestEligible) {
        setCouponAppliedItemId(latestEligible.id);
        setPendingWheelDeal(null);
      }
      return;
    }

    if (!latestEligible) {
      if (couponAppliedItemId !== null) {
        setCouponAppliedItemId(null);
      }
      setPendingWheelDeal(claimedWheelCoupon);
      return;
    }

    if (
      couponAppliedItemId === null ||
      !eligibleCouponItems.some((item) => item.id === couponAppliedItemId)
    ) {
      setCouponAppliedItemId(latestEligible.id);
    }
  }, [
    cart,
    claimedWheelCoupon,
    couponAppliedItemId,
    eligibleCouponItems,
    pendingWheelDeal,
  ]);


  // Order
  const placeOrder = async () => {

    if (cart.length === 0 || placingOrder) {
      return;
    }

    try {

      setPlacingOrder(true);
      setApiError('');


      const payload = {
        user_id: 1,
        items: cart.map((item) => ({
          drink_id: item.drink.drink_id,
          qty: item.qty,
          sweetness_level: item.sweetness_level,
          ice_level: item.ice_level,
          drink_size: item.size && ['S', 'M', 'L'].includes(item.size) ? item.size : 'M',
          drink_unit_price: Number(Number(item.total_price).toFixed(2)),
          toppings: item.toppings,
          total_price: Number((getDiscountedUnitPrice(item) * item.qty).toFixed(2)),
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
      setClaimedWheelCoupon(null);
      setCouponApplyEnabled(true);
      setCouponAppliedItemId(null);
      setPendingWheelDeal(null);
      setShowCart(false);
      setOrderPlaced(true);


      setTimeout(() => setOrderPlaced(false), 4000);
      if (funMode) {
        setBobaPoints(prev => prev + 50);
        setPointsFlash(true);
        setTimeout(() => setPointsFlash(false), 600);
        confetti({
          particleCount: 150, spread: 100, origin: { y: 0.55 },
          colors: ['#c8773a', '#4a2c0a', '#fdf6ec', '#f4a462', '#fff8f0', '#ffc857'],
        });
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 80, angle: 60,  origin: { x: 0, y: 0.6 }, colors: ['#c8773a', '#4a2c0a', '#fdf6ec'] });
          confetti({ particleCount: 100, spread: 80, angle: 120, origin: { x: 1, y: 0.6 }, colors: ['#c8773a', '#4a2c0a', '#fdf6ec'] });
        }, 350);
        unlockAchievement('firstOrder', '🎮', 'Order Champion!');
      }
    } catch (err) {

      console.error(err);


      setApiError('Could not place order. Please try again.');
    } finally {

      setPlacingOrder(false);
    }
  };


  const getSugarLabel = (val) =>
    SUGAR_LEVELS.find((s) => s.value === val)?.label || val;


  const getIceLabel = (val) => {
    if (val === 'HOT') return uiText.hot || 'Hot';
    return getIceDisplayLabel(val);
  };

  const getIceDisplayLabel = (value) => {
    if (value === 'NO_ICE') return uiText.noIce || 'No Ice';
    if (value === 'LESS_ICE') return uiText.lessIce || 'Less Ice';
    if (value === 'NORMAL_ICE') return uiText.regular || 'Regular';
    if (value === 'HOT') return uiText.hot || 'Hot';
    return ICE_LEVELS.find((i) => i.value === value)?.label || value;
  };

  const getSugarDisplayLabel = (value) => {
    if (value === '0') return uiText.noSugar || 'No Sugar';
    if (value === '50') return uiText.littleSugar || 'A Little';
    if (value === '100') return uiText.fullSweet || 'Full Sweet';
    if (value === '125') return uiText.extraSweet || 'Extra Sweet';
    return SUGAR_LEVELS.find((s) => s.value === value)?.label || value;
  };

  const getToppingDisplayName = (topping) =>
    translatedToppings[topping.topping_id] || topping.topping_name;


  const translateText = async (text) => text;

  const translateBatch = async (texts) => texts;


  const currentCategoryName =
    selectedCategory === null
      ? uiText.all
      : translatedCategories[selectedCategory] ||
        categories.find((c) => c.category_id === selectedCategory)?.category_name ||
        'Selected category';

  const showTouchKeyboard = () => {
    const virtualKeyboard = navigator.virtualKeyboard;
    if (virtualKeyboard && typeof virtualKeyboard.show === 'function') {
      try {
        virtualKeyboard.show();
      } catch (err) {
        console.error('Could not open touchscreen keyboard:', err);
      }
    }
  };


  // Assistant
  const sendAssistantMessage = async (prompt) => {
    const messageText = (prompt ?? assistantInput).trim();


    if (!messageText || assistantLoading) {
      return;
    }


    const nextMessages = [
      ...assistantMessages,
      { role: 'user', content: messageText },
    ];


    setAssistantMessages(nextMessages);


    setAssistantInput('');
    setAssistantLoading(true);
    setAssistantError('');

    try {

      const response = await fetch(toApiUrl('/api/assistant/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });


      if (!response.ok) {
        throw new Error('Assistant request failed');
      }


      const data = await response.json();


      setAssistantMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {

      console.error(err);


      setAssistantError(
        'The assistant could not respond right now. Please try again.'
      );
    } finally {

      setAssistantLoading(false);
    }
  };


  const TEXT_SCALES = [1, 1.25, 1.55];
  const ts = TEXT_SCALES[textSize];
  const wheelGradient = `conic-gradient(${WHEEL_DEALS.map((deal, index) => {
    const start = (index * 360) / WHEEL_DEALS.length;
    const end = ((index + 1) * 360) / WHEEL_DEALS.length;
    return `${deal.color} ${start}deg ${end}deg`;
  }).join(', ')})`;

  const assistantPlaceholder =
    language === 'es'
      ? 'Pregunta sobre el menú...'
      : language === 'fr'
      ? 'Demandez sur le menu...'
      : language === 'hi'
      ? 'मेनू के बारे में पूछें...'
      : language === 'zh'
      ? '询问菜单...'
      : 'Ask something about the menu or ordering...';

  // Render
  return (
    <div style={s.root}>
      <a href="#drink-grid" className="customer-skip-link" style={s.skipLink}>
        Skip to drinks
      </a>
      <style>{`
        .customer-skip-link:focus,
        .customer-skip-link:focus-visible {
          left: 1rem !important;
          outline: 3px solid #c8773a;
          outline-offset: 2px;
        }
        @keyframes pointsPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        .fun-btn {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .fun-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 4px 14px rgba(200, 119, 58, 0.4);
        }
        .fun-btn:active {
          transform: scale(0.91);
          transition: transform 0.08s ease;
        }
        .fun-card {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .points-pop {
          display: inline-block;
          animation: pointsPop 600ms ease-out;
        }
        @keyframes achievementSlide {
          0%   { transform: translateX(120%); opacity: 0; }
          15%  { transform: translateX(0);    opacity: 1; }
          80%  { transform: translateX(0);    opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        .achievement-toast {
          animation: achievementSlide 3.2s ease forwards;
        }
      `}</style>


      <div style={s.navShell}>
        <header style={s.header}>
          <div style={s.headerInner}>
            <div style={s.headerLeft}>
              <h1 style={s.logo}>🧋 {uiText.title}</h1>

              {weather && (
                <div
                  style={s.weatherChip}
                  aria-label={`Current weather: ${weather.temp}°F, ${weather.description}`}
                >
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                    alt={weather.description}
                    style={{ width: '28px', height: '28px' }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {weather.temp}°F
                  </span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                    {weather.description}
                  </span>
                </div>
              )}

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  padding: '0.4rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                }}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="hi">Hindi</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <div style={s.headerActions}>
              {funMode && (
                <button
                  type="button"
                  style={s.pointsBadge}
                  className={pointsFlash ? 'points-pop' : ''}
                  onClick={() => setShowAchievements(true)}
                >
                  ⭐ {bobaPoints} pts
                </button>
              )}

              <div style={s.featureMenuWrap} ref={featureMenuRef}>
                <button
                  type="button"
                  style={s.featureMenuBtn}
                  onClick={() => setShowFeatureMenu((prev) => !prev)}
                >
                  ✨ Features
                </button>
              </div>

              <button
                type="button"
                style={s.cartBtn}
                onClick={() => setShowCart(true)}
              >
                🛒 Cart {cart.length > 0 && <span style={s.cartBadge}>{cart.length}</span>}
              </button>
            </div>
          </div>

          <div style={s.categoryBarWrap}>
            <p style={s.categoryBarLabel} id="category-nav-label">
              {uiText.browseByCategory || 'Browse by category'}
            </p>
            <nav style={s.categoryBar} aria-labelledby="category-nav-label">
              <button
                style={{ ...s.catBtn, ...(selectedCategory === null ? s.catBtnActive : {}), fontSize: `${0.78 * ts}rem` }}
                onClick={() => setSelectedCategory(null)}
                aria-pressed={selectedCategory === null}
                aria-label="Show all categories"
              >
                {uiText.all}
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  style={{ ...s.catBtn, ...(selectedCategory === cat.category_id ? s.catBtnActive : {}), fontSize: `${0.78 * ts}rem` }}
                  onClick={() => setSelectedCategory(cat.category_id)}
                  aria-pressed={selectedCategory === cat.category_id}
                  aria-label={`Show ${cat.category_name} drinks`}
                >
                  {categoryEmojis[cat.category_name] || '🍹'} {translatedCategories[cat.category_id] || cat.category_name}
                </button>
              ))}
            </nav>
          </div>


          <div style={s.controlsBar}>
            <div style={s.controlsBarInner}>
              <div style={s.controlCluster}>
                <span style={s.controlClusterLabel}>Layout</span>
                <div style={s.viewToggleGroup} role="group" aria-label="View mode">
                  <button
                    style={{ ...s.viewBtn, ...(viewMode === 'grid' ? s.viewBtnActive : {}) }}
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    aria-label="Grid view"
                    title="Grid view"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                      <rect x="0" y="0" width="7" height="7" rx="1.5" />
                      <rect x="11" y="0" width="7" height="7" rx="1.5" />
                      <rect x="0" y="11" width="7" height="7" rx="1.5" />
                      <rect x="11" y="11" width="7" height="7" rx="1.5" />
                    </svg>
                  </button>
                  <button
                    style={{ ...s.viewBtn, ...(viewMode === 'list' ? s.viewBtnActive : {}) }}
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    aria-label="List view"
                    title="List view"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                      <rect x="0" y="1" width="18" height="4" rx="1.5" />
                      <rect x="0" y="7" width="18" height="4" rx="1.5" />
                      <rect x="0" y="13" width="18" height="4" rx="1.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={s.controlCluster}>
                <span style={s.controlClusterLabel}>Text</span>
                <div style={s.sizeGroup} role="group" aria-label="Text size">
                  <button
                    style={s.sizeBtn}
                    onClick={() => setTextSize((prev) => Math.max(0, prev - 1))}
                    aria-label="Decrease text size"
                    disabled={textSize === 0}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>A</span>
                  </button>
                  <button
                    style={s.sizeBtn}
                    onClick={() => setTextSize((prev) => Math.min(2, prev + 1))}
                    aria-label="Increase text size"
                    disabled={textSize === 2}
                  >
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>A</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <p style={s.visuallyHidden} role="status" aria-live="polite">
        Showing {displayDrinks.length} drinks in {currentCategoryName}
        {ingredientStylePreset ? ' with an extra style filter' : ''}
        {ingredientQuery ? ' matching your ingredient search' : ''}. Cart has{' '}
        {cart.length} item{cart.length === 1 ? '' : 's'}.
      </p>

      {loadingMenu && <p style={s.statusMessage}>{uiText.loadingMenu}</p>}
      {apiError && <p style={s.errorMessage}>{apiError}</p>}

      <main
        id="drink-grid"
        style={viewMode === 'list' ? s.listGrid : s.grid}
        aria-label={`${currentCategoryName} drink menu`}
      >
        {displayDrinks.map(drink => viewMode === 'list' ? (
          <button
            key={drink.drink_id}
            style={s.listCard}
            className={funMode ? 'fun-card' : ''}
            onClick={() => openModal(drink)}
            aria-label={`${translatedDrinks[drink.drink_id] || drink.drink_name}, ${drink.category_name}, ${parseFloat(drink.base_price).toFixed(2)} dollars. Open customization.`}
          >
            <div style={{ fontSize: `${2.5 * ts}rem`, lineHeight: 1, flexShrink: 0 }}>{categoryEmojis[drink.category_name] || '🍹'}</div>
            <div style={s.listCardInfo}>
              <div style={{ ...s.drinkName,     fontSize: `${1.05 * ts}rem` }}>{translatedDrinks[drink.drink_id] || drink.drink_name}</div>
              <div style={{ ...s.drinkCategory, fontSize: `${0.8 * ts}rem` }}>
                {translatedCategories[drink.category_id] || drink.category_name}
              </div>
            </div>
            <div style={{ ...s.drinkPrice, fontSize: `${1.15 * ts}rem`, marginLeft: 'auto', flexShrink: 0 }}>${parseFloat(drink.base_price).toFixed(2)}</div>
            {getWeatherRecommendationReason(drink) && (<div style={s.weatherRecommendation}> ☁️ {getWeatherRecommendationReason(drink)}</div>)}
          </button>
        ) : (
          <button
            key={drink.drink_id}
            style={s.drinkCard}
            className={funMode ? 'fun-card' : ''}
            onClick={() => openModal(drink)}
            aria-label={`${translatedDrinks[drink.drink_id] || drink.drink_name}, ${drink.category_name}, ${parseFloat(
              drink.base_price
            ).toFixed(2)} dollars. Open customization.`}
          >
            <div style={{ ...(funMode ? s.drinkEmojiLarge : s.drinkEmoji), fontSize: `${(funMode ? 3.8 : 2.5) * ts}rem` }}>{categoryEmojis[drink.category_name] || '🍹'}</div>
            <div style={{ ...s.drinkName,     fontSize: `${0.95 * ts}rem` }}>{translatedDrinks[drink.drink_id] || drink.drink_name}</div>
            <div style={{ ...s.drinkCategory, fontSize: `${0.75 * ts}rem` }}>
              {translatedCategories[drink.category_id] || drink.category_name}
            </div>
            <div style={s.drinkPriceRow}>
              <div style={{ ...s.drinkPrice, fontSize: `${1.1 * ts}rem` }}>
                ${parseFloat(drink.base_price).toFixed(2)}
              </div>
              <span
                role="button"
                tabIndex={0}
                style={s.speakBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(
                    `${drink.drink_name}. ${drink.category_name}. ${parseFloat(drink.base_price).toFixed(2)} dollars.`,
                    drink.drink_id
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    speakText(
                      `${drink.drink_name}. ${drink.category_name}. ${parseFloat(drink.base_price).toFixed(2)} dollars.`,
                      drink.drink_id
                    );
                  }
                }}
                aria-label={`Read ${drink.drink_name} aloud`}
                title={speakingId === drink.drink_id ? 'Stop' : 'Read aloud'}
              >
                {speakingId === drink.drink_id ? '⏸️' : '🔊'}
              </span>
            </div>
            {getWeatherRecommendationReason(drink) && (
              <div style={s.weatherRecommendation}> ☁️ {getWeatherRecommendationReason(drink)} </div>
            )}
          </button>
        ))}

        {!loadingMenu && !apiError && displayDrinks.length === 0 && (
          <p style={s.emptyFilterMessage}>
            No drinks match your filters. Try another category, clear the style shortcut, or adjust your search.
          </p>
        )}
      </main>


      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div
            style={funMode ? s.wizardBox : s.modalBox}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customize-drink-title"
          >
            {funMode ? (
              <>
                <button style={s.wizardCloseBtn} onClick={() => setModal(null)} aria-label="Exit customization">✕</button>
                <div style={s.wizardHeader}>
                  <div style={s.wizardBigEmoji}>{categoryEmojis[modal.category_name] || '🍹'}</div>
                  <h2 id="customize-drink-title" style={s.wizardDrinkName}>{translatedDrinks[modal.drink_id] || modal.drink_name}</h2>
                  {wizardStep >= 1 && (
                    <div style={s.wizardSummary} aria-label="Your choices so far">
                      <span style={s.wizardSummaryChip}>
                        {WIZARD_SUGAR[customization.sugar].emoji} {getSugarDisplayLabel(customization.sugar)}
                      </span>
                      {wizardStep >= 2 && (
                        <span style={s.wizardSummaryChip}>
                          {WIZARD_ICE[customization.ice].emoji} {getIceDisplayLabel(customization.ice)}
                        </span>
                      )}
                      {customization.toppings.length > 0 && (
                        <span style={s.wizardSummaryChip}>
                          🧆 {customization.toppings.length} topping{customization.toppings.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={s.wizardDots} aria-label={`Step ${wizardStep + 1} of 4`}>
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} style={{ ...s.wizardDot, ...(i === wizardStep ? s.wizardDotActive : {}) }} />
                  ))}
                </div>
                {wizardStep === 0 && (
                  <div style={s.wizardStep}>
                    <p style={s.wizardQuestion}>{uiText.howSweet} 🍬</p>
                    <div style={s.wizardOptions} role="group" aria-label={uiText.sweetness}>
                      {[
                        { value: '0',   emoji: '🚫', label: 'No Sugar'  },
                        { value: '50',  emoji: '🍬', label: 'A Little'  },
                        { value: '100', emoji: '🍭', label: 'Full Sweet' },
                      ].map(({ value, emoji, label }) => (
                        <button
                          key={value}
                          style={{ ...s.wizardOptBtn, ...(customization.sugar === value ? s.wizardOptBtnActive : {}) }}
                          onClick={() => { setCustomization(prev => ({ ...prev, sugar: value })); setWizardStep(2); }}
                          aria-pressed={customization.sugar === value}
                          aria-label={`Sweetness: ${getSugarDisplayLabel(value)}`}
                        >
                          <span style={s.wizardOptEmoji}>{emoji}</span>
                          <span style={s.wizardOptLabel}>{value === 'HOT' || value.includes('ICE') ? getIceDisplayLabel(value) : getSugarDisplayLabel(value)}</span>
                        </button>
                      ))}
                    </div>
                    <button style={s.wizardBackBtn} onClick={() => setWizardStep(0)}>← Back</button>
                  </div>
                )}
                {wizardStep === 2 && (
                  <div style={s.wizardStep}>
                    <p style={s.wizardQuestion}>{modal.category_name === 'Hot Drinks' ? `${uiText.howHot} ☕` : `${uiText.howCold} 🧊`}</p>
                    <div style={s.wizardOptions} role="group" aria-label={modal.category_name === 'Hot Drinks' ? 'Temperature' : 'Ice level'}>
                      {(modal.category_name === 'Hot Drinks' ? [
                        { value: 'HOT', emoji: '☕', label: 'Hot' }
                      ] : [
                        { value: 'NO_ICE',     emoji: '🌡️', label: 'No Ice'   },
                        { value: 'LESS_ICE',   emoji: '🧊', label: 'Less Ice'  },
                        { value: 'NORMAL_ICE', emoji: '❄️', label: 'Regular'   },
                      ]).map(({ value, emoji, label }) => (
                        <button
                          key={value}
                          style={{ ...s.wizardOptBtn, ...(customization.ice === value ? s.wizardOptBtnActive : {}) }}
                          onClick={() => { setCustomization(prev => ({ ...prev, ice: value })); setWizardStep(3); }}
                          aria-pressed={customization.ice === value}
                          aria-label={`${modal.category_name === 'Hot Drinks' ? uiText.temperature : uiText.iceLevel}: ${getIceDisplayLabel(value)}`}
                        >
                          <span style={s.wizardOptEmoji}>{emoji}</span>
                          <span style={s.wizardOptLabel}>{value === 'HOT' || value.includes('ICE') ? getIceDisplayLabel(value) : getSugarDisplayLabel(value)}</span>
                        </button>
                      ))}
                    </div>
                    <button style={s.wizardBackBtn} onClick={() => setWizardStep(0)}>← {uiText.back}</button>
                  </div>
                )}
                {wizardStep === 3 && (
                  <div style={s.wizardStep}>
                    <p style={s.wizardQuestion}>{uiText.anyExtras} ✨</p>
                    <div style={s.wizardToppingGrid} role="group" aria-label="Toppings">
                      {toppings.map(t => (
                        <button
                          key={t.topping_id}
                          style={{ ...s.wizardToppingBtn, ...(customization.toppings.includes(t.topping_id) ? s.wizardToppingBtnActive : {}) }}
                          onClick={() => toggleTopping(t.topping_id)}
                          aria-pressed={customization.toppings.includes(t.topping_id)}
                          aria-label={`${getToppingDisplayName(t)}, add ${parseFloat(t.topping_price).toFixed(2)} dollars`}
                        >
                          <span style={{ fontSize: '1.5rem' }}>🧆</span>
                          <span>{getToppingDisplayName(t)}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>+${parseFloat(t.topping_price).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                    <div style={s.wizardFooter}>
                      <button style={s.wizardBackBtn} onClick={() => setWizardStep(1)}>← {uiText.back}</button>
                      <span style={s.wizardTotal}>${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)}</span>
                      <button style={s.wizardAddBtn} className="fun-btn" onClick={addToCart} aria-label={`Add ${modal.drink_name} to cart`}>
                        Add to Cart 🛒
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  style={s.modalCloseBtn}
                  onClick={() => setModal(null)}
                  aria-label="Close customization"
                >
                  ✕
                </button>
                <div style={{ fontSize: `${3 * ts}rem`, textAlign: 'center', lineHeight: 1, marginBottom: '0.5rem' }}>{categoryEmojis[modal.category_name] || '🍹'}</div>
                <h2 id="customize-drink-title" style={{ ...s.modalTitle,    fontSize: `${1.4  * ts}rem` }}>{translatedDrinks[modal.drink_id] || modal.drink_name}</h2>
                <p                             style={{ ...s.modalCategory, fontSize: `${0.85 * ts}rem` }}>{translatedCategories[modal.category_id] || modal.category_name}</p>
                <div style={s.section}>
                  <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.sweetness}</p>
                  <div style={s.optionRow} role="group" aria-label={uiText.sweetness}>
                    {SUGAR_LEVELS.map(({ label, value }) => (
                      <button key={value}
                        style={{ ...s.optBtn, ...(customization.sugar === value ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                        onClick={() => setCustomization(prev => ({ ...prev, sugar: value }))}
                        aria-pressed={customization.sugar === value}
                        aria-label={`Set sweetness to ${label}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <div style={s.section}>
                  <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.size}</p>
                  <div style={s.optionRow} role="group" aria-label="Size">
                    {SIZE_LEVELS.map(({ label, value }) => (
                      <button key={value}
                        style={{ ...s.optBtn, ...(customization.size === value ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                        onClick={() => setCustomization(prev => ({ ...prev, size: value }))}
                        aria-pressed={customization.size === value}
                        aria-label={`Set size to ${label}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                {modal.category_name !== 'Hot Drinks' && (
                  <div style={s.section}>
                    <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.iceLevel}</p>
                    <div style={s.optionRow} role="group" aria-label="Ice level">
                      {ICE_LEVELS.map(({ label, value }) => (
                        <button key={value}
                          style={{ ...s.optBtn, ...(customization.ice === value ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                          onClick={() => setCustomization(prev => ({ ...prev, ice: value }))}
                          aria-pressed={customization.ice === value}
                          aria-label={`Set ice level to ${label}`}
                        >{getIceDisplayLabel(value)}</button>
                      ))}
                    </div>
                  </div>
                )}
                {modal.category_name === 'Hot Drinks' && (
                  <div style={s.section}>
                    <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.temperature}</p>
                    <div style={s.optionRow} role="group" aria-label="Temperature">
                      <button
                        style={{ ...s.optBtn, ...(customization.ice === 'HOT' ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                        onClick={() => setCustomization(prev => ({ ...prev, ice: 'HOT' }))}
                        aria-pressed={customization.ice === 'HOT'}
                        aria-label="Hot temperature"
                      >{uiText.hot}</button>
                    </div>
                  </div>
                )}
                <div style={s.section}>
                  <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.toppings}</p>
                  <div style={s.toppingGrid} role="group" aria-label="Toppings">
                    {toppings.map(t => (
                      <button key={t.topping_id}
                        style={{ ...s.toppingBtn, ...(customization.toppings.includes(t.topping_id) ? s.toppingBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                        onClick={() => toggleTopping(t.topping_id)}
                        aria-pressed={customization.toppings.includes(t.topping_id)}
                        aria-label={`Add ${getToppingDisplayName(t)} topping`}
                      >{getToppingDisplayName(t)} (+${parseFloat(t.topping_price).toFixed(2)})</button>
                    ))}
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <span style={{ ...s.modalTotal, fontSize: `${1.4 * ts}rem` }}>${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)}</span>
                  <button style={{ ...s.addBtn, fontSize: `${1 * ts}rem` }} onClick={addToCart} aria-label={`Add ${modal.drink_name} to cart`}>Add to Cart</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {showCart && (
        <div style={s.overlay} onClick={() => setShowCart(false)}>
          <div style={s.cartOverlayContent} onClick={(e) => e.stopPropagation()}>
            <div
              style={s.cartDrawer}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
            >
              <div style={s.cartHeader}>
                <h2 id="cart-title" style={s.cartTitle}>
                  Your Order
                </h2>
                <button
                  type="button"
                  style={s.cartCloseBtn}
                  onClick={() => setShowCart(false)}
                  aria-label="Close cart"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p style={s.emptyCart}>Your cart is empty.</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} style={s.cartItem}>
                      <div style={s.cartItemInfo}>
                        <div style={s.cartItemName}>
                          {item.drink.drink_name}
                        </div>

                        <div style={s.cartItemMeta}>
                          Size {item.size} · {getSugarLabel(item.sweetness_level)} sweet ·{' '}
                          {getIceLabel(item.ice_level)}
                          {item.toppings.length > 0 && (
                            <>
                              {' '}
                              ·{' '}
                              {item.toppings
                                .map(
                                  (tid) =>
                                    toppings.find((t) => t.topping_id === tid)
                                      ?.topping_name
                                )
                                .filter(Boolean)
                                .join(', ')}
                            </>
                          )}
                          {getCouponDiscountForItem(item) > 0 && (
                            <>
                              {' '}
                              · Promo: {claimedWheelCoupon?.label}
                            </>
                          )}
                        </div>
                      </div>

                      <div style={s.cartItemRight}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <button
                            style={{ ...s.quantityBtn, fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            aria-label={`Decrease quantity of ${item.drink.drink_name}`}
                          >
                            −
                          </button>
                          <span style={{ fontSize: '1rem', minWidth: '2rem', textAlign: 'center' }}>
                            {item.qty}
                          </span>
                          <button
                            style={{ ...s.quantityBtn, fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            aria-label={`Increase quantity of ${item.drink.drink_name}`}
                          >
                            +
                          </button>
                        </div>
                        {getCouponDiscountForItem(item) > 0 ? (
                          <div style={s.cartPriceStack}>
                            <span style={s.cartItemOldPrice}>
                              ${(item.total_price * item.qty).toFixed(2)}
                            </span>
                            <span style={s.cartItemPrice}>
                              ${(getDiscountedUnitPrice(item) * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span style={s.cartItemPrice}>
                            ${(item.total_price * item.qty).toFixed(2)}
                          </span>
                        )}
                        <button
                          style={s.removeBtn}
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.drink.drink_name} from cart`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  <div style={s.cartTotalRow}>
                    <span>Total {(discountedCartTotal < cartTotal) && <span style={s.cartSavings}>(${(cartTotal - discountedCartTotal).toFixed(2)} saved)</span>}</span>
                    <span style={s.cartTotalAmt}>${discountedCartTotal.toFixed(2)}</span>
                  </div>
                  <button style={s.placeOrderBtn} className={funMode ? 'fun-btn' : ''} onClick={placeOrder} aria-label="Place order" disabled={placingOrder}>
                    {placingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                </>
              )}
            </div>

            <div
              style={s.couponDrawer}
              role="dialog"
              aria-modal="true"
              aria-labelledby="coupon-title"
            >
              <h2 id="coupon-title" style={s.couponTitle}>Coupon</h2>

              {claimedWheelCoupon ? (
                <>
                  <div style={s.cartCouponLabel}>{claimedWheelCoupon.label}</div>
                  <div style={s.cartCouponActions}>
                    <button
                      type="button"
                      style={{ ...s.cartCouponActionBtn, ...(couponApplyEnabled ? s.cartCouponActionBtnActive : {}) }}
                      onClick={() => setCouponApplyEnabled(true)}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      style={{ ...s.cartCouponActionBtn, ...(!couponApplyEnabled ? s.cartCouponActionBtnActive : {}) }}
                      onClick={() => setCouponApplyEnabled(false)}
                    >
                      Do Not Apply
                    </button>
                  </div>
                  {couponApplyEnabled && eligibleCouponItems.length > 0 && (
                    <select
                      style={s.cartCouponSelect}
                      value={couponAppliedItemId ?? eligibleCouponItems[eligibleCouponItems.length - 1].id}
                      onChange={(event) => setCouponAppliedItemId(Number(event.target.value))}
                    >
                      {eligibleCouponItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          Apply to: {item.drink.drink_name}
                        </option>
                      ))}
                    </select>
                  )}
                  {couponApplyEnabled && eligibleCouponItems.length === 0 && (
                    <div style={s.cartCouponQueued}>No eligible drink yet. Coupon will wait.</div>
                  )}
                </>
              ) : (
                <p style={s.couponEmpty}>No coupon claimed yet. Spin the wheel to unlock one.</p>
              )}
            </div>
          </div>
        </div>
      )}


      {showWheel && (
        <div style={s.overlay} onClick={() => setShowWheel(false)}>
          <div
            style={s.wheelModal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wheel-title"
          >
            <div style={s.wheelHeader}>
              <h2 id="wheel-title" style={s.wheelTitle}>🎡 Spin the Deal Wheel</h2>
              <button
                type="button"
                style={s.wheelCloseBtn}
                onClick={() => setShowWheel(false)}
                aria-label="Close spin wheel"
              >
                ✕
              </button>
            </div>

            <p style={s.wheelLimitNote}>One spin per visit</p>
            <p style={s.wheelHint}>Spin to unlock a deal for this order, then claim your coupon.</p>
            {unclaimedWheelDeal ? (
              <div style={s.wheelCouponCard}>
                <p style={s.wheelCouponTitle}>Ready To Claim</p>
                <p style={s.wheelCouponText}>{unclaimedWheelDeal.label}</p>
              </div>
            ) : pendingWheelDeal ? (
              <div style={s.wheelCouponCard}>
                <p style={s.wheelCouponTitle}>Queued Coupon</p>
                <p style={s.wheelCouponText}>{pendingWheelDeal.label}</p>
              </div>
            ) : claimedWheelCoupon ? (
              <div style={s.wheelCouponCard}>
                <p style={s.wheelCouponTitle}>Applied Coupon</p>
                <p style={s.wheelCouponText}>{claimedWheelCoupon.label}</p>
              </div>
            ) : null}

            <div style={s.wheelStage}>
              <div style={s.wheelPointer}>▼</div>
              <div
                style={{
                  ...s.wheelDisc,
                  background: wheelGradient,
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: wheelSpinning ? 'transform 3.2s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none',
                }}
              >
                {WHEEL_DEALS.map((deal, index) => {
                  const angle = (360 / WHEEL_DEALS.length) * index + 45;
                  return (
                    <span
                      key={deal.id}
                      style={{
                        ...s.wheelSegmentLabel,
                        transform: `rotate(${angle}deg) translateY(-78px) rotate(${-angle}deg) translate(-50%, -50%)`,
                      }}
                    >
                      {deal.short}
                    </span>
                  );
                })}
                <div style={s.wheelHub} />
              </div>
            </div>

            <button
              type="button"
              style={{
                ...s.wheelSpinBtn,
                ...((wheelSpinning || wheelHasSpunThisLoad) ? s.wheelSpinBtnDisabled : {}),
              }}
              onClick={spinWheel}
              disabled={wheelSpinning || wheelHasSpunThisLoad}
            >
              {wheelSpinning ? 'Spinning...' : (wheelHasSpunThisLoad ? 'Spin Used This Load' : 'Spin')}
            </button>

            {unclaimedWheelDeal && !wheelSpinning && (
              <button
                type="button"
                style={s.wheelClaimBtn}
                onClick={claimWheelCoupon}
              >
                Claim Coupon
              </button>
            )}
          </div>
        </div>
      )}


      {orderPlaced && (
        <div style={s.toast} role="status" aria-live="polite">
          ✅ Order placed! Thank you!
        </div>
      )}

      {funMode && achievement && (
        <div style={s.achievementToast} className="achievement-toast" role="status" aria-live="polite">
          <span style={s.achievementIcon}>{achievement.icon}</span>
          <div>
            <div style={s.achievementLabel}>Achievement Unlocked!</div>
            <div style={s.achievementName}>{achievement.text}</div>
          </div>
        </div>
      )}


      {showAchievements && (
        <div style={s.overlay} onClick={() => setShowAchievements(false)}>
          <div
            style={s.achievementsPanel}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievements-title"
          >
            <div style={s.achievementsPanelHeader}>
              <h2 id="achievements-title" style={s.achievementsPanelTitle}>🏆 Achievements</h2>
              <button style={s.achievementsCloseBtn} onClick={() => setShowAchievements(false)} aria-label="Close achievements">✕</button>
            </div>
            <p style={s.achievementsPanelSub}>
              {unlockedAchievements.size} of {ACHIEVEMENTS.length} unlocked
            </p>
            <div style={s.achievementsList}>
              {ACHIEVEMENTS.map(a => {
                const earned = unlockedAchievements.has(a.id);
                return (
                  <div key={a.id} style={{ ...s.achievementsItem, ...(earned ? s.achievementsItemEarned : s.achievementsItemLocked) }}>
                    <span style={s.achievementsItemIcon}>{earned ? a.icon : '🔒'}</span>
                    <div style={s.achievementsItemInfo}>
                      <div style={s.achievementsItemName}>{earned ? a.name : '???'}</div>
                      <div style={s.achievementsItemHint}>{earned ? a.hint : 'Keep playing to unlock!'}</div>
                    </div>
                    {earned && <span style={s.achievementsItemBadge}>✅</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {showAllergyGuide && (
        <div style={s.overlay} onClick={() => setShowAllergyGuide(false)}>
          <div
            style={s.modalBox}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="allergy-guide-title"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 id="allergy-guide-title" style={s.modalTitle}>Allergies & Sensitivities</h2>
              <button
                style={s.assistantClose}
                onClick={() => setShowAllergyGuide(false)}
                aria-label="Close allergy guide"
              >
                ✕
              </button>
            </div>
            <div style={s.guideSection}>
              <h3 style={s.guideSectionTitle}>Common Ingredients</h3>
              <ul style={s.guideList}>
                <li>
                  <strong>Tea bases</strong> — black, green, jasmine, or oolong tea, brewed and paired with ice, milk,
                  fruit, or syrups depending on the drink.
                </li>
                <li>
                  <strong>Milk & cream</strong> — dairy milk, creamers, or toppings like cheese foam on some recipes.
                </li>
                <li>
                  <strong>Sweetness & ice</strong> — set in the drink window (0–100% sugar; no ice through regular ice).
                </li>
                <li>
                  <strong>Tapioca (boba)</strong> — chewy pearls from tapioca starch; other add-ons may include jellies,
                  pudding, aloe, beans, or popping pearls.
                </li>
                <li>
                  <strong>Flavorings</strong> — fruit purees, powders (matcha, taro), brown sugar, and seasonal syrups.
                </li>
              </ul>
            </div>
            <div style={s.guideSection}>
              <p style={s.guideDisclaimer}>
                ⚠️ <strong>Important:</strong> Recipes and suppliers can change. Shared blenders, shakers, and prep areas
                mean traces of dairy, nuts, gluten, soy, sesame, and other allergens can still be present even when a
                name sounds safe.
              </p>
              <p style={s.guideDisclaimer}>
                <strong>Tell a team member before you order</strong> if you have allergies or intolerances. Use the menu
                categories to explore, confirm with staff, and skip toppings you cannot have in the customization step.
              </p>
            </div>
          </div>
        </div>
      )}


      {showAssistant && (
        <div
          style={s.assistantOverlay}
          onClick={() => setShowAssistant(false)}
        >
          <div
            style={s.assistantPopup}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
          >
            <div style={s.assistantHeader}>
              <div>
                <h2 id="assistant-title" style={s.assistantTitle}>
                  {uiText.helperTitle}
                </h2>
              </div>

              <button
                type="button"
                style={s.assistantClose}
                onClick={() => setShowAssistant(false)}
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
            <p style={s.assistantDescription}>
              {uiText.helperDescription}
            </p>
            <div style={s.assistantQuickRow}>
              {assistantQuickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  style={s.assistantQuickButton}
                  onClick={() => sendAssistantMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div style={s.assistantChatWindow}>
              {assistantMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    ...s.assistantMessage,
                    ...(message.role === 'assistant'
                      ? s.assistantMessageBot
                      : s.assistantMessageUser),
                  }}
                >
                  {message.content}
                </div>
              ))}

              {assistantLoading && (
                <div
                  style={{
                    ...s.assistantMessage,
                    ...s.assistantMessageBot,
                  }}
                >
                  {uiText.helperThinking}
                </div>
              )}
            </div>
            {assistantError && <p style={s.assistantError}>{assistantError}</p>}
            <form
              style={s.assistantForm}
              onSubmit={(event) => {
                event.preventDefault();
                sendAssistantMessage();
              }}
            >
              <input
                ref={assistantInputRef}
                style={s.assistantInput}
                type="text"
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onFocus={showTouchKeyboard}
                onClick={showTouchKeyboard}
                inputMode="text"
                enterKeyHint="send"
              />

              <button
                style={s.assistantSendButton}
                type="submit"
                disabled={assistantLoading}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


const BROWN = '#4a2c0a';
const CREAM = '#fdf6ec';
const ACCENT = '#c8773a';
const LIGHT = '#fff8f0';


// Styles
const s = {
  root:             { position: 'relative', minHeight: '100vh', background: CREAM, fontFamily: "'Georgia', serif", color: BROWN },
  skipLink: {
    position: 'absolute',
    left: '-9999px',
    top: '0.75rem',
    zIndex: 1000,
    padding: '0.5rem 1rem',
    background: '#fff',
    color: BROWN,
    fontWeight: 'bold',
    borderRadius: '8px',
    border: `2px solid ${ACCENT}`,
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  navShell: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 6px 20px rgba(74, 44, 10, 0.12)',
  },
  header: {
    background: BROWN,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
  },
  headerLeft:       { display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', minWidth: 0 },
  headerActions:    { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' },
  logo:             { fontSize: 'clamp(1.2rem, 2.8vw, 1.55rem)', fontWeight: 'bold', letterSpacing: '0.04em', margin: 0, lineHeight: 1.2 },
  assistantToggle:  { width: '2.2rem', height: '2.2rem', borderRadius: '50%', border: 'none', background: '#fff', color: BROWN, fontSize: '1.05rem', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' },
  translateWidget: {
    background: '#fff',
    borderRadius: '8px',
    padding: '0.15rem 0.35rem',
    fontSize: '0.85rem',
  },
  weatherChip:      { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.25rem 0.75rem 0.25rem 0.25rem', color: '#fff', backdropFilter: 'blur(4px)' },
  visuallyHidden:   { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 },
  statusMessage:    { margin: '0.75rem auto 0', padding: '0 1.25rem', maxWidth: '1200px', color: BROWN, fontSize: '0.95rem' },
  errorMessage:     { margin: '0.75rem auto 0', padding: '0 1.25rem', maxWidth: '1200px', color: '#b00020', fontSize: '0.95rem', fontWeight: 'bold' },
  cartBtn:          { background: ACCENT, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.55rem 1.15rem', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 'bold', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  featureMenuWrap:  { position: 'relative' },
  featureMenuBtn:   { background: '#fff', color: BROWN, border: 'none', borderRadius: '50px', padding: '0.5rem 0.95rem', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  featureDropdown:  { position: 'absolute', top: 'calc(100% + 0.45rem)', right: 0, minWidth: '220px', background: '#fff', border: '1px solid #e8d5b7', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', zIndex: 150 },
  featureMenuItem:  { border: 'none', background: '#fff8f0', color: BROWN, borderRadius: '9px', padding: '0.6rem 0.7rem', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' },
  cartBadge:        { background: '#fff', color: ACCENT, borderRadius: '50%', padding: '0 6px', fontSize: '0.8rem', fontWeight: 'bold' },
  categoryBarWrap: {
    background: LIGHT,
    borderBottom: '1px solid #e8d5b7',
    padding: '0.5rem 0 0.65rem',
  },
  categoryBarLabel: {
    margin: '0 auto 0.4rem',
    padding: '0 1rem',
    maxWidth: '1200px',
    boxSizing: 'border-box',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: '#7a5c3b',
  },
  categoryBar: {
    display: 'flex',
    flexWrap: 'nowrap',
    gap: '0.45rem',
    padding: '0 1rem 0.15rem',
    maxWidth: '1200px',
    margin: '0 auto',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    scrollSnapType: 'x proximity',
    boxSizing: 'border-box',
  },
  catBtn: {
    border: '2px solid #e8d5b7',
    background: '#fff',
    color: BROWN,
    borderRadius: '999px',
    padding: '0.5rem 0.9rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
    textAlign: 'center',
    fontFamily: 'inherit',
    flex: '0 0 auto',
    scrollSnapAlign: 'start',
    minHeight: '2.35rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
  },
  catBtnActive:     { background: BROWN, color: '#fff', border: `2px solid ${BROWN}` },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '1.2rem',
    padding: '1.5rem 1.25rem 2.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box',
    scrollMarginTop: '12px',
  },
  drinkCard:        { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '16px', padding: '1.5rem 1rem', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(74,44,10,0.08)' },
  drinkEmoji:       { fontSize: '2.5rem' },
  drinkName:        { fontSize: '0.95rem', fontWeight: 'bold', color: BROWN, lineHeight: 1.3 },
  drinkCategory:    { fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' },
  drinkPrice:       { fontSize: '1.1rem', color: ACCENT, fontWeight: 'bold', marginTop: '0.25rem' },
  drinkPriceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    marginTop: '0.25rem',
  },
  speakBtn: {
    background: 'transparent',
    border: '1.5px solid #e8d5b7',
    borderRadius: '50%',
    width: '1.8rem',
    height: '1.8rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  weatherRecommendation: { marginTop: '0.4rem', background: '#e8f4ff', color: '#2b4a60', borderRadius: '999px', padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 'bold'},
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalBox: {
    position: 'relative',
    background: '#fff',
    borderRadius: '20px',
    padding: '2rem',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  /** Regular-mode customize modal: top-right dismiss (fun mode uses wizard close on the left). */
  modalCloseBtn: {
    position: 'absolute',
    top: '0.85rem',
    right: '0.85rem',
    zIndex: 2,
    border: 'none',
    background: '#f3e6d8',
    color: BROWN,
    borderRadius: '50%',
    width: '2.25rem',
    height: '2.25rem',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    fontFamily: 'inherit',
    boxShadow: '0 1px 4px rgba(74,44,10,0.12)',
  },
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
  cartOverlayContent: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '1rem', width: '100%', padding: '1rem', boxSizing: 'border-box', flexWrap: 'wrap' },
  cartDrawer:       { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' },
  couponDrawer:     { background: '#fff', borderRadius: '20px', padding: '1.3rem', width: '90%', maxWidth: '260px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  couponTitle:      { fontSize: '1.2rem', fontWeight: 'bold', color: BROWN, margin: 0 },
  couponEmpty:      { margin: 0, color: '#7a5c3b', fontSize: '0.9rem', lineHeight: 1.35 },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  cartTitle: { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, margin: 0, flex: 1, minWidth: 0 },
  /** Closes the cart drawer (checkout panel). */
  cartCloseBtn: {
    flexShrink: 0,
    border: 'none',
    background: '#f3e6d8',
    color: BROWN,
    borderRadius: '50%',
    width: '2.25rem',
    height: '2.25rem',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    fontFamily: 'inherit',
    boxShadow: '0 1px 4px rgba(74,44,10,0.12)',
  },
  emptyCart:        { color: '#999', textAlign: 'center', padding: '2rem 0' },
  cartItem:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f0e0cc' },
  cartItemInfo:     { flex: 1 },
  cartItemName:     { fontWeight: 'bold', color: BROWN, fontSize: '0.95rem' },
  cartItemMeta:     { fontSize: '0.78rem', color: '#999', marginTop: '0.25rem' },
  cartItemRight:    { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' },
  cartPriceStack:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 },
  cartItemOldPrice: { color: '#9f8e79', textDecoration: 'line-through', fontSize: '0.82rem' },
  cartItemPrice:    { fontWeight: 'bold', color: ACCENT },
  removeBtn:        { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.9rem' },
  quantityBtn:      { background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', color: BROWN, cursor: 'pointer', fontSize: '0.9rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cartTotalRow:     { display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: BROWN },
  cartSavings:      { fontSize: '0.78rem', color: '#2d6a4f' },
  cartTotalAmt:     { color: ACCENT, fontSize: '1.2rem' },
  cartCouponLabel:  { fontSize: '0.88rem', fontWeight: 'bold', color: BROWN },
  cartCouponActions: { display: 'flex', gap: '0.35rem' },
  cartCouponActionBtn: { flex: 1, border: '1px solid #d5c2a8', borderRadius: '8px', background: '#fff', color: BROWN, padding: '0.35rem 0.45rem', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  cartCouponActionBtnActive: { background: BROWN, color: '#fff', borderColor: BROWN },
  cartCouponSelect: { width: '100%', border: '1px solid #d5c2a8', borderRadius: '8px', background: '#fff', color: BROWN, padding: '0.35rem 0.45rem', fontSize: '0.8rem', fontFamily: 'inherit' },
  cartCouponQueued: { fontSize: '0.76rem', color: '#6b4b2c', fontWeight: 'bold' },
  placeOrderBtn:    { width: '100%', background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '1rem', fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginTop: '0.5rem' },
  toast:            { position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#2d6a4f', color: '#fff', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1rem', fontWeight: 'bold', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  assistantOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'flex-end', alignItems: 'stretch', zIndex: 400, padding: '0.75rem 0.75rem' },
  assistantPopup:   { width: 'min(420px, 100%)', height: 'calc(100dvh - 1.5rem)', maxHeight: 'calc(100dvh - 1.5rem)', background: '#fff', borderRadius: '22px', border: '1px solid #e8d5b7', boxShadow: '0 18px 40px rgba(0,0,0,0.22)', padding: '1rem', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  assistantHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  assistantBadge:   { display: 'inline-block', padding: '0.25rem 0.65rem', borderRadius: '999px', background: '#fdf6ec', border: '1px solid #e8d5b7', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.35rem' },
  assistantTitle:   { margin: 0, fontSize: '1.35rem', color: BROWN },
  assistantClose:   { border: 'none', background: '#f3e6d8', color: BROWN, borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontWeight: 'bold' },
  assistantDescription: { margin: 0, color: '#6b4b2c', fontSize: '0.95rem' },
  assistantQuickRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  assistantQuickButton: { border: '1px solid #e8d5b7', background: '#fdf6ec', color: BROWN, borderRadius: '999px', padding: '0.45rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit' },
  assistantChatWindow: { flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid #f0e0cc', borderRadius: '18px', padding: '0.85rem', background: '#fffdf9', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  assistantMessage: { maxWidth: '80%', padding: '0.8rem 0.95rem', borderRadius: '16px', lineHeight: 1.45, whiteSpace: 'pre-wrap' },
  assistantMessageBot: { background: '#f3e6d8', alignSelf: 'flex-start' },
  assistantMessageUser: { background: BROWN, color: '#fff', alignSelf: 'flex-end' },
  assistantError:   { color: '#b00020', fontWeight: 'bold', margin: 0 },
  assistantForm:    { display: 'flex', gap: '0.65rem' },
  assistantInput:   { flex: 1, borderRadius: '999px', border: '1px solid #d8c1a5', padding: '0.85rem 0.95rem', fontSize: '1rem', fontFamily: 'inherit' },
  assistantSendButton: { border: 'none', borderRadius: '999px', background: ACCENT, color: '#fff', padding: '0.85rem 1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' },
  wheelModal:       { background: '#fff', borderRadius: '20px', padding: '1.3rem', width: '92%', maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  wheelHeader:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  wheelTitle:       { margin: 0, color: BROWN, fontSize: '1.3rem' },
  wheelCloseBtn:    { border: 'none', background: '#f3e6d8', color: BROWN, borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontWeight: 'bold' },
  wheelLimitNote:   { margin: 0, color: '#7a5c3b', fontSize: '0.86rem', fontWeight: 'bold' },
  wheelHint:        { margin: 0, color: '#7a5c3b', fontSize: '0.9rem' },
  wheelCouponCard:  { border: '1px solid #e8d5b7', background: '#fff8f0', borderRadius: '10px', padding: '0.55rem 0.7rem' },
  wheelCouponTitle: { margin: 0, color: '#7a5c3b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' },
  wheelCouponText:  { margin: '0.2rem 0 0', color: BROWN, fontSize: '0.92rem', fontWeight: 'bold' },
  wheelStage:       { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0.6rem 0 0.3rem' },
  wheelPointer:     { position: 'absolute', top: '-0.35rem', fontSize: '1.2rem', color: BROWN, zIndex: 2 },
  wheelDisc:        { width: '250px', height: '250px', borderRadius: '50%', border: `6px solid ${BROWN}`, position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' },
  wheelSegmentLabel: { position: 'absolute', top: '50%', left: '50%', transformOrigin: '0 0', color: BROWN, fontSize: '0.62rem', fontWeight: 'bold', width: '56px', textAlign: 'center', lineHeight: 1.1, whiteSpace: 'normal', wordBreak: 'break-word' },
  wheelHub:         { position: 'absolute', width: '24px', height: '24px', borderRadius: '50%', background: BROWN, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  wheelSpinBtn:     { border: 'none', background: ACCENT, color: '#fff', borderRadius: '50px', padding: '0.75rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1rem' },
  wheelClaimBtn:    { border: 'none', background: BROWN, color: '#fff', borderRadius: '50px', padding: '0.72rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '0.95rem' },
  wheelSpinBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  pointsBadge:   { background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.45rem 1rem', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  funModeBtn:    { width: '2.2rem', height: '2.2rem', borderRadius: '50%', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, transition: 'opacity 0.2s ease, box-shadow 0.2s ease' },
  funModeBtnOn:  { background: '#fff', boxShadow: '0 2px 8px rgba(200,119,58,0.45)', opacity: 1 },
  funModeBtnOff: { background: 'rgba(255,255,255,0.25)', boxShadow: 'none', opacity: 0.45 },
  drinkEmojiLarge: { fontSize: '3.8rem' },
  wizardBox:         { background: '#fff', borderRadius: '24px', padding: '2rem 1.5rem', width: '92%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
  wizardCloseBtn:    { position: 'absolute', top: '0.85rem', left: '0.85rem', background: '#f3e6d8', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1rem', fontWeight: 'bold', color: BROWN, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  wizardHeader:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' },
  wizardBigEmoji:    { fontSize: '4.5rem', lineHeight: 1 },
  wizardDrinkName:   { fontSize: '1.5rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: 0 },
  wizardSummary:     { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' },
  wizardSummaryChip: { background: '#fff4eb', border: `1.5px solid ${ACCENT}`, borderRadius: '50px', padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: 'bold', color: BROWN, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  wizardDots:        { display: 'flex', justifyContent: 'center', gap: '0.6rem', margin: '0.75rem 0' },
  wizardDot:         { width: '0.7rem', height: '0.7rem', borderRadius: '50%', background: '#e8d5b7', display: 'inline-block' },
  wizardDotActive:   { background: ACCENT, transform: 'scale(1.3)' },
  wizardStep:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  wizardQuestion:    { fontSize: '1.5rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: 0 },
  wizardOptions:     { display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' },
  wizardOptBtn:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', border: `3px solid #e8d5b7`, background: '#fffdf9', borderRadius: '18px', padding: '1rem 0.75rem', minWidth: '90px', flex: 1, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s ease, background 0.15s ease' },
  wizardOptBtnActive: { border: `3px solid ${ACCENT}`, background: '#fff4eb' },
  wizardOptEmoji:    { fontSize: '2.2rem', lineHeight: 1 },
  wizardOptLabel:    { fontSize: '0.95rem', fontWeight: 'bold', color: BROWN, textAlign: 'center' },
  wizardToppingGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', width: '100%' },
  wizardToppingBtn:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', border: `2px solid #e8d5b7`, background: '#fffdf9', borderRadius: '14px', padding: '0.6rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', color: BROWN, minWidth: '90px' },
  wizardToppingBtnActive: { border: `2px solid ${ACCENT}`, background: '#fff4eb', color: BROWN },
  wizardFooter:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem', marginTop: '0.5rem' },
  wizardBackBtn:     { background: '#f3e6d8', border: 'none', borderRadius: '50px', padding: '0.6rem 1.2rem', fontSize: '0.95rem', color: BROWN, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  wizardTotal:       { fontSize: '1.4rem', fontWeight: 'bold', color: ACCENT },
  wizardAddBtn:      { background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.75rem 1.4rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  achievementToast:  { position: 'fixed', bottom: '5rem', right: '1.5rem', background: BROWN, color: '#fff', padding: '0.9rem 1.2rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '0.8rem', zIndex: 500, boxShadow: '0 6px 24px rgba(0,0,0,0.25)', minWidth: '200px' },
  achievementIcon:   { fontSize: '2rem', lineHeight: 1, flexShrink: 0 },
  achievementLabel:  { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, fontWeight: 'bold' },
  achievementName:   { fontSize: '1.05rem', fontWeight: 'bold' },
  achievementsPanel:       { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' },
  achievementsPanelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' },
  achievementsPanelTitle:  { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, margin: 0 },
  achievementsPanelSub:    { fontSize: '0.85rem', color: '#999', margin: '0 0 1.25rem' },
  achievementsCloseBtn:    { border: 'none', background: '#f3e6d8', color: BROWN, borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
  achievementsList:        { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  achievementsItem:        { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', border: '2px solid transparent' },
  achievementsItemEarned:  { background: '#fff8f0', border: `2px solid ${ACCENT}` },
  achievementsItemLocked:  { background: '#f5f5f5', opacity: 0.6 },
  achievementsItemIcon:    { fontSize: '2rem', lineHeight: 1, flexShrink: 0 },
  achievementsItemInfo:    { flex: 1 },
  achievementsItemName:    { fontWeight: 'bold', color: BROWN, fontSize: '1rem' },
  achievementsItemHint:    { fontSize: '0.8rem', color: '#888', marginTop: '0.15rem' },
  achievementsItemBadge:   { fontSize: '1.2rem', flexShrink: 0 },
  controlsBar: {
    background: '#f5ebe0',
    borderBottom: '1px solid #e8d5b7',
    padding: '0.55rem 1rem',
  },
  controlsBarInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: '1rem',
    boxSizing: 'border-box',
  },
  controlCluster: { display: 'flex', alignItems: 'center', gap: '0.45rem' },
  controlClusterLabel: {
    fontSize: '0.68rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#7a5c3b',
    minWidth: '2.75rem',
  },
  viewToggleGroup:  { display: 'flex', gap: '0.35rem' },
  viewBtn:          { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '8px', padding: '0.45rem 0.65rem', cursor: 'pointer', color: BROWN, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease, border-color 0.15s ease' },
  viewBtnActive:    { background: BROWN, color: '#fff', borderColor: BROWN },
  sizeGroup:        { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  sizeBtn:          { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '8px', padding: '0.3rem 0.7rem', cursor: 'pointer', color: BROWN, fontFamily: 'inherit', transition: 'background 0.15s ease, border-color 0.15s ease', lineHeight: 1 },
  listGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.25rem 1.25rem 2.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box',
    scrollMarginTop: '12px',
  },
  listCard:         { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '16px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(74,44,10,0.08)', textAlign: 'left', width: '100%' },
  listCardInfo:     { display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minWidth: 0 },

  emptyFilterMessage: {
    gridColumn: '1 / -1',
    width: '100%',
    textAlign: 'center',
    color: '#7a5c3b',
    padding: '2rem 1rem',
    margin: 0,
    fontSize: '1rem',
    lineHeight: 1.5,
    fontWeight: 'bold',
  },
  guideFooter: {
    marginTop: '0.5rem',
    padding: '2rem 2rem 3rem',
    background: LIGHT,
    borderTop: '2px solid #e8d5b7',
    maxWidth: '52rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
  },
  guideTitle: {
    margin: '0 0 1.25rem',
    fontSize: '1.35rem',
    color: BROWN,
    fontWeight: 'bold',
    letterSpacing: '0.02em',
  },
  guideSection: { marginBottom: '1.75rem' },
  guideSectionTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.05rem',
    color: BROWN,
    fontWeight: 'bold',
    letterSpacing: '0.04em',
  },
  guideLead: {
    margin: '0 0 1rem',
    fontSize: '0.95rem',
    lineHeight: 1.55,
    color: '#4a3828',
  },
  guideChipRow: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.1rem' },
  guideChip: {
    border: `2px solid #e8d5b7`,
    background: '#fff',
    color: BROWN,
    borderRadius: '50px',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
  },
  guideChipActive: { background: BROWN, color: '#fff', borderColor: BROWN },
  guideSearchLabel: {
    display: 'block',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    color: BROWN,
    marginBottom: '0.35rem',
  },
  guideSearchInput: {
    width: '100%',
    maxWidth: '24rem',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid #d8c1a5',
    padding: '0.65rem 0.9rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: BROWN,
    background: '#fff',
  },
  guideList: {
    margin: 0,
    paddingLeft: '1.25rem',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#4a3828',
  },
  guideDisclaimer: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#4a3828',
    padding: '1rem 1.15rem',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e8d5b7',
  },
};
