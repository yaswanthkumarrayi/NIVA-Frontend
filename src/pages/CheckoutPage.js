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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

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
        
        // Check for missing fields and provide specific guidance
        const missingFields = [];
        if (!result.data.name || result.data.name.trim() === '') missingFields.push('Name');
        if (!result.data.email || result.data.email.trim() === '') missingFields.push('Email');
        if (!result.data.phone || result.data.phone.trim() === '') missingFields.push('Phone');
        if (!result.data.college || result.data.college.trim() === '' || result.data.college === 'Select your university') missingFields.push('University');
        
        if (missingFields.length > 0) {
          alert(`Please complete your profile before checkout.\n\nMissing fields: ${missingFields.join(', ')}`);
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
      alert('Error loading profile. Please try again or complete your profile.');
      navigate('/customer/edit-profile');
      return null;
    }
  };

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(cart);
    
    if (cart.length === 0) {
      alert('Your cart is empty');
      navigate('/customer/dashboard');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      // Debug: Log environment variables (only Key ID, never the secret)
      console.log('Environment Check:');
      console.log('- API URL:', process.env.REACT_APP_API_URL);
      console.log('- Razorpay Key ID:', process.env.REACT_APP_RAZORPAY_KEY_ID);
      console.log('- All REACT_APP vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP')));
      
      // Check if Razorpay SDK is loaded first
      if (!window.Razorpay) {
        alert('Payment system is loading. Please wait a moment and try again.');
        window.location.reload();
        return;
      }

      if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
        alert('Payment system is not configured. Please contact support.');
        console.error('RAZORPAY_KEY_ID not configured');
        console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP')));
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const totalAmount = calculateTotal();
      
      if (totalAmount <= 0) {
        alert('Invalid cart total. Please refresh and try again.');
        return;
      }
      
      // Create Razorpay order
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${user.id.substring(0, 8)}`
        })
      });

      if (!orderResponse.ok) {
        throw new Error(`Server error: ${orderResponse.status}`);
      }

      const orderResult = await orderResponse.json();

      if (!orderResult.success || !orderResult.order) {
        throw new Error(orderResult.message || 'Failed to create payment order');
      }

      const { order } = orderResult;

      // Get Razorpay key from environment (LIVE mode)
      const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
      const isLiveMode = razorpayKey.startsWith('rzp_live_');
      
      console.log('Payment Mode:', isLiveMode ? 'LIVE' : 'TEST');

      // Razorpay options with comprehensive error handling
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'NIVA Fruits',
        description: 'Fresh Fruits Delivery',
        order_id: order.id,
        handler: async function (response) {
          try {
            console.log('Payment completed, verifying...');
            
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
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

            console.log('Payment verified successfully');

            // Check if cart has subscription packs
            const hasSubscription = cartItems.some(item => item.isSubscription);
            
            // Calculate subscription dates if applicable
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

            // Create order in database
            const orderData = {
              customer_id: user.id,
              customer_name: customerProfile.name,
              customer_email: customerProfile.email,
              customer_phone: customerProfile.phone,
              customer_college: customerProfile.college,
              items: cartItems,
              total_amount: totalAmount,
              status: 'placed',
              payment_id: response.razorpay_payment_id,
              payment_method: 'razorpay',
              order_date: new Date().toISOString(),
              ...subscriptionData
            };

            const dbResponse = await fetch(`${API_URL}/api/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            });

            if (!dbResponse.ok) {
              throw new Error('Failed to save order to database');
            }

            const dbResult = await dbResponse.json();

            if (dbResult.success) {
              // Clear cart
              localStorage.removeItem('cart');
              window.dispatchEvent(new Event('cartUpdated'));
              
              // Show success message
              alert('Payment successful! Your order has been placed.');
              
              // Redirect to orders page
              navigate('/customer/orders');
            } else {
              // Payment succeeded but order creation failed
              alert(
                'IMPORTANT: Your payment was successful (Payment ID: ' + response.razorpay_payment_id + ').\n\n' +
                'However, we encountered an issue saving your order. Please contact support immediately with your payment ID.\n\n' +
                'DO NOT make another payment - your money will be refunded or your order will be manually processed.'
              );
              console.error('Order creation failed:', dbResult);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert(
              'Payment completed but verification failed.\n\n' +
              'If money was deducted, please contact support with:\n' +
              '- Payment ID: ' + (response.razorpay_payment_id || 'Not available') + '\n' +
              '- Order ID: ' + (response.razorpay_order_id || 'Not available') + '\n\n' +
              'We will verify and process your order manually.'
            );
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
            console.log('Payment cancelled by user');
            alert('Payment cancelled. Your cart items are still saved.');
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
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(
          'Payment failed!\n\n' +
          'Reason: ' + (response.error.description || response.error.reason || 'Unknown error') + '\n\n' +
          'Please try again or contact support if the issue persists.'
        );
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment: ' + error.message + '\n\nPlease try again or contact support.');
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
                    <p className="text-lg text-black mt-1">{customerProfile.email}</p>
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

              <div className="mt-6 pt-6 border-t-2 border-black">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="text-black font-semibold">₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700 font-medium">Delivery Fee</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold pt-4 border-t border-gray-300">
                  <span className="text-black">Total</span>
                  <span className="text-black">₹{calculateTotal()}</span>
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
