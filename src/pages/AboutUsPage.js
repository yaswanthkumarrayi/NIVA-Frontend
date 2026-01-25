import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Linkedin, Github } from 'lucide-react';

const AboutUsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-black sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">About Us</h1>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="px-2">
          <p className="text-gray-700 text-base leading-relaxed">
            Welcome to our platform – a simple and convenient solution for ordering fresh fruits, daily fruit bowls, and monthly fruit bowl subscriptions.
          </p>
          <p className="text-gray-700 text-base leading-relaxed mt-3">
            Our goal is to encourage healthy eating by making fresh fruits easily accessible while supporting local fruit vendors and delivery partners through a technology-driven platform.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        
        {/* What We Offer */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">What We Offer</h2>
          </div>
          <div className="px-2">
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Custom Fruit Orders (minimum two fruits per order)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Daily Fruit Bowl (One-Time Orders)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Monthly Fruit Bowl Subscription with fixed delivery timing</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Clear delivery schedules excluding Sundays and public holidays</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Our Role as a Mediator */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Our Role as a Mediator</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm font-semibold mb-3">We operate strictly as a technology platform and mediator.</p>
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We connect users with independent fruit vendors and delivery partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>We do not own or operate farms, kitchens, warehouses, or delivery vehicles</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Fruit sourcing, preparation, and delivery are managed by third-party partners</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our responsibility is limited to facilitating orders, schedules, and communication through the platform</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Business Status Disclosure */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Business Status Disclosure</h2>
          </div>
          <div className="px-2">
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>This business is currently <span className="font-semibold">unregistered</span></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Services are offered on a best-effort basis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>By using this platform, users acknowledge and accept this operational status</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Founder & Developer */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Founder & Developer</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              This platform is founded and developed by:
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">YASWANTH KUMAR RAYI</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              The application is independently built to support small-scale operations and local delivery ecosystems.
            </p>
            
            {/* Social Links */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200">
              <a
                href="https://www.linkedin.com/in/yaswanth-kumar-rayi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Linkedin className="w-4 h-4" />
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a
                href="https://github.com/yaswanthkumarrayi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-all shadow-sm"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a
                href="mailto:yaswanthkumarrayi@gmail.com"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Our Vision */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Our Vision</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm mb-3">We aim to:</p>
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Promote daily healthy eating habits</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Enable convenient fruit access</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Support local vendors and delivery partners</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2 mt-0.5">✓</span>
                <span>Maintain transparency in operations and policies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Support & Contact */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Support & Contact</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm leading-relaxed">
              For any questions, issues, or feedback, users can contact us through the Help & Support section available within the app or website.
            </p>
          </div>
        </div>

        {/* Our Commitment to Transparency */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
            <h2 className="text-lg font-bold text-white">Our Commitment to Transparency</h2>
          </div>
          <div className="px-2">
            <p className="text-gray-700 text-sm mb-3">We believe in clearly communicating:</p>
            <ul className="space-y-2 text-gray-700 text-sm leading-relaxed">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our role as a mediator</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Delivery limitations (no Sundays or public holidays)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Fixed policies including no-refund policy</span>
              </li>
            </ul>
            <p className="text-gray-700 text-sm leading-relaxed mt-4 font-medium">
              Thank you for trusting our platform and being part of our journey.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default AboutUsPage;
