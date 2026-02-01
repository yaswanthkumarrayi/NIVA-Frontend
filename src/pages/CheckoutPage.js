import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Footer from '../components/Footer';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Delivery, 2: Order Summary, 3: Payment
  const [paymentError, setPaymentError] = useState(''); // Add payment error state

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/customer/login', { state: { from: location.pathname } });
        return;
      }

      setUser(session.user);
      const profileData = await fetchCustomerProfile(session.user.id);
      
      if (!profileData) {
        setLoading(false);
        return;
      }
      
      loadCart();
      setLoading(false);
    } catch (error) {
      navigate('/customer/login');
      setLoading(false);
    }
  };

  const fetchCustomerProfile = async (userId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/customers/${userId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCustomerProfile(result.data);
        
        // Check for missing fields and provide specific guidance
        const missingFields = [];
        if (!result.data.name || result.data.name.trim() === '') missingFields.push('Name');
        if (!result.data.email || result.data.email.trim() === '') missingFields.push('Email');
        if (!result.data.phone || result.data.phone.trim() === '') missingFields.push('Phone');
        if (!result.data.college || result.data.college.trim() === '' || result.data.college === 'Select your university') missingFields.push('University');
        
        if (missingFields.length > 0) {
          navigate('/customer/update-profile', { state: { notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
          return null;
        }
        
        return result.data;
      } else {
        navigate('/customer/update-profile', { state: { notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
        return null;
      }
    } catch (error) {
      navigate('/customer/update-profile', { state: { notice: { variant: 'info', title: 'Complete your profile', message: 'Please continue the details to proceed.' } } });
      return null;
    }
  };

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(cart);

    // Reset coupon when cart changes
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    
    if (cart.length === 0) {
      navigate('/customer/dashboard');
    }
  };

  // Calculate original total (before discount)
  const calculateOriginalTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Calculate final total (after discount)
  const calculateTotal = () => {
    const originalTotal = calculateOriginalTotal();
    if (appliedCoupon) {
      return originalTotal - appliedCoupon.discountAmount;
    }
    return originalTotal;
  };

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          cartItems: cartItems
        })
      });

      const result = await response.json();

      if (result.success) {
        // New response format with eligibleItems array
        const eligibleProductNames = result.eligibleItems
          ? result.eligibleItems.map(item => item.name).join(', ')
          : result.coupon.applicableProductNames?.join(', ') || result.coupon.productName || 'your items';

        setAppliedCoupon({
          code: result.coupon.code,
          category: result.coupon.category,
          applicableProducts: result.coupon.applicableProducts || [],
          applicableProductNames: result.coupon.applicableProductNames || [],
          eligibleItems: result.eligibleItems || [],
          eligibleProductNames: eligibleProductNames,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
          discountAmount: result.pricing.discountAmount,
          eligibleTotal: result.pricing.eligibleTotal,
          originalTotal: result.pricing.originalTotal,
          finalTotal: result.pricing.finalTotal,
          message: result.message
        });
        setCouponError('');
        
        // Show success alert
        alert(`Coupon Applied! You save ₹${result.pricing.discountAmount}`);
      } else {
        // Show specific error message with eligible products
        let errorMsg = result.message || 'Invalid coupon code';
        if (result.eligibleProducts && result.eligibleProducts.length > 0) {
          errorMsg = `Coupon valid only for: ${result.eligibleProducts.join(', ')}`;
        }
        setCouponError(errorMsg);
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleProceedToPayment = () => {
    if (currentStep === 1) {
      // Move from Delivery Info to Order Summary
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Move from Order Summary to Payment
      setCurrentStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setPaymentError(''); // Clear previous errors
      
      // Check if Razorpay SDK is loaded first
      if (!window.Razorpay) {
        setPaymentError('Payment system is loading. Please wait...');
        return;
      }

      // Validate user is logged in
      if (!user?.id) {
        setPaymentError('Please log in to place an order');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Get cart from localStorage
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      if (cart.length === 0) {
        setPaymentError('Cart is empty');
        return;
      }

      // Auto-detect localhost and use test key for safe testing
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const RAZORPAY_TEST_KEY = 'rzp_test_S01qKJJ0ovAUGa';
      const razorpayKey = isLocalhost ? RAZORPAY_TEST_KEY : process.env.REACT_APP_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        console.error('Razorpay key not configured');
        setPaymentError('Payment configuration error. Please contact support.');
        return;
      }

      // ========================================
      // 🔒 SECURITY: Create secure order with backend-calculated total
      // Frontend sends ONLY: productId, type, quantity
      // Backend calculates the actual price from hard-coded catalog
      // ========================================
      
      // Helper function to infer type from product ID if missing
      const inferProductType = (item) => {
        if (item.type) return item.type;
        const id = parseInt(item.id || item.productId);
        if (id >= 201) return 'refreshment';
        if (id >= 101) return 'bowl';
        if (item.isSubscription || item.numberOfDays) return 'pack';
        return 'fruit';
      };
      
      // Transform cart to secure format: {productId, type, quantity} only
      const secureCart = cart
        .filter(item => item && (item.id || item.productId))  // Filter out invalid items
        .map(item => ({
          productId: parseInt(item.id || item.productId),
          type: inferProductType(item),
          quantity: Math.min(Math.max(parseInt(item.quantity) || 1, 1), 7) // Clamp 1-7
        }));
      
      // Validate cart has valid items
      if (secureCart.length === 0) {
        setPaymentError('Cart contains no valid items. Please add items to cart.');
        return;
      }
      
      // DEBUG: Log what we're sending (REMOVE IN PRODUCTION)
      const requestBody = {
        cart: secureCart,
        customerId: user.id,
        customerDetails: {
          name: customerProfile?.name,
          email: customerProfile?.email,
          phone: customerProfile?.phone,
          college: customerProfile?.college
        },
        ...(appliedCoupon && {
          couponCode: appliedCoupon.code,
          couponDiscount: appliedCoupon.discountAmount
        })
      };
      console.log('DEBUG - Sending to backend:', JSON.stringify(requestBody, null, 2));
      
      const orderResponse = await fetch(`${API_URL}/api/orders/create-secure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // DEBUG: Log response status
      console.log('DEBUG - Response status:', orderResponse.status);
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.log('DEBUG - Error response:', JSON.stringify(errorData, null, 2));
        const errorMessage = errorData.errors 
          ? errorData.errors.join(', ') 
          : (errorData.message || `Server error: ${orderResponse.status}`);
        throw new Error(errorMessage);
      }

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success) {
        throw new Error(orderResult.message || 'Order creation failed');
      }

      const { order } = orderResult;

      // ========================================
      // Open Razorpay with BACKEND-CALCULATED amount
      // ========================================
      const options = {
        key: razorpayKey,
        amount: order.amount * 100,  // Backend amount in paise
        currency: 'INR',
        name: 'NIVA Fruits',
        description: 'Fresh Fruits Delivery',
        order_id: order.razorpayOrderId,
        
        handler: async function (response) {
          try {
            
            // ========================================
            // 🔒 SECURITY: Verify payment securely
            // Backend checks: signature + Razorpay API + amount + replay
            // ========================================
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify-secure`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification request failed');
            }

            const verifyResult = await verifyResponse.json();

            if (!verifyResult.success) {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }

            // Clear cart
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated'));
            
            // Redirect to orders page
            navigate('/customer/orders');
            
          } catch (error) {
            setPaymentError(error.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: customerProfile?.name || '',
          email: customerProfile?.email || '',
          contact: customerProfile?.phone || ''
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: function() {
            setPaymentError('');
          },
          confirm_close: true
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 600 // 10 minutes timeout
      };

      // Open Razorpay checkout
      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', function (response) {
        setPaymentError(`Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}`);
      });
      
      razorpayInstance.open();
    } catch (error) {
      setPaymentError(`Error initiating payment: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Note: Order success screen removed - redirects directly to orders page

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-black text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => currentStep === 1 ? navigate(-1) : setCurrentStep(currentStep - 1)} className="text-white hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Delivery Info</span>
              {currentStep > 1 && <div className="absolute top-5 left-1/2 w-full h-0.5 bg-black -z-0"></div>}
            </div>

            {/* Line 1-2 */}
            <div className={`flex-1 h-0.5 -mt-6 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 2 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '2'}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Order Summary</span>
            </div>

            {/* Line 2-3 */}
            <div className={`flex-1 h-0.5 -mt-6 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-300'}`}></div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep >= 3 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Delivery Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black mb-6">Delivery Information</h2>
              
              {customerProfile ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg text-black mt-1">{customerProfile.name}</p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
                    <p className="text-lg text-black mt-1 break-all">{customerProfile.email}</p>
                  </div>
                  
                  <div className="border-b border-gray-200 pb-4">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Phone Number</label>
                    <p className="text-lg text-black mt-1">{customerProfile.phone}</p>
                  </div>
                  
                  <div className="pb-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Location (College)</label>
                    <p className="text-lg text-black mt-1">{customerProfile.college}</p>
                  </div>

                  <button
                    onClick={() => navigate('/customer/update-profile')}
                    className="mt-4 text-black border-2 border-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Information
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Loading profile...</p>
              )}
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
            >
              Proceed to Order Summary
            </button>
          </div>
        )}

        {/* Step 2: Order Summary */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black mb-6">Order Summary</h2>
              
              {/* Coupon Section - Moved to Top */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Have a discount coupon?</h3>

                {!appliedCoupon ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black uppercase min-w-0"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-semibold text-green-800">Coupon Applied!</span>
                        </div>
                        <p className="text-sm text-green-700">
                          <span className="font-mono font-bold">{appliedCoupon.code}</span> -
                          {appliedCoupon.discountType === 'percentage'
                            ? ` ${appliedCoupon.discountValue}% off`
                            : ` ₹${appliedCoupon.discountValue} off`}
                        </p>
                        <p className="text-sm font-bold text-green-800 mt-1">
                          You save: ₹{appliedCoupon.discountAmount}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 text-sm font-medium flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {couponError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{couponError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-black text-lg mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.type === 'pack' ? 'Monthly Pack' : 'Fresh Fruit'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Quantity: <span className="font-semibold">{item.quantity}</span></span>
                        <span className="text-lg font-bold text-black">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-6 pt-6 border-t-2 border-black">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{calculateOriginalTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Delivery Fee</span>
                    <span className="text-green-600 font-semibold">FREE</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{appliedCoupon.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <div className="text-right">
                      {appliedCoupon && (
                        <span className="text-base text-gray-400 line-through mr-2">₹{calculateOriginalTotal()}</span>
                      )}
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-black flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-black mb-2">Delivery Information</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Daily delivery except Sundays</li>
                    <li>• Fresh fruits handpicked daily</li>
                    <li>• Subscription valid for 30 days</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
            >
              Proceed to Payment
            </button>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-black mb-6">Payment Details</h2>
              
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Online Payment</h3>
                  <p className="text-gray-600 text-sm">Secure payment gateway</p>
                </div>
              </div>

              {/* Applied Coupon Display */}
              {appliedCoupon && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-green-800">
                      Coupon <span className="font-mono">{appliedCoupon.code}</span> applied
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You're saving ₹{appliedCoupon.discountAmount} on this order!
                  </p>
                </div>
              )}

              <div className="border-t-2 border-black pt-6">
                <h3 className="font-bold text-black mb-4">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Items</span>
                    <span className="font-semibold text-black">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery to</span>
                    <span className="font-semibold text-black">{customerProfile?.college}</span>
                  </div>
                  {appliedCoupon && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Original Amount</span>
                        <span className="line-through">₹{calculateOriginalTotal()}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{appliedCoupon.discountAmount}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-300">
                    <span className="font-bold text-black text-lg">Amount to Pay</span>
                    <span className="font-bold text-black text-lg">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-black flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-700">
                  By placing this order, you agree to our terms and conditions. You will receive a confirmation email shortly after your order is confirmed.
                </p>
              </div>
            </div>

            {/* Payment Error Display */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      <Footer showFooter={true} />
    </div>
  );
};

export default CheckoutPage;
