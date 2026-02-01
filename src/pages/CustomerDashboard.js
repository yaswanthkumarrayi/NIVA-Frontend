import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Footer from '../components/Footer';
import FloatingCart from '../components/FloatingCart';
import axios from 'axios';
import { fruits as fruitsData, packs as packsData, bowls as bowlsData, refreshments as refreshmentsData } from '../data/productsData';
import { supabase } from '../supabaseClient';
import { isCustomerProfileComplete } from '../utils/customerProfile';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CustomerDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [packs, setPacks] = useState([]);
  const [bowls, setBowls] = useState([]);
  const [refreshments, setRefreshments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [searchPlaceholder, setSearchPlaceholder] = useState("'vit c pack'");
  const [placeholderAnimating, setPlaceholderAnimating] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [subscriptionSettings, setSubscriptionSettings] = useState({ isOpen: true, nextAvailableDate: null });
  const [authInitialized, setAuthInitialized] = useState(false);

  const searchPlaceholders = [
    "'vit c pack'",
    "'combo pack'",
    "'fresh fruits'",
    "'organic'",
  ];

  // Update cart count
  useEffect(() => {
    // Listen for cart updates
    window.addEventListener('cartUpdated', () => {});
    return () => window.removeEventListener('cartUpdated', () => {});
  }, []);

  // Load wishlist items
  useEffect(() => {
    const updateWishlist = () => {
      const savedWishlist = localStorage.getItem('wishlist');
      const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      setWishlistItems(wishlist.map(item => item.id));
    };

    updateWishlist();
    window.addEventListener('wishlistUpdated', updateWishlist);
    return () => window.removeEventListener('wishlistUpdated', updateWishlist);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Animated placeholder effect with slide up animation
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setPlaceholderAnimating(true);
      setTimeout(() => {
        index = (index + 1) % searchPlaceholders.length;
        setSearchPlaceholder(searchPlaceholders[index]);
        setPlaceholderAnimating(false);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track scroll direction to show/hide footer
  useEffect(() => {
    let lastScroll = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only start hiding footer after scrolling past a threshold
      if (currentScrollY > 50) {
        if (currentScrollY > lastScroll) {
          // Scrolling down - hide footer
          setShowFooter(false);
        } else if (currentScrollY < lastScroll) {
          // Scrolling up - show footer
          setShowFooter(true);
        }
      } else {
        // Near top of page - always show footer
        setShowFooter(true);
      }
      
      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Wait for Supabase to restore session from storage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        if (session?.user) {
          localStorage.setItem('userId', session.user.id);
          localStorage.setItem('userRole', 'customer');
        }
        setAuthInitialized(true);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && session?.user) {
        localStorage.setItem('userId', session.user.id);
        localStorage.setItem('userRole', 'customer');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (!authInitialized) return;

    const fetchUserProfile = async () => {
      try {
        let userId = localStorage.getItem('userId');
        
        // Verify with current session if no userId
        if (!userId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            userId = session.user.id;
            localStorage.setItem('userId', userId);
            localStorage.setItem('userRole', 'customer');
          }
        }
        
        if (!userId) {
          // No authentication, silently skip (user can browse as guest)
          setUserProfile({
            name: 'Guest',
            university: 'Select your university',
            location: 'Your Location'
          });
          return;
        }

        const response = await axios.get(`${API_URL}/api/customers/${userId}`);
        
        if (response.data.success && response.data.data) {
          const customerData = response.data.data;

          if (!isCustomerProfileComplete(customerData)) {
            navigate('/customer/update-profile', { replace: true });
            return;
          }

          setUserProfile({
            name: customerData.name || 'User',
            university: customerData.college || 'Select your university',
            location: customerData.college || 'Your Location'
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Set default values on error
        setUserProfile({
          name: 'User',
          university: 'Select your university',
          location: 'Your Location'
        });
      }
    };

    fetchUserProfile();
  }, [authInitialized]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        setUserProfile({
          name: event.detail.name || 'User',
          university: event.detail.college || 'Select your university',
          location: event.detail.college || 'Your Location'
        });
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Fetch subscription settings
  useEffect(() => {
    const fetchSubscriptionSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/subscription-settings`);
        if (response.data.success) {
          setSubscriptionSettings(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching subscription settings:', error);
        // Default to open if there's an error
        setSubscriptionSettings({ isOpen: true, nextAvailableDate: null });
      }
    };
    
    fetchSubscriptionSettings();
  }, []);

  // Load hardcoded fruits based on local images
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Use centralized product data
        setProducts(fruitsData);
        setPacks(packsData);
        setBowls(bowlsData);
        setRefreshments(refreshmentsData);

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddToCart = (product) => {
    // Check if it's a subscription pack (not fruit bowl) and if subscriptions are closed
    if (product.type === 'pack' && product.isSubscription && !subscriptionSettings.isOpen) {
      const nextDate = subscriptionSettings.nextAvailableDate 
        ? new Date(subscriptionSettings.nextAvailableDate).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : 'soon';
      alert(`Subscription packs are currently closed.\n\nThey will be available again on ${nextDate}.\n\nMeanwhile, you can order Fruit Bowls or fresh individual fruits!`);
      return;
    }

    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      // Increment quantity if item exists
      cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
    } else {
      // Add new item with quantity 1
      const newItem = { ...product, quantity: 1 };
      cart.push(newItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleAddToWishlist = (product) => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
      // Navigate to profile page with message
      navigate('/customer/edit-profile', { 
        state: { message: 'Please login or signup to add items to your wishlist' } 
      });
      return;
    }

    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    // Check if item already exists in wishlist
    const existingIndex = wishlist.findIndex(item => item.id === product.id);
    
    if (existingIndex > -1) {
      // Remove from wishlist if already exists
      wishlist.splice(existingIndex, 1);
    } else {
      // Add to wishlist if not exists
      wishlist.push(product);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPacks = packs.filter(pack =>
    pack.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header - Non-sticky top bar */}
      <div className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            {/* Left - Brand Name */}
            <div>
              <h1 className="text-white font-bold text-2xl">NIVA</h1>
              <div className="flex items-center gap-1 mt-1">
                <FontAwesomeIcon icon={faLocationDot} className="text-white text-xs" />
                <span className="text-white text-xs">
                  Deliver to {userProfile?.location || 'Your Location'}
                </span>
              </div>
            </div>

            {/* Right - User Icon */}
            <div className="relative">
              <button
                onClick={() => navigate('/customer/edit-profile')}
                className="focus:outline-none bg-black hover:bg-gray-800 p-2 rounded-full transition-colors active:bg-gray-700"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Search Bar */}
      <div className="bg-black shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="relative overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => navigate('/customer/search')}
              readOnly
              className="w-full pl-12 pr-4 py-3 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-gray-700 cursor-pointer"
            />
            <div className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none overflow-hidden h-6 flex items-center">
              <span className="text-gray-500 mr-1">{searchQuery === '' ? 'Search for ' : ''}</span>
              <div className={`transition-all duration-300 ${placeholderAnimating ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <span className="text-gray-500">{searchQuery === '' ? searchPlaceholder : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Space below sticky search bar */}
      <div className="h-4"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Subscription Packs Section - First position, with horizontal scroll */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Subscription Packs</h2>
              <p className="text-sm text-gray-600 mt-1">Save more with monthly subscriptions</p>
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-500">Loading subscription packs...</p>
              </div>
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">No subscription packs available</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {filteredPacks.map(pack => {
                  const discount = pack.originalPrice ? Math.round(((pack.originalPrice - pack.price) / pack.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(pack.id);
                  return (
                  <div key={pack.id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group`}>
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
                      {/* Discount Badge - Only show for Duo packs with actual discount */}
                      {discount > 0 && pack.originalPrice !== pack.price && (
                        <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {/* Wishlist Button */}
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {/* Add Button at Edge */}
                      <button
                        onClick={() => handleAddToCart(pack)}
                        className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-base mb-1">{pack.name}</h3>
                      <span className="text-xs text-gray-500 block mb-2">1 month</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900 font-metropolis">₹{pack.price}</span>
                        {pack.originalPrice && (
                          <span className="text-sm text-gray-400 line-through font-metropolis">₹{pack.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 mt-1 block font-metropolis">
                        {pack.name.includes('Duo') 
                          ? `₹${pack.price} for 2 persons` 
                          : `₹${pack.price} per person`}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fresh Fruits Section - Second position, with grid layout */}
        <div className="px-4 py-6 bg-gradient-to-b from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fresh Fruits</h2>
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-500">Loading fresh fruits...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No fruits available at the moment</p>
            </div>
          ) : (
            <div className="-mx-4 px-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map(product => {
                  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(product.id);
                  return (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group">
                    <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                      <img
                        src={product.image}
                        alt={product.name}
                        onClick={() => navigate(`/product/fruit/${product.id}`)}
                        className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                      />
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {/* Wishlist Button */}
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {/* Add Button at Edge */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 text-base">{product.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900 font-metropolis">₹{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through font-metropolis">₹{product.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-metropolis">/250g</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fruit Bowls Section - Third position below Fresh Fruits, always available */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Fruit Bowls</h2>
              <p className="text-sm text-gray-600 mt-1">Order anytime</p>
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-500">Loading fruit bowls...</p>
              </div>
            </div>
          ) : bowls.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">No fruit bowls available</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {bowls.map(bowl => {
                  const discount = bowl.originalPrice ? Math.round(((bowl.originalPrice - bowl.price) / bowl.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(bowl.id);
                  return (
                  <div key={`bowl-${bowl.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group">
                    <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                      <img
                        src={bowl.image}
                        alt={bowl.name}
                        onClick={() => navigate(`/product/bowl/${bowl.id}`)}
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                      />
                      {/* Discount Badge - Only show for Duo bowls with actual discount */}
                      {discount > 0 && bowl.originalPrice !== bowl.price && (
                        <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {/* Wishlist Button */}
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {/* Add Button at Edge */}
                      <button
                        onClick={() => handleAddToCart(bowl)}
                        className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-base mb-2">{bowl.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900 font-metropolis">₹{bowl.price}</span>
                        {bowl.originalPrice && (
                          <span className="text-sm text-gray-400 line-through font-metropolis">₹{bowl.originalPrice}</span>
                        )}
                        <span className="text-xs text-gray-600 font-metropolis">/{bowl.name.toLowerCase().includes('solo') ? '1 bowl' : '2 bowls'}</span>
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
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-500">Loading refreshments...</p>
              </div>
            </div>
          ) : refreshments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No refreshments available</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {refreshments.map(item => {
                  const discount = item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                  const isInWishlist = wishlistItems.includes(item.id);
                  return (
                  <div key={`refreshment-${item.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex-shrink-0 w-64 group">
                    <div className="relative overflow-hidden bg-gray-50 rounded-xl">
                      <img
                        src={item.image}
                        alt={item.name}
                        onClick={() => navigate(`/product/refreshment/${item.id}`)}
                        className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105 rounded-xl cursor-pointer"
                      />
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-0 left-0 bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-br-2xl shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {/* Wishlist Button */}
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {/* Add Button at Edge */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="absolute bottom-0 right-0 bg-black text-white px-3 py-2 rounded-tl-2xl hover:bg-gray-800 transition-all duration-200 font-semibold text-sm flex items-center gap-1 shadow-lg"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800 text-base">{item.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900 font-metropolis">₹{item.price}</span>
                        {item.originalPrice && item.originalPrice !== item.price && (
                          <span className="text-sm text-gray-400 line-through font-metropolis">₹{item.originalPrice}</span>
                        )}
                      </div>
                      {item.unit && (
                        <span className="text-xs text-gray-500 font-metropolis">/1 litre</span>
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

      {/* Fixed Bottom Navigation */}
      <Footer showFooter={showFooter} />
      <FloatingCart />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default CustomerDashboard;
