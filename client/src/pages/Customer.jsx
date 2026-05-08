// Imports
import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';



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


const SIZE_MULTIPLIERS = {
  'S': 0.8,  
  'M': 1.0,  
  'L': 1.2,  
};

const DEFAULT_CUSTOMIZATION = {
  sugar: '100',
  ice: 'NORMAL_ICE',
  size: 'M',
  toppings: [],
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
  Coffee: '☕',
  Featured: '⭐',
  Caffeinated: '⚡',
};

const ALLERGY_RULES = {
  dairy: {
    label: 'No Dairy',
    emoji: '🥛',
    blockedIngredients: [
      'Whole Milk',
      'Creamer',
      'Pudding Mix',
      'Ice Cream Base',
    ],
  },
};


const assistantStarterMessages = [
  {
    role: 'assistant',
    content:
      'Hi, I can help with menu questions and ordering. Ask me about drinks, toppings, prices, or how to place an order.',
  },
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
    proceedCheckout: 'Proceed to checkout',
    checkoutTitle: 'Checkout',
    orderReview: 'Order review',
    paymentDetails: 'Payment details',
    cardholderName: 'Name on card',
    cardNumber: 'Card number',
    cardExpiry: 'Expiry (MM/YY)',
    cardCvv: 'CVV',
    payAndPlaceOrder: 'Pay & place order',
    backToOrder: 'Back to cart',
    cold: 'Cold',
    serving: 'Serving',
    placingOrder: 'Placing Order...',
    loadingMenu: 'Loading menu...',
    sweetness: 'Sweetness Level',
    ice: 'Ice Level',
    toppings: 'Toppings',
    pricesFromDb: '(prices from DB)',
    addToCart: 'Add to Cart',
    updateCart: 'Update cart',
    editCartItem: 'Edit',
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
    features: 'Features',
    spinTheWheel: 'Spin the wheel',
    allergyGuide: 'Allergy guide',
    chatbot: 'Chatbot',
    enable: 'Enable',
    disable: 'Disable',
    funMode: 'Fun Mode',
    greatPickForToday: 'A great pick for today',
    cozyPickForRainyWeather: 'Cozy pick for rainy weather',
    recommendedForHotWeather: 'Recommended for hot weather',
    recommendedForCoolerWeather: 'Recommended for cooler weather',
    chatbotQ1: 'What are your most popular drinks under $6?',
    chatbotQ2: 'Suggest a fruity drink with low sugar',
    chatbotQ3: 'What toppings pair best with brown sugar drinks?',
    chatbotQ4: 'How do I customize sugar and ice levels?',
    allergiesTitle: 'Allergies & Sensitivities',
    commonIngredients: 'Common Ingredients',
    allergiesImportant: 'Important: Recipes and suppliers can change. Shared blenders, shakers, and prep areas mean traces of dairy, nuts, gluten, soy, sesame, and other allergens can still be present even when a name sounds safe.',
    allergyWarning: 'Tell a team member before you order if you have allergies or intolerances. Use the menu categories to explore, confirm with staff, and skip toppings you cannot have in the customization step.',
  };


