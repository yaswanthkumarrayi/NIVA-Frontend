// ⚠️ SECURITY REFACTOR: Products now fetched from backend API
// Backend is the ONLY source of truth for prices
// This prevents price manipulation attacks

let cachedProducts = null;

/**
 * Fetch all products from secure backend endpoint
 * Backend hard-codes all prices - frontend NEVER sends prices
 */
export async function fetchProducts() {
  if (cachedProducts) {
    console.log('✅ Using cached products');
    return cachedProducts;
  }
  
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('📡 Fetching products from:', `${API_URL}/api/products`);
    
    const response = await fetch(`${API_URL}/api/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.products) {
      cachedProducts = data.products;
      console.log(`✅ Loaded ${data.products.length} products from backend`);
      return data.products;
    }
    
    throw new Error(data.message || 'Failed to fetch products');
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
}

/**
 * Clear cached products (use when products might have changed)
 */
export function clearProductCache() {
  cachedProducts = null;
  console.log('🔄 Product cache cleared');
}

// ========================================
// DEPRECATED: Old hard-coded product arrays
// Kept for backwards compatibility during migration
// TODO: Remove once all components use fetchProducts()
// ========================================
export const fruits = [
  {
    id: 1,
    name: 'Apple',
    description: 'Crisp and juicy red apples, rich in fiber and vitamin C',
    price: 69,
    originalPrice: 80,
    image: '/fruits/apple.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 2,
    name: 'Amla',
    description: 'Indian gooseberry packed with vitamin C and antioxidants',
    price: 80,
    originalPrice: 100,
    image: '/fruits/amla.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 3,
    name: 'Black Grapes',
    description: 'Sweet and seedless black grapes, perfect for snacking',
    price: 39,
    originalPrice: 59,
    image: '/fruits/blackgrapes.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit A'
  },
  {
    id: 4,
    name: 'Green Grapes',
    description: 'Fresh and tangy green grapes, refreshingly sweet',
    price: 69,
    originalPrice: 80,
    image: '/fruits/greengrapes.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit A'
  },
  {
    id: 5,
    name: 'Guava',
    description: 'Tropical guava with unique flavor and high vitamin content',
    price: 39,
    originalPrice: 59,
    image: '/fruits/guava.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 6,
    name: 'Kiwi',
    description: 'Exotic kiwi fruit with bright green flesh and tiny seeds',
    price: 89,
    originalPrice: 129,
    image: '/fruits/kiwi.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 7,
    name: 'Oranges',
    description: 'Fresh citrus oranges bursting with vitamin C',
    price: 39,
    originalPrice: 59,
    image: '/fruits/oranges.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 8,
    name: 'Papaya',
    description: 'Sweet tropical papaya rich in enzymes and vitamins',
    price: 39,
    originalPrice: 70,
    image: '/fruits/papaya.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit A'
  },
  {
    id: 9,
    name: 'Pineapple',
    description: 'Juicy golden pineapple with tropical sweetness',
    price: 39,
    originalPrice: 59,
    image: '/fruits/Pineapple.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  }
];

export const packs = [
  {
    id: 1,
    name: 'Vit C Pack - Solo',
    description: 'Boost your immunity with our specially curated Vitamin C rich fruits for one person',
    price: 2399,
    originalPrice: 2599,
    image: '/packs/vit-c_pack.png',
    category: 'Health Pack',
    numberOfDays: 30,
    usesOfPack: 'Immunity boosting, Rich in antioxidants',
    type: 'pack',
    isSubscription: true
  },
  {
    id: 2,
    name: 'Vit C Pack - Duo',
    description: 'Boost immunity for two with our specially curated Vitamin C rich fruits',
    price: 3999,
    originalPrice: 4798,
    image: '/packs/vit-c_pack-duo.png',
    category: 'Health Pack',
    numberOfDays: 30,
    usesOfPack: 'Immunity boosting, Rich in antioxidants, For 2 persons',
    type: 'pack',
    isSubscription: true
  },
  {
    id: 3,
    name: 'Standard Pack - Solo',
    description: 'Daily essentials fruit pack for complete nutrition for one person',
    price: 1999,
    originalPrice: 2399,
    image: '/packs/standard_pack.png',
    category: 'Daily Pack',
    numberOfDays: 30,
    usesOfPack: 'Balanced nutrition, Daily wellness',
    type: 'pack',
    isSubscription: true
  },
  {
    id: 4,
    name: 'Standard Pack - Duo',
    description: 'Daily essentials fruit pack for complete nutrition for two persons',
    price: 3599,
    originalPrice: 3998,
    image: '/packs/standard_pack-duo.png',
    category: 'Daily Pack',
    numberOfDays: 30,
    usesOfPack: 'Balanced nutrition, Daily wellness, For 2 persons',
    type: 'pack',
    isSubscription: true
  }
];

export const bowls = [
  {
    id: 101,
    name: 'Vit C Bowl - Solo',
    description: 'Boost your immunity with our specially curated Vitamin C rich fruits for one person',
    price: 99,
    originalPrice: 119,
    image: '/packs/vit-c_pack.png',
    category: 'Health Bowl',
    usesOfPack: 'Immunity boosting, Rich in antioxidants',
    type: 'bowl',
    isSubscription: false
  },
  {
    id: 102,
    name: 'Vit C Bowl - Duo',
    description: 'Boost immunity for two with our specially curated Vitamin C rich fruits',
    price: 179,
    originalPrice: 198,
    image: '/packs/vit-c_pack-duo.png',
    category: 'Health Bowl',
    usesOfPack: 'Immunity boosting, Rich in antioxidants, For 2 persons',
    type: 'bowl',
    isSubscription: false
  },
  {
    id: 103,
    name: 'Standard Bowl - Solo',
    description: 'Daily essentials fruit bowl for complete nutrition for one person',
    price: 79,
    originalPrice: 99,
    image: '/packs/standard_pack.png',
    category: 'Daily Bowl',
    usesOfPack: 'Balanced nutrition, Daily wellness',
    type: 'bowl',
    isSubscription: false
  },
  {
    id: 104,
    name: 'Standard Bowl - Duo',
    description: 'Daily essentials fruit bowl for complete nutrition for two persons',
    price: 149,
    originalPrice: 168,
    image: '/packs/standard_pack-duo.png',
    category: 'Daily Bowl',
    usesOfPack: 'Balanced nutrition, Daily wellness, For 2 persons',
    type: 'bowl',
    isSubscription: false
  }
];

export const refreshments = [
  {
    id: 201,
    name: 'Coconut Juice',
    description: 'Fresh and natural coconut water, hydrating and refreshing',
    price: 120,
    originalPrice: 150,
    image: '/refreshments/coconut.png',
    category: 'Refreshments',
    type: 'refreshment',
    vitamin: 'Electrolytes',
    unit: '1 litre per bottle'
  }
];

// ========================================
// Helper Functions - Updated to work with API
// ========================================

/**
 * Get all products (use fetchProducts() instead for fresh data)
 */
export const getAllProducts = () => [...fruits, ...packs, ...bowls, ...refreshments];

/**
 * Filter products by type from fetched products
 */
export function getFruits(products) {
  return products ? products.filter(p => p.type === 'fruit') : fruits;
}

export function getPacks(products) {
  return products ? products.filter(p => p.type === 'pack') : packs;
}

export function getBowls(products) {
  return products ? products.filter(p => p.type === 'bowl') : bowls;
}

export function getRefreshments(products) {
  return products ? products.filter(p => p.type === 'refreshment') : refreshments;
}

/**
 * Find product by ID from fetched products
 */
export const getFruitById = (id, products = null) => {
  if (products) return products.find(p => p.id === parseInt(id) && p.type === 'fruit');
  return fruits.find(f => f.id === parseInt(id));
};

export const getPackById = (id, products = null) => {
  if (products) return products.find(p => p.id === parseInt(id) && p.type === 'pack');
  return packs.find(p => p.id === parseInt(id));
};

export const getBowlById = (id, products = null) => {
  if (products) return products.find(p => p.id === parseInt(id) && p.type === 'bowl');
  return bowls.find(b => b.id === parseInt(id));
};

export const getRefreshmentById = (id, products = null) => {
  if (products) return products.find(p => p.id === parseInt(id) && p.type === 'refreshment');
  return refreshments.find(r => r.id === parseInt(id));
};

export const getProductById = (id, type, products = null) => {
  if (products) {
    return products.find(p => p.id === parseInt(id) && p.type === type);
  }
  
  if (type === 'pack') return getPackById(id);
  if (type === 'bowl') return getBowlById(id);
  if (type === 'refreshment') return getRefreshmentById(id);
  return getFruitById(id);
};

export const searchProducts = (query, products = null) => {
  if (!query || !query.trim()) return [];
  
  const searchTerm = query.trim().toLowerCase();
  const allItems = products || getAllProducts();
  
  return allItems.filter(item => {
    return (
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
      (item.category && item.category.toLowerCase().includes(searchTerm)) ||
      (item.usesOfPack && item.usesOfPack.toLowerCase().includes(searchTerm))
    );
  });
};

export const getPriceDropItems = (maxPrice = 100, products = null) => {
  const allItems = products || getAllProducts();
  return allItems.filter(item => item.price < maxPrice);
};
