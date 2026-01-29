import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// SOLO PACKS - Coupons will automatically apply to these
const SOLO_PACKS = [
  { id: '1', name: 'Vit C Pack - Solo', price: 2399 },
  { id: '3', name: 'Standard Pack - Solo', price: 1999 }
];

function ManageCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    couponCode: '',
    discountType: 'percentage',
    discountValue: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/coupons`);
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setMessage({ type: 'error', text: 'Failed to load coupons' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.couponCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid discount value' });
      return;
    }

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      // Automatically apply to Solo packs only
      const response = await axios.post(`${API_URL}/api/admin/coupons`, {
        couponCode: formData.couponCode,
        applicableCategory: 'pack',
        applicableProducts: SOLO_PACKS.map(p => p.id),
        applicableProductNames: SOLO_PACKS.map(p => p.name),
        discountType: formData.discountType,
        discountValue: formData.discountValue
      });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Coupon created! Applies to: Vit C Pack - Solo & Standard Pack - Solo' });
        setFormData({
          couponCode: '',
          discountType: 'percentage',
          discountValue: ''
        });
        setShowForm(false);
        fetchCoupons();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create coupon' 
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleCouponStatus = async (coupon) => {
    try {
      await axios.put(`${API_URL}/api/admin/coupons/${coupon.id}`, {
        isActive: !coupon.is_active
      });
      fetchCoupons();
      setMessage({ 
        type: 'success', 
        text: `Coupon ${coupon.is_active ? 'disabled' : 'enabled'} successfully` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update coupon status' });
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/coupons/${couponId}`);
      fetchCoupons();
      setMessage({ type: 'success', text: 'Coupon deleted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete coupon' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/niva-ctrl-x7k2')}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Manage Coupons</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Create Coupon Form - SIMPLIFIED */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Coupon</h2>
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">ℹ️ Coupons automatically apply to:</p>
              <ul className="text-blue-700 mt-2 space-y-1">
                <li>✓ Vit C Pack - Solo (₹2,399)</li>
                <li>✓ Standard Pack - Solo (₹1,999)</li>
              </ul>
              <p className="text-blue-600 text-sm mt-2">Duo packs, Bowls, and Fruits are NOT eligible for coupons.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Coupon Code */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Coupon Code *</label>
                  <input
                    type="text"
                    name="couponCode"
                    value={formData.couponCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black uppercase"
                    placeholder="E.g., SOLO50"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Discount Type *</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">
                    Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    required
                    min="1"
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    placeholder={formData.discountType === 'percentage' ? 'E.g., 10' : 'E.g., 100'}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Coupon for Solo Packs'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons List */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Coupons ({coupons.length})</h2>
          
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-gray-500 text-lg">No coupons created yet</p>
              <p className="text-gray-400">Click "Create Coupon" to add your first coupon</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Applies To</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                          {coupon.coupon_code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-800">Solo Packs Only</p>
                          <p className="text-gray-500 text-xs">Vit C Solo, Standard Solo</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%` 
                          : `₹${coupon.discount_value}`}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          coupon.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleCouponStatus(coupon)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              coupon.is_active
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {coupon.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon.id)}
                            className="px-3 py-1 rounded text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageCoupons;
