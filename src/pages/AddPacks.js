import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AddPacks() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    packName: '',
    packDescription: '',
    usesOfPack: '',
    numberOfDays: '',
    category: '',
    cost: '',
    items: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API_URL}/api/admin/packs`, formData);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Pack added successfully!' });
        setFormData({
          packName: '',
          packDescription: '',
          usesOfPack: '',
          numberOfDays: '',
          category: '',
          cost: '',
          items: ''
        });
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 2000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to add pack. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
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
            <h1 className="text-3xl font-bold text-gray-800">Add Packs</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block mb-2 text-gray-700 font-medium">Pack Name *</label>
              <input
                type="text"
                name="packName"
                value={formData.packName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="Enter pack name"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700 font-medium">Pack Description *</label>
              <textarea
                name="packDescription"
                value={formData.packDescription}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="Enter pack description"
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700 font-medium">Uses of Pack *</label>
              <input
                type="text"
                name="usesOfPack"
                value={formData.usesOfPack}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="E.g., Daily breakfast, Weight loss"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">Number of Days *</label>
                <input
                  type="number"
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Enter number of days"
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium">Cost (₹) *</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Enter cost"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700 font-medium">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              >
                <option value="">Select category</option>
                <option value="Health">Health</option>
                <option value="Fitness">Fitness</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Energy Boost">Energy Boost</option>
                <option value="Immunity">Immunity</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-gray-700 font-medium">Items (comma-separated) *</label>
              <textarea
                name="items"
                value={formData.items}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                placeholder="E.g., Apple, Banana, Orange, Grapes"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">

                {loading ? 'Adding Pack...' : 'Add Pack'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPacks;
