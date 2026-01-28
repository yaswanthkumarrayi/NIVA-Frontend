import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AddPacks from './pages/AddPacks';
import AddFruits from './pages/AddFruits';
import ManagePartners from './pages/ManagePartners';
import SubscriptionSettings from './pages/SubscriptionSettings';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerDashboard from './pages/CustomerDashboard';
import EditProfile from './pages/EditProfile';
import UpdateProfile from './pages/UpdateProfile';
import SearchPage from './pages/SearchPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PartnerLogin from './pages/PartnerLogin';
import PartnerDashboard from './pages/PartnerDashboard';
import OrdersManagement from './pages/OrdersManagement';
import CustomerOrders from './pages/CustomerOrders';
import SubscriptionTracking from './pages/SubscriptionTracking';
import DebugAuth from './pages/DebugAuth';
import ViewAllPage from './pages/ViewAllPage';
import CategoriesPage from './pages/CategoriesPage';
import FAQsPage from './pages/FAQsPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import AboutUsPage from './pages/AboutUsPage';
import HelpAndSupportPage from './pages/HelpAndSupportPage';

function App() {
  // Apply Metropolis font to numbers globally
  useEffect(() => {
    const applyNumberFont = () => {
      // Find all text nodes containing numbers or currency symbols
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeValue && (node.nodeValue.match(/[0-9₹]/) || node.nodeValue.includes('Rs'))) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(textNode => {
        const parent = textNode.parentElement;
        if (parent && !parent.classList.contains('metropolis-applied')) {
          // Check if the text contains numbers or currency
          if (textNode.nodeValue.match(/[0-9₹]/) || textNode.nodeValue.includes('Rs')) {
            parent.style.fontFamily = "'Metropolis', 'Montserrat', sans-serif";
            parent.style.fontVariantNumeric = 'tabular-nums';
            parent.classList.add('metropolis-applied');
          }
        }
      });
    };

    // Initial application
    applyNumberFont();

    // Re-apply when DOM changes
    const observer = new MutationObserver((mutations) => {
      applyNumberFont();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/customer/dashboard" />} />
          <Route path="/debug" element={<DebugAuth />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-packs" element={<AddPacks />} />
          <Route path="/admin/add-fruits" element={<AddFruits />} />
          <Route path="/admin/manage-partners" element={<ManagePartners />} />
          <Route path="/admin/subscription-settings" element={<SubscriptionSettings />} />
          <Route path="/admin/orders" element={<OrdersManagement userRole="admin" />} />
          
          {/* Customer Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/edit-profile" element={<EditProfile />} />
          <Route path="/customer/update-profile" element={<UpdateProfile />} />
          <Route path="/customer/search" element={<SearchPage />} />
          <Route path="/customer/wishlist" element={<WishlistPage />} />
          <Route path="/customer/cart" element={<CartPage />} />
          <Route path="/customer/orders" element={<CustomerOrders />} />
          <Route path="/customer/subscription-tracking/:orderId" element={<SubscriptionTracking />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/product/:type/:id" element={<ProductDetailPage />} />
          <Route path="/view-all" element={<ViewAllPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/faqs" element={<FAQsPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/help-and-support" element={<HelpAndSupportPage />} />
          
          {/* Partner Routes */}
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="/partner/orders" element={<OrdersManagement userRole="partner" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
