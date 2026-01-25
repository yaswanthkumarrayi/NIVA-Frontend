import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to parse items if they're stored as JSON string
const parseItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch (error) {
      console.error('Error parsing items:', error);
      return [];
    }
  }
  return [];
};

function PartnerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [nextDayDeliveries, setNextDayDeliveries] = useState([]);
  const [nextDayDate, setNextDayDate] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({ delivered: 0, undelivered: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const partnerId = localStorage.getItem('userId');
    const partnerName = localStorage.getItem('userName');
    const partnerPhone = localStorage.getItem('userPhone');
    
    if (userRole !== 'partner') {
      navigate('/partner/login');
      return;
    }

    setPartnerInfo({ id: partnerId, name: partnerName, phone: partnerPhone });
    fetchOrders();
    fetchNextDayDeliveries();
    fetchSubscriptions();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/partner/orders`);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextDayDeliveries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/partner/next-day-deliveries`);
      if (response.data.success) {
        setNextDayDeliveries(response.data.data || []);
        setNextDayDate(response.data.date || '');
      }
    } catch (error) {
      console.error('Error fetching next day deliveries:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/partner/subscriptions`);
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
      console.error('Error fetching subscriptions:', error);
    }
  };

  const handleMarkDelivered = async (orderId, date) => {
    if (!window.confirm('Mark this subscription delivery as delivered?')) return;
    
    setUpdatingId(orderId);
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/${orderId}/mark-delivery`,
        { date }
      );

      if (response.data.success) {
        fetchNextDayDeliveries();
        fetchSubscriptions();
        alert('Delivery marked successfully!');
      }
    } catch (error) {
      console.error('Error marking delivery:', error);
      alert('Failed to mark delivery.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTakeOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to take this order?')) return;
    
    setUpdatingId(orderId);
    try {
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/take`,
        { 
          partnerId: partnerInfo.id,
          partnerName: partnerInfo.name,
          partnerPhone: partnerInfo.phone
        }
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order taken successfully! Customer and admin have been notified.');
      }
    } catch (error) {
      console.error('Error taking order:', error);
      alert('Failed to take order. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOutForDelivery = async (orderId) => {
    if (!window.confirm('Mark this order as out for delivery?')) return;
    
    setUpdatingId(orderId);
    try {
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/out-for-delivery`
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order marked as out for delivery! Customer and admin have been notified.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelivered = async (orderId) => {
    if (!window.confirm('Confirm that this order has been delivered?')) return;
    
    setUpdatingId(orderId);
    try {
      const response = await axios.put(
        `${API_URL}/api/partner/order/${orderId}/delivered`
      );

      if (response.data.success) {
        fetchOrders();
        alert('Order marked as delivered! Customer and admin have been notified.');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to mark order as delivered.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    navigate('/partner/login');
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
            Subscriptions
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white bg-opacity-20 text-sm">
              {subscriptions.length}
            </span>
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {activeTab === 'subscriptions' ? (
            // Subscriptions View
            subscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No Subscription Orders</h3>
                <p className="text-gray-600">No subscription orders found for this month.</p>
              </div>
            ) : (
              <>
                {/* Monthly Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                    <p className="text-green-100 text-sm font-medium uppercase mb-1">Delivered This Month</p>
                    <p className="text-4xl font-bold">{subscriptionStats.delivered}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                    <p className="text-orange-100 text-sm font-medium uppercase mb-1">Undelivered This Month</p>
                    <p className="text-4xl font-bold">{subscriptionStats.undelivered}</p>
                  </div>
                </div>

                {/* Subscription Orders */}
                {subscriptions.map((order) => {
                  const items = parseItems(order.items);
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const monthDeliveries = order.delivery_dates?.filter(d => {
                    const date = new Date(d.date);
                    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                  }) || [];

                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-purple-200">
                      <div className="flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                                Subscription Pack
                              </span>
                              <span className="text-gray-600 text-sm">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {order.customer_name}
                            </h3>
                            <p className="text-sm text-gray-600">{order.customer_phone}</p>
                            <p className="text-sm text-gray-600">{order.customer_college}</p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                                )}
                                <div>
                                  <p className="font-semibold text-gray-800">{item.name}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Calendar for Current Month */}
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Deliveries
                          </h4>
                          <div className="grid grid-cols-7 gap-2">
                            {monthDeliveries.map((delivery) => {
                              const date = new Date(delivery.date);
                              const day = date.getDate();
                              const isDelivered = delivery.status === 'delivered';
                              const isToday = delivery.date === new Date().toISOString().split('T')[0];

                              return (
                                <div
                                  key={delivery.date}
                                  className={`aspect-square rounded-full flex items-center justify-center text-sm font-bold ${
                                    isDelivered
                                      ? 'bg-black text-white'
                                      : 'bg-white text-black border-2 border-black'
                                  } ${isToday ? 'ring-4 ring-purple-400' : ''}`}
                                  title={`${delivery.date} - ${isDelivered ? 'Delivered' : 'Pending'}`}
                                >
                                  {isDelivered ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    day
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-black"></div>
                              <span>Delivered</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-white border-2 border-black"></div>
                              <span>Pending</span>
                            </div>
                          </div>
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
}

export default PartnerDashboard;
