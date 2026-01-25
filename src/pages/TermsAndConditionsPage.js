import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditionsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Services Offered",
      content: [
        "We provide the following services:",
        "- Custom Fruit Orders (minimum 2 fruits per order)",
        "- Daily Fruit Bowl (One-Time Orders)",
        "- Monthly Fruit Bowl Subscription",
        "All products are subject to availability."
      ]
    },
    {
      title: "Ordering & Eligibility",
      content: [
        "- Users must provide accurate delivery details while placing an order.",
        "- A minimum of two fruits is mandatory for Custom Fruit Orders.",
        "- Orders once placed cannot be modified after the cut-off time.",
        "- We reserve the right to refuse or cancel orders in case of misuse or incorrect information."
      ]
    },
    {
      title: "Monthly Subscription Terms",
      content: [
        "- Monthly subscriptions are valid for the selected calendar month.",
        "- Deliveries are scheduled every day except Sundays and public holidays.",
        "- Users place one subscription order, and daily deliveries are auto-scheduled.",
        "- The delivery time for subscription orders is fixed and cannot be changed daily."
      ]
    },
    {
      title: "Delivery Policy",
      subsections: [
        {
          subtitle: "4.1 Delivery Availability",
          content: [
            "- Deliveries are not available on Sundays.",
            "- Deliveries are not available on public holidays.",
            "- Delivery schedules may vary due to unforeseen circumstances."
          ]
        },
        {
          subtitle: "4.2 Delivery Time",
          content: [
            "- Delivery time for Custom Fruit Orders and Daily Fruit Bowls depends on the assigned delivery partner.",
            "- Delivery time for Monthly Subscriptions is fixed for the entire subscription period."
          ]
        },
        {
          subtitle: "4.3 Missed Deliveries",
          content: [
            "- If a delivery is missed for any reason, the delivery will be postponed to the next available delivery day.",
            "- Postponed deliveries will not be delivered on Sundays or public holidays.",
            "- No refunds are provided for missed deliveries."
          ]
        }
      ]
    },
    {
      title: "Pricing & Payments",
      content: [
        "- Prices are displayed clearly before checkout.",
        "- Subscription pricing is calculated based on: Number of delivery days (excluding Sundays and public holidays).",
        "- Full payment must be made in advance for all orders.",
        "- We reserve the right to change prices at any time without prior notice."
      ]
    },
    {
      title: "Refund & Cancellation Policy",
      content: [
        "- Refunds are not available once payment is completed.",
        "- No refunds will be issued for: Missed deliveries, Skipped days, Sundays or public holidays.",
        "- Orders cannot be canceled after confirmation."
      ]
    },
    {
      title: "Product Quality & Availability",
      content: [
        "- Fruits are sourced fresh and prepared hygienically.",
        "- Fruit variety may vary depending on seasonal availability.",
        "- Images shown in the app are for representation purposes only."
      ]
    },
    {
      title: "User Responsibilities",
      content: [
        "- Users must ensure availability at the delivery location.",
        "- Incorrect address or unavailability may result in missed delivery.",
        "- Users agree not to misuse the platform for fraudulent activities."
      ]
    },
    {
      title: "Delivery Partner Assignment",
      content: [
        "- Delivery partners are assigned automatically based on availability and location.",
        "- We do not guarantee the same delivery partner for every order."
      ]
    },
    {
      title: "Limitation of Liability",
      content: [
        "- We are not responsible for delays caused by weather, traffic, strikes, or unforeseen circumstances.",
        "- Our liability is limited to the value of the order placed."
      ]
    },
    {
      title: "Account Suspension or Termination",
      content: [
        "We reserve the right to suspend or terminate user accounts if:",
        "- False information is provided",
        "- Terms are violated",
        "- Fraudulent activity is detected"
      ]
    },
    {
      title: "Changes to Terms & Conditions",
      content: [
        "- We may update these Terms & Conditions at any time.",
        "- Continued use of our services implies acceptance of updated terms."
      ]
    },
    {
      title: "Governing Law",
      content: [
        "These Terms & Conditions shall be governed by and interpreted in accordance with the laws applicable in your operating region."
      ]
    },
    {
      title: "Contact & Support",
      content: [
        "For any questions or concerns regarding these Terms & Conditions, please contact us through the Help & Support section in the website."
      ]
    }
  ];

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
          <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
        </div>
      </div>

      {/* Last Updated */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="px-2">
          <p className="text-sm text-gray-700">
            Last updated: <span className="font-semibold text-gray-900">January 25, 2026</span>
          </p>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            By accessing or using our application, website, or services, you agree to be bound by the following Terms & Conditions. Please read them carefully before placing an order.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            {/* Section Header */}
            <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
              <h2 className="text-lg font-bold text-white">
                {index + 1}. {section.title}
              </h2>
            </div>

            {/* Section Content */}
            <div className="px-2">
              {section.content && (
                <div className="space-y-2">
                  {section.content.map((text, textIndex) => (
                    <p key={textIndex} className="text-gray-700 text-sm leading-relaxed">
                      {text}
                    </p>
                  ))}
                </div>
              )}

              {/* Subsections */}
              {section.subsections && (
                <div className="space-y-4 mt-3">
                  {section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="pl-4">
                      <h3 className="font-bold text-gray-900 text-base mb-2">
                        {subsection.subtitle}
                      </h3>
                      <div className="space-y-1">
                        {subsection.content.map((text, textIndex) => (
                          <p key={textIndex} className="text-gray-700 text-sm leading-relaxed">
                            {text}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default TermsAndConditionsPage;
