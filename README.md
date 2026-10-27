# ShopSphere — E-Commerce Website with Razorpay Test Payments

A full-stack learning project built with React + Vite, Node.js + Express, MongoDB/Mongoose and Razorpay Checkout in **test mode**.

## Requirements
- Node.js 20 LTS or newer (Node 22 LTS recommended)
- npm
- MongoDB local service or a MongoDB Atlas database
- Razorpay test account keys (optional until testing payment)

## Windows PowerShell setup
Open PowerShell in the folder that contains the root `package.json`, `backend` and `frontend` folders. If the ZIP extraction creates an extra `ecommerce-razorpay-fullstack` folder, enter that inner folder before running npm commands.

```powershell
# 1. Install root developer tool
npm install

# 2. Install backend and frontend dependencies
npm install --prefix backend
npm install --prefix frontend

# 3. Create your backend environment file
Copy-Item backend/.env.example backend/.env
# Open backend/.env and set MONGODB_URI and JWT_SECRET.

# 4. Start MongoDB locally, or set your Atlas connection string in backend/.env.

# 5. Seed demo products (in a second terminal after .env is configured)
npm run seed --prefix backend

# 6. Run backend and frontend together
npm run dev
```

Frontend: http://localhost:5173  
Backend health: http://localhost:5000/api/health

If you prefer separate terminals:
```powershell
npm run dev --prefix backend
npm run dev --prefix frontend
```

## Environment variables
Copy `backend/.env.example` to `backend/.env`. Never commit `.env` or expose Razorpay secret/JWT secret in frontend code.

- `MONGODB_URI`: local MongoDB URI or Atlas connection string
- `JWT_SECRET`: long random secret (at least 32 characters)
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: Razorpay **test** credentials from Dashboard → Account & Settings → API Keys
- `CLIENT_URL`: `http://localhost:5173`

The frontend receives only the public Razorpay key ID from the backend. The secret stays server-side.

## Demo admin
After seeding, register a user normally, then promote that user to admin in MongoDB for local development only:
```javascript
// In mongosh, switch to the database configured in MONGODB_URI:
db.users.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```
Sign out and sign back in to refresh the JWT role. Do not use this manual promotion pattern in a public production environment; use a controlled admin provisioning process.

## Razorpay test payment
1. Add your Razorpay test Key ID and Key Secret to `backend/.env`.
2. Restart the backend.
3. Add a product to cart and go to checkout.
4. Choose Razorpay and use the test payment details shown in your Razorpay test dashboard/docs. Test mode does not move real money.
5. The backend creates the order and verifies the returned signature before marking it paid.

If Razorpay keys are not configured, the app still supports the demo **Cash on Delivery** order flow. Never mark an online payment as paid based only on the browser callback; signature verification must succeed on the server.

## API overview
- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:id`
- `POST /api/products` (admin), `PUT /api/products/:id` (admin), `DELETE /api/products/:id` (admin)
- `POST /api/orders` (COD), `GET /api/orders/my`, `GET /api/orders/:id`
- `POST /api/payments/create-order`, `POST /api/payments/verify`
- `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`

## Project structure
```text
ecommerce-razorpay-fullstack/
  backend/src/             Express app, routes, models, middleware
  backend/scripts/seed.js  demo catalog seed
  frontend/src/            React pages and cart/auth contexts
  docs/                    project report and API notes
```

## Important production checklist
This is a project starter, not a compliance certification. Before real launch, configure HTTPS, production secrets, secure cookie/token strategy, email verification/password reset, audit logging, monitoring, backups, payment webhooks with signature verification and idempotency, tax/shipping rules, privacy/terms, and a proper admin provisioning process. Test Razorpay only until the merchant account is approved for live mode.

## Optional Kaggle dataset connection
The project brief mentions the [Brazilian E-Commerce Public Dataset by Olist on Kaggle](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce). The app seeds a curated demo catalog of 32 products across Electronics, Fashion, Home, Accessories, Beauty and Footwear by default so it can be run without downloading a large dataset. If your instructor requires the Kaggle data specifically, download it from Kaggle, review its license/terms, and map its product CSV fields into the `Product` schema (`product_name` → `name`, `product_category_name` → `category`, product image URL if available → `image`). Olist's dataset is primarily historical Brazilian marketplace orders, customers, sellers, products and payments; it is not a ready-made modern storefront catalog, so normalize categories and convert prices/currency deliberately rather than treating historical BRL values as INR.
