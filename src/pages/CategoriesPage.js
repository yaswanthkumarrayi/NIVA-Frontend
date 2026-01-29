import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import { fruits as fruitsData, packs as packsData, bowls as bowlsData, refreshments as refreshmentsData } from '../data/productsData';

function CategoriesPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [bowls, setBowls] = useState([]);
  const [refreshments, setRefreshments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [subscriptionSettings, setSubscriptionSettings] = useState({ isOpen: true, nextAvailableDate: null });

  useEffect(() => {
    loadData();
    loadWishlist();
    fetchSubscriptionSettings();
  }, []);

  const loadWishlist = () => {
    const updateWishlist = () => {
      const savedWishlist = localStorage.getItem('wishlist');
      const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      setWishlistItems(wishlist.map(item => item.id));
    };

    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => window.removeEventListener('wishlistUpdated', updateWishlist);
  };

  const fetchSubscriptionSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subscription-settings');
      if (response.data.success) {
        setSubscriptionSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription settings:', error);
      // Default to open if there's an error
      setSubscriptionSettings({ isOpen: true, nextAvailableDate: null });
    }
  };

  const loadData = () => {
    // Use centralized product data
    setProducts(fruitsData);
    setPacks(packsData);
    setBowls(bowlsData);
    setRefreshments(refreshmentsData);
    setLoading(false);
  };

  const handleAddToCart = (product) => {
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];

    const existingItemIndex = cart.findIndex(item => item.id === product.id && item.type === product.type);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleAddToWishlist = (product) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/customer/edit-profile', { 
        state: { message: 'Please login or signup to add items to your wishlist' } 
      });
      return;
    }

    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    const existingIndex = wishlist.findIndex(item => item.id === product.id && item.type === product.type);
    
    if (existingIndex > -1) {
      wishlist.splice(existingIndex, 1);
    } else {
      wishlist.push(product);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-black shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Categories</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Packs Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Packs</h2>
              <p className="text-sm text-gray-600 mt-1">Save more with subscriptions</p>
            </div>
            <button 
              onClick={() => navigate('/view-all', { state: { items: packs, title: 'Subscription Packs' } })}
              className="text-gray-800 font-semibold text-sm hover:text-black flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {packs.map(pack => {
                  const discount = pack.originalPrice ? Math.round(((pack.originalPrice - pack.price) / pack.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(pack.id);
                  return (
                    <div key={pack.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group">
                      <div className="relative overflow-hidden bg-gray-50 rounded-xl h-40">
                        <img
                          src={pack.image}
                          alt={pack.name}
                          onClick={() => navigate(`/product/pack/${pack.id}`)}
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                        />
                        {!subscriptionSettings.isOpen && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-xl">
                            <p className="text-white text-center px-4 text-sm font-medium">
                              Registrations are currently closed
                            </p>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                            {discount}% OFF
                          </div>
                        )}
                        <button
                          onClick={() => handleAddToWishlist(pack)}
                          className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 drop-shadow-lg"
                            fill={isInWishlist ? '#000000' : 'white'}
                            viewBox="0 0 24 24"
                            stroke={isInWishlist ? '#000000' : '#000000'}
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAddToCart(pack)}
                          className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 text-base mb-1">{pack.name}</h3>
                        <span className="text-xs text-gray-500 block mb-2">1 month</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">₹{pack.price}</span>
                          {pack.originalPrice && pack.originalPrice !== pack.price && (
                            <span className="text-sm text-gray-400 line-through">₹{pack.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fruits Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fruits</h2>
              <p className="text-sm text-gray-600 mt-1">Handpicked for freshness</p>
            </div>
            <button 
              onClick={() => navigate('/view-all', { state: { items: products, title: 'Fresh Fruits' } })}
              className="text-gray-800 font-semibold text-sm hover:text-black flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {products.map(product => {
                  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group">
                      <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                        <img
                          src={product.image}
                          alt={product.name}
                          onClick={() => navigate(`/product/fruit/${product.id}`)}
                          className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                        />
                        {discount > 0 && (
                          <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                            {discount}% OFF
                          </div>
                        )}
                        <button
                          onClick={() => handleAddToWishlist(product)}
                          className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 drop-shadow-lg"
                            fill={isInWishlist ? '#000000' : 'white'}
                            viewBox="0 0 24 24"
                            stroke={isInWishlist ? '#000000' : '#000000'}
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 text-base">{product.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">/50-100g</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fruit Bowls Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fruit Bowls</h2>
              <p className="text-sm text-gray-600 mt-1">Ready to enjoy daily</p>
            </div>
            <button 
              onClick={() => navigate('/view-all', { state: { items: bowls, title: 'Fruit Bowls' } })}
              className="text-gray-800 font-semibold text-sm hover:text-black flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {bowls.map(bowl => {
                  const discount = bowl.originalPrice ? Math.round(((bowl.originalPrice - bowl.price) / bowl.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(bowl.id);
                  return (
                    <div key={bowl.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group">
                      <div className="relative overflow-hidden bg-gray-50 rounded-xl h-40">
                        <img
                          src={bowl.image}
                          alt={bowl.name}
                          onClick={() => navigate(`/product/bowl/${bowl.id}`)}
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                        />
                        {discount > 0 && (
                          <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                            {discount}% OFF
                          </div>
                        )}
                        <button
                          onClick={() => handleAddToWishlist(bowl)}
                          className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 drop-shadow-lg"
                            fill={isInWishlist ? '#000000' : 'white'}
                            viewBox="0 0 24 24"
                            stroke={isInWishlist ? '#000000' : '#000000'}
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAddToCart(bowl)}
                          className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-800 text-base mb-1">{bowl.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">₹{bowl.price}</span>
                          {bowl.originalPrice && bowl.originalPrice !== bowl.price && (
                            <span className="text-sm text-gray-400 line-through">₹{bowl.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Refreshments Section */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Refreshments</h2>
              <p className="text-sm text-gray-600 mt-1">Cool and refreshing drinks</p>
            </div>
            <button 
              onClick={() => navigate('/view-all', { state: { items: refreshments, title: 'Refreshments' } })}
              className="text-gray-800 font-semibold text-sm hover:text-black flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {refreshments.map(item => {
                  const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(item.id);
                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group">
                      <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                        <img
                          src={item.image}
                          alt={item.name}
                          onClick={() => navigate(`/product/refreshment/${item.id}`)}
                          className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                        />
                        {discount > 0 && (
                          <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                            {discount}% OFF
                          </div>
                        )}
                        <button
                          onClick={() => handleAddToWishlist(item)}
                          className="absolute top-3 right-3 hover:scale-110 transition-all duration-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 drop-shadow-lg"
                            fill={isInWishlist ? '#000000' : 'white'}
                            viewBox="0 0 24 24"
                            stroke={isInWishlist ? '#000000' : '#000000'}
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 text-base">{item.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                          {item.originalPrice && item.originalPrice !== item.price && (
                            <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>
                        {item.unit && (
                          <span className="text-xs text-gray-500">/1 litre</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer showFooter={true} />
      <FloatingCart />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default CategoriesPage;
