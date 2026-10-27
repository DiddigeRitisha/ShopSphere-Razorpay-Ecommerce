# 🛍️ ShopSphere — Full-Stack E-Commerce Website

A full-stack e-commerce web application built using **React, Vite, Node.js, Express.js, MongoDB, and Razorpay**. ShopSphere provides product browsing, shopping cart management, order processing, and secure payment verification using Razorpay's test environment.

> **Payment Mode:** Razorpay Test Mode — no real money is charged.

---

## 📌 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Requirements](#-requirements)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Demo Administrator Setup](#-demo-administrator-setup)
- [Razorpay Test Payments](#-razorpay-test-payments)
- [API Documentation](#-api-documentation)
- [Optional Kaggle Dataset](#-optional-kaggle-dataset)
- [Production Considerations](#-production-considerations)
- [Author](#-author)

---

## ✨ Features

- **Product Catalog:** Browse products across multiple categories.
- **Product Details:** View individual product information.
- **Authentication:** User registration, login, and account access.
- **Shopping Cart:** Add products and manage cart items.
- **Order Management:** Place orders and view order history.
- **Payment Integration:** Razorpay Checkout integration in test mode.
- **Cash on Delivery:** Alternative demo checkout flow.
- **Administrator Dashboard:** Manage products and order statuses.
- **REST API:** Backend endpoints for authentication, products, orders, and payments.
- **Database Integration:** MongoDB with Mongoose.
- **Responsive Interface:** React-based frontend powered by Vite.

*Features depend on the functionality implemented in the current application.*

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Payment Gateway | Razorpay Checkout |
| API Architecture | REST API |
| Version Control | Git, GitHub |
| Development Environment | Visual Studio Code |

---

## 📋 Requirements

Install the following software before running the application:

- **Node.js:** Version 20 or newer; Node.js 22 LTS is recommended.
- **npm:** Included with Node.js.
- **MongoDB:** Local MongoDB installation or MongoDB Atlas account.
- **Git:** For version control.
- **Razorpay Test Account:** Optional until online payment testing is required.

Verify your Node.js and npm installations:

```powershell
node --version
npm --version
git --version
```

---

## 📁 Project Structure

The project should have the following structure:

```text
ecommerce-razorpay-fullstack/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── scripts/
│   │   └── seed.js
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│   │
│   ├── index.html
│   └── package.json
│
├── docs/
│   ├── API_REFERENCE.md
│   └── PROJECT_REPORT.md
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

**Note:** This is the intended project layout. Keep only files and folders that actually exist in your project.

---

## 🚀 Installation and Setup

### Step 1: Open the Project

Open the project root in Visual Studio Code.

In PowerShell, navigate to the folder containing the root `package.json`, `backend`, and `frontend` directories.

If your extracted project contains an extra nested `ecommerce-razorpay-fullstack` folder, enter that inner folder before running the following commands.

### Step 2: Install Dependencies

Install the root dependencies:

```powershell
npm install
```

Install backend dependencies:

```powershell
npm install --prefix backend
```

Install frontend dependencies:

```powershell
npm install --prefix frontend
```

### Step 3: Configure Environment Variables

Create the backend environment file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and configure your MongoDB connection and JWT secret.

### Step 4: Start MongoDB

Ensure that your local MongoDB service is running, or configure a valid MongoDB Atlas connection string in `backend/.env`.

### Step 5: Seed Demo Products

After configuring the environment variables, run:

```powershell
npm run seed --prefix backend
```

This command runs the backend's product-seeding script, provided it is configured in the backend package scripts.

### Step 6: Start the Application

If your root `package.json` defines a development script that starts both applications, run:

```powershell
npm run dev
```

Otherwise, start the frontend and backend separately using the instructions below.

---

## ▶️ Running the Application

### Option A: Separate Terminals

**Terminal 1 — Backend**

```powershell
npm run dev --prefix backend
```

**Terminal 2 — Frontend**

```powershell
npm run dev --prefix frontend
```

### Option B: Root Development Command

If the root `package.json` includes a script that starts both services:

```powershell
npm run dev
```

### Local Development URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend Health Check | http://localhost:5000/api/health |

Open the frontend URL in your browser after both services have started successfully.

---

## 🔐 Environment Configuration

The backend reads configuration values from `backend/.env`.

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `NODE_ENV` | Application environment |
| `CLIENT_URL` | Frontend origin |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for JWT signing |
| `JWT_EXPIRES_IN` | JWT expiration period |
| `RAZORPAY_KEY_ID` | Razorpay test Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test Key Secret |

Example local configuration:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/shopsphere
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace_with_razorpay_test_secret
```

Replace the example values with your own development credentials.

### Security Guidelines

- Never commit `backend/.env` to GitHub.
- Keep `.env.example` free of real credentials.
- Never expose `RAZORPAY_KEY_SECRET` in frontend code.
- Use a strong, randomly generated JWT secret.
- Use test credentials during development.

The frontend should receive only the public Razorpay Key ID through the appropriate backend integration.

---

## 👨‍💻 Demo Administrator Setup

For local development, you can promote a registered user to administrator in MongoDB.

Open `mongosh` and switch to the database configured in `MONGODB_URI`.

Then run:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

Replace the email with the address of your registered account.

Sign out and sign in again to refresh the authentication token if the application stores the role in its JWT.

> **Security warning:** This is a local development procedure. A production application should use controlled administrator provisioning and appropriate access controls.

---

## 💳 Razorpay Test Payments

ShopSphere integrates Razorpay Checkout for testing the online payment workflow.

### Configuration

1. Create or access your Razorpay account.
2. Switch to test mode.
3. Obtain your test API credentials.
4. Add the test Key ID and Key Secret to `backend/.env`.
5. Restart the backend.

### Test the Payment Workflow

1. Start the frontend and backend.
2. Register or sign in to the application.
3. Browse products and add an item to your cart.
4. Navigate to checkout.
5. Select Razorpay as the payment method.
6. Use the test payment details provided by Razorpay.
7. Verify that the backend validates the payment signature before marking the order as paid.

If Razorpay credentials are not configured, the application may still support the demo Cash on Delivery workflow.

**Payment security:** Never mark an online payment as successful based only on a browser callback. Payment verification must be performed on the server.

Razorpay test mode is intended for testing and does not charge real money.

---

## 🔌 API Documentation

The backend exposes REST API endpoints for the following operations.

### Health Check

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the current user's information |

### Products

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | Retrieve products |
| GET | `/api/products/:id` | Retrieve a product |
| POST | `/api/products` | Create a product — admin |
| PUT | `/api/products/:id` | Update a product — admin |
| DELETE | `/api/products/:id` | Delete a product — admin |

### Orders

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/orders` | Place a Cash on Delivery order |
| GET | `/api/orders/my` | Retrieve the current user's orders |
| GET | `/api/orders/:id` | Retrieve an order |

### Payments

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/payments/create-order` | Create a payment order |
| POST | `/api/payments/verify` | Verify payment details |

### Administration

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/orders` | Retrieve orders for administration |
| PATCH | `/api/admin/orders/:id/status` | Update an order's status |

For request bodies, response formats, authentication requirements, and implementation details, refer to `docs/API_REFERENCE.md`.

*The table reflects the endpoints listed in this project's documentation. Confirm the actual route implementations before relying on these endpoints.*

---

## 📊 Optional Kaggle Dataset

The project brief mentions the Brazilian E-Commerce Public Dataset by Olist.

Dataset: [Brazilian E-Commerce Public Dataset by Olist — Kaggle](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)

The application uses a curated demo catalog so that users can run the project without downloading the complete dataset.

If your instructor requires the Kaggle dataset:

1. Download the dataset from Kaggle.
2. Review the dataset license and usage terms.
3. Inspect the product CSV files and available fields.
4. Map suitable fields to the application's product schema.
5. Normalize product categories and currency values as needed.

For example:

| Dataset Field | Application Field |
|---|---|
| `product_name` | `name` |
| `product_category_name` | `category` |
| Available product image URL | `image` |

The Olist dataset primarily contains historical Brazilian marketplace data. It is not a ready-made modern storefront catalog, so additional transformation may be necessary.

---

## 🛡️ Production Considerations

This project is intended for learning and demonstration. Before deploying it for real customers, consider implementing and reviewing:

- HTTPS and secure production configuration
- Proper secret management
- Secure authentication and token handling
- Email verification and password recovery
- Server-side authorization
- Payment webhooks and signature verification
- Payment idempotency and duplicate-request protection
- Logging, monitoring, and database backups
- Tax, shipping, privacy, and terms requirements
- Controlled administrator provisioning

Keep Razorpay in test mode until your merchant account and production integration are appropriately configured.

---

## 👩‍💻 Author

**Diddige Ritisha**

GitHub: [DiddigeRitisha](https://github.com/DiddigeRitisha)

Project Repository: [ShopSphere — E-Commerce Website](https://github.com/DiddigeRitisha/ShopSphere-Razorpay-Ecommerce)

---

## 📄 License

Add a `LICENSE` file if you intend to distribute this project under a specific open-source license.
