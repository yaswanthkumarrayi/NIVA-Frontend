import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SubscriptionSettings() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [month, setMonth] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/subscription-settings`);
      if (response.data.success) {
        setIsOpen(response.data.data.isOpen);
        setNextAvailableDate(response.data.data.nextAvailableDate);
      }
      // Fetch subscription config
      const configResponse = await axios.get(`${API_URL}/api/subscription-config`);
      if (configResponse.data.success) {
        setMonth(configResponse.data.data.month || '');
        setTotalDays(configResponse.data.data.totalDays || '');
      }
    } catch (error) {
      console.error('Error fetching subscription settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await axios.post(`${API_URL}/api/subscription-settings`, {
        isOpen: newStatus
      });

      if (response.data.success) {
        setIsOpen(response.data.data.isOpen);
        setNextAvailableDate(response.data.data.nextAvailableDate);
        alert(newStatus ? 'Subscription packs are now OPEN for purchase!' : 'Subscription packs are now CLOSED. They will be available again on ' + formatDate(response.data.data.nextAvailableDate));
      }
    } catch (error) {
      console.error('Error updating subscription settings:', error);
      alert('Failed to update subscription settings. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSaveConfig = async () => {
    if (!month || !totalDays) {
      alert('Please enter both month and total days');
      return;
    }

    try {
      setSavingConfig(true);
      const response = await axios.post(`${API_URL}/api/subscription-config`, {
        month,
        totalDays: parseInt(totalDays)
      });

      if (response.data.success) {
        alert('Subscription configuration saved successfully!');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleMarkDayDelivered = async () => {
    if (!window.confirm('Are you sure you want to mark today as delivered for all active subscriptions? This action cannot be undone.')) {
      return;
    }

    try {
      setMarkingDelivered(true);
      const response = await axios.post(`${API_URL}/api/subscriptions/mark-day-delivered`);

      if (response.data.success) {
        alert(`Successfully marked deliveries for ${response.data.updatedCount} subscription(s)!`);
      }
    } catch (error) {
      console.error('Error marking day delivered:', error);
      alert('Failed to mark deliveries. Please try again.');
    } finally {
      setMarkingDelivered(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/niva-ctrl-x7k2')}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Subscription Pack Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-500">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Delivery Management Card - NEW */}
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.01]"
              onClick={() => navigate('/niva-sub-dlv-m7k3')}
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold mb-2">📦 Subscription Delivery Management</h2>
                  <p className="text-purple-100">View all subscriptions, manage daily deliveries, track customer orders</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Subscription Configuration Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Subscription Configuration</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subscription Month
                    </label>
                    <input
                      type="text"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      placeholder="e.g., January 2026"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Days in Month
                    </label>
                    <input
                      type="number"
                      value={totalDays}
                      onChange={(e) => setTotalDays(e.target.value)}
                      placeholder="e.g., 30"
                      min="1"
                      max="31"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400"
                >
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>

            {/* Daily Delivery Management Card */}
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🚚 Daily Delivery Management</h2>
              <p className="text-gray-600 mb-6">
                Click the button below to mark today's delivery as completed for all active subscription packs. 
                This will reduce the remaining days for all customers by 1.
              </p>
              <button
                onClick={handleMarkDayDelivered}
                disabled={markingDelivered}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-400"
              >
                {markingDelivered ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark All Packs Delivered for Today
                  </>
                )}
              </button>
            </div>

            {/* Current Status Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Subscription Packs Status</h2>
                  <p className="text-gray-600">Control whether customers can purchase subscription packs</p>
                </div>
                <div className={`px-6 py-3 rounded-full font-bold text-lg ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isOpen ? '✓ OPEN' : '✕ CLOSED'}
                </div>
              </div>

              {!isOpen && nextAvailableDate && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Next Available:</strong> {formatDate(nextAvailableDate)}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Customers will see this message when trying to purchase subscription packs
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleToggle(true)}
                  disabled={isOpen || updating}
                  className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all ${
                    isOpen 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {updating && !isOpen ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Opening...
                    </span>
                  ) : (
                    <>
                      <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Open Subscription Packs
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggle(false)}
                  disabled={!isOpen || updating}
                  className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all ${
                    !isOpen 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {updating && isOpen ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Closing...
                    </span>
                  ) : (
                    <>
                      <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Close Subscription Packs
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Information Card */}
            <div className="bg-blue-50 rounded-lg shadow-md p-8 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-900 mb-4">📋 How It Works</h3>
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Open:</strong> Customers can see and purchase all subscription packs (fruit bowls)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Close:</strong> Subscription packs section is hidden and customers see an availability message</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Automatic Date:</strong> When closed, the next available date is automatically set to the 1st of next month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Fresh Fruits:</strong> Individual fruits remain available regardless of subscription pack status</span>
                </li>
              </ul>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">👁️ Customer View Preview</h3>
              {isOpen ? (
                <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
                  <p className="text-green-800 font-semibold mb-2">✓ Subscription Packs Section Visible</p>
                  <p className="text-green-700 text-sm">Customers can browse and purchase all subscription packs (fruit bowls)</p>
                </div>
              ) : (
                <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
                  <p className="text-orange-800 font-semibold mb-2">⏳ Availability Message Shown</p>
                  <p className="text-orange-700 text-sm mb-4">Customers will see:</p>
                  <div className="bg-white border-2 border-orange-300 rounded-lg p-4">
                    <p className="text-gray-800 font-medium">🍎 Fruit Bowls (Subscription Packs)</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Subscription packs will be available again on <strong>{formatDate(nextAvailableDate)}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubscriptionSettings;
