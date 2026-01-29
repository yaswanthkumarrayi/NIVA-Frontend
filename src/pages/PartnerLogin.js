import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hardcoded partner credentials
const PARTNER_CREDENTIALS = {
  '8008514369': 'vishnuann@a143'
};

function PartnerLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate credentials
    if (PARTNER_CREDENTIALS[phone] && PARTNER_CREDENTIALS[phone] === password) {
      localStorage.setItem('userRole', 'partner');
      localStorage.setItem('userPhone', phone);
      navigate('/niva-dlv-p3k9');
    } else {
      setError('Invalid credentials. Please check your phone number and password.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-5">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">Delivery Partner Login</h2>
        <p className="text-center text-gray-600 mb-8">Access your delivery dashboard</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="[0-9]{10}"
              maxLength="10"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-base transition-colors"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-base transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-600">
          <a href="/customer/login" className="text-purple-600 font-semibold hover:underline">Customer Login</a>
          {' | '}
          <a href="/niva-mgmt-access" className="text-purple-600 font-semibold hover:underline">Admin Login</a>
        </div>
      </div>
    </div>
  );
}

export default PartnerLogin;