// Page
export default function Customer() {
  
  // State
  const [speakingId, setSpeakingId] = useState(null);
  const currentAudioRef = useRef(null);

  
  const [categories, setCategories] = useState([]);

  
  const [drinks, setDrinks] = useState([]);

  
  const [toppings, setToppings] = useState([]);

  
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [language, setLanguageState] = useState('en');
  const [uiText, setUiText] = useState(DEFAULT_UI_TEXT);
  const [translatedCategories, setTranslatedCategories] = useState({});
  const [translatedDrinks, setTranslatedDrinks] = useState({});
  const [translatedToppings, setTranslatedToppings] = useState({});

  
  const [apiError, setApiError] = useState('');

  
  const [selectedCategory, setSelectedCategory] = useState(null);

  
  const [cart, setCart] = useState([]);

  
  const [modal, setModal] = useState(null);

  const [editingCartItemId, setEditingCartItemId] = useState(null);

  
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);

  
  const [showCart, setShowCart] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentName, setPaymentName] = useState('');
  const [paymentCard, setPaymentCard] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  
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

  const [allergyFilter, setAllergyFilter] = useState(null);

  
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
  const getFeaturedCategoryId = () => {
    return categories.find((c) => c.category_name === 'Featured')?.category_id;
  };

  const getWeatherRecommendedDrinks = () => {
    return drinks.filter((drink) => {
      const reason = getWeatherRecommendationReason(drink);
      return reason !== null;
    });
  };

  const filteredDrinks = selectedCategory
    ? selectedCategory === getFeaturedCategoryId()
      ? getWeatherRecommendedDrinks()
      : drinks.filter((d) => d.category_id === selectedCategory)
    : drinks;

  
  const presetCategoryNames = INGREDIENT_STYLE_PRESETS.find(
    (p) => p.id === ingredientStylePreset
  )?.categoryNames;

  const ingredientQuery = ingredientSearch.trim().toLowerCase();

  const categoryButtonOrder = [
    'Milk Tea',
    'Fruit Tea',
    'Fresh Milk',
    'Ice Blended',
    'Mojito',
    'Hot Drinks',
    'Brewed Tea',
    'Coffee',
    'Seasonal',
    'Featured',
  ];

  const orderedCategories = [...categories].sort((left, right) => {
    const leftIndex = categoryButtonOrder.indexOf(left.category_name);
    const rightIndex = categoryButtonOrder.indexOf(right.category_name);

    const normalizedLeftIndex = leftIndex === -1 ? categoryButtonOrder.length : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? categoryButtonOrder.length : rightIndex;

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex;
    }

    return left.category_name.localeCompare(right.category_name);
  });

  const hasBlockedIngredient = (item, blockedIngredients) => {
    const ingredients = item.ingredients || [];

    return ingredients.some((ingredient) =>
      blockedIngredients.includes(ingredient)
    );
  };

  const activeAllergyRule = allergyFilter ? ALLERGY_RULES[allergyFilter] : null;

  const cartHasBlockedAllergen =
    activeAllergyRule &&
    cart.some((item) =>
      hasBlockedIngredient(item.drink, activeAllergyRule.blockedIngredients)
    );

    const displayDrinks = filteredDrinks.filter((d) => {
    if (
      activeAllergyRule &&
      hasBlockedIngredient(d, activeAllergyRule.blockedIngredients)
    ) {
      return false;
    }

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

  const displayToppings = toppings.filter((t) => {
    if (
      activeAllergyRule &&
      hasBlockedIngredient(t, activeAllergyRule.blockedIngredients)
    ) {
      return false;
    }

    return true;
  });
  
  // Speech
const speakText = (text, id) => {
  if (!text) return;

  // Cancel any in-progress speech
  window.speechSynthesis.cancel();

  // Toggle off if clicking the same item that's already speaking
  if (speakingId === id) {
    setSpeakingId(null);
    return;
  }

  setSpeakingId(id);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => setSpeakingId(null);
  utterance.onerror = (err) => {
    console.error('Speech synthesis error:', err);
    setSpeakingId(null);
  };

  currentAudioRef.current = utterance;
  window.speechSynthesis.speak(utterance);
};

  
useEffect(() => {
  return () => {
    window.speechSynthesis.cancel();
  };
}, []);
  
  function getWeatherRecommendationReason(drink) {
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
        return uiText.cozyPickForRainyWeather;
      }
    }

    if (temp >= 80) {
      if (
        category.includes('fruit') ||
        category.includes('mojito') ||
        category.includes('ice blended')
      ) {
        return uiText.recommendedForHotWeather;
      }
    }

    if (temp <= 60) {
      if (
        category.includes('milk tea') ||
        category.includes('fresh milk') ||
        category.includes('brewed tea')
      ) {
        return uiText.recommendedForCoolerWeather;
      }
    }


    if (temp > 60 && temp < 80) {
      if (category.includes('milk tea') || category.includes('fruit tea')) {
        return uiText.greatPickForToday;
      }
    }

    return null;
  }

  
  const unlockAchievement = (id, icon, text) => {
    setUnlockedAchievements(prev => {
      if (prev.has(id)) return prev;
      setAchievement({ icon, text });
      setTimeout(() => setAchievement(null), 3200);
      return new Set([...prev, id]);
    });
  };

  
  // Modal
  const closeCustomizationModal = () => {
    const wasEditing = editingCartItemId != null;
    setEditingCartItemId(null);
    setModal(null);
    if (wasEditing) {
      setShowCart(true);
    }
  };

  const openModal = (drink) => {
    setEditingCartItemId(null);
    setModal(drink);
    const initialIce = (drink.category_name === 'Coffee' || drink.category_name === 'Brewed Tea') ? 'HOT' : 'NORMAL_ICE';
    setCustomization({
      ...DEFAULT_CUSTOMIZATION,
      ice: initialIce,
    });
    setWizardStep(0);
  };

  const beginEditCartItem = (item) => {
    setShowCart(false);
    setEditingCartItemId(item.id);
    setModal(item.drink);
    setCustomization({
      sugar: String(item.sweetness_level),
      ice: item.ice_level,
      size: item.size,
      toppings: [...item.toppings],
    });
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
    const toppingCost = selectedToppingIds.reduce((sum, tid) => {
      
      const t = toppings.find((t) => t.topping_id === tid);

      
      return sum + (t ? parseFloat(t.topping_price) : 0);
    }, 0);

    
    const sizeMultiplier = SIZE_MULTIPLIERS[size] || 1.0;
    return (parseFloat(drink.base_price) + toppingCost) * sizeMultiplier;
  };

  const getSizePriceAdjustment = (drink, size) => {
    if (!drink || !size) return 0;
    const basePrice = parseFloat(drink.base_price);
    const basePriceWithM = basePrice * 1.0;
    const priceWithSize = basePrice * (SIZE_MULTIPLIERS[size] || 1.0);
    return Number((priceWithSize - basePriceWithM).toFixed(2));
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

    if (editingCartItemId != null) {
      setCart((prev) =>
        prev.map((i) =>
          i.id === editingCartItemId
            ? {
                ...i,
                sweetness_level: customization.sugar,
                ice_level: customization.ice,
                size: customization.size,
                toppings: [...customization.toppings],
                total_price: total,
              }
            : i
        )
      );
      setEditingCartItemId(null);
      setModal(null);
      setShowCart(true);
      return;
    }

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

  // Language switching via API
  const handleLanguageChange = async (newLang) => {
    if (newLang === 'en') {
      // English: just reset to defaults
      setLanguageState('en');
      setUiText(DEFAULT_UI_TEXT);
      setTranslatedCategories({});
      setTranslatedDrinks({});
      setTranslatedToppings({});
      return;
    }

    // Map user-facing language codes to API language codes
    const langMap = { es: 'es', fr: 'fr', hi: 'hi', zh: 'zh-CN' };
    const apiLang = langMap[newLang] || newLang;

    try {
      // Collect all text to translate
      const textsToTranslate = [
        ...Object.values(DEFAULT_UI_TEXT),
        ...categories.map((c) => c.category_name),
        ...drinks.map((d) => d.drink_name),
        ...toppings.map((t) => t.topping_name),
      ];

      // Call translation API
      const response = await fetch(toApiUrl('/api/translate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: textsToTranslate, target: apiLang }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      const translations = data.translations || [];

      // Map translations back to their sources
      let idx = 0;
      const translatedText = {};
      Object.keys(DEFAULT_UI_TEXT).forEach((key) => {
        translatedText[key] = translations[idx++];
      });

      const catMap = {};
      categories.forEach((c) => {
        catMap[c.category_id] = translations[idx++];
      });

      const drinkMap = {};
      drinks.forEach((d) => {
        drinkMap[d.drink_id] = translations[idx++];
      });

      const toppingMap = {};
      toppings.forEach((t) => {
        toppingMap[t.topping_id] = translations[idx++];
      });

      // Update state
      setLanguageState(newLang);
      setUiText(translatedText);
      setTranslatedCategories(catMap);
      setTranslatedDrinks(drinkMap);
      setTranslatedToppings(toppingMap);
    } catch (err) {
      console.error('Language switch failed:', err);
      setApiError('Failed to switch language. Please try again.');
    }
  };

  const assistantQuickPrompts = useMemo(() => [
    uiText.chatbotQ1,
    uiText.chatbotQ2,
    uiText.chatbotQ3,
    uiText.chatbotQ4,
  ], [uiText]);

  const validateCheckoutPayment = () => {
    if (!paymentName.trim()) return 'Please enter the name on the card.';
    if (!paymentCard.trim()) return 'Please enter a card number.';
    if (!paymentExpiry.trim()) return 'Please enter an expiry date.';
    if (!paymentCvv.trim()) return 'Please enter a CVV.';
    return '';
  };

  const resetCheckoutForm = () => {
    setPaymentName('');
    setPaymentCard('');
    setPaymentExpiry('');
    setPaymentCvv('');
    setCheckoutError('');
  };

  const submitCheckoutOrder = async () => {
    const err = validateCheckoutPayment();
    if (err) {
      setCheckoutError(err);
      return;
    }
    setCheckoutError('');
    await placeOrder();
  };

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
          size: item.size,
          drink_unit_price: Number(item.drink.base_price),
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
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      
      setCart([]);
      setClaimedWheelCoupon(null);
      setCouponApplyEnabled(true);
      setCouponAppliedItemId(null);
      setPendingWheelDeal(null);
      setShowCart(false);
      setShowCheckout(false);
      resetCheckoutForm();
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

      
      setApiError(err.message || 'Could not place order. Please try again.');
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

  const getDrinkDisplayLabel = (drink) => {
    const base = translatedDrinks[drink.drink_id] || drink.drink_name;
    const categoryName = drink.category_name || '';
    if (categoryName === 'Coffee' || categoryName === 'Brewed Tea') {
      return `${base} (Hot)`;
    }
    return base;
  };

  const getCategoryDisplayName = (category) => {
    const base = translatedCategories[category.category_id] || category.category_name;
    if (category.category_name === 'Coffee' || category.category_name === 'Brewed Tea') {
      return `${base} (Hot)`;
    }
    return base;
  };

  
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

  // Render
  return (
    <div style={s.root}>
      <a href="#drink-grid" className="customer-skip-link" style={s.skipLink}>
        Skip to drinks
      </a>
      <style>{`
        /* Keeps skip link visible during keyboard focus. */
        .customer-skip-link:focus,
        .customer-skip-link:focus-visible {
          left: 1rem !important;
          outline: 3px solid #c8773a;
          outline-offset: 2px;
        }
        /* Animates points badge pop effect. */
        @keyframes pointsPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        /* Adds smooth button movement and shadow. */
        .fun-btn {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        /* Enlarges fun buttons on hover. */
        .fun-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 4px 14px rgba(200, 119, 58, 0.4);
        }
        /* Shrinks fun buttons when clicked. */
        .fun-btn:active {
          transform: scale(0.91);
          transition: transform 0.08s ease;
        }
        /* Adds smooth card hover readiness. */
        .fun-card {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        /* Applies points pop animation class. */
        .points-pop {
          display: inline-block;
          animation: pointsPop 600ms ease-out;
        }
        /* Slides achievement toast in and out. */
        @keyframes achievementSlide {
          0%   { transform: translateX(120%); opacity: 0; }
          15%  { transform: translateX(0);    opacity: 1; }
          80%  { transform: translateX(0);    opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        /* Applies achievement toast animation. */
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
                  <span style={{ fontSize: '0.8rem', color: '#fefcf8' }}>
                    {weather.description}
                  </span>
                </div>
              )}

              <label htmlFor="language-select" style={{ position: 'absolute', left: '-9999px' }}>
                Select Language
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => {
                  const lang = e.target.value;
                  if (lang === language) return;
                  handleLanguageChange(lang);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  padding: '0.6rem 2.2rem 0.6rem 0.8rem',
                  borderRadius: '10px',
                  border: '2px solid #e8f4f8',
                  backgroundColor: '#f0fafb',
                  color: '#002f47',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(13, 90, 111, 0.12)',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230d5a6f' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.7rem center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#4a90a4';
                  e.target.style.backgroundColor = '#e8f4f8';
                  e.target.style.boxShadow = '0 6px 16px rgba(13, 90, 111, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e8f4f8';
                  e.target.style.backgroundColor = '#f0fafb';
                  e.target.style.boxShadow = '0 4px 12px rgba(13, 90, 111, 0.12)';
                }}
              >
                <option value="en">🌐 English</option>
                <option value="es">🌐 Spanish</option>
                <option value="fr">🌐 French</option>
                <option value="hi">🌐 Hindi</option>
                <option value="zh">🌐 Chinese</option>
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
                  ✨ {uiText.features} <span style={{ fontSize: '0.7rem', marginLeft: '0.3rem' }}>▼</span>
                </button>

                {showFeatureMenu && (
                  <div style={s.featureDropdown} role="menu" aria-label="Features menu">
                    <button
                      type="button"
                      style={s.featureMenuItem}
                      role="menuitem"
                      onClick={() => {
                        setShowWheel(true);
                        setShowFeatureMenu(false);
                      }}
                    >
                      🎡 {uiText.spinTheWheel}
                    </button>
                    <button
                      type="button"
                      style={s.featureMenuItem}
                      role="menuitem"
                      onClick={() => {
                        setShowAllergyGuide(true);
                        setShowFeatureMenu(false);
                      }}
                    >
                      ⚠️ {uiText.allergyGuide}
                    </button>
                    <button
                      type="button"
                      style={s.featureMenuItem}
                      role="menuitem"
                      onClick={() => {
                        setShowAssistant(true);
                        setShowFeatureMenu(false);
                      }}
                    >
                      🤖 {uiText.chatbot}
                    </button>
                    <button
                      type="button"
                      style={s.featureMenuItem}
                      role="menuitem"
                      onClick={() => {
                        setFunMode(!funMode);
                        setShowFeatureMenu(false);
                      }}
                    >
                      🎉 {funMode ? uiText.disable : uiText.enable} {uiText.funMode}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                style={s.cartBtn}
                onClick={() => setShowCart(true)}
              >
                🛒 {uiText.cart} {cart.length > 0 && <span style={s.cartBadge}>{cart.length}</span>}
              </button>
            </div>
          </div>

          <div style={s.categoryBarWrap}>
            <nav style={s.categoryBar} aria-label="Browse categories">
              <button
                style={{ ...s.catBtn, ...(selectedCategory === null ? s.catBtnActive : {}), fontSize: `${0.72 * ts}rem` }}
                onClick={() => setSelectedCategory(null)}
                aria-pressed={selectedCategory === null}
                aria-label="Show all categories"
              >
                {uiText.all}
              </button>

              {orderedCategories.map((cat) => (
                <button
                  key={cat.category_id}
                  style={{ ...s.catBtn, ...(selectedCategory === cat.category_id ? s.catBtnActive : {}), fontSize: `${0.72 * ts}rem` }}
                  onClick={() => setSelectedCategory(cat.category_id)}
                  aria-pressed={selectedCategory === cat.category_id}
                  aria-label={`Show ${cat.category_name} drinks`}
                >
                  {categoryEmojis[cat.category_name] || '🍹'} {getCategoryDisplayName(cat)}
                </button>
              ))}
            </nav>
          </div>

        </header>
      </div>

      <section aria-label="Menu controls and filters" style={{ paddingTop: '0.5rem' }}>
      <div style={s.categoryControls}>
        <div style={s.controlClusterSide}>
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
            <button
              type="button"
              style={{
                ...s.catBtn,
                ...(allergyFilter === 'dairy' ? s.catBtnActive : {}),
              }}
              onClick={() =>
                setAllergyFilter((prev) => (prev === 'dairy' ? null : 'dairy'))
              }
              aria-pressed={allergyFilter === 'dairy'}
            >
              🥛 No Dairy
            </button>
          </div>
        </div>

        <div style={s.controlClusterSide}>
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

      <p style={s.visuallyHidden} role="status" aria-live="polite">
        Showing {displayDrinks.length} drinks in {currentCategoryName}
        {ingredientStylePreset ? ' with an extra style filter' : ''}
        {ingredientQuery ? ' matching your ingredient search' : ''}. Cart has{' '}
        {cart.length} item{cart.length === 1 ? '' : 's'}.
      </p>

      {loadingMenu && <p style={s.statusMessage}>{uiText.loadingMenu}</p>}
      {apiError && <p style={s.errorMessage}>{apiError}</p>}
      </section>

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
          <div key={drink.drink_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <button
              type="button"
              style={{
                ...s.speakBtn,
                padding: '0.5rem 0.6rem',
                minWidth: 'auto',
              }}
              onClick={() => {
                speakText(
                  `${drink.drink_name}. ${drink.category_name}. ${parseFloat(drink.base_price).toFixed(2)} dollars.`,
                  drink.drink_id
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
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
            </button>
            <button
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
              </div>
              {getWeatherRecommendationReason(drink) && (
                <div style={s.weatherRecommendation}> ☁️ {getWeatherRecommendationReason(drink)} </div>
              )}
            </button>
          </div>
        ))}
        
        {!loadingMenu && !apiError && displayDrinks.length === 0 && (
          <p style={s.emptyFilterMessage}>
            No drinks match your filters. Try another category, clear the style shortcut, or adjust your search.
          </p>
        )}
      </main>

      
      {modal && (
        <div style={s.overlay} onClick={closeCustomizationModal}>
          <div
            style={
              funMode
                ? s.wizardBox
                : editingCartItemId
                  ? { ...s.modalBox, position: 'relative', paddingTop: '3rem' }
                  : { ...s.modalBox, position: 'relative' }
            }
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customize-drink-title"
          >
            {funMode ? (
              <>
                {editingCartItemId ? (
                  <>
                    <button
                      type="button"
                      style={s.customizeEditBackBtn}
                      onClick={closeCustomizationModal}
                      aria-label={uiText.backToOrder}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      style={{ ...s.wizardCloseBtn, ...s.wizardCloseBtnRight }}
                      onClick={closeCustomizationModal}
                      aria-label="Exit customization"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button style={s.wizardCloseBtn} onClick={closeCustomizationModal} aria-label="Exit customization">✕</button>
                )}
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
                          📏 Size {customization.size}
                        </span>
                      )}
                      {wizardStep >= 3 && (
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
                        { value: '125', emoji: '🍯', label: 'Extra Sweet' },
                      ].map(({ value, emoji, label }) => (
                        <button
                          key={value}
                          style={{ ...s.wizardOptBtn, ...(customization.sugar === value ? s.wizardOptBtnActive : {}) }}
                          onClick={() => { setCustomization(prev => ({ ...prev, sugar: value })); setWizardStep(1); }}
                          aria-pressed={customization.sugar === value}
                          aria-label={`Sweetness: ${getSugarDisplayLabel(value)}`}
                        >
                          <span style={s.wizardOptEmoji}>{emoji}</span>
                          <span style={s.wizardOptLabel}>{getSugarDisplayLabel(value)}</span>
                        </button>
                      ))}
                    </div>
                    <div style={s.wizardFooter}>
                      <span style={s.wizardTotal}>${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {wizardStep === 1 && (
                  <div style={s.wizardStep}>
                    <p style={s.wizardQuestion}>What size? 📏</p>
                    <div style={s.wizardOptions} role="group" aria-label="Size">
                      {SIZE_LEVELS.map(({ label, value }) => {
                        const adjustment = getSizePriceAdjustment(modal, value);
                        const adjustmentStr = adjustment === 0 ? '+$0.00' : (adjustment > 0 ? `+$${adjustment.toFixed(2)}` : `-$${Math.abs(adjustment).toFixed(2)}`);
                        return (
                          <button
                            key={value}
                            style={{ ...s.wizardOptBtn, ...(customization.size === value ? s.wizardOptBtnActive : {}) }}
                            onClick={() => { setCustomization(prev => ({ ...prev, size: value })); setWizardStep(2); }}
                            aria-pressed={customization.size === value}
                            aria-label={`Size ${label}, ${adjustmentStr}`}
                          >
                            <span style={s.wizardOptEmoji}>📏</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <span style={s.wizardOptLabel}>{label}</span>
                              <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: '600', color: '#c8773a' }}>{adjustmentStr}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div style={s.wizardFooter}>
                      <button style={s.wizardBackBtn} onClick={() => setWizardStep(0)}>← {uiText.back}</button>
                      <span style={s.wizardTotal}>${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {wizardStep === 2 && (
                  <div style={s.wizardStep}>
                    <p style={s.wizardQuestion}>{modal.category_name === 'Hot Drinks' ? `${uiText.howHot} ☕` : `${uiText.howCold} 🧊`}</p>
                    <div style={s.wizardOptions} role="group" aria-label={modal.category_name === 'Hot Drinks' ? 'Temperature' : 'Ice level'}>
                      {(modal.category_name === 'Hot Drinks' ? [
                        { value: 'HOT', emoji: '☕', label: 'Hot' }
                      ] : modal.category_name === 'Ice Blended' ? [
                        { value: 'NORMAL_ICE', emoji: '❄️', label: 'Regular'   },
                      ] : (modal.category_name === 'Coffee' || modal.category_name === 'Brewed Tea' || modal.category_name === 'Milk Tea') ? [
                        { value: 'NO_ICE',     emoji: '🌡️', label: 'No Ice'   },
                        { value: 'LESS_ICE',   emoji: '🧊', label: 'Less Ice'  },
                        { value: 'NORMAL_ICE', emoji: '❄️', label: 'Regular'   },
                        { value: 'HOT',        emoji: '☕', label: 'Hot'       },
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
                    <div style={s.wizardFooter}>
                      <button style={s.wizardBackBtn} onClick={() => setWizardStep(1)}>← {uiText.back}</button>
                      <span style={s.wizardTotal}>${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {wizardStep === 3 && (
                  <div style={s.wizardStep}>
                    <p style={s.wizardQuestion}>{uiText.anyExtras} ✨</p>
                    <div style={s.wizardToppingGrid} role="group" aria-label="Toppings">
                      {displayToppings.map(t => (
                        <button
                          key={t.topping_id}
                          style={{ ...s.wizardToppingBtn, ...(customization.toppings.includes(t.topping_id) ? s.wizardToppingBtnActive : {}) }}
                          onClick={() => toggleTopping(t.topping_id)}
                          aria-pressed={customization.toppings.includes(t.topping_id)}
                          aria-label={`${getToppingDisplayName(t)}, add ${parseFloat(t.topping_price).toFixed(2)} dollars`}
                        >
                          <span style={{ fontSize: '1.5rem' }}>🧆</span>
                          <span>{getToppingDisplayName(t)}</span>
                          <span style={{ fontSize: '0.8rem', color: PRICE_TEXT }}>+${parseFloat(t.topping_price).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                    <div style={s.wizardFooter}>
                      <button style={s.wizardBackBtn} onClick={() => setWizardStep(2)}>← {uiText.back}</button>
                      <span style={s.wizardTotal}>${getSubtotal(modal, customization.toppings, customization.size).toFixed(2)}</span>
                      <button style={s.wizardAddBtn} className="fun-btn" onClick={addToCart} aria-label={editingCartItemId ? `Update ${modal.drink_name} in cart` : `Add ${modal.drink_name} to cart`}>
                        {editingCartItemId ? uiText.updateCart : uiText.addToCart} 🛒
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {editingCartItemId && (
                  <button
                    type="button"
                    style={s.customizeEditBackBtn}
                    onClick={closeCustomizationModal}
                    aria-label={uiText.backToOrder}
                  >
                    ←
                  </button>
                )}
                <div style={{ fontSize: `${3 * ts}rem`, textAlign: 'center', lineHeight: 1, marginBottom: '0.5rem' }}>{categoryEmojis[modal.category_name] || '🍹'}</div>
                <h2 id="customize-drink-title" style={{ ...s.modalTitle,    fontSize: `${1.4  * ts}rem` }}>{getDrinkDisplayLabel(modal)}</h2>
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
                    {SIZE_LEVELS.map(({ label, value }) => {
                      const adjustment = getSizePriceAdjustment(modal, value);
                      const adjustmentStr = adjustment === 0 ? '+$0.00' : (adjustment > 0 ? `+$${adjustment.toFixed(2)}` : `-$${Math.abs(adjustment).toFixed(2)}`);
                      return (
                        <button key={value}
                          style={{ ...s.optBtn, ...(customization.size === value ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                          onClick={() => setCustomization(prev => ({ ...prev, size: value }))}
                          aria-pressed={customization.size === value}
                          aria-label={`Set size to ${label}, ${adjustmentStr}`}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                            <span>{label}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{adjustmentStr}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {modal.category_name === 'Milk Tea' && (
                  <>
                    <div style={s.section}>
                      <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.serving}</p>
                      <div style={s.optionRow} role="group" aria-label={uiText.serving}>
                        <button
                          type="button"
                          style={{ ...s.optBtn, ...(customization.ice !== 'HOT' ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                          onClick={() =>
                            setCustomization((prev) => ({
                              ...prev,
                              ice:
                                prev.ice === 'HOT'
                                  ? 'NORMAL_ICE'
                                  : ['NO_ICE', 'LESS_ICE', 'NORMAL_ICE'].includes(prev.ice)
                                    ? prev.ice
                                    : 'NORMAL_ICE',
                            }))
                          }
                          aria-pressed={customization.ice !== 'HOT'}
                          aria-label={`${uiText.cold} serving`}
                        >
                          {uiText.cold}
                        </button>
                        <button
                          type="button"
                          style={{ ...s.optBtn, ...(customization.ice === 'HOT' ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                          onClick={() => setCustomization((prev) => ({ ...prev, ice: 'HOT' }))}
                          aria-pressed={customization.ice === 'HOT'}
                          aria-label={`${uiText.hot} serving`}
                        >
                          {uiText.hot}
                        </button>
                      </div>
                    </div>
                    {customization.ice !== 'HOT' && (
                      <div style={s.section}>
                        <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.iceLevel}</p>
                        <div style={s.optionRow} role="group" aria-label="Ice level">
                          {ICE_LEVELS.map(({ label, value }) => (
                            <button
                              key={value}
                              type="button"
                              style={{ ...s.optBtn, ...(customization.ice === value ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                              onClick={() => setCustomization((prev) => ({ ...prev, ice: value }))}
                              aria-pressed={customization.ice === value}
                              aria-label={`Set ice level to ${label}`}
                            >
                              {getIceDisplayLabel(value)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {modal.category_name !== 'Hot Drinks' && modal.category_name !== 'Milk Tea' && (
                  <div style={s.section}>
                    <p style={{ ...s.sectionLabel, fontSize: `${0.95 * ts}rem` }}>{uiText.iceLevel}</p>
                    <div style={s.optionRow} role="group" aria-label="Ice level">
                      {ICE_LEVELS.filter(({ value }) => modal.category_name !== 'Ice Blended' || value === 'NORMAL_ICE').map(({ label, value }) => (
                        <button key={value}
                          style={{ ...s.optBtn, ...(customization.ice === value ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                          onClick={() => setCustomization(prev => ({ ...prev, ice: value }))}
                          aria-pressed={customization.ice === value}
                          aria-label={`Set ice level to ${label}`}
                        >{getIceDisplayLabel(value)}</button>
                      ))}
                      {(modal.category_name === 'Coffee' || modal.category_name === 'Brewed Tea') && (
                        <button
                          style={{ ...s.optBtn, ...(customization.ice === 'HOT' ? s.optBtnActive : {}), fontSize: `${0.85 * ts}rem` }}
                          onClick={() => setCustomization(prev => ({ ...prev, ice: 'HOT' }))}
                          aria-pressed={customization.ice === 'HOT'}
                          aria-label="Hot temperature"
                        >{uiText.hot}</button>
                      )}
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
                    {displayToppings.map(t => (
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
                  <button style={{ ...s.addBtn, fontSize: `${1 * ts}rem` }} onClick={addToCart} aria-label={editingCartItemId ? `Update ${modal.drink_name} in cart` : `Add ${modal.drink_name} to cart`}>{editingCartItemId ? uiText.updateCart : uiText.addToCart}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      
      {showCart && (
        <div style={s.overlay} onClick={() => setShowCart(false)} onTouchEnd={() => setShowCart(false)}>
          <div style={s.cartOverlayContent} onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            <div
              style={s.cartDrawer}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 id="cart-title" style={s.cartTitle}>
                  Your Order
                </h2>
                <button
                  style={s.closeCartBtn}
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
                  {cartHasBlockedAllergen && (
                    <div
                      style={{
                        background: '#fff3cd',
                        border: '2px solid #c8773a',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        color: '#4a2c0a',
                        fontWeight: '700',
                        lineHeight: 1.35,
                      }}
                    >
                      ⚠️ Allergy warning: Your current filter is set to{' '}
                      {activeAllergyRule.label}, but one or more items already in your cart
                      contain blocked ingredients. Please remove them before ordering if needed.
                    </div>
                  )}
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
                        <button
                          type="button"
                          style={s.cartEditBtn}
                          onClick={() => beginEditCartItem(item)}
                          aria-label={`Edit customization for ${item.drink.drink_name}`}
                        >
                          {uiText.editCartItem}
                        </button>
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
                  <button
                    type="button"
                    style={s.placeOrderBtn}
                    className={funMode ? 'fun-btn' : ''}
                    onClick={() => {
                      setCheckoutError('');
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    aria-label={uiText.proceedCheckout}
                    disabled={placingOrder}
                  >
                    {uiText.proceedCheckout}
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

      {showCheckout && (
        <div
          style={s.checkoutOverlay}
          onClick={() => {
            setShowCheckout(false);
            setShowCart(true);
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              setShowCheckout(false);
              setShowCart(true);
            }
          }}
          role="presentation"
        >
          <div
            style={s.checkoutCard}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 id="checkout-title" style={s.cartTitle}>
                {uiText.checkoutTitle}
              </h2>
              <button
                type="button"
                style={s.closeCartBtn}
                onClick={() => {
                  setShowCheckout(false);
                  setShowCart(true);
                }}
                aria-label={uiText.backToOrder}
              >
                ✕
              </button>
            </div>

            <h3 style={{ ...s.sectionLabel, marginTop: 0 }}>{uiText.orderReview}</h3>
            <div style={{ marginBottom: '1.25rem', maxHeight: '36vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {cart.map((item) => (
                <div key={item.id} style={{ ...s.cartItem, padding: '0.6rem 0' }}>
                  <div style={s.cartItemInfo}>
                    <div style={s.cartItemName}>{item.drink.drink_name}</div>
                    <div style={s.cartItemMeta}>
                      Size {item.size} · {getSugarLabel(item.sweetness_level)} sweet · {getIceLabel(item.ice_level)}
                      {item.toppings.length > 0 && (
                        <>
                          {' '}
                          ·{' '}
                          {item.toppings
                            .map((tid) => toppings.find((t) => t.topping_id === tid)?.topping_name)
                            .filter(Boolean)
                            .join(', ')}
                        </>
                      )}
                    </div>
                  </div>
                  <div style={s.cartItemRight}>
                    <span style={s.cartItemPrice}>
                      $
                      {(getDiscountedUnitPrice(item) * item.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={s.cartTotalRow}>
              <span>{uiText.total}</span>
              <span style={s.cartTotalAmt}>${discountedCartTotal.toFixed(2)}</span>
            </div>

            <h3 style={{ ...s.sectionLabel, marginTop: '1.25rem' }}>{uiText.paymentDetails}</h3>

            {checkoutError ? (
              <div
                style={{
                  background: '#fde8e8',
                  border: '2px solid #c84a4a',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  color: '#5c1a1a',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                }}
                role="alert"
              >
                {checkoutError}
              </div>
            ) : null}

            <div style={s.checkoutField}>
              <label htmlFor="checkout-name" style={s.checkoutLabel}>{uiText.cardholderName}</label>
              <input
                id="checkout-name"
                type="text"
                autoComplete="cc-name"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
                style={s.checkoutInput}
              />
            </div>
            <div style={s.checkoutField}>
              <label htmlFor="checkout-card" style={s.checkoutLabel}>{uiText.cardNumber}</label>
              <input
                id="checkout-card"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={paymentCard}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
                  const spaced = raw.replace(/(.{4})/g, '$1 ').trim();
                  setPaymentCard(spaced);
                }}
                style={s.checkoutInput}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={s.checkoutField}>
                <label htmlFor="checkout-exp" style={s.checkoutLabel}>{uiText.cardExpiry}</label>
                <input
                  id="checkout-exp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={paymentExpiry}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                    const fmt = d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
                    setPaymentExpiry(fmt);
                  }}
                  style={s.checkoutInput}
                />
              </div>
              <div style={s.checkoutField}>
                <label htmlFor="checkout-cvv" style={s.checkoutLabel}>{uiText.cardCvv}</label>
                <input
                  id="checkout-cvv"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={paymentCvv}
                  onChange={(e) => setPaymentCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={s.checkoutInput}
                />
              </div>
            </div>

            <button
              type="button"
              style={s.placeOrderBtn}
              className={funMode ? 'fun-btn' : ''}
              onClick={submitCheckoutOrder}
              aria-label={uiText.payAndPlaceOrder}
              disabled={placingOrder || cart.length === 0}
            >
              {placingOrder ? uiText.placingOrder : uiText.payAndPlaceOrder}
            </button>

            <button
              type="button"
              style={s.checkoutBackBtn}
              onClick={() => {
                setShowCheckout(false);
                setShowCart(true);
              }}
            >
              ← {uiText.backToOrder}
            </button>
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
              <h2 id="allergy-guide-title" style={s.modalTitle}>{uiText.allergiesTitle}</h2>
              <button
                style={s.assistantClose}
                onClick={() => setShowAllergyGuide(false)}
                aria-label="Close allergy guide"
              >
                ✕
              </button>
            </div>
            <div style={s.guideSection}>
              <h3 style={s.guideSectionTitle}>{uiText.commonIngredients}</h3>
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
                ⚠️ <strong>Important:</strong> {uiText.allergiesImportant}
              </p>
              <p style={s.guideDisclaimer}>
                <strong>Tell a team member before you order</strong> {uiText.allergyWarning}
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
                placeholder={
                  language === 'es'
                    ? 'Pregunta sobre el menú...'
                    : language === 'fr'
                    ? 'Demandez sur le menu...'
                    : language === 'hi'
                    ? 'मेनू के बारे में पूछें...'
                    : language === 'zh'
                    ? '询问菜单...'
                    : 'Ask something about the menu or ordering...'
                }
                onFocus={showTouchKeyboard}
                onClick={showTouchKeyboard}
                placeholder="Ask something about the menu or ordering..."
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
/** Filled buttons / white text (~WCAG AA for typical label sizes when bold). */
const ACCENT_FILL = '#9a3412';
const LIGHT = '#fff8f0';
/** WCAG 2 AA: ~7:1 vs white for normal body text */
const TEXT_MUTED = '#4a4a4a';
const TEXT_SECONDARY = '#5c5c5c';
/** Price / emphasis on white cards (darker than ACCENT for readable text) */
const PRICE_TEXT = '#3d2914';


// Styles
const s = {
  // Styles the page root container.
  root:             { position: 'relative', minHeight: '100vh', background: CREAM, fontFamily: "'Georgia', serif", color: BROWN },
  // Styles the keyboard skip link.
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
  // Styles the sticky navigation wrapper.
  navShell: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 6px 20px rgba(74, 44, 10, 0.12)',
  },
  // Styles the top header bar.
  header: {
    background: BROWN,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
  },
  // Styles the inner header layout.
  headerInner:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', boxSizing: 'border-box', width: '100%', padding: '0.35rem 0.85rem' },
  // Styles the left-side header area.
  headerLeft:       { display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 },
  // Styles the page title.
  logo:             { fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.03em', margin: 0, lineHeight: 1.1 },
  // Styles the right-side header buttons.
  headerActions:    { display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end', paddingRight: '0.4rem' },
  // Styles the weather display chip.
  weatherChip:      { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.18rem 0.6rem 0.18rem 0.2rem', color: '#fff', backdropFilter: 'blur(4px)' },
  // Hides text visually for screen readers.
  visuallyHidden:   { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 },
  // Styles loading/status messages.
  statusMessage:    { margin: '0.75rem auto 0', padding: '0 1.25rem', maxWidth: '1200px', color: BROWN, fontSize: '0.95rem' },
  // Styles error messages.
  errorMessage:     { margin: '0.75rem auto 0', padding: '0 1.25rem', maxWidth: '1200px', color: '#b00020', fontSize: '0.95rem', fontWeight: 'bold' },
  // Styles the cart button.
  cartBtn:          { background: ACCENT_FILL, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.55rem 1.15rem', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 'bold', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  // Positions the feature menu wrapper.
  featureMenuWrap:  { position: 'relative' },
  // Styles the feature menu button.
  featureMenuBtn:   { background: '#fff', color: BROWN, border: 'none', borderRadius: '50px', padding: '0.42rem 0.85rem', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  // Styles the feature dropdown panel.
  featureDropdown:  { position: 'absolute', top: 'calc(100% + 0.45rem)', right: 0, minWidth: '220px', background: '#fff', border: '1px solid #e8d5b7', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.18)', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', zIndex: 150 },
  // Styles each feature menu item.
  featureMenuItem:  { border: 'none', background: '#fff8f0', color: BROWN, borderRadius: '9px', padding: '0.6rem 0.7rem', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' },
  // Styles the cart item count badge.
  cartBadge:        { background: '#fff', color: BROWN, borderRadius: '50%', padding: '0 6px', fontSize: '0.8rem', fontWeight: 'bold' },
  // Styles the category bar section.
  categoryBarWrap: {
    background: LIGHT,
    borderBottom: '1px solid #e8d5b7',
    padding: '0.55rem 1rem 0.8rem',
  },
  // Styles the full-width all-categories row.
  categoryBarAll: {
    maxWidth: '1200px',
    margin: '0 auto 0.45rem',
    boxSizing: 'border-box',
    fontSize: '0.72rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: '#3d2914',
  },
  // Styles the compact controls under the category grid.
  categoryControls: {
    maxWidth: '1200px',
    margin: '0.55rem auto 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
  },
  // Styles a control cluster in the category row.
  controlClusterSide: { display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' },
  // Styles the all-categories button.
  catBtnAll: {
    border: '1px solid #d9c4a7',
    background: '#fcf7ef',
    color: BROWN,
    borderRadius: '0',
    padding: '0.45rem 0.75rem',
    fontSize: '0.68rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    textAlign: 'center',
    fontFamily: 'inherit',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 'bold',
    width: '100%',
    minHeight: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(74,44,10,0.05)',
  },
  // Styles the category button grid.
  categoryBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '0.7rem',
    padding: 0,
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box',
    width: '100%',
  },
  // Styles each category button.
  catBtn: {
    border: '1px solid #d9c4a7',
    background: '#fcf7ef',
    color: BROWN,
    borderRadius: '0',
    padding: '0.6rem 0.6rem',
    fontSize: '0.68rem',
    cursor: 'pointer',
    whiteSpace: 'normal',
    lineHeight: 1.2,
    textAlign: 'center',
    fontFamily: 'inherit',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 'bold',
    width: '100%',
    minHeight: '2.6rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    boxShadow: '0 1px 2px rgba(74,44,10,0.05)',
  },
  // Styles the active category button.
  catBtnActive:     { background: BROWN, color: '#fff', border: `1px solid ${BROWN}`, boxShadow: '0 2px 5px rgba(74,44,10,0.12)' },
  // Styles the drink card grid.
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
  // Styles each drink grid card.
  drinkCard:        { flex: 1, width: '100%', background: '#fff', border: '2px solid #e8d5b7', borderRadius: '16px', padding: '1.5rem 1rem', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(74,44,10,0.08)' },
  // Styles the drink emoji.
  drinkEmoji:       { fontSize: '2.5rem' },
  // Styles drink names.
  drinkName:        { fontSize: '0.95rem', fontWeight: 'bold', color: BROWN, lineHeight: 1.3 },
  // Styles drink category text.
  drinkCategory:    { fontSize: '0.75rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' },
  // Styles drink price text.
  drinkPrice:       { fontSize: '1.1rem', color: PRICE_TEXT, fontWeight: 'bold', marginTop: '0.25rem' },
  // Styles the price and speaker row.
  drinkPriceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    marginTop: '0.25rem',
  },
  // Styles the read-aloud button.
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
  // Styles weather recommendation labels.
  weatherRecommendation: { marginTop: '0.4rem', background: '#e8f4ff', color: '#001a2e', borderRadius: '999px', padding: '0.25rem 0.55rem', fontSize: '0.72rem', fontWeight: 'bold'},
  // Styles modal overlay backgrounds.
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  checkoutOverlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210, padding: '0.75rem', boxSizing: 'border-box' },
  checkoutCard:     { background: '#fff', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' },
  checkoutField:    { marginBottom: '1rem' },
  checkoutLabel:    { display: 'block', fontWeight: 'bold', color: BROWN, marginBottom: '0.35rem', fontSize: '0.9rem' },
  checkoutInput:    { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '2px solid #e8d5b7', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' },
  checkoutBackBtn:  { width: '100%', marginTop: '0.75rem', background: 'transparent', border: 'none', color: BROWN, cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem', padding: '0.5rem', textDecoration: 'underline' },
  // Styles the standard customization modal.
  modalBox:         { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  // Styles modal title text.
  modalTitle:       { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: '0.5rem 0 0.25rem' },
  // Styles modal category text.
  modalCategory:    { fontSize: '0.85rem', color: TEXT_MUTED, textAlign: 'center', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  // Styles modal form sections.
  section:          { marginBottom: '1.25rem' },
  // Styles section labels.
  sectionLabel:     { fontWeight: 'bold', color: BROWN, marginBottom: '0.5rem', fontSize: '0.95rem' },
  // Styles the topping note element.
  toppingNote:      { color: TEXT_SECONDARY, fontWeight: 'normal', fontSize: '0.8rem' },
  // Styles option button rows.
  optionRow:        { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  // Styles modal option buttons.
  optBtn:           { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  // Styles selected option buttons.
  optBtnActive:     { background: BROWN, color: '#fff', border: `2px solid ${BROWN}` },
  // Styles the topping button grid.
  toppingGrid:      { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  // Styles each topping button.
  toppingBtn:       { border: '2px solid #e8d5b7', background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' },
  // Styles selected topping buttons.
  toppingBtnActive: { background: ACCENT_FILL, color: '#fff', border: `2px solid ${ACCENT_FILL}` },
  // Styles the modal footer row.
  modalFooter:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e8d5b7' },
  // Styles modal total price.
  modalTotal:       { fontSize: '1.4rem', fontWeight: 'bold', color: PRICE_TEXT },
  // Styles add-to-cart buttons.
  addBtn:           { background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.7rem 1.8rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  // Styles cart overlay layout.
  cartOverlayContent: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '1rem', width: '100%', padding: '1rem', boxSizing: 'border-box', flexWrap: 'wrap' },
  // Styles the cart drawer panel.
  cartDrawer:       { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' },
  // Styles coupon drawer panel.
  couponDrawer:     { background: '#fff', borderRadius: '20px', padding: '1.3rem', width: '90%', maxWidth: '260px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 6px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  // Styles coupon title.
  couponTitle:      { fontSize: '1.2rem', fontWeight: 'bold', color: BROWN, margin: 0 },
  // Styles empty coupon text.
  couponEmpty:      { margin: 0, color: '#3d2914', fontSize: '0.9rem', lineHeight: 1.35 },
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
  emptyCart:        { color: TEXT_MUTED, textAlign: 'center', padding: '2rem 0' },
  // Styles each cart item row.
  cartItem:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f0e0cc' },
  // Styles cart item details.
  cartItemInfo:     { flex: 1 },
  // Styles cart item name.
  cartItemName:     { fontWeight: 'bold', color: BROWN, fontSize: '0.95rem' },
  // Styles cart item metadata.
  cartItemMeta:     { fontSize: '0.78rem', color: TEXT_MUTED, marginTop: '0.25rem' },
  cartEditBtn:      { marginTop: '0.45rem', padding: '0.25rem 0', background: 'none', border: 'none', color: ACCENT_FILL, cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'underline', textUnderlineOffset: '2px' },
  // Styles cart item controls.
  cartItemRight:    { display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' },
  // Stacks old and new prices.
  cartPriceStack:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 },
  // Styles crossed-out old price.
  cartItemOldPrice: { color: '#5c534a', textDecoration: 'line-through', fontSize: '0.82rem' },
  // Styles cart item price.
  cartItemPrice:    { fontWeight: 'bold', color: PRICE_TEXT },
  // Styles remove item button (subtle).
  removeBtn:        { background: 'none', border: 'none', color: '#5c3d2e', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' },
  // Styles close cart button (prominent).
  closeCartBtn:     { background: '#f0e6d8', border: '1px solid #d5c2a8', borderRadius: '6px', color: BROWN, cursor: 'pointer', fontSize: '0.95rem', padding: '0.35rem 0.45rem', fontWeight: '600' },
  // Styles quantity buttons.
  quantityBtn:      { background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', color: BROWN, cursor: 'pointer', fontSize: '0.9rem', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  // Styles cart total row.
  cartTotalRow:     { display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: BROWN },
  // Styles cart savings note.
  cartSavings:      { fontSize: '0.78rem', color: '#2d6a4f' },
  // Styles cart total amount.
  cartTotalAmt:     { color: PRICE_TEXT, fontSize: '1.2rem' },
  // Styles claimed coupon label.
  cartCouponLabel:  { fontSize: '0.88rem', fontWeight: 'bold', color: BROWN },
  // Styles coupon action group.
  cartCouponActions: { display: 'flex', gap: '0.35rem' },
  // Styles coupon action buttons.
  cartCouponActionBtn: { flex: 1, border: '1px solid #d5c2a8', borderRadius: '8px', background: '#fff', color: BROWN, padding: '0.35rem 0.45rem', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  // Styles active coupon action button.
  cartCouponActionBtnActive: { background: BROWN, color: '#fff', borderColor: BROWN },
  // Styles coupon item selector.
  cartCouponSelect: { width: '100%', border: '1px solid #d5c2a8', borderRadius: '8px', background: '#fff', color: BROWN, padding: '0.35rem 0.45rem', fontSize: '0.8rem', fontFamily: 'inherit' },
  // Styles queued coupon notice.
  cartCouponQueued: { fontSize: '0.76rem', color: '#1a0f0a', fontWeight: 'bold' },
  // Styles place-order button.
  placeOrderBtn:    { width: '100%', background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '1rem', fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginTop: '0.5rem' },
  // Styles order success toast.
  toast:            { position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#2d6a4f', color: '#fff', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1rem', fontWeight: 'bold', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  // Styles assistant overlay area.
  assistantOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'flex-end', alignItems: 'stretch', zIndex: 400, padding: '0.75rem 0.75rem' },
  // Styles assistant chat popup.
  assistantPopup:   { width: 'min(420px, 100%)', height: 'calc(100dvh - 1.5rem)', maxHeight: 'calc(100dvh - 1.5rem)', background: '#fff', borderRadius: '22px', border: '1px solid #e8d5b7', boxShadow: '0 18px 40px rgba(0,0,0,0.22)', padding: '1rem', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  // Styles assistant header.
  assistantHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  // Styles the assistant badge element.
  assistantBadge:   { display: 'inline-block', padding: '0.25rem 0.65rem', borderRadius: '999px', background: '#fdf6ec', border: '1px solid #e8d5b7', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.35rem' },
  // Styles assistant title.
  assistantTitle:   { margin: 0, fontSize: '1.35rem', color: BROWN },
  // Styles assistant close button.
  assistantClose:   { border: 'none', background: '#f3e6d8', color: BROWN, borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontWeight: 'bold' },
  // Styles the assistant description element.
  assistantDescription: { margin: 0, color: '#1a0f0a', fontSize: '0.95rem' },
  // Styles the assistant quick row element.
  assistantQuickRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  // Styles the assistant quick button element.
  assistantQuickButton: { border: '1px solid #e8d5b7', background: '#fdf6ec', color: BROWN, borderRadius: '999px', padding: '0.45rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit' },
  // Styles the assistant chat window element.
  assistantChatWindow: { flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid #f0e0cc', borderRadius: '18px', padding: '0.85rem', background: '#fffdf9', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  // Styles the assistant message element.
  assistantMessage: { maxWidth: '80%', padding: '0.8rem 0.95rem', borderRadius: '16px', lineHeight: 1.45, whiteSpace: 'pre-wrap' },
  // Styles the assistant message bot element.
  assistantMessageBot: { background: '#f3e6d8', color: BROWN, alignSelf: 'flex-start' },
  // Styles the assistant message user element.
  assistantMessageUser: { background: BROWN, color: '#fff', alignSelf: 'flex-end' },
  // Styles assistant error text.
  assistantError:   { color: '#b00020', fontWeight: 'bold', margin: 0 },
  // Styles the assistant form element.
  assistantForm:    { display: 'flex', gap: '0.65rem' },
  // Styles assistant text input.
  assistantInput:   { flex: 1, borderRadius: '999px', border: '1px solid #d8c1a5', padding: '0.85rem 0.95rem', fontSize: '1rem', fontFamily: 'inherit' },
  // Styles the assistant send button element.
  assistantSendButton: { border: 'none', borderRadius: '999px', background: ACCENT_FILL, color: '#fff', padding: '0.85rem 1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' },
  // Styles the deal wheel modal.
  wheelModal:       { background: '#fff', borderRadius: '20px', padding: '1.3rem', width: '92%', maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  // Styles wheel modal header.
  wheelHeader:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  // Styles wheel title.
  wheelTitle:       { margin: 0, color: BROWN, fontSize: '1.3rem' },
  // Styles wheel close button.
  wheelCloseBtn:    { border: 'none', background: '#f3e6d8', color: BROWN, borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontWeight: 'bold' },
  // Styles wheel spin-limit note.
  wheelLimitNote:   { margin: 0, color: '#3d2914', fontSize: '0.86rem', fontWeight: 'bold' },
  // Styles wheel instruction text.
  wheelHint:        { margin: 0, color: '#3d2914', fontSize: '0.9rem' },
  // Styles wheel coupon card.
  wheelCouponCard:  { border: '1px solid #e8d5b7', background: '#fff8f0', borderRadius: '10px', padding: '0.55rem 0.7rem' },
  // Styles wheel coupon heading.
  wheelCouponTitle: { margin: 0, color: '#321f0f', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' },
  // Styles wheel coupon text.
  wheelCouponText:  { margin: '0.2rem 0 0', color: BROWN, fontSize: '0.92rem', fontWeight: 'bold' },
  // Styles wheel display area.
  wheelStage:       { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0.6rem 0 0.3rem' },
  // Styles wheel pointer marker.
  wheelPointer:     { position: 'absolute', top: '-0.35rem', fontSize: '1.2rem', color: BROWN, zIndex: 2 },
  // Styles spinning wheel disc.
  wheelDisc:        { width: '250px', height: '250px', borderRadius: '50%', border: `6px solid ${BROWN}`, position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' },
  // Styles wheel segment labels.
  wheelSegmentLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transformOrigin: '0 0',
    color: '#220f05',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    width: '56px',
    textAlign: 'center',
    lineHeight: 1.1,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    textShadow: '0 0 2px #ffffff, 0 0 6px #ffffff',
  },
  // Styles wheel center hub.
  wheelHub:         { position: 'absolute', width: '24px', height: '24px', borderRadius: '50%', background: BROWN, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  // Styles wheel spin button.
  wheelSpinBtn:     { border: 'none', background: ACCENT_FILL, color: '#fff', borderRadius: '50px', padding: '0.75rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '1rem' },
  // Styles coupon claim button.
  wheelClaimBtn:    { border: 'none', background: BROWN, color: '#fff', borderRadius: '50px', padding: '0.72rem 1.2rem', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: '0.95rem' },
  // Styles disabled spin button.
  wheelSpinBtnDisabled: {
    border: 'none',
    background: '#c9beb3',
    color: '#383838',
    borderRadius: '50px',
    padding: '0.75rem 1.2rem',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    fontFamily: 'inherit',
    fontSize: '1rem',
  },
  // Styles fun-mode points badge.
  pointsBadge:   { background: '#fff', color: BROWN, borderRadius: '50px', padding: '0.45rem 1rem', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  // Styles the fun mode btn element.
  funModeBtn:    { width: '2.2rem', height: '2.2rem', borderRadius: '50%', border: 'none', fontSize: '1.2rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, transition: 'opacity 0.2s ease, box-shadow 0.2s ease' },
  // Styles the fun mode btn on element.
  funModeBtnOn:  { background: '#fff', boxShadow: '0 2px 8px rgba(200,119,58,0.45)', opacity: 1 },
  // Styles the fun mode btn off element.
  funModeBtnOff: { background: '#fff', boxShadow: 'none', opacity: 1, border: '2px solid rgba(255,255,255,0.5)' },
  // Styles larger fun-mode drink emoji.
  drinkEmojiLarge: { fontSize: '3.8rem' },
  // Styles fun-mode wizard modal.
  wizardBox:         { background: '#fff', borderRadius: '24px', padding: '2rem 1.5rem', width: '92%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
  // Styles wizard close button.
  wizardCloseBtn:    { position: 'absolute', top: '0.85rem', left: '0.85rem', background: '#f3e6d8', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1rem', fontWeight: 'bold', color: BROWN, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  wizardCloseBtnRight: { left: 'auto', right: '0.85rem' },
  customizeEditBackBtn: { position: 'absolute', top: '0.85rem', left: '0.85rem', background: '#f3e6d8', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', fontSize: '1.15rem', fontWeight: 'bold', color: BROWN, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, zIndex: 1 },
  // Styles wizard header area.
  wizardHeader:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' },
  // Styles large wizard emoji.
  wizardBigEmoji:    { fontSize: '4.5rem', lineHeight: 1 },
  // Styles wizard drink name.
  wizardDrinkName:   { fontSize: '1.5rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: 0 },
  // Styles wizard choice summary.
  wizardSummary:     { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' },
  // Styles wizard summary chips.
  wizardSummaryChip: { background: '#fff4eb', border: `1.5px solid ${ACCENT}`, borderRadius: '50px', padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: 'bold', color: BROWN, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' },
  // Styles wizard progress dots.
  wizardDots:        { display: 'flex', justifyContent: 'center', gap: '0.6rem', margin: '0.75rem 0' },
  // Styles each wizard dot.
  wizardDot:         { width: '0.7rem', height: '0.7rem', borderRadius: '50%', background: '#e8d5b7', display: 'inline-block' },
  // Styles active wizard dot.
  wizardDotActive:   { background: ACCENT_FILL, transform: 'scale(1.3)' },
  // Styles wizard step content.
  wizardStep:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  // Styles wizard question text.
  wizardQuestion:    { fontSize: '1.5rem', fontWeight: 'bold', color: BROWN, textAlign: 'center', margin: 0 },
  // Styles wizard option grid.
  wizardOptions:     { display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' },
  // Styles wizard option buttons.
  wizardOptBtn:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', border: `3px solid #e8d5b7`, background: '#fffdf9', borderRadius: '18px', padding: '1rem 0.75rem', minWidth: '90px', flex: 1, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s ease, background 0.15s ease' },
  // Styles active wizard option.
  wizardOptBtnActive: { border: `3px solid ${ACCENT}`, background: '#fff4eb' },
  // Styles wizard option emoji.
  wizardOptEmoji:    { fontSize: '2.2rem', lineHeight: 1 },
  // Styles wizard option label.
  wizardOptLabel:    { fontSize: '0.95rem', fontWeight: 'bold', color: BROWN, textAlign: 'center' },
  // Styles wizard topping grid.
  wizardToppingGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', width: '100%' },
  // Styles wizard topping buttons.
  wizardToppingBtn:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', border: `2px solid #e8d5b7`, background: '#fffdf9', borderRadius: '14px', padding: '0.6rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', color: BROWN, minWidth: '90px' },
  // Styles active wizard topping.
  wizardToppingBtnActive: { border: `2px solid ${ACCENT}`, background: '#fff4eb', color: BROWN },
  // Styles wizard footer row.
  wizardFooter:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.75rem', marginTop: '0.5rem' },
  // Styles wizard back button.
  wizardBackBtn:     { background: '#f3e6d8', border: 'none', borderRadius: '50px', padding: '0.6rem 1.2rem', fontSize: '0.95rem', color: BROWN, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  // Styles wizard total price.
  wizardTotal:       { fontSize: '1.4rem', fontWeight: 'bold', color: PRICE_TEXT },
  // Styles wizard add button.
  wizardAddBtn:      { background: BROWN, color: '#fff', border: 'none', borderRadius: '50px', padding: '0.75rem 1.4rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' },
  // Styles achievement toast panel.
  achievementToast:  { position: 'fixed', bottom: '5rem', right: '1.5rem', background: BROWN, color: '#fff', padding: '0.9rem 1.2rem', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '0.8rem', zIndex: 500, boxShadow: '0 6px 24px rgba(0,0,0,0.25)', minWidth: '200px' },
  // Styles achievement icon.
  achievementIcon:   { fontSize: '2rem', lineHeight: 1, flexShrink: 0 },
  // Styles achievement label.
  achievementLabel:  { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f8fafc', fontWeight: 'bold' },
  // Styles achievement name.
  achievementName:   { fontSize: '1.05rem', fontWeight: 'bold', color: '#ffffff' },
  // Styles achievements modal panel.
  achievementsPanel:       { background: '#fff', borderRadius: '20px', padding: '2rem', width: '90%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' },
  // Styles achievements header.
  achievementsPanelHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' },
  // Styles achievements title.
  achievementsPanelTitle:  { fontSize: '1.4rem', fontWeight: 'bold', color: BROWN, margin: 0 },
  // Styles achievements progress text.
  achievementsPanelSub:    { fontSize: '0.85rem', color: TEXT_MUTED, margin: '0 0 1.25rem' },
  // Styles achievements close button.
  achievementsCloseBtn:    { border: 'none', background: '#f3e6d8', color: BROWN, borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
  // Styles achievements list.
  achievementsList:        { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  // Styles each achievement row.
  achievementsItem:        { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '14px', border: '2px solid transparent' },
  // Styles earned achievements.
  achievementsItemEarned:  { background: '#fff8f0', border: `2px solid ${ACCENT}` },
  // Styles locked achievements.
  achievementsItemLocked:  { background: '#ececec', border: '2px dashed #b0b0b0', opacity: 1 },
  // Styles achievement row icon.
  achievementsItemIcon:    { fontSize: '2rem', lineHeight: 1, flexShrink: 0 },
  // Styles achievement text area.
  achievementsItemInfo:    { flex: 1 },
  // Styles achievement row name.
  achievementsItemName:    { fontWeight: 'bold', color: BROWN, fontSize: '1rem' },
  // Styles achievement hint text.
  achievementsItemHint:    { fontSize: '0.8rem', color: TEXT_MUTED, marginTop: '0.15rem' },
  // Styles earned check badge.
  achievementsItemBadge:   { fontSize: '1.2rem', flexShrink: 0 },
  // Styles the controls bar wrapper.
  controlsBar: {
    background: '#f5ebe0',
    borderBottom: '1px solid #e8d5b7',
    padding: '0.55rem 1rem',
  },
  // Styles the controls bar layout.
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
  // Groups related controls together.
  controlCluster: { display: 'flex', alignItems: 'center', gap: '0.45rem' },
  // Styles small control labels.
  controlClusterLabel: {
    fontSize: '0.68rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#291a0f',
    minWidth: '2.75rem',
  },
  // Styles the view toggle group.
  viewToggleGroup:  { display: 'flex', gap: '0.35rem', paddingLeft: '1.5rem' },
  // Styles each view toggle button.
  viewBtn:          { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '8px', padding: '0.75rem 0.75rem', cursor: 'pointer', color: BROWN, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s ease, border-color 0.15s ease' },
  // Styles the active view button.
  viewBtnActive:    { background: BROWN, color: '#fff', borderColor: BROWN },
  // Styles the text-size button group.
  sizeGroup:        { display: 'flex', alignItems: 'center', gap: '0.4rem', paddingRight: '1.5rem' },
  // Styles each text-size button.
  sizeBtn:          { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '8px', padding: '0.75rem 0.75rem', cursor: 'pointer', color: BROWN, fontFamily: 'inherit', transition: 'background 0.15s ease, border-color 0.15s ease', lineHeight: 1 },
  // Styles the drink list layout.
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
  // Styles each drink list card.
  listCard:         { background: '#fff', border: '2px solid #e8d5b7', borderRadius: '16px', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(74,44,10,0.08)', textAlign: 'left', width: '100%' },
  // Styles list-card text content.
  listCardInfo:     { display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minWidth: 0 },
  
  // Styles the empty-filter message.
  emptyFilterMessage: {
    gridColumn: '1 / -1',
    width: '100%',
    textAlign: 'center',
    color: '#291a0f',
    padding: '2rem 1rem',
    margin: 0,
    fontSize: '1rem',
    lineHeight: 1.5,
    fontWeight: 'bold',
  },
  // Styles the guide footer element.
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
  // Styles the guide title element.
  guideTitle: {
    margin: '0 0 1.25rem',
    fontSize: '1.35rem',
    color: BROWN,
    fontWeight: 'bold',
    letterSpacing: '0.02em',
  },
  // Styles guide content section.
  guideSection: { marginBottom: '1.75rem' },
  // Styles guide section title.
  guideSectionTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.05rem',
    color: BROWN,
    fontWeight: 'bold',
    letterSpacing: '0.04em',
  },
  // Styles the guide lead element.
  guideLead: {
    margin: '0 0 1rem',
    fontSize: '0.95rem',
    lineHeight: 1.55,
    color: '#2d231a',
  },
  // Styles the guide chip row element.
  guideChipRow: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.1rem' },
  // Styles the guide chip element.
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
  // Styles the guide chip active element.
  guideChipActive: { background: BROWN, color: '#fff', borderColor: BROWN },
  // Styles the guide search label element.
  guideSearchLabel: {
    display: 'block',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    color: BROWN,
    marginBottom: '0.35rem',
  },
  // Styles the guide search input element.
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
  // Styles guide bullet list.
  guideList: {
    margin: 0,
    paddingLeft: '1.25rem',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#2d231a',
  },
  // Styles guide warning boxes.
  guideDisclaimer: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#2d231a',
    padding: '1rem 1.15rem',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e8d5b7',
  },
};
