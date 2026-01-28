import React from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminPhone');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Admin</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Subscription Settings Card - NEW */}
          <div 
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-purple-500"
            onClick={() => navigate('/admin/subscription-settings')}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-purple-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Subscription Packs</h2>
              <p className="text-gray-600 text-center">Open/Close subscription packs</p>
            </div>
          </div>

          {/* Add Packs Card */}
          <div 
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/admin/add-packs')}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Packs</h2>
              <p className="text-gray-600 text-center">Create and manage subscription packs</p>
            </div>
          </div>

          {/* Add Fruits Card */}
          <div 
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/admin/add-fruits')}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-purple-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Fruits</h2>
              <p className="text-gray-600 text-center">Add and manage fruit products</p>
            </div>
          </div>

          {/* Access Partners Card */}
          <div 
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate('/admin/manage-partners')}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-blue-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Partners</h2>
              <p className="text-gray-600 text-center">Manage delivery partners</p>
            </div>
          </div>

          {/* View Orders Card */}
          <div 
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-green-500"
            onClick={() => navigate('/admin/orders')}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-green-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">View Orders</h2>
              <p className="text-gray-600 text-center">Track and manage all orders</p>
            </div>
          </div>

          {/* Manage Coupons Card */}
          <div 
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-all cursor-pointer border-2 border-yellow-500"
            onClick={() => navigate('/admin/coupons')}
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-yellow-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Manage Coupons</h2>
              <p className="text-gray-600 text-center">Create and manage discount coupons</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
