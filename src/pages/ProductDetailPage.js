import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Heart, Share2, ArrowLeft, Calendar, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { fruits, packs, bowls, refreshments, getProductById } from '../data/productsData';

const ProductDetailPage = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loadingRelatedId, setLoadingRelatedId] = useState(null);
  const [isReloading, setIsReloading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Weekly schedule for Vit C packs
  const vitCSchedule = {
    Monday: ['Amla', 'Papaya', 'Apple', 'Guava', 'Pomegranate'],
    Tuesday: ['Amla', 'Green Apple', 'Orange', 'Pineapple', 'Apple'],
    Wednesday: ['Amla', 'Papaya', 'Guava', 'Pomegranate', 'Black Grapes'],
    Thursday: ['Amla', 'Pineapple', 'Green Apple', 'Apple', 'Papaya'],
    Friday: ['Amla', 'Pomegranate', 'Pineapple', 'Guava', 'Black Grapes'],
    Saturday: ['Green Grapes', 'Apple', 'Amla', 'Pomegranate', 'Papaya']
  };

  // Standard pack fruits list
  const standardPackFruits = ['Apple', 'Papaya', 'Guava', 'Pineapple', 'Pomegranate', 'Black Grapes', 'Green Grapes', 'Orange', 'Amla'];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsReloading(false);
    loadProductData();
    checkUserAuth();
    checkWishlistStatus();
  }, [id, type]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkWishlistStatus = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    setIsInWishlist(wishlist.some(item => item.id === parseInt(id)));
  };

  const checkUserAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchCustomerProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const fetchCustomerProfile = async (userId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/customers/${userId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCustomerProfile(result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const isProfileComplete = (profile) => {
    if (!user) return false;
    if (!profile) return false;

    // Check if all required fields are filled
    return !!(
      profile.name &&
      profile.email &&
      profile.phone &&
      profile.college
    );
  };

  const loadProductData = () => {
    // Get current product using centralized data
    const currentProduct = getProductById(id, type);
    setProduct(currentProduct);

    if (!currentProduct) {
      return;
    }

    if (type === 'pack') {
      // Find variant (if Solo, show Duo; if Duo, show Solo)
      const isSolo = currentProduct.name.includes('Solo');
      const isVitC = currentProduct.name.includes('Vit C');

      const variantPack = packs.find(p =>
        p.name.includes(isVitC ? 'Vit C' : 'Standard') &&
        p.name.includes(isSolo ? 'Duo' : 'Solo')
      );

      setVariants(variantPack ? [variantPack] : []);

      // Set related items (other packs)
      setRelatedItems(packs.filter(p => p.id !== parseInt(id)).slice(0, 4));
    } else if (type === 'bowl') {
      setVariants([]);
      setRelatedItems(bowls.filter(b => b.id !== parseInt(id)).slice(0, 4));
    } else if (type === 'refreshment') {
      setVariants([]);
      setRelatedItems(refreshments.filter(r => r.id !== parseInt(id)).slice(0, 4));
    } else {
      setVariants([]);
      setRelatedItems(fruits.filter(f => f.id !== parseInt(id)).slice(0, 4));
    }
  };

  const handleRelatedClick = (item, itemType) => {
    setLoadingRelatedId(item.id);
    setIsReloading(true);
    setTimeout(() => {
      navigate(`/product/${itemType}/${item.id}`);
    }, 400);
  };

  // Fruit benefits mapping
  const getFruitBenefits = (productName) => {
    const benefits = {
      'Apple': [
        'Rich in dietary fiber, aids digestion',
        'High in antioxidants, reduces disease risk',
        'Helps regulate blood sugar levels',
        'Supports heart health and lowers cholesterol',
        'Boosts immune system with Vitamin C'
      ],
      'Amla': [
        'Highest natural source of Vitamin C',
        'Powerful immune system booster',
        'Promotes healthy hair and skin',
        'Improves metabolism and digestion',
        'Rich in antioxidants, anti-aging properties'
      ],
      'Black Grapes': [
        'Rich in antioxidants and vitamins',
        'Promotes heart health',
        'Boosts brain function and memory',
        'Natural energy source',
        'Supports healthy skin'
      ],
      'Green Grapes': [
        'Hydrating and refreshing',
        'Good source of vitamins K and C',
        'Supports bone health',
        'Low calorie, perfect for snacking',
        'Aids in digestion'
      ],
      'Guava': [
        'Extremely high in Vitamin C',
        'Excellent for digestive health',
        'Helps regulate blood sugar',
        'Boosts immunity naturally',
        'Rich in dietary fiber'
      ],
      'Kiwi': [
        'Packed with Vitamin C and E',
        'Aids digestion with natural enzymes',
        'Supports immune function',
        'Promotes healthy skin',
        'Good source of potassium'
      ],
      'Oranges': [
        'Excellent source of Vitamin C',
        'Boosts immune system',
        'Hydrating and refreshing',
        'Supports heart health',
        'Rich in antioxidants'
      ],
      'Papaya': [
        'Contains papain enzyme for digestion',
        'Rich in Vitamin A and C',
        'Promotes healthy skin',
        'Anti-inflammatory properties',
        'Supports eye health'
      ],
      'Pineapple': [
        'Contains bromelain for digestion',
        'Natural anti-inflammatory',
        'Boosts immune system',
        'Rich in Vitamin C and manganese',
        'Supports bone health'
      ]
    };
    return benefits[productName] || [
      'Nutritious and delicious',
      'Rich in vitamins and minerals',
      'Supports overall health',
      'Natural energy source',
      'Part of a balanced diet'
    ];
  };

  const handleAddToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === item.type);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleBuyNow = async (item) => {
    // Check if user is logged in
    if (!user) {
      navigate('/customer/login', { state: { from: `/product/${type}/${id}` } });
      return;
    }

    const latestProfile = customerProfile || await fetchCustomerProfile(user.id);

    // Check if profile is complete
    if (!isProfileComplete(latestProfile)) {
      navigate('/customer/update-profile', { state: { from: `/product/${type}/${id}`, notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
      return;
    }

    // Add to cart and navigate to checkout page
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === item.type);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Navigate to checkout page
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    const itemIndex = wishlist.findIndex(item => item.id === product.id && item.type === product.type);

    if (itemIndex > -1) {
      wishlist.splice(itemIndex, 1);
      setIsInWishlist(false);
    } else {
      wishlist.push(product);
      setIsInWishlist(true);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const benefits = getFruitBenefits(product.name);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Header - Shows on Scroll */}
      <div className={`fixed top-0 left-0 right-0 bg-gray-200 border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50 transition-transform duration-300 ${isScrolled ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => navigate('/customer/search')}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">{product?.name}</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleWishlist}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <Heart
              className={`w-5 h-5 ${isInWishlist ? 'fill-black text-black' : 'text-gray-700'}`}
            />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Full Width Product Image with Icons */}
      <div className="relative w-full">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-96 object-cover"
        />

        {/* Top Icons Bar */}
        <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => navigate('/customer/search')}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleToggleWishlist}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <Heart
                className={`w-5 h-5 ${isInWishlist ? 'fill-black text-black' : 'text-gray-700'}`}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="px-4 py-6">
        {/* Product Name */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>

        {/* Price Section */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
          {product.originalPrice && product.originalPrice !== product.price && (
            <>
              <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
              <span className="bg-green-700 text-white text-sm font-bold px-3 py-1 rounded-full">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed">{product.description}</p>
        </div>

        {/* Benefits/Uses Section */}
        {type === 'fruit' && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Health Benefits</h2>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vitamins Section */}
        {product.vitamin && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Vitamins & Nutrients</h2>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                {product.vitamin}
              </span>
              <span className="text-sm text-gray-700">Rich source</span>
            </div>
          </div>
        )}

        {/* Refreshment Details */}
        {type === 'refreshment' && product.unit && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Product Details</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Size:</span> {product.unit}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Category:</span> {product.category}
              </p>
            </div>
          </div>
        )}

        {/* Pack Details */}
        {(type === 'pack' || type === 'bowl') && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pack Details</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Duration:</span> {product.numberOfDays === 30 ? '1 Month' : product.numberOfDays === 1 ? '1 Day' : `${product.numberOfDays} Days`}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Category:</span> {product.category}
              </p>
              {product.usesOfPack && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Uses:</span> {product.usesOfPack}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Weekly Schedule Button - Only for subscription packs */}
        {type === 'pack' && product.isSubscription && (
          <div className="mb-6">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg border-2 border-black"
            >
              <Calendar className="w-5 h-5" />
              View Weekly Schedule
            </button>
          </div>
        )}

        {/* Variants Section */}
        {variants.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Available Variants</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => handleRelatedClick(variant, 'pack')}
                  className="relative flex-shrink-0 w-40 bg-white rounded-xl border-2 border-gray-200 p-3 cursor-pointer hover:border-black transition-all"
                >
                  <img src={variant.image} alt={variant.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                  <p className="text-sm font-semibold text-gray-900 truncate">{variant.name}</p>
                  <p className="text-sm font-bold text-gray-900">₹{variant.price}</p>
                  {isReloading && loadingRelatedId === variant.id && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl">
                      <div className="h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      <p className="mt-2 text-xs font-semibold text-gray-900">Loading...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* People Also Bought Section */}
        {relatedItems.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">People Also Bought</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {relatedItems.map((item) => {
                const itemType = item.type || (item.numberOfDays && item.numberOfDays > 1 ? 'pack' : item.numberOfDays === 1 ? 'bowl' : 'fruit');
                return (
                  <div
                    key={item.id}
                    onClick={() => handleRelatedClick(item, itemType)}
                    className="relative flex-shrink-0 w-40 bg-white rounded-xl border-2 border-gray-100 overflow-hidden cursor-pointer hover:border-gray-300 transition-all"
                  >
                    <img src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm font-bold text-gray-900">₹{item.price}</p>
                    </div>
                    {loadingRelatedId === item.id && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                        <div className="h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                        <p className="mt-2 text-xs font-semibold text-gray-900">Loading...</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-50">
        <button
          onClick={() => handleAddToCart(product)}
          className="flex-1 py-3 bg-gray-300 text-gray-900 font-bold rounded-xl hover:bg-gray-400 transition-all"
        >
          Add to Cart
        </button>
        <button
          onClick={() => handleBuyNow(product)}
          className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
        >
          Buy Now
        </button>
      </div>

      {/* Full Screen Reload Animation */}
      {isReloading && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-300">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold text-gray-900 animate-pulse">Loading Product...</p>
        </div>
      )}

      {/* Weekly Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-black text-white px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h2 className="text-lg font-bold">Weekly Schedule</h2>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-60px)]">
              {product?.name?.includes('Vit C') ? (
                // Vit C Pack Schedule
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Your daily fruit delivery schedule for the Vit C Pack:
                  </p>
                  {Object.entries(vitCSchedule).map(([day, fruits]) => (
                    <div key={day} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-black rounded-full"></span>
                        {day}
                      </h3>
                      <ul className="space-y-1">
                        {fruits.map((fruit, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <span className="text-green-600">•</span>
                            {fruit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    * Sunday is a rest day - no delivery
                  </p>
                </div>
              ) : (
                // Standard Pack Info
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-yellow-600">📦</span>
                      Flexible Delivery
                    </h3>
                    <p className="text-sm text-gray-700">
                      Any 5 fruits from the list below will be delivered daily based on seasonal availability and freshness.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-3">Available Fruits</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {standardPackFruits.map((fruit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-green-600">✓</span>
                          {fruit}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    * Actual fruits may vary based on seasonal availability
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
