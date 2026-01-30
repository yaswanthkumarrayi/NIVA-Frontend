import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// SECURITY: Helper function to get auth headers with JWT token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    };
  }
  return { headers: { 'Content-Type': 'application/json' } };
};

// Helper function to parse items if they're stored as JSON string
const parseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch (error) {
      return [];
    }
  }
  return [];
};

function PartnerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [nextDayDeliveries, setNextDayDeliveries] = useState([]);
  const [nextDayDate, setNextDayDate] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({ delivered: 0, undelivered: 0 });
  // New: Today's subscription deliveries state
  const [todaySubscriptionDeliveries, setTodaySubscriptionDeliveries] = useState([]);
  const [todayDate, setTodayDate] = useState('');
  const [isSunday, setIsSunday] = useState(false);
  // February 2026 Calendar State
  const [februaryCalendar, setFebruaryCalendar] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [tomorrowDeliveries, setTomorrowDeliveries] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/dlv-p7q2k-auth');
        return;
      }

      // Verify user role is partner
      const userRole = session.user?.user_metadata?.role || session.user?.app_metadata?.role;
      
      if (userRole !== 'partner') {
        console.log('User role is not partner:', userRole);
        await supabase.auth.signOut();
        navigate('/dlv-p7q2k-auth');
        return;
      }

      // Get partner info from session
      const partnerPhone = session.user?.user_metadata?.phone || localStorage.getItem('userPhone');
      const partnerName = session.user?.user_metadata?.name || localStorage.getItem('userName');
      const partnerId = session.user?.id || localStorage.getItem('userId');

      setPartnerInfo({ id: partnerId, name: partnerName, phone: partnerPhone });
      setAuthenticated(true);
      setAuthLoading(false);
      
      // Fetch data
      fetchOrders();
      fetchNextDayDeliveries();
      fetchSubscriptions();
      fetchTodaySubscriptionDeliveries();
      fetchFebruaryCalendar();
      fetchTomorrowDeliveries();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/dlv-p7q2k-auth');
    }
  };

  // Fetch February 2026 Calendar
  const fetchFebruaryCalendar = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/subscription/february-2026/calendar`, authHeaders);
      if (response.data.success) {
        setFebruaryCalendar(response.data);
      }
    } catch (error) {
      console.error('Error fetching February calendar:', error);
    }
  };

  // Fetch Tomorrow's Deliveries
  const fetchTomorrowDeliveries = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/subscription/next-day-deliveries`, authHeaders);
      if (response.data.success) {
        setTomorrowDeliveries(response.data.deliveries || []);
      }
    } catch (error) {
      console.error('Error fetching tomorrow deliveries:', error);
    }
  };

  // Batch mark all as Out for Delivery
  const handleBatchOutForDelivery = async (date) => {
    if (!window.confirm(`Mark ALL subscription deliveries for ${date} as Out for Delivery?`)) return;
    
    setBatchProcessing(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/api/subscription/batch/out-for-delivery`, {
        date,
        role: 'partner',
        userName: partnerInfo?.name || 'Partner'
      }, authHeaders);

      if (response.data.success) {
        fetchTodaySubscriptionDeliveries();
        fetchFebruaryCalendar();
        alert(`${response.data.results.updated} orders marked as Out for Delivery! Customers have been notified.`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to batch update.');
    } finally {
      setBatchProcessing(false);
    }
  };

  // Batch mark all as Delivered and send next day notifications
  const handleBatchDelivered = async (date) => {
    if (!window.confirm(`Mark ALL subscription deliveries for ${date} as Delivered? This will also notify customers about tomorrow's delivery.`)) return;
    
    setBatchProcessing(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(`${API_URL}/api/subscription/batch/delivered`, {
        date,
        role: 'partner',
        userName: partnerInfo?.name || 'Partner'
      }, authHeaders);

      if (response.data.success) {
        fetchTodaySubscriptionDeliveries();
        fetchFebruaryCalendar();
        fetchTomorrowDeliveries();
        alert(`${response.data.results.success.length} orders marked as Delivered! Next day notifications sent to all customers.`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to batch update.');
    } finally {
      setBatchProcessing(false);
    }
  };

  // New: Fetch today's subscription deliveries only
  const fetchTodaySubscriptionDeliveries = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/subscription/partner/today-deliveries`, authHeaders);
      if (response.data.success) {
        setTodaySubscriptionDeliveries(response.data.deliveries || []);
        setTodayDate(response.data.today || '');
        setIsSunday(response.data.is_sunday || false);
      }
    } catch (error) {
      console.error('Error fetching today subscription deliveries:', error);
    }
  };

  // New: Handle subscription out for delivery
  const handleSubscriptionOutForDelivery = async (orderId) => {
    if (!window.confirm('Mark this subscription as Out for Delivery?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/subscription/${orderId}/out-for-delivery`,
        { partner_id: partnerInfo.id },
        authHeaders
      );

      if (response.data.success) {
        fetchTodaySubscriptionDeliveries();
        alert('Subscription marked as Out for Delivery! Customer has been notified.');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // New: Handle subscription delivered
  const handleSubscriptionDelivered = async (orderId) => {
    if (!window.confirm('Confirm that this subscription delivery is complete?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/subscription/${orderId}/delivered`,
        { partner_id: partnerInfo.id },
        authHeaders
      );

      if (response.data.success) {
        fetchTodaySubscriptionDeliveries();
        alert('Subscription marked as Delivered! Customer has been notified.');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to mark as delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/partner/orders`, authHeaders);
      setOrders(response.data.orders || []);
    } catch (error) {
      // Error fetching orders handled silently
    } finally {
      setLoading(false);
    }
  };

  const fetchNextDayDeliveries = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/orders/partner/next-day-deliveries`, authHeaders);
      if (response.data.success) {
        setNextDayDeliveries(response.data.data || []);
        setNextDayDate(response.data.date || '');
      }
    } catch (error) {
      // Error fetching next day deliveries handled silently
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/api/orders/partner/subscriptions`, authHeaders);
      if (response.data.success) {
        setSubscriptions(response.data.data || []);
        
        // Calculate stats for current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let delivered = 0;
        let undelivered = 0;
        
        response.data.data.forEach(order => {
          order.delivery_dates?.forEach(delivery => {
            const deliveryDate = new Date(delivery.date);
            if (deliveryDate.getMonth() === currentMonth && deliveryDate.getFullYear() === currentYear) {
              if (delivery.status === 'delivered') {
                delivered++;
              } else {
                undelivered++;
              }
            }
          });
        });
        
        setSubscriptionStats({ delivered, undelivered });
      }
    } catch (error) {
      // Error fetching subscriptions handled silently
    }
  };

  const handleMarkDelivered = async (orderId, date) => {
    if (!window.confirm('Mark this subscription delivery as delivered?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/orders/${orderId}/mark-delivery`,
        { date },
        authHeaders
      );

      if (response.data.success) {
        fetchNextDayDeliveries();
        fetchSubscriptions();
        alert('Delivery marked successfully!');
      }
    } catch (error) {
      alert('Failed to mark delivery.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTakeOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to take this order?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/take`,
        { 
          partnerId: partnerInfo.id,
          partnerName: partnerInfo.name,
          partnerPhone: partnerInfo.phone
        },
        authHeaders
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order taken successfully! Customer and admin have been notified.');
      }
    } catch (error) {
      alert('Failed to take order. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOutForDelivery = async (orderId) => {
    if (!window.confirm('Mark this order as out for delivery?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/out-for-delivery`,
        {},
        authHeaders
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order marked as out for delivery! Customer and admin have been notified.');
      }
    } catch (error) {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelivered = async (orderId) => {
    if (!window.confirm('Confirm that this order has been delivered?')) return;
    
    setUpdatingId(orderId);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/delivered`,
        {},
        authHeaders
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order marked as delivered! Customer and admin have been notified.');
      }
    } catch (error) {
      alert('Failed to mark order as delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('supabaseSession');
    navigate('/dlv-p7q2k-auth');
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'all':
        return orders.filter(o => o.status === 'placed');
      case 'taken':
        return orders.filter(o => o.status === 'taken');
      case 'out_for_delivery':
        return orders.filter(o => o.status === 'out_for_delivery');
      case 'delivered':
        return orders.filter(o => o.status === 'delivered');
      case 'subscriptions':
        return []; // Subscriptions handled separately
      default:
        return orders;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      placed: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'New Order' },
      taken: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Taken' },
      out_for_delivery: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', label: 'Out for Delivery' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Delivered' }
    };
    const badge = badges[status] || badges.placed;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = getFilteredOrders();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Partner Dashboard</h1>
              <p className="text-gray-600">Welcome, {partnerInfo?.name || 'Partner'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium uppercase mb-1">New Orders</p>
                <p className="text-4xl font-bold">{orders.filter(o => o.status === 'placed').length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase mb-1">Taken</p>
                <p className="text-4xl font-bold">{orders.filter(o => o.status === 'taken').length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium uppercase mb-1">Out for Delivery</p>
                <p className="text-4xl font-bold">{orders.filter(o => o.status === 'out_for_delivery').length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium uppercase mb-1">Delivered</p>
                <p className="text-4xl font-bold">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full p-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Next Day Subscription Deliveries Section */}
        {nextDayDeliveries.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <h2 className="text-2xl font-bold">Tomorrow's Subscription Deliveries</h2>
                  <p className="text-purple-100 mt-1">
                    {nextDayDate && new Date(nextDayDate).toLocaleDateString('en-IN', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {nextDayDeliveries.map((order) => {
                const items = parseItems(order.items);
                const deliveryDates = order.delivery_dates || [];
                const tomorrowDelivery = deliveryDates.find(d => d.date === nextDayDate);
                
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Subscription Pack
                          </span>
                          <span className="text-gray-600 text-sm">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-800 font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                          <p className="text-sm text-gray-600">{order.customer_college}</p>
                        </div>

                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                              )}
                              <div>
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex lg:flex-col gap-2">
                        {tomorrowDelivery && tomorrowDelivery.status === 'pending' && (
                          <button
                            onClick={() => handleMarkDelivered(order.id, nextDayDate)}
                            disabled={updatingId === order.id}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === order.id ? 'Processing...' : 'Mark Delivered'}
                          </button>
                        )}
                        {tomorrowDelivery && tomorrowDelivery.status === 'delivered' && (
                          <div className="px-6 py-3 bg-green-100 text-green-800 rounded-xl font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Already Delivered
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-md p-2 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All New Orders
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {orders.filter(o => o.status === 'placed').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('taken')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'taken'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Taken Orders
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {orders.filter(o => o.status === 'taken').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('out_for_delivery')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'out_for_delivery'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Out for Delivery
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'delivered'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Delivered
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {orders.filter(o => o.status === 'delivered').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today's Subscriptions
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {todaySubscriptionDeliveries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('february')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'february'
                ? 'bg-pink-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 Feb 2026
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'tomorrow'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tomorrow
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {tomorrowDeliveries.length}
            </span>
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {activeTab === 'february' ? (
            // February 2026 Calendar View
            renderFebruaryCalendar()
          ) : activeTab === 'tomorrow' ? (
            // Tomorrow's Deliveries View
            renderTomorrowDeliveries()
          ) : activeTab === 'subscriptions' ? (
            // Today's Subscription Deliveries View
            isSunday ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🌞</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Sunday - No Deliveries</h3>
                <p className="text-gray-600">Subscription deliveries are not scheduled on Sundays. Enjoy your day off!</p>
              </div>
            ) : todaySubscriptionDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">All Done for Today!</h3>
                <p className="text-gray-600">No pending subscription deliveries for today ({todayDate}).</p>
              </div>
            ) : (
              <>
                {/* Today's Date Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <h2 className="text-2xl font-bold">Today's Subscription Deliveries</h2>
                      <p className="text-purple-100 mt-1">
                        {todayDate && new Date(todayDate + 'T00:00:00').toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        {' • '}{todaySubscriptionDeliveries.length} pending
                      </p>
                    </div>
                  </div>
                </div>

                {/* Today's Subscription Deliveries */}
                {todaySubscriptionDeliveries.map((delivery) => {
                  const items = parseItems(delivery.items);
                  const todayDeliveryInfo = delivery.today_delivery;

                  return (
                    <div key={delivery.order_id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-purple-200">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Order Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                  Subscription Pack
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                  Day {todayDeliveryInfo?.day_number || '-'}
                                </span>
                                <span className="text-gray-600 text-sm">
                                  #{delivery.order_id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {delivery.customer_name}
                              </h3>
                              <p className="text-sm text-gray-600">{delivery.customer_phone}</p>
                              <p className="text-sm text-gray-600">{delivery.customer_college}</p>
                            </div>
                            {todayDeliveryInfo?.status === 'out_for_delivery' && (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold border-2 bg-orange-100 text-orange-800 border-orange-300">
                                Out for Delivery
                              </span>
                            )}
                          </div>

                          {/* Items */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              Delivery Items:
                            </h4>
                            <div className="space-y-2">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 lg:w-64">
                          {todayDeliveryInfo?.status === 'pending' && (
                            <button
                              onClick={() => handleSubscriptionOutForDelivery(delivery.order_id)}
                              disabled={updatingId === delivery.order_id}
                              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {updatingId === delivery.order_id ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Out for Delivery
                                </>
                              )}
                            </button>
                          )}

                          {todayDeliveryInfo?.status === 'out_for_delivery' && (
                            <button
                              onClick={() => handleSubscriptionDelivered(delivery.order_id)}
                              disabled={updatingId === delivery.order_id}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {updatingId === delivery.order_id ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Mark as Delivered
                                </>
                              )}
                            </button>
                          )}

                          {todayDeliveryInfo?.status === 'pending' && (
                            <button
                              onClick={() => handleSubscriptionDelivered(delivery.order_id)}
                              disabled={updatingId === delivery.order_id}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {updatingId === delivery.order_id ? 'Processing...' : (
                                <>
                                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Quick Deliver
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          ) : (
            // Regular Orders View
            filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Orders Found</h3>
                <p className="text-gray-600">
                  {activeTab === 'all' && 'No new orders available at the moment.'}
                  {activeTab === 'taken' && 'You have not taken any orders yet.'}
                  {activeTab === 'out_for_delivery' && 'No orders are currently out for delivery.'}
                  {activeTab === 'delivered' && 'No orders have been delivered yet.'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-gray-100 hover:border-indigo-200"
              >
                <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {order.customer_name}
                        </h3>
                        <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{order.customer_email}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm">{order.customer_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-sm">{order.customer_college || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{formatDate(order.order_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-lg font-bold text-green-600">₹{order.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Order Items:
                      </h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {parseItems(order.items).map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-700 flex justify-between">
                            <span>• {item.name} {item.type && `(${item.type})`}</span>
                            <span className="font-semibold">₹{item.price} x {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 lg:w-64">
                    {order.status === 'placed' && (
                      <button
                        onClick={() => handleTakeOrder(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {updatingId === order.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <>
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Take Order
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'taken' && (
                      <button
                        onClick={() => handleOutForDelivery(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {updatingId === order.id ? 'Updating...' : (
                          <>
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Out for Delivery
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleDelivered(order.id)}
                        disabled={updatingId === order.id}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {updatingId === order.id ? 'Updating...' : (
                          <>
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark as Delivered
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <div className="w-full bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 text-green-800 px-6 py-3 rounded-xl font-semibold text-center">
                        <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
            )
          )}
        </div>
      </div>
    </div>
  );

  // Render February 2026 Calendar View
  function renderFebruaryCalendar() {
    if (!februaryCalendar) {
      return (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading February 2026 calendar...</p>
        </div>
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cell for Feb 1 (Sunday)
    currentWeek.push(null);
    
    februaryCalendar.calendar.forEach((day) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold">February 2026 Subscription Calendar</h2>
              <p className="text-pink-100 mt-1">
                {februaryCalendar.totalDeliveryDays} delivery days • {februaryCalendar.totalSubscriptionCustomers} customers
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-bold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Weeks */}
          <div className="space-y-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIdx) => {
                  if (!day) {
                    return <div key={dayIdx} className="aspect-square" />;
                  }

                  const isToday = day.date === today;
                  const hasCustomers = day.totalCustomers > 0;
                  const allDelivered = hasCustomers && day.stats.delivered === day.totalCustomers;
                  const hasOutForDelivery = day.stats.outForDelivery > 0;
                  const hasPending = day.stats.pending > 0;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => !day.isSunday && setSelectedCalendarDay(selectedCalendarDay?.date === day.date ? null : day)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:scale-105 border-2 ${
                        day.isSunday
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : allDelivered
                          ? 'bg-green-500 text-white border-green-600'
                          : hasOutForDelivery
                          ? 'bg-orange-500 text-white border-orange-600'
                          : hasPending
                          ? 'bg-pink-100 text-pink-800 border-pink-300 hover:border-pink-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      } ${isToday ? 'ring-4 ring-black ring-offset-2' : ''} ${selectedCalendarDay?.date === day.date ? 'ring-4 ring-purple-500 ring-offset-2' : ''}`}
                    >
                      <span className="text-xl font-bold">{day.dayOfMonth}</span>
                      {!day.isSunday && (
                        <>
                          <span className="text-xs opacity-75">Day {day.dayNumber}</span>
                          {hasCustomers && (
                            <span className="text-xs font-semibold mt-1">
                              {day.stats.delivered}/{day.totalCustomers}
                            </span>
                          )}
                        </>
                      )}
                      {day.isSunday && <span className="text-xs">OFF</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">All Delivered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm text-gray-600">Out for Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-100 border border-pink-300"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
              <span className="text-sm text-gray-600">Sunday (OFF)</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedCalendarDay && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {new Date(selectedCalendarDay.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-purple-600 font-semibold">Day {selectedCalendarDay.dayNumber} • {selectedCalendarDay.totalCustomers} customers</p>
              </div>
              
              {/* Batch Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedCalendarDay.stats.pending > 0 && (
                  <button
                    onClick={() => handleBatchOutForDelivery(selectedCalendarDay.date)}
                    disabled={batchProcessing}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {batchProcessing ? 'Processing...' : `All Out for Delivery (${selectedCalendarDay.stats.pending})`}
                  </button>
                )}
                {(selectedCalendarDay.stats.pending > 0 || selectedCalendarDay.stats.outForDelivery > 0) && (
                  <button
                    onClick={() => handleBatchDelivered(selectedCalendarDay.date)}
                    disabled={batchProcessing}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {batchProcessing ? 'Processing...' : `All Delivered (${selectedCalendarDay.stats.pending + selectedCalendarDay.stats.outForDelivery})`}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{selectedCalendarDay.stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="bg-orange-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{selectedCalendarDay.stats.outForDelivery}</p>
                <p className="text-sm text-orange-600">Out for Delivery</p>
              </div>
              <div className="bg-green-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{selectedCalendarDay.stats.delivered}</p>
                <p className="text-sm text-green-600">Delivered</p>
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedCalendarDay.customers.map((customer, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{customer.customerName}</p>
                    <p className="text-sm text-gray-600">{customer.customerPhone} • {customer.customerCollege}</p>
                    <p className="text-xs text-purple-600">{customer.packName}</p>
                  </div>
                  <div>
                    {customer.status === 'pending' && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">Pending</span>
                    )}
                    {customer.status === 'out_for_delivery' && (
                      <span className="px-3 py-1 bg-orange-200 text-orange-700 rounded-full text-sm font-semibold">Out for Delivery</span>
                    )}
                    {customer.status === 'delivered' && (
                      <span className="px-3 py-1 bg-green-200 text-green-700 rounded-full text-sm font-semibold">✓ Delivered</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Tomorrow's Deliveries View
  function renderTomorrowDeliveries() {
    if (tomorrowDeliveries.length === 0) {
      return (
        <div className="bg-teal-50 rounded-2xl shadow-md p-12 text-center border-2 border-teal-200">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-teal-800 mb-2">No Deliveries Tomorrow</h3>
          <p className="text-teal-600">Either all subscriptions are complete or tomorrow is outside the subscription period.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold">Tomorrow's Subscription Deliveries (Day {tomorrowDeliveries[0]?.dayNumber})</h2>
              <p className="text-teal-100 mt-1">
                {tomorrowDeliveries.length} customers scheduled • Get ready for delivery!
              </p>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {tomorrowDeliveries.map((delivery, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Day {delivery.dayNumber}
                    </span>
                    <span className="text-gray-500 text-sm">
                      #{delivery.orderId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{delivery.customerName}</h3>
                  <p className="text-gray-600">{delivery.customerPhone}</p>
                  <p className="text-gray-500 text-sm">{delivery.customerCollege}</p>
                  <p className="text-purple-600 text-sm font-medium mt-2">{delivery.packName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {delivery.deliveredSoFar} / {delivery.totalDays}
                  </p>
                  <p className="text-xs text-gray-400">days delivered</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default PartnerDashboard;
