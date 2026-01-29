import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Package, Users, CheckCircle2, Clock, Truck, AlertCircle, ArrowLeft, ChevronDown, ChevronUp, Mail, CalendarDays } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SubscriptionDeliveryManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
    outForDelivery: 0
  });
  
  // February 2026 Calendar State
  const [februaryCalendar, setFebruaryCalendar] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [nextDayDeliveries, setNextDayDeliveries] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/niva-mgmt-access');
      return;
    }
    fetchSubscriptions();
    fetchFebruaryCalendar();
    fetchNextDayDeliveries();
  }, [navigate]);

  const fetchFebruaryCalendar = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/subscription/february-2026/calendar`);
      if (response.data.success) {
        setFebruaryCalendar(response.data);
      }
    } catch (error) {
      console.error('Error fetching February calendar:', error);
    }
  };

  const fetchNextDayDeliveries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/subscription/next-day-deliveries`);
      if (response.data.success) {
        setNextDayDeliveries(response.data.deliveries || []);
      }
    } catch (error) {
      console.error('Error fetching next day deliveries:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/subscription/admin/all`);
      if (response.data.success) {
        setSubscriptions(response.data.data || []);
        calculateStats(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    let total = 0;
    let delivered = 0;
    let pending = 0;
    let outForDelivery = 0;

    orders.forEach(order => {
      if (order.stats) {
        total += order.stats.total;
        delivered += order.stats.delivered;
        pending += order.stats.pending;
        outForDelivery += order.stats.out_for_delivery;
      }
    });

    setStats({ total, delivered, pending, outForDelivery });
  };

  const getTodayDeliveries = () => {
    const today = new Date().toISOString().split('T')[0];
    const isSunday = new Date().getDay() === 0;
    
    if (isSunday) return [];
    
    return subscriptions.filter(order => {
      const todayDelivery = order.delivery_dates?.find(d => d.date === today);
      return todayDelivery && (todayDelivery.status === 'pending' || todayDelivery.status === 'out_for_delivery');
    });
  };

  // Batch mark all as Out for Delivery
  const handleBatchOutForDelivery = async (date) => {
    if (!window.confirm(`Mark ALL subscription deliveries for ${date} as Out for Delivery?`)) return;
    
    setBatchProcessing(true);
    try {
      const response = await axios.post(`${API_URL}/api/subscription/batch/out-for-delivery`, {
        date,
        role: 'admin',
        userName: 'Admin'
      });

      if (response.data.success) {
        fetchSubscriptions();
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
      const response = await axios.post(`${API_URL}/api/subscription/batch/delivered`, {
        date,
        role: 'admin',
        userName: 'Admin'
      });

      if (response.data.success) {
        fetchSubscriptions();
        fetchFebruaryCalendar();
        fetchNextDayDeliveries();
        alert(`${response.data.results.success.length} orders marked as Delivered! Next day notifications sent to all customers.`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to batch update.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleMarkOutForDelivery = async (orderId, date) => {
    if (!window.confirm('Mark this delivery as out for delivery?')) return;
    
    setUpdating(orderId);
    try {
      const response = await axios.post(`${API_URL}/api/subscription/${orderId}/out-for-delivery`, {
        date,
        role: 'admin',
        userName: 'Admin'
      });

      if (response.data.success) {
        fetchSubscriptions();
        fetchFebruaryCalendar();
        alert('Marked as out for delivery! Customer has been notified.');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update delivery status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkDelivered = async (orderId, date) => {
    if (!window.confirm('Mark this delivery as delivered?')) return;
    
    setUpdating(orderId);
    try {
      const response = await axios.post(`${API_URL}/api/subscription/${orderId}/delivered`, {
        date,
        role: 'admin',
        userName: 'Admin'
      });

      if (response.data.success) {
        fetchSubscriptions();
        alert('Marked as delivered! Customer has been notified.');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark as delivered.');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      NA: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Sunday' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
      out_for_delivery: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Out for Delivery' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const renderCalendar = (order) => {
    if (!order.delivery_dates || order.delivery_dates.length === 0) {
      return <div className="text-gray-500 text-center py-4">No delivery dates available</div>;
    }

    const weeks = [];
    let currentWeek = [];
    const startDate = new Date(order.subscription_start_date);
    const startingDayOfWeek = startDate.getDay();
    
    // Add empty cells for days before subscription starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    order.delivery_dates.forEach((delivery, idx) => {
      currentWeek.push(delivery);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Fill remaining days in last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mt-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((delivery, dayIdx) => {
                if (!delivery) {
                  return <div key={dayIdx} className="aspect-square" />;
                }
                
                const isToday = delivery.date === today;
                const dayNum = new Date(delivery.date).getDate();
                
                return (
                  <div
                    key={dayIdx}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative cursor-pointer transition-all hover:scale-105 ${
                      delivery.is_sunday
                        ? 'bg-gray-200 text-gray-500'
                        : delivery.status === 'delivered'
                        ? 'bg-green-500 text-white'
                        : delivery.status === 'out_for_delivery'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}`}
                    title={`${formatDate(delivery.date)} - ${delivery.status}`}
                  >
                    <span className="font-bold">{dayNum}</span>
                    {delivery.day_number && !delivery.is_sunday && (
                      <span className="text-[10px] opacity-75">D{delivery.day_number}</span>
                    )}
                    {delivery.is_sunday && (
                      <span className="text-[10px]">NA</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-200 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Delivered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span>Out for Delivery</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-200"></div>
            <span>Sunday (NA)</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTodayDeliveries = () => {
    const todayDeliveries = getTodayDeliveries();
    const today = new Date().toISOString().split('T')[0];
    const isSunday = new Date().getDay() === 0;

    if (isSunday) {
      return (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Deliveries Today</h3>
          <p className="text-gray-500">Sundays are rest days - no subscription deliveries.</p>
        </div>
      );
    }

    if (todayDeliveries.length === 0) {
      return (
        <div className="bg-green-50 rounded-xl p-8 text-center border-2 border-green-200">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-700 mb-2">All Done!</h3>
          <p className="text-green-600">All today's subscription deliveries have been completed.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {todayDeliveries.map(order => {
          const todayDelivery = order.delivery_dates?.find(d => d.date === today);
          const items = order.items || [];
          
          return (
            <div key={order.id} className="bg-white rounded-xl border-2 border-black shadow-md p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Day {todayDelivery?.day_number}
                    </span>
                    {getStatusBadge(todayDelivery?.status)}
                    <span className="text-gray-500 text-sm">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-black">{order.customer_name}</h3>
                  <p className="text-gray-600">{order.customer_phone}</p>
                  <p className="text-gray-500 text-sm">{order.customer_college}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {items.map((item, idx) => (
                      <span key={idx} className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-medium">
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Progress:</span> {order.stats?.delivered || 0} / {order.stats?.total || 0} days delivered
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {todayDelivery?.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleMarkOutForDelivery(order.id, today)}
                        disabled={updating === order.id}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Truck className="w-5 h-5" />
                        {updating === order.id ? 'Processing...' : 'Out for Delivery'}
                      </button>
                      <button
                        onClick={() => handleMarkDelivered(order.id, today)}
                        disabled={updating === order.id}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {updating === order.id ? 'Processing...' : 'Mark Delivered'}
                      </button>
                    </>
                  )}
                  {todayDelivery?.status === 'out_for_delivery' && (
                    <button
                      onClick={() => handleMarkDelivered(order.id, today)}
                      disabled={updating === order.id}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {updating === order.id ? 'Processing...' : 'Mark Delivered'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAllSubscriptions = () => {
    if (subscriptions.length === 0) {
      return (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Subscription Orders</h3>
          <p className="text-gray-500">No subscription pack orders have been placed yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {subscriptions.map(order => {
          const isExpanded = expandedOrder === order.id;
          const items = order.items || [];
          
          return (
            <div key={order.id} className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-all"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 text-sm">
                        {formatDate(order.subscription_start_date)} - {formatDate(order.subscription_end_date)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-black">{order.customer_name}</h3>
                    <p className="text-gray-600 text-sm">{order.customer_email}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {items.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium">
                          {item.name}
                        </span>
                      ))}
                      {items.length > 2 && (
                        <span className="text-gray-500 text-sm">+{items.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="font-semibold">{order.stats?.delivered || 0}</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-semibold">{order.stats?.total || 0}</span>
                      </div>
                      <span className="text-xs text-gray-500">Days Delivered</span>
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h4 className="font-semibold text-black mb-2">Customer Details</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p><span className="text-gray-500">Name:</span> {order.customer_name}</p>
                        <p><span className="text-gray-500">Phone:</span> {order.customer_phone}</p>
                        <p><span className="text-gray-500">Email:</span> {order.customer_email}</p>
                        <p><span className="text-gray-500">Location:</span> {order.customer_college}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-black mb-2">Order Details</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p><span className="text-gray-500">Amount:</span> ₹{order.total_amount}</p>
                        <p><span className="text-gray-500">Start:</span> {formatDate(order.subscription_start_date)}</p>
                        <p><span className="text-gray-500">End:</span> {formatDate(order.subscription_end_date)}</p>
                        <p><span className="text-gray-500">Ordered:</span> {formatDate(order.order_date)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-black mb-2">Delivery Calendar</h4>
                    {renderCalendar(order)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/niva-sub-s5e7')}
              className="p-2 hover:bg-gray-100 rounded-full transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Subscription Delivery Management</h1>
              <p className="text-gray-500">Manage daily subscription pack deliveries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Total Subscriptions</p>
                <p className="text-3xl font-bold text-black mt-1">{subscriptions.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Delivered</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.delivered}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Out for Delivery</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.outForDelivery}</p>
              </div>
              <Truck className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase">Pending</p>
                <p className="text-3xl font-bold text-gray-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'today'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Today's Deliveries
            <span className={`px-2 py-0.5 rounded-full text-sm ${
              activeTab === 'today' ? 'bg-white bg-opacity-20' : 'bg-gray-200'
            }`}>
              {getTodayDeliveries().length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('february')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'february'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            February 2026
          </button>
          <button
            onClick={() => setActiveTab('nextday')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'nextday'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Mail className="w-5 h-5" />
            Next Day
            <span className={`px-2 py-0.5 rounded-full text-sm ${
              activeTab === 'nextday' ? 'bg-white bg-opacity-20' : 'bg-gray-200'
            }`}>
              {nextDayDeliveries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="w-5 h-5" />
            All Subscriptions
            <span className={`px-2 py-0.5 rounded-full text-sm ${
              activeTab === 'all' ? 'bg-white bg-opacity-20' : 'bg-gray-200'
            }`}>
              {subscriptions.length}
            </span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'today' && renderTodayDeliveries()}
        {activeTab === 'february' && renderFebruaryCalendar()}
        {activeTab === 'nextday' && renderNextDayDeliveries()}
        {activeTab === 'all' && renderAllSubscriptions()}
      </div>
    </div>
  );

  // Render February 2026 Calendar View
  function renderFebruaryCalendar() {
    if (!februaryCalendar) {
      return (
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading February 2026 calendar...</p>
        </div>
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells for days before Feb 2 (which is Monday)
    // Feb 1, 2026 is Sunday, so we start from Feb 2 (Monday)
    currentWeek.push(null); // Sunday placeholder
    
    februaryCalendar.calendar.forEach((day, idx) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Fill remaining days
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8" />
            February 2026 Subscription Calendar
          </h2>
          <p className="mt-2 text-purple-100">
            {februaryCalendar.totalDeliveryDays} delivery days • {februaryCalendar.totalSubscriptionCustomers} active customers
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
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
                      onClick={() => !day.isSunday && setSelectedDay(selectedDay?.date === day.date ? null : day)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:scale-105 border-2 ${
                        day.isSunday
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : allDelivered
                          ? 'bg-green-500 text-white border-green-600'
                          : hasOutForDelivery
                          ? 'bg-orange-500 text-white border-orange-600'
                          : hasPending
                          ? 'bg-purple-100 text-purple-800 border-purple-300 hover:border-purple-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      } ${isToday ? 'ring-4 ring-black ring-offset-2' : ''} ${selectedDay?.date === day.date ? 'ring-4 ring-indigo-500 ring-offset-2' : ''}`}
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
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
              <span className="text-sm text-gray-600">Sunday (No Delivery)</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {new Date(selectedDay.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-indigo-600 font-semibold">Day {selectedDay.dayNumber} • {selectedDay.totalCustomers} customers</p>
              </div>
              
              {/* Batch Actions */}
              <div className="flex gap-3">
                {selectedDay.stats.pending > 0 && (
                  <button
                    onClick={() => handleBatchOutForDelivery(selectedDay.date)}
                    disabled={batchProcessing}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    {batchProcessing ? 'Processing...' : `Mark All Out for Delivery (${selectedDay.stats.pending})`}
                  </button>
                )}
                {(selectedDay.stats.pending > 0 || selectedDay.stats.outForDelivery > 0) && (
                  <button
                    onClick={() => handleBatchDelivered(selectedDay.date)}
                    disabled={batchProcessing}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {batchProcessing ? 'Processing...' : `Mark All Delivered (${selectedDay.stats.pending + selectedDay.stats.outForDelivery})`}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{selectedDay.stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="bg-orange-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{selectedDay.stats.outForDelivery}</p>
                <p className="text-sm text-orange-600">Out for Delivery</p>
              </div>
              <div className="bg-green-100 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{selectedDay.stats.delivered}</p>
                <p className="text-sm text-green-600">Delivered</p>
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDay.customers.map((customer, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{customer.customerName}</p>
                    <p className="text-sm text-gray-600">{customer.customerPhone} • {customer.customerCollege}</p>
                    <p className="text-xs text-gray-500">{customer.packName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {customer.status === 'pending' && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">Pending</span>
                    )}
                    {customer.status === 'out_for_delivery' && (
                      <span className="px-3 py-1 bg-orange-200 text-orange-700 rounded-full text-sm font-semibold">Out for Delivery</span>
                    )}
                    {customer.status === 'delivered' && (
                      <span className="px-3 py-1 bg-green-200 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Delivered
                      </span>
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

  // Render Next Day Deliveries View
  function renderNextDayDeliveries() {
    if (nextDayDeliveries.length === 0) {
      return (
        <div className="bg-indigo-50 rounded-xl p-8 text-center border-2 border-indigo-200">
          <CalendarDays className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-indigo-700 mb-2">No Deliveries Tomorrow</h3>
          <p className="text-indigo-600">Either all subscriptions are complete or tomorrow is outside the subscription period.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-8 h-8" />
            Tomorrow's Subscription Deliveries (Day {nextDayDeliveries[0]?.dayNumber})
          </h2>
          <p className="mt-2 text-indigo-100">
            {nextDayDeliveries.length} customers scheduled for delivery
          </p>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {nextDayDeliveries.map((delivery, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
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
                  <p className="text-2xl font-bold text-indigo-600">
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

export default SubscriptionDeliveryManagement;
