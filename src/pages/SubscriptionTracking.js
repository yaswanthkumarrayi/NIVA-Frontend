import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Package, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SubscriptionTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingDays, setRemainingDays] = useState(0);
  const [deliveredDays, setDeliveredDays] = useState(0);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [orderId]);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/subscription-details`);
      const result = await response.json();

      if (result.success) {
        setOrder(result.data);
        setRemainingDays(result.remainingDays);
        setDeliveredDays(result.deliveredDays);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    if (!order || !order.delivery_dates || order.delivery_dates.length === 0) {
      return <div className="text-center text-gray-500 py-8">No delivery dates available</div>;
    }

    // Group dates by week
    const weeks = [];
    let currentWeek = [];
    
    // Get the first date (booking date) to determine starting day
    const startDate = new Date(order.subscription_start_date || order.delivery_dates[0].date);
    const startingDayOfWeek = startDate.getDay();
    
    // Add empty cells for days before subscription starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Create a map of dates for easy lookup
    const dateMap = {};
    order.delivery_dates.forEach(d => {
      dateMap[d.date] = d;
    });
    
    // Get all dates from booking date for subscription period
    const endDate = new Date(order.delivery_dates[order.delivery_dates.length - 1].date);
    const currentDate = new Date(startDate);
    
    // Get current month and year for calendar header
    const currentMonth = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Show calendar from start date to end date
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isSunday = currentDate.getDay() === 0;
      
      currentWeek.push({
        day: currentDate.getDate(),
        date: dateStr,
        isSunday,
        deliveryInfo: dateMap[dateStr] || null
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add remaining days to last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-black">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-black" />
          <h2 className="text-xl font-bold text-black">{currentMonth}</h2>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-black py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((dayInfo, dayIdx) => {
                if (!dayInfo) {
                  return <div key={dayIdx} className="aspect-square" />;
                }
                
                const { day, isSunday, deliveryInfo } = dayInfo;
                const isDelivered = deliveryInfo?.status === 'delivered';
                const isPending = deliveryInfo?.status === 'pending';
                const isToday = dayInfo.date === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={dayIdx}
                    className={`aspect-square rounded-full flex flex-col items-center justify-center text-sm font-bold transition-all ${
                      isSunday
                        ? 'bg-gray-200 text-gray-500'
                        : isDelivered
                        ? 'bg-black text-white border-2 border-black'
                        : isPending
                        ? 'bg-white text-black border-2 border-black'
                        : 'bg-gray-100 text-gray-400'
                    } ${isToday ? 'ring-4 ring-gray-400' : ''}`}
                  >
                    <span className="text-base">{day}</span>
                    {isDelivered && (
                      <CheckCircle2 className="w-4 h-4 text-white mt-1" />
                    )}
                    {isPending && (
                      <Clock className="w-4 h-4 text-black mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t-2 border-black">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black border-2 border-black flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-black font-semibold">Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center">
              <Clock className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm text-black font-semibold">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500 font-bold">S</span>
            </div>
            <span className="text-sm text-black font-semibold">Sunday (No Delivery)</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order || !order.is_subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">This is not a subscription order</p>
          <button
            onClick={() => navigate('/customer/orders')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-black shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/orders')}
              className="p-2 hover:bg-gray-800 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Track Subscription</h1>
              <p className="text-xs sm:text-sm text-gray-300">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Days */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-semibold">Total Days</p>
                <p className="text-3xl font-bold text-black">
                  {order.delivery_dates.length}
                </p>
              </div>
              <Package className="w-10 h-10 text-black" />
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-black rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1 font-semibold">Delivered</p>
                <p className="text-3xl font-bold text-white">
                  {deliveredDays}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 font-semibold">Remaining</p>
                <p className="text-3xl font-bold text-black">
                  {remainingDays}
                </p>
              </div>
              <Clock className="w-10 h-10 text-black" />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-black">
          <h3 className="text-lg font-bold text-black mb-4">Subscription Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-300">
                <div>
                  <p className="font-semibold text-black">{item.name}</p>
                  {item.type && <p className="text-sm text-gray-600">{item.type}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-black">₹{item.price}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        {renderCalendar()}

        {/* Delivery Info */}
        <div className="bg-white border-2 border-black rounded-lg p-4">
          <p className="text-sm text-black">
            <strong>Note:</strong> Deliveries are scheduled every day except Sundays. 
            The partner will deliver your subscription pack daily during the active period.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionTracking;
