// Centralized product data - single source of truth
export const fruits = [
  {
    id: 1,
    name: 'Apple',
    description: 'Crisp and juicy red apples, rich in fiber and vitamin C',
    price: 120,
    originalPrice: 150,
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
    price: 90,
    originalPrice: 120,
    image: '/fruits/blackgrapes.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit A'
  },
  {
    id: 4,
    name: 'Green Grapes',
    description: 'Fresh and tangy green grapes, refreshingly sweet',
    price: 85,
    originalPrice: 110,
    image: '/fruits/greengrapes.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit A'
  },
  {
    id: 5,
    name: 'Guava',
    description: 'Tropical guava with unique flavor and high vitamin content',
    price: 60,
    originalPrice: 80,
    image: '/fruits/guava.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 6,
    name: 'Kiwi',
    description: 'Exotic kiwi fruit with bright green flesh and tiny seeds',
    price: 150,
    originalPrice: 200,
    image: '/fruits/kiwi.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 7,
    name: 'Oranges',
    description: 'Fresh citrus oranges bursting with vitamin C',
    price: 70,
    originalPrice: 90,
    image: '/fruits/oranges.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit C'
  },
  {
    id: 8,
    name: 'Papaya',
    description: 'Sweet tropical papaya rich in enzymes and vitamins',
    price: 40,
    originalPrice: 60,
    image: '/fruits/papaya.png',
    category: 'Fresh Fruits',
    type: 'fruit',
    vitamin: 'Vit A'
  },
  {
    id: 9,
    name: 'Pineapple',
    description: 'Juicy golden pineapple with tropical sweetness',
    price: 50,
    originalPrice: 70,
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
    price: 500,
    originalPrice: 500,
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
    price: 900,
    originalPrice: 1200,
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
    price: 450,
    originalPrice: 450,
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
    price: 800,
    originalPrice: 1100,
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
    price: 500,
    originalPrice: 500,
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
    price: 900,
    originalPrice: 1200,
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
    price: 450,
    originalPrice: 450,
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
    price: 800,
    originalPrice: 1100,
    image: '/packs/standard_pack-duo.png',
    category: 'Daily Bowl',
    usesOfPack: 'Balanced nutrition, Daily wellness, For 2 persons',
    type: 'bowl',
    isSubscription: false
  }
];

// Helper functions
export const getAllProducts = () => [...fruits, ...packs, ...bowls];

export const getFruitById = (id) => fruits.find(f => f.id === parseInt(id));

export const getPackById = (id) => packs.find(p => p.id === parseInt(id));

export const getBowlById = (id) => bowls.find(b => b.id === parseInt(id));

export const getProductById = (id, type) => {
  if (type === 'pack') return getPackById(id);
  if (type === 'bowl') return getBowlById(id);
  return getFruitById(id);
};

export const searchProducts = (query) => {
  if (!query || !query.trim()) return [];
  
  const searchTerm = query.trim().toLowerCase();
  const allItems = getAllProducts();
  
  return allItems.filter(item => {
    return (
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.description && item.description.toLowerCase().includes(searchTerm)) ||
      (item.category && item.category.toLowerCase().includes(searchTerm)) ||
      (item.usesOfPack && item.usesOfPack.toLowerCase().includes(searchTerm))
    );
  });
};

export const getPriceDropItems = (maxPrice = 100) => {
  return getAllProducts().filter(item => item.price < maxPrice);
};
