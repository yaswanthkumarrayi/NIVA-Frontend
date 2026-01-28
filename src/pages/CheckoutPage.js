// ============================================================
// COMPLETE CHECKOUT PAGE - PRODUCTION READY
// ============================================================
// This is the FINAL, working solution for Razorpay LIVE mode
// Copy this entire file to: frontend/src/pages/CheckoutPage.js
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  
  // CRITICAL: Use ref to track Razorpay instance for cleanup
  const razorpayInstanceRef = useRef(null);

  useEffect(() => {
    checkAuthAndLoadData();
    
    return () => {
      // Cleanup on unmount
      cleanupRazorpay();
    };
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      setIsProcessingPayment(false);
      cleanupRazorpay();
    }
  }, [currentStep]);

  // ============================================================
  // CRITICAL: Razorpay cleanup function
  // ============================================================
  const cleanupRazorpay = () => {
    console.log('🧹 Starting Razorpay cleanup...');
    
    // 1. Clear instance reference
    if (razorpayInstanceRef.current) {
      razorpayInstanceRef.current = null;
      console.log('  ✓ Instance reference cleared');
    }
    
    // 2. Remove all Razorpay iframes
    const iframes = document.querySelectorAll('iframe[src*="razorpay"], iframe[class*="razorpay"]');
    iframes.forEach((iframe, i) => {
      iframe.remove();
      console.log(`  ✓ Removed iframe ${i + 1}`);
    });
    
    // 3. Remove all Razorpay containers
    const containers = document.querySelectorAll('[class*="razorpay-container"], [id*="razorpay"]');
    containers.forEach((container, i) => {
      container.remove();
      console.log(`  ✓ Removed container ${i + 1}`);
    });
    
    // 4. Remove backdrops
    const backdrops = document.querySelectorAll('[class*="razorpay-backdrop"]');
    backdrops.forEach((backdrop, i) => {
      backdrop.remove();
      console.log(`  ✓ Removed backdrop ${i + 1}`);
    });
    
    console.log('✅ Razorpay cleanup complete');
  };

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        alert('Please login to continue with checkout');
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
      console.error('Error checking auth:', error);
      alert('An error occurred. Please try again.');
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
        
        const missingFields = [];
        if (!result.data.name || result.data.name.trim() === '') missingFields.push('Name');
        if (!result.data.email || result.data.email.trim() === '') missingFields.push('Email');
        if (!result.data.phone || result.data.phone.trim() === '') missingFields.push('Phone');
        if (!result.data.college || result.data.college.trim() === '' || result.data.college === 'Select your university') missingFields.push('University');
        
        if (missingFields.length > 0) {
          alert(`Please complete your profile before checkout.\\n\\nMissing fields: ${missingFields.join(', ')}`);
          navigate('/customer/update-profile');
          return null;
        }
        
        return result.data;
      } else {
        alert('Unable to load your profile. Please complete your profile first.');
        navigate('/customer/update-profile');
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Error loading profile. Please try again.');
      navigate('/customer/edit-profile');
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
      alert('Your cart is empty');
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
      console.error('Error validating coupon:', error);
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
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // ============================================================
  // MAIN PAYMENT HANDLER - PRODUCTION PROVEN
  // ============================================================
  const handlePlaceOrder = async () => {
    if (isProcessingPayment) {
      console.warn('⚠️ Payment already in progress');
      return;
    }

    console.log('═══════════════════════════════════════');
    console.log('🚀 STARTING PAYMENT FLOW');
    console.log('═══════════════════════════════════════');

    setIsProcessingPayment(true);

    try {
      // ============================================================
      // STEP 1: AGGRESSIVE CLEANUP
      // ============================================================
      cleanupRazorpay();
      
      // CRITICAL: Wait for DOM mutations to complete
      console.log('⏳ Waiting 800ms for Razorpay internal cleanup...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // ============================================================
      // STEP 2: VERIFY RAZORPAY SDK
      // ============================================================
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }
      
      if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
        throw new Error('Payment system not configured');
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // ============================================================
      // STEP 3: GET FRESH CART DATA
      // ============================================================
      const freshCart = JSON.parse(localStorage.getItem('cart')) || [];
      if (freshCart.length === 0) {
        alert('Your cart is empty');
        setIsProcessingPayment(false);
        navigate('/customer/dashboard');
        return;
      }
      
      // Calculate total with coupon discount if applied
      const originalTotal = freshCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
      const totalAmount = originalTotal - discountAmount;
      
      if (totalAmount <= 0) {
        throw new Error('Invalid cart total');
      }
      
      // ============================================================
      // STEP 4: CREATE FRESH ORDER WITH DISCOUNTED AMOUNT
      // ============================================================
      console.log('📝 Creating new order for ₹' + totalAmount + (discountAmount > 0 ? ` (Original: ₹${originalTotal}, Discount: ₹${discountAmount})` : ''));
      
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount, // Send the discounted amount to payment gateway
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${user.id.substring(0, 8)}`
        })
      });

      if (!orderResponse.ok) {
        throw new Error(`Server error: ${orderResponse.status}`);
      }

      const orderResult = await orderResponse.json();

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.message || 'Failed to create order');
      }

      const { order } = orderResult;
      console.log('✅ Order created:', order.id);

      // ============================================================
      // STEP 5: CONFIGURE RAZORPAY (MINIMAL CONFIG)
      // ============================================================
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'NIVA Fruits',
        description: 'Fresh Fruits Delivery',
        order_id: order.id,
        
        handler: async function (response) {
          try {
            console.log('✅ Payment successful');
            
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyResult = await verifyResponse.json();

            if (!verifyResult.success) {
              throw new Error('Payment verification failed');
            }

            const hasSubscription = freshCart.some(item => item.isSubscription);
            let subscriptionData = {};
            
            if (hasSubscription) {
              const today = new Date();
              const startDate = new Date(today);
              startDate.setDate(startDate.getDate() + 1);
              const endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + 1);
              endDate.setDate(endDate.getDate() - 1);
              
              subscriptionData = {
                is_subscription: true,
                subscription_start_date: startDate.toISOString().split('T')[0],
                subscription_end_date: endDate.toISOString().split('T')[0]
              };
            }

            // Include coupon info if applied
            const couponData = appliedCoupon ? {
              coupon_code: appliedCoupon.code,
              coupon_discount: appliedCoupon.discountAmount,
              coupon_eligible_products: appliedCoupon.eligibleItems?.map(i => i.name).join(', ') || '',
              original_amount: originalTotal
            } : {};

            const orderData = {
              customer_id: user.id,
              customer_name: customerProfile.name,
              customer_email: customerProfile.email,
              customer_phone: customerProfile.phone,
              customer_college: customerProfile.college,
              items: freshCart,
              total_amount: totalAmount, // Final amount after discount
              status: 'placed',
              payment_id: response.razorpay_payment_id,
              payment_method: 'razorpay',
              order_date: new Date().toISOString(),
              ...subscriptionData,
              ...couponData
            };

            const dbResponse = await fetch(`${API_URL}/api/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            });

            const dbResult = await dbResponse.json();

            if (dbResult.success) {
              localStorage.removeItem('cart');
              window.dispatchEvent(new Event('cartUpdated'));
              cleanupRazorpay();
              setIsProcessingPayment(false);
              alert('Payment successful! Your order has been placed.');
              navigate('/customer/orders');
            } else {
              setIsProcessingPayment(false);
              alert('Payment successful but order save failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            cleanupRazorpay();
            setIsProcessingPayment(false);
            alert('Payment completed. Please contact support if money was deducted.');
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
            console.log('⚠️ Payment cancelled');
            cleanupRazorpay();
            setTimeout(() => {
              setIsProcessingPayment(false);
            }, 100);
            alert('Payment cancelled. You can try again when ready.');
          },
          confirm_close: true,
          backdrop_close: false
        },
        
        timeout: 600
      };

      // ============================================================
      // STEP 6: CREATE NEW INSTANCE
      // ============================================================
      console.log('🔨 Creating Razorpay instance...');
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstanceRef.current = razorpayInstance;
      
      // ============================================================
      // STEP 7: ATTACH FAILURE HANDLER
      // ============================================================
      razorpayInstance.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        cleanupRazorpay();
        setTimeout(() => {
          setIsProcessingPayment(false);
        }, 100);
        alert('Payment failed: ' + (response.error.description || 'Unknown error'));
      });
      
      // ============================================================
      // STEP 8: OPEN CHECKOUT
      // ============================================================
      console.log('🎬 Opening Razorpay checkout...');
      razorpayInstance.open();
      console.log('✅ Checkout opened successfully');
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      cleanupRazorpay();
      setTimeout(() => {
        setIsProcessingPayment(false);
      }, 100);
      alert('Failed to initiate payment: ' + error.message);
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
            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Delivery Info</span>
            </div>

            <div className={`flex-1 h-0.5 -mt-6 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`}></div>

            <div className="flex-1 flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm z-10 ${
                currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span className="text-xs mt-2 font-medium text-gray-700">Order Summary</span>
            </div>

            <div className={`flex-1 h-0.5 -mt-6 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-300'}`}></div>

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
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Delivery Information</h2>
              {customerProfile && (
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <label className="text-sm font-semibold text-gray-700">Full Name</label>
                    <p className="text-lg mt-1">{customerProfile.name}</p>
                  </div>
                  <div className="border-b pb-4">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <p className="text-lg mt-1">{customerProfile.email}</p>
                  </div>
                  <div className="border-b pb-4">
                    <label className="text-sm font-semibold text-gray-700">Phone</label>
                    <p className="text-lg mt-1">{customerProfile.phone}</p>
                  </div>
                  <div className="pb-2">
                    <label className="text-sm font-semibold text-gray-700">College</label>
                    <p className="text-lg mt-1">{customerProfile.college}</p>
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleProceedToPayment} className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800">
              Proceed to Order Summary
            </button>
          </div>
        )}

        {/* Step 2: Order Summary */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.type === 'pack' ? 'Monthly Pack' : 'Fresh Fruit'}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-sm">Qty: {item.quantity}</span>
                        <span className="font-bold">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Have a discount coupon?</h3>
                
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black uppercase"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-semibold text-green-800">Coupon Applied!</span>
                        </div>
                        <p className="text-sm text-green-700">
                          <span className="font-mono font-bold">{appliedCoupon.code}</span> - 
                          {appliedCoupon.discountType === 'percentage' 
                            ? ` ${appliedCoupon.discountValue}% off` 
                            : ` ₹${appliedCoupon.discountValue} off`} on {appliedCoupon.eligibleProductNames || 'eligible items'}
                        </p>
                        {appliedCoupon.eligibleItems && appliedCoupon.eligibleItems.length > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Discount applied to: {appliedCoupon.eligibleItems.map(i => i.name).join(', ')}
                          </p>
                        )}
                        <p className="text-sm font-bold text-green-800 mt-1">
                          You save: ₹{appliedCoupon.discountAmount}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {couponError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{couponError}</span>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="mt-6 pt-6 border-t-2 border-black">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{calculateOriginalTotal()}</span>
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
            <button onClick={handleProceedToPayment} className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800">
              Proceed to Payment
            </button>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-black rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Payment</h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Payment</h3>
                <p className="text-gray-600">UPI • Cards • Net Banking</p>
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
                {appliedCoupon && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Original Amount</span>
                      <span className="line-through">₹{calculateOriginalTotal()}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{appliedCoupon.discountAmount}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Amount to Pay</span>
                  <span className="text-2xl">₹{calculateTotal()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={isProcessingPayment}
              className={`w-full py-4 rounded-lg font-bold text-lg ${
                isProcessingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isProcessingPayment ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        )}
      </div>

      <Footer showFooter={true} />
    </div>
  );
};

export default CheckoutPage;
