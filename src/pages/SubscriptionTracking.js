import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Package, Calendar, Truck, RefreshCw } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Hardcoded February 2026 subscription calendar
// Feb 2 (Monday) to Feb 28 (Saturday)
// Sundays: Feb 8, 15, 22 (no delivery)
const FEBRUARY_2026_CALENDAR = (() => {
  const dates = [];
  let dayNumber = 0;
  
  for (let day = 2; day <= 28; day++) {
    const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
    const date = new Date(2026, 1, day);
    const isSunday = date.getDay() === 0;
    
    if (!isSunday) {
      dayNumber++;
    }
    
    dates.push({
      date: dateStr,
      day: day,
      day_number: isSunday ? null : dayNumber,
      is_sunday: isSunday,
      status: isSunday ? 'NA' : 'pending'
    });
  }
  
  return dates;
})();

function SubscriptionTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingDays, setRemainingDays] = useState(0);
  const [deliveredDays, setDeliveredDays] = useState(0);
  const [todayDelivery, setTodayDelivery] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [orderId]);

  const fetchSubscriptionDetails = async () => {
    try {
      // Try new enhanced endpoint first
      const response = await fetch(`${API_URL}/api/subscription/customer/${orderId}`);
      const result = await response.json();

      if (result.success && result.order) {
        // Check if this is really a subscription order
        const hasDeliveryDates = result.order.delivery_dates && result.order.delivery_dates.length > 0;
        const isSubscription = result.is_subscription || result.order.is_subscription || hasDeliveryDates;
        
        if (!isSubscription) {
          // Not a subscription - show error
          setOrder(null);
          return;
        }
        
        setOrder({ ...result.order, is_subscription: true });
        setRemainingDays(result.stats?.remaining || 0);
        setDeliveredDays(result.stats?.delivered || 0);
        setTodayDelivery(result.today_delivery);
      } else {
        // Fallback to old endpoint
        const fallbackResponse = await fetch(`${API_URL}/api/orders/${orderId}/subscription-details`);
        const fallbackResult = await fallbackResponse.json();
        if (fallbackResult.success && fallbackResult.data) {
          // Mark as subscription if it has delivery_dates (subscription pack indicator)
          const hasDeliveryDates = fallbackResult.data.delivery_dates && fallbackResult.data.delivery_dates.length > 0;
          const isSubscription = fallbackResult.data.is_subscription || hasDeliveryDates;
          
          if (!isSubscription) {
            setOrder(null);
            return;
          }
          
          setOrder({ ...fallbackResult.data, is_subscription: true });
          setRemainingDays(fallbackResult.remainingDays || 0);
          setDeliveredDays(fallbackResult.deliveredDays || 0);
          
          // Find today's delivery for the status card
          const today = new Date().toISOString().split('T')[0];
          const todayDel = fallbackResult.data.delivery_dates?.find(d => d.date === today);
          setTodayDelivery(todayDel || null);
        } else {
          setOrder(null);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptionDetails();
    setRefreshing(false);
  };

  const getStatusColor = (status, is_sunday) => {
    if (is_sunday || status === 'NA') {
      return { bg: 'bg-gray-200', text: 'text-gray-500', border: 'border-gray-300' };
    }
    switch (status) {
      case 'delivered':
        return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' };
      case 'out_for_delivery':
        return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' };
      case 'pending':
      default:
        return { bg: 'bg-white', text: 'text-gray-700', border: 'border-gray-400' };
    }
  };

  const renderCalendar = () => {
    // Use hardcoded February 2026 calendar, merge with order's actual delivery status
    const today = new Date().toISOString().split('T')[0];
    
    // Create a map of order's delivery statuses
    const statusMap = {};
    if (order && order.delivery_dates) {
      order.delivery_dates.forEach(d => {
        statusMap[d.date] = d;
      });
    }
    
    // Build weeks for February 2026
    const weeks = [];
    let currentWeek = [];
    
    // Feb 1, 2026 is a Sunday (add it first)
    currentWeek.push({ 
      day: 1, 
      date: '2026-02-01', 
      is_sunday: true, 
      isBeforeStart: true,
      status: 'NA'
    });
    
    // Add days 2-28 using hardcoded calendar
    FEBRUARY_2026_CALENDAR.forEach(dayInfo => {
      const orderStatus = statusMap[dayInfo.date];
      currentWeek.push({
        ...dayInfo,
        status: orderStatus?.status || dayInfo.status,
        marked_at: orderStatus?.marked_at
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Fill remaining if any
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-black">February 2026</h2>
              <p className="text-sm text-gray-500">Subscription: Feb 2 - Feb 28</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-full transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
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
                
                // Use new data structure from FEBRUARY_2026_CALENDAR
                const day = dayInfo.day;
                const isSunday = dayInfo.is_sunday;
                const dayNumber = dayInfo.day_number;
                const status = dayInfo.status || 'pending';
                const isToday = dayInfo.date === new Date().toISOString().split('T')[0];
                const colors = getStatusColor(status, isSunday);
                
                return (
                  <div
                    key={dayIdx}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all relative
                      ${colors.bg} ${colors.text} border-2 ${colors.border}
                      ${isToday ? 'ring-4 ring-purple-400 ring-offset-2' : ''}`}
                    title={`${dayInfo.date} - ${isSunday ? 'Sunday (No Delivery)' : status === 'delivered' ? 'Delivered' : status === 'out_for_delivery' ? 'Out for Delivery' : 'Pending'}`}
                  >
                    {/* Day Number Badge */}
                    {dayNumber && !isSunday && (
                      <span className="absolute -top-2 -right-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        D{dayNumber}
                      </span>
                    )}
                    
                    <span className="text-base">{day}</span>
                    
                    {isSunday ? (
                      <span className="text-[10px] text-gray-500">OFF</span>
                    ) : status === 'delivered' ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5" />
                    ) : status === 'out_for_delivery' ? (
                      <Truck className="w-4 h-4 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 border-2 border-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-gray-700 font-medium">Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 border-2 border-orange-600 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-gray-700 font-medium">Out for Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white border-2 border-gray-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-700 font-medium">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
              <span className="text-[9px] text-gray-500 font-bold">OFF</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">Sunday</span>
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Subscription Data</h2>
          <p className="text-gray-600 mb-6">
            This order doesn't have subscription tracking data or is not a subscription pack order.
          </p>
          <button
            onClick={() => navigate('/customer/orders')}
            className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 font-semibold"
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
        {/* Today's Delivery Status Card */}
        {todayDelivery && todayDelivery.status !== 'NA' && (
          <div className={`rounded-2xl shadow-lg p-6 ${
            todayDelivery.status === 'delivered' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : todayDelivery.status === 'out_for_delivery'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600'
          } text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Today's Delivery - Day {todayDelivery.day_number}</p>
                <h2 className="text-2xl font-bold">
                  {todayDelivery.status === 'delivered' 
                    ? '✓ Delivered!' 
                    : todayDelivery.status === 'out_for_delivery'
                    ? '🚚 Out for Delivery'
                    : '📦 Scheduled for Today'}
                </h2>
                {todayDelivery.marked_at && (
                  <p className="text-white/70 text-sm mt-1">
                    {todayDelivery.status === 'delivered' ? 'Delivered' : 'Updated'} at {new Date(todayDelivery.marked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="bg-white/20 rounded-full p-4">
                {todayDelivery.status === 'delivered' ? (
                  <CheckCircle2 className="w-10 h-10" />
                ) : todayDelivery.status === 'out_for_delivery' ? (
                  <Truck className="w-10 h-10" />
                ) : (
                  <Package className="w-10 h-10" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Days */}
          <div className="bg-white rounded-2xl shadow-md p-5 border-2 border-black">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Total Days</p>
              <p className="text-3xl font-bold text-black">
                {order.delivery_dates.filter(d => d.status !== 'NA' && !d.is_sunday).length}
              </p>
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-green-500 rounded-2xl shadow-md p-5">
            <div className="text-center">
              <p className="text-xs text-green-100 mb-1 font-semibold uppercase">Delivered</p>
              <p className="text-3xl font-bold text-white">
                {deliveredDays}
              </p>
            </div>
          </div>

          {/* In Progress (Out for Delivery) */}
          <div className="bg-orange-500 rounded-2xl shadow-md p-5">
            <div className="text-center">
              <p className="text-xs text-orange-100 mb-1 font-semibold uppercase">In Transit</p>
              <p className="text-3xl font-bold text-white">
                {order.delivery_dates.filter(d => d.status === 'out_for_delivery').length}
              </p>
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white rounded-2xl shadow-md p-5 border-2 border-black">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1 font-semibold uppercase">Remaining</p>
              <p className="text-3xl font-bold text-black">
                {remainingDays}
              </p>
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
