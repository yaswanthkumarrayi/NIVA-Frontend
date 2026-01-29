import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMenuForOrder, setShowMenuForOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const customerId = localStorage.getItem('userId');
    if (!customerId) {
      navigate('/customer/login');
      return;
    }

    fetchOrders();
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenuForOrder && !event.target.closest('.menu-dropdown')) {
        setShowMenuForOrder(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuForOrder]);

  const fetchOrders = async () => {
    try {
      const customerId = localStorage.getItem('userId');
      const response = await axios.get(`${API_URL}/api/orders/customer/${customerId}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status) => {
    const badges = {
      placed: { 
        bg: 'bg-amber-100', 
        text: 'text-amber-800', 
        border: 'border-amber-300', 
        label: 'Placed'
      },
      taken: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        border: 'border-blue-300', 
        label: 'Accepted'
      },
      out_for_delivery: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800', 
        border: 'border-purple-300', 
        label: 'Out for Delivery'
      },
      delivered: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        border: 'border-green-300', 
        label: 'Delivered'
      }
    };
    return badges[status] || badges.placed;
  };

  const handleTrackOrder = (order) => {
    // If subscription (check multiple indicators), navigate to subscription tracking page
    const isSubscription = order.is_subscription || 
      (order.delivery_dates && order.delivery_dates.length > 0) ||
      (typeof order.delivery_dates === 'string' && order.delivery_dates.length > 2);
    
    if (isSubscription) {
      navigate(`/customer/subscription-tracking/${order.id}`);
    } else {
      setSelectedOrder(order);
      setShowTrackModal(true);
      setShowMenuForOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`${API_URL}/api/orders/${orderId}`);
        setOrders(orders.filter(order => order.id !== orderId));
        setShowMenuForOrder(null);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  const handleReorder = (item) => {
    const productType = item.type || 'fruit';
    navigate(`/product/${productType}/${item.id}`);
    setShowMenuForOrder(null);
  };

  const TrackingTimeline = ({ order }) => {
    const getStepStatus = (step) => {
      const statusOrder = ['placed', 'taken', 'out_for_delivery', 'delivered'];
      const currentIndex = statusOrder.indexOf(order.status);
      const stepIndex = statusOrder.indexOf(step);
      
      if (stepIndex <= currentIndex) {
        return 'completed';
      }
      return 'pending';
    };

    const getStepDate = (step) => {
      const dateMap = {
        placed: order.placed_at || order.order_date,
        taken: order.taken_at,
        out_for_delivery: order.out_for_delivery_at,
        delivered: order.delivered_at
      };
      return dateMap[step];
    };

    const steps = [
      { key: 'placed', label: 'Order Placed' },
      { key: 'taken', label: 'Accepted by Partner' },
      { key: 'out_for_delivery', label: 'Out for Delivery' },
      { key: 'delivered', label: 'Delivered' }
    ];

    return (
      <div className="py-6">
        <div className="relative">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key);
            const isActive = order.status === step.key;
            const date = getStepDate(step.key);

            return (
              <div key={step.key} className="flex items-start mb-8 last:mb-0">
                {/* Timeline Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute left-6 top-12 w-0.5 h-16 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    style={{ marginLeft: '1px' }}
                  />
                )}

                {/* Icon - Green Check or Gray Circle */}
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  status === 'completed' 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                }`}>
                  {status === 'completed' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className={`font-semibold text-lg ${
                    status === 'completed' ? 'text-green-700' : 'text-gray-500'
                  } ${isActive ? 'text-purple-700' : ''}`}>
                    {step.label}
                    {isActive && <span className="ml-2 text-purple-600">(Current)</span>}
                  </div>
                  {date && (
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDate(date)}
                    </div>
                  )}
                  {step.key === 'taken' && order.partner_name && status === 'completed' && (
                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded-lg">
                      <div className="font-medium text-blue-900">Partner: {order.partner_name}</div>
                      <div className="text-blue-700">Phone: {order.partner_phone}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-semibold">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - White - Fixed */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/customer/dashboard')}
                className="hover:bg-gray-100 p-2 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-black">Your Orders</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {orders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl max-w-4xl mx-auto">
            <p className="text-black text-xl">No orders placed</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {orders.map((order) => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              const deliveryDates = order.delivery_dates ? 
                (typeof order.delivery_dates === 'string' ? JSON.parse(order.delivery_dates) : order.delivery_dates) 
                : [];
              
              // Calculate remaining days for subscriptions
              const today = new Date().toISOString().split('T')[0];
              const remainingDeliveries = deliveryDates.filter(
                d => d.date >= today && d.status === 'pending'
              ).length;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-md relative"
                >
                  {/* Subscription Badge */}
                  {order.is_subscription && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 16a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h8z" />
                        </svg>
                        Subscription
                      </div>
                      {remainingDeliveries > 0 && (
                        <div className="mt-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {remainingDeliveries} days left
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3 Dots Menu - Top Right */}
                  <div className="absolute top-4 right-4 z-10 menu-dropdown">
                    <button
                      onClick={() => setShowMenuForOrder(showMenuForOrder === order.id ? null : order.id)}
                      className="text-black hover:bg-gray-100 p-2 rounded-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMenuForOrder === order.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                        <button
                          onClick={() => handleTrackOrder(order)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                        >
                          Track Order
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                        >
                          Delete Order
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-8">
                    {items.map((item, idx) => (
                      <div key={idx} className="mb-6">
                        {/* Item Image and Heading - Left Aligned */}
                        <div className="flex items-center gap-4 mb-4">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                            <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                          </div>
                        </div>
                        
                        {/* Line below image */}
                        <div className="border-t border-gray-300 my-4"></div>
                        
                        {/* Action Buttons - Below the line with separator */}
                        <div className="flex justify-center items-center gap-4">
                          <button
                            onClick={() => handleTrackOrder(order)}
                            className="bg-white hover:bg-gray-50 text-black border-2 border-black px-8 py-2 rounded-lg font-semibold transition-all"
                          >
                            Track Order
                          </button>
                          {/* Vertical Line Separator */}
                          <div className="h-10 border-l-2 border-gray-300"></div>
                          <button
                            onClick={() => handleReorder(item)}
                            className="bg-black hover:bg-gray-800 text-white px-8 py-2 rounded-lg font-semibold transition-all"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Track Order Modal */}
      {showTrackModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Black */}
            <div className="bg-black text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Track Your Order</h2>
                  <p className="text-gray-300 mt-1">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="hover:bg-gray-800 p-2 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Current Status */}
              <div className={`rounded-xl p-4 mb-6 border-2 border-black`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedOrder.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {selectedOrder.status === 'delivered' ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-black">{getStatusBadge(selectedOrder.status).label}</div>
                    <div className="text-sm text-gray-600">Last updated: {formatDate(selectedOrder.updated_at)}</div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              <TrackingTimeline order={selectedOrder} />

              {/* Order Details */}
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-black">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Order Date:</span>
                    <div className="font-medium text-black">{formatDate(selectedOrder.order_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <div className="font-bold text-black">₹{selectedOrder.total_amount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Location:</span>
                    <div className="font-medium text-black">{selectedOrder.customer_college}</div>
                  </div>
                  {selectedOrder.partner_name && (
                    <div>
                      <span className="text-gray-600">Delivery Partner:</span>
                      <div className="font-medium text-black">{selectedOrder.partner_name}</div>
                      <div className="text-xs text-gray-500">{selectedOrder.partner_phone}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 rounded-b-2xl flex justify-end border-t-2 border-gray-200">
              <button
                onClick={() => setShowTrackModal(false)}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
