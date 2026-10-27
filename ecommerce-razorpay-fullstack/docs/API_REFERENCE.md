# API reference
Base URL: `http://localhost:5000/api`

All JSON requests use `Content-Type: application/json`. Protected routes use `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/auth/register` | Public | Create customer account |
| POST | `/auth/login` | Public | Sign in and receive JWT |
| GET | `/auth/me` | Signed in | Current user |
| GET | `/products?q=&category=&page=&limit=` | Public | Browse/search catalog |
| GET | `/products/:id` | Public | Product details |
| POST | `/products` | Admin | Create product |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Archive product |
| POST | `/orders` | Signed in | Place COD order |
| GET | `/orders/my` | Signed in | Current user's order history |
| GET | `/orders/:id` | Owner/Admin | Order detail |
| GET | `/payments/config` | Signed in | Payment availability/public key |
| POST | `/payments/create-order` | Signed in | Recalculate cart and create Razorpay order |
| POST | `/payments/verify` | Signed in | Verify checkout signature |
| GET | `/admin/orders` | Admin | List recent orders |
| PATCH | `/admin/orders/:id/status` | Admin | Change fulfillment status |

## Example register request
```json
{"name":"Demo Customer","email":"customer@example.com","password":"strong-demo-password"}
```

## Example create COD order request
```json
{"items":[{"productId":"MONGODB_PRODUCT_ID","quantity":1}],"shippingAddress":{"name":"Demo Customer","phone":"9999999999","line1":"12 Example Road","city":"Hyderabad","state":"Telangana","postalCode":"500001","country":"India"}}
```
