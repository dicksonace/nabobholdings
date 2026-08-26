<?php

return [

    /*
    | Buyer My Orders history and "Request refund" window (months from order created_at).
    | After this period orders drop off My Orders and refund requests are blocked.
    */
    'buyer_order_months' => (int) env('BUYER_ORDER_MONTHS', 2),

    /*
    | After the seller marks an item delivered (awaiting buyer confirmation),
    | Nabob Holdings auto-confirms receipt if the buyer does not act within this many days.
    */
    'auto_confirm_delivery_days' => (int) env('AUTO_CONFIRM_DELIVERY_DAYS', 21),

    'contact' => [
        'email' => env('MARKETPLACE_SUPPORT_EMAIL', 'support@nabobholdings.com'),
        'phone' => env('MARKETPLACE_SUPPORT_PHONE', '+94 70 321 7775'),
        'whatsapp' => env('MARKETPLACE_SUPPORT_WHATSAPP', '+94 70 321 7775'),
        'address' => env('MARKETPLACE_SUPPORT_ADDRESS', 'Sri Lanka'),
        'hours' => 'Monday – Saturday, 8:00 AM – 6:00 PM IST',
    ],

    'faq' => [
        [
            'category' => 'Buying on Nabob Holdings',
            'items' => [
                [
                    'question' => 'How do I place an order?',
                    'answer' => 'Browse products, add items to your cart, then proceed to checkout. Enter your delivery details, choose a payment method, and complete payment via Paystack. You will receive an order confirmation by email and SMS.',
                ],
                [
                    'question' => 'Do I need an account to shop?',
                    'answer' => 'You can browse products without an account, but you must register and log in to add items to your cart, checkout, track orders, save a wishlist, and leave reviews.',
                ],
                [
                    'question' => 'What payment methods are accepted?',
                    'answer' => 'We accept Mobile Money (MTN, Telecel, AirtelTigo), bank cards, and bank transfers through Paystack. All payments are processed securely at checkout.',
                ],
                [
                    'question' => 'Can I cancel my order?',
                    'answer' => 'You may cancel before your order is sent for delivery. Go to My Orders, open the order, and request cancellation. Once out for delivery, cancellation is no longer available — you may open a refund request if there is a problem.',
                ],
            ],
        ],
        [
            'category' => 'Delivery',
            'items' => [
                [
                    'question' => 'Who handles delivery?',
                    'answer' => 'Nabob Holdings arranges delivery for your order. Tracking details are added when your package is out for delivery.',
                ],
                [
                    'question' => 'How long does delivery take?',
                    'answer' => 'Delivery times vary by location. Items marked "Local Delivery" typically arrive within 1–5 business days locally and 3–10 days nationwide.',
                ],
                [
                    'question' => 'What does "Free Delivery" mean?',
                    'answer' => 'Products with a Free Delivery badge are delivered at no extra charge. You pay only the product price at checkout with no additional delivery fee for that item.',
                ],
                [
                    'question' => 'How do I track my order?',
                    'answer' => 'When your order is out for delivery, courier details and a tracking number appear under My Orders → order details. You will also receive SMS and email updates when your order status changes.',
                ],
            ],
        ],
        [
            'category' => 'Payments & Wallet',
            'items' => [
                [
                    'question' => 'When is my payment released?',
                    'answer' => 'For secured checkout, your payment is held until you confirm delivery (or until auto-confirmation after the waiting period). Then the sale settles in the store wallet.',
                ],
                [
                    'question' => 'What is my buyer wallet for?',
                    'answer' => 'Your wallet holds refunds and top-ups. You can use wallet balance at checkout or withdraw to Mobile Money after admin approval.',
                ],
            ],
        ],
        [
            'category' => 'Returns, Disputes & Buyer Protection',
            'items' => [
                [
                    'question' => 'What if I receive a wrong or damaged item?',
                    'answer' => 'Open a refund request from your order details page within 2 months of the order date. Describe the issue and our team will investigate. Orders older than 2 months no longer appear under My Orders.',
                ],
                [
                    'question' => 'How does buyer protection work?',
                    'answer' => 'Secured payments are held until delivery is confirmed. If something goes wrong with the order, you can open a refund request for a refund or replacement.',
                ],
                [
                    'question' => 'Can I return a product?',
                    'answer' => 'Contact us from your order page first. If unresolved, open a refund request and Nabob Holdings support will help resolve it.',
                ],
            ],
        ],
        [
            'category' => 'Account & Security',
            'items' => [
                [
                    'question' => 'How do I reset my password?',
                    'answer' => 'Click Login, then "Forgot password?" Enter your registered email and follow the reset link sent to you. If you registered with a mobile number only, contact support for help.',
                ],
                [
                    'question' => 'Is my payment information safe?',
                    'answer' => 'Yes. Nabob Holdings does not store your card or Mobile Money PIN. All payments are handled by Paystack, a PCI-DSS compliant payment processor.',
                ],
                [
                    'question' => 'How do I contact support?',
                    'answer' => 'Visit our Contact page to send a message, email support@nabobholdings.com, or WhatsApp us during business hours. Include your order number if your question is about a specific purchase.',
                ],
            ],
        ],
    ],

];
