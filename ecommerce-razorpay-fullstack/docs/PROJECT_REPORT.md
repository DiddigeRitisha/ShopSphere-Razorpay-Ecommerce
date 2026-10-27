# Project Report: ShopSphere E-Commerce Website with Payment Gateway

## Abstract
ShopSphere is a responsive full-stack e-commerce web application that lets customers browse a catalog, register and sign in, maintain a shopping cart, submit delivery details, and place orders using Cash on Delivery or Razorpay test checkout. An administrator can create products and manage order statuses. MongoDB stores users, products and orders; Express exposes REST APIs; React provides the user interface.

## Objectives
1. Build a clean, responsive shopping experience.
2. Design persistent models for users, products and orders.
3. Provide REST APIs for catalog, identity, checkout and administration.
4. Implement authentication and role-based authorization.
5. Integrate a test payment gateway with server-side signature verification.
6. Produce an order confirmation and downloadable invoice.
7. Test error handling, access control, payment flow and deployment readiness.

## Architecture
Browser (React/Vite) → HTTPS/REST API (Node.js/Express) → MongoDB. Razorpay Checkout is opened by the browser using the public Key ID; the backend creates payment orders and verifies the HMAC signature using the secret stored only in the backend environment.

## Database design
- **User**: name, email (unique), password hash, role, timestamps.
- **Product**: name, description, category, price, image URL, stock, rating, featured/active flags, timestamps.
- **Order**: user reference, immutable item snapshots, shipping address, subtotal/shipping/tax/total, payment method/status, order status, Razorpay order/payment IDs, paidAt, timestamps.

Relationships: one user can own many orders; an order contains one or more item snapshots referencing products. Item snapshots preserve the purchase-time name and price if the catalog later changes.

## Security
Passwords are hashed with bcrypt; JWTs are signed with a server-only secret; protected routes check the authenticated user; admin APIs require the admin role; request payloads are validated with Zod; Helmet sets security headers; CORS is limited to the configured client origin; request rate limiting is enabled; online payment signatures are verified with HMAC SHA-256 and constant-time comparison. Client-provided totals are never trusted.

## Payment workflow
1. Authenticated customer submits cart and delivery address.
2. Backend fetches current products and calculates price, tax and shipping.
3. Backend creates a Razorpay order in INR and stores a pending application order.
4. Browser opens Razorpay Checkout using the public key and server-generated order ID.
5. Checkout returns payment ID, order ID and signature.
6. Backend validates ownership and order ID, recomputes the HMAC signature, and only then marks payment paid and places the order.

For production, add verified Razorpay webhooks, idempotency, reconciliation, and transaction-safe stock reservation/decrement. The included implementation is intended for coursework/demo use.

## Ten-point requirements mapping
1. Features: catalog, search, cart, orders and checkout.
2. Database schema: User, Product and Order Mongoose models.
3. APIs: product CRUD, auth, customer orders, payment and admin endpoints.
4. Authentication: register/login JWT and customer/admin roles.
5. Responsive UI: mobile-aware React layout and CSS.
6. Cart/checkout: persisted browser cart, quantities, address form and pricing summary.
7. Payment: Razorpay test order creation and server signature verification.
8. Confirmation/invoice: order success page and downloadable invoice text.
9. Security/testing: password hashing, validation, rate limiting, auth guards and API error handling.
10. Deployment: environment template, production frontend build and deployment checklist in README.

## Test plan
- Register with valid data; reject invalid email and short password.
- Login with correct credentials; reject incorrect credentials.
- Browse and search products; ensure inactive products are hidden.
- Add/update/remove cart items and confirm persisted cart.
- Attempt checkout without authentication; confirm redirect to login.
- Submit valid COD order; verify order appears in order history.
- Attempt admin APIs as customer; expect HTTP 403.
- Create a Razorpay test order and verify valid signature; reject modified signature.
- Confirm backend recalculates total from database prices.
- Test mobile viewport and production build.

## Limitations and future work
Add automated unit/integration tests, email verification and password recovery, order cancellation/refunds, tax/shipping configuration, image upload, inventory transactions, webhook reconciliation, structured audit logs, analytics, and formal accessibility review. The generated invoice is a plain-text demo invoice, not a statutory tax invoice.
