import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const FAQsPage = () => {
  const navigate = useNavigate();

  const faqSections = [
    {
      title: "Ordering Options",
      faqs: [
        {
          question: "What types of orders do you offer?",
          answer: "We offer three types of orders: Custom Fruit Orders (choose individual fruits), Daily Fruit Bowl Orders (one-time order), and Monthly Fruit Bowl Subscription."
        },
        {
          question: "What is a Custom Fruit Order?",
          answer: "Custom Fruit Orders allow you to choose individual fruits based on your preference."
        },
        {
          question: "Is there a minimum requirement for Custom Fruit Orders?",
          answer: "Yes. You must select at least two fruits to place a custom fruit order."
        },
        {
          question: "Are Custom Fruit Orders one-time or recurring?",
          answer: "Custom Fruit Orders are one-time orders and must be placed each time you want delivery."
        }
      ]
    },
    {
      title: "Fruit Bowl Orders",
      faqs: [
        {
          question: "What is a Daily Fruit Bowl order?",
          answer: "A Daily Fruit Bowl order is a single-day order where you receive a freshly prepared fruit bowl on that specific day."
        },
        {
          question: "Can I order a Fruit Bowl every day without a subscription?",
          answer: "Yes. You can place Daily Fruit Bowl orders individually without subscribing."
        }
      ]
    },
    {
      title: "Monthly Fruit Bowl Subscription",
      faqs: [
        {
          question: "What is the Monthly Fruit Bowl Subscription?",
          answer: "The Monthly Fruit Bowl Subscription delivers fruit bowls every day except Sundays and public holidays for the selected month."
        },
        {
          question: "When does the subscription start?",
          answer: "The subscription starts from the selected start date (for example, February 1st) and continues till the end of the month."
        },
        {
          question: "Do I need to place an order every day for the subscription?",
          answer: "No. You place one subscription order, and all deliveries are automatically scheduled."
        },
        {
          question: "Are Sundays included in the subscription?",
          answer: "No. Deliveries are not available on Sundays."
        },
        {
          question: "Are public holidays included in the subscription?",
          answer: "No. Deliveries are not available on public holidays."
        }
      ]
    },
    {
      title: "Delivery Schedule & Calendar",
      faqs: [
        {
          question: "Can I view my delivery schedule?",
          answer: "Yes. Subscription users can view a monthly calendar showing all delivery days. Sundays and public holidays will be marked as no-delivery days."
        },
        {
          question: "How many delivery days will I get in a month?",
          answer: "Delivery days are calculated as: Total days in the month – Sundays – public holidays. You are charged only for delivery days."
        }
      ]
    },
    {
      title: "Delivery Time",
      faqs: [
        {
          question: "How is delivery time decided for Custom Fruit Orders?",
          answer: "Delivery time for Custom Fruit Orders depends on the delivery partner assigned to your order."
        },
        {
          question: "How is delivery time decided for Daily Fruit Bowl orders?",
          answer: "Delivery time for Daily Fruit Bowl orders also depends on partner availability and routing."
        },
        {
          question: "Is delivery time fixed for Monthly Subscriptions?",
          answer: "Yes. Monthly Subscription Fruit Bowls are delivered at a fixed delivery time every day (except Sundays and public holidays)."
        },
        {
          question: "Can I change the delivery time for my subscription?",
          answer: "Currently, the delivery time for monthly subscriptions is fixed and cannot be changed daily."
        }
      ]
    },
    {
      title: "Missed & Postponed Deliveries",
      faqs: [
        {
          question: "What happens if a delivery is missed on a delivery day?",
          answer: "If a delivery is missed for any reason, that day's delivery will be postponed to the next available delivery day."
        },
        {
          question: "Will postponed deliveries be made on Sundays or public holidays?",
          answer: "No. Deliveries are not made on Sundays or public holidays, even for postponed deliveries."
        }
      ]
    },
    {
      title: "Delivery Partners",
      faqs: [
        {
          question: "How are delivery partners assigned?",
          answer: "Delivery partners are assigned automatically based on location, availability, and delivery routes."
        },
        {
          question: "Do delivery partners deliver on Sundays or public holidays?",
          answer: "No. There are no deliveries on Sundays or public holidays."
        }
      ]
    },
    {
      title: "Pricing & Payments",
      faqs: [
        {
          question: "How is the Monthly Subscription price calculated?",
          answer: "The price is calculated based on: Price per day × number of delivery days (excluding Sundays and public holidays)."
        },
        {
          question: "How do payments work for Custom Fruit Orders?",
          answer: "Custom Fruit Orders and Daily Fruit Bowls are paid per order at checkout."
        },
        {
          question: "Is Cash on Delivery available?",
          answer: "Availability of payment methods depends on your location and app settings."
        }
      ]
    },
    {
      title: "Refund & Cancellation Policy",
      faqs: [
        {
          question: "Is a refund available after payment?",
          answer: "No. Refunds are not available once the payment is completed."
        },
        {
          question: "Will I get a refund for Sundays or public holidays?",
          answer: "No. Sundays and public holidays are already excluded from delivery and pricing."
        },
        {
          question: "Is a refund available for missed deliveries?",
          answer: "No. Missed deliveries are postponed, not refunded."
        }
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
          <h1 className="text-2xl font-bold text-white">Frequently Asked Questions</h1>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {faqSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4">
            {/* Section Header */}
            <div className="bg-black rounded-lg px-5 py-3 shadow-lg">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
            </div>

            {/* FAQs in Section - Simple Text Style */}
            <div className="space-y-4 px-2">
              {section.faqs.map((faq, faqIndex) => (
                <div key={faqIndex} className="space-y-2">
                  {/* Question */}
                  <h3 className="font-semibold text-gray-900 text-base">
                    Q: {faq.question}
                  </h3>
                  
                  {/* Answer */}
                  <p className="text-gray-700 text-sm leading-relaxed pl-4">
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default FAQsPage;
