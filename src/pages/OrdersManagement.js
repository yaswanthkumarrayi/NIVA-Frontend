import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

const OrdersManagement = ({ userRole }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({ delivered: 0, undelivered: 0 });

  useEffect(() => {
    fetchOrders();
    fetchSubscriptions();
  }, []);

  const fetchOrders = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/orders`);
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/orders/admin/subscriptions`);
      const result = await response.json();
      
      if (result.success) {
        setSubscriptions(result.data || []);
        
        // Calculate stats for current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let delivered = 0;
        let undelivered = 0;
        
        result.data.forEach(order => {
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

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'taken':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    if (userRole === 'admin') {
      localStorage.removeItem('adminPhone');
      navigate('/sys-x9k3m-auth');
    } else {
      navigate('/dlv-q5n8t-auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">{userRole === 'admin' ? 'Admin' : 'Partner'} - Orders</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-black rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Total Orders</p>
            <p className="text-3xl font-bold text-black mt-1">{orders.length}</p>
          </div>
          <div className="bg-white border-2 border-amber-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Placed</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {orders.filter(o => o.status === 'placed').length}
            </p>
          </div>
          <div className="bg-white border-2 border-purple-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Out for Delivery</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {orders.filter(o => o.status === 'out_for_delivery').length}
            </p>
          </div>
          <div className="bg-white border-2 border-green-500 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 uppercase">Delivered</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-black text-white'
                : 'bg-white text-black border-2 border-black hover:bg-gray-100'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-black text-white'
                : 'bg-white text-black border-2 border-black hover:bg-gray-100'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'all' ? (
        // Orders Table
        <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">College</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-black">{order.customer_name}</div>
                        <div className="text-xs text-gray-600">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.customer_college}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.customer_phone}</td>
                      <td className="px-4 py-3 text-sm font-bold text-black">₹{order.total_amount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="bg-black text-white px-3 py-1 rounded text-xs font-semibold hover:bg-gray-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          // Subscriptions View
          <div className="space-y-6">
            {subscriptions.length === 0 ? (
              <div className="bg-white border-2 border-black rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-black mb-2">No Subscription Orders</h3>
                <p className="text-gray-600">No subscription orders found.</p>
              </div>
            ) : (
              <>
                {/* Monthly Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black text-white rounded-lg p-6 border-2 border-black">
                    <p className="text-gray-300 text-sm font-medium uppercase mb-1">Delivered This Month</p>
                    <p className="text-4xl font-bold">{subscriptionStats.delivered}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border-2 border-black">
                    <p className="text-gray-600 text-sm font-medium uppercase mb-1">Undelivered This Month</p>
                    <p className="text-4xl font-bold text-black">{subscriptionStats.undelivered}</p>
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
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border-2 border-black">
                      <div className="flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-semibold">
                                Subscription Pack
                              </span>
                              <span className="text-gray-600 text-sm">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-black mb-1">
                              {order.customer_name}
                            </h3>
                            <p className="text-sm text-gray-600">{order.customer_phone}</p>
                            <p className="text-sm text-gray-600">{order.customer_college}</p>
                            {order.partner_name && (
                              <p className="text-sm text-blue-600 font-semibold mt-1">
                                Partner: {order.partner_name}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                          <h4 className="font-semibold text-black mb-2">Items:</h4>
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-300" />
                                )}
                                <div>
                                  <p className="font-semibold text-black">{item.name}</p>
                                  <p className="text-xs text-gray-600">Qty: {item.quantity} | ₹{item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Calendar for Current Month */}
                        <div className="bg-white rounded-lg p-4 border-2 border-black">
                          <h4 className="font-semibold text-black mb-3">
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Deliveries
                          </h4>
                          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
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
                                  } ${isToday ? 'ring-4 ring-gray-400' : ''}`}
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
                              <span className="font-semibold">Delivered</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-white border-2 border-black"></div>
                              <span className="font-semibold">Pending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-lg font-bold text-black mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-semibold">Order ID</p>
                    <p className="text-black font-mono">#{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Status</p>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Order Date</p>
                    <p className="text-black">{formatDate(selectedOrder.order_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Total Amount</p>
                    <p className="text-black font-bold">₹{selectedOrder.total_amount}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-black mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Name:</span>
                    <span className="text-black">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Email:</span>
                    <span className="text-black">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Phone:</span>
                    <span className="text-black">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">College:</span>
                    <span className="text-black">{selectedOrder.customer_college}</span>
                  </div>
                </div>
              </div>
              
              {/* Order Tracking */}
              {userRole === 'admin' && (
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-black mb-4">Order Tracking</h3>
                  <div className="relative">
                    {[
                      { key: 'placed', label: 'Order Placed', date: selectedOrder.placed_at || selectedOrder.order_date },
                      { key: 'taken', label: 'Accepted by Partner', date: selectedOrder.taken_at, partner: selectedOrder.partner_name },
                      { key: 'out_for_delivery', label: 'Out for Delivery', date: selectedOrder.out_for_delivery_at },
                      { key: 'delivered', label: 'Delivered', date: selectedOrder.delivered_at }
                    ].map((step, index, arr) => {
                      const statusOrder = ['placed', 'taken', 'out_for_delivery', 'delivered'];
                      const currentIndex = statusOrder.indexOf(selectedOrder.status);
                      const stepIndex = statusOrder.indexOf(step.key);
                      const isCompleted = stepIndex <= currentIndex;
                      const isActive = selectedOrder.status === step.key;

                      return (
                        <div key={step.key} className="flex items-start mb-6 last:mb-0">
                          {/* Timeline Line */}
                          {index < arr.length - 1 && (
                            <div 
                              className={`absolute left-3 top-8 w-0.5 h-12 ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          )}

                          {/* Icon */}
                          <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-green-500 ring-4 ring-green-100' 
                              : 'bg-gray-300 ring-4 ring-gray-100'
                          } ${isActive ? 'animate-pulse' : ''}`}>
                            {isCompleted && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>

                          {/* Content */}
                          <div className="ml-4 flex-1">
                            <div className={`font-semibold ${
                              isCompleted ? 'text-green-700' : 'text-gray-500'
                            } ${isActive ? 'text-purple-700' : ''}`}>
                              {step.label}
                              {isActive && <span className="ml-2 text-sm">(Current)</span>}
                            </div>
                            {step.date && (
                              <div className="text-sm text-gray-600 mt-1">
                                {formatDate(step.date)}
                              </div>
                            )}
                            {step.partner && isCompleted && (
                              <div className="text-sm text-blue-600 mt-1">
                                Partner: {step.partner}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-black mb-3">Order Items</h3>
                <div className="space-y-3">
                  {JSON.parse(selectedOrder.items).map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border border-gray-300"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-black">{item.name}</h4>
                        <p className="text-xs text-gray-600">{item.type === 'pack' ? 'Monthly Pack' : 'Fresh Fruit'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-bold text-black">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
