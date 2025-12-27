# 🍣 Haru Sora Café – Premium Sushi Experience

A **full-stack web application** for a modern Japanese sushi café, featuring a complete e-commerce system with user authentication, shopping cart, order management, table reservations, and a comprehensive admin dashboard.

![Sushi Café](https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=400&fit=crop)

---

## ✨ Features

### 🛒 Customer Features
- 🍣 Beautiful menu with categorized sushi items (Nigiri, Maki Rolls, Sashimi, Bowls, Sides, Beverages)
- 🛍️ Shopping cart with quantity management
- 📦 Order tracking and history
- 📅 Table reservation system
- 👤 User profile management
- 🔐 Secure authentication (Email/Password + Google OAuth)
- 💳 Checkout system with order confirmation
- 🚫 Smart unavailability popups for out-of-stock items

### 👨‍💼 Admin Dashboard
- 📊 Real-time statistics (orders, revenue, products, users)
- 📦 Complete product management (CRUD operations)
- 👥 User management with role assignment
- 🛒 Order management with status updates
- 📅 Reservation management
- ⭐ Review moderation
- 📈 Analytics and reporting

### 🎨 Design
- 📱 Fully responsive (mobile, tablet, desktop)
- 🌙 Elegant dark theme for admin panel
- 🎭 Smooth animations and transitions
- 🖼️ Professional UI with modern aesthetics

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** – Semantic structure
- **CSS3** – Custom styling, animations, Flexbox/Grid
- **JavaScript (ES6+)** – DOM manipulation, API integration
- **Google OAuth** – Social authentication

### Backend
- **Node.js** – Runtime environment
- **Express.js** – Web framework
- **MongoDB** – NoSQL database
- **Mongoose** – ODM for MongoDB
- **JWT** – Token-based authentication
- **bcryptjs** – Password hashing

---

## 🌐 Live Demo

[View Live Website](https://morsalin012.github.io/sushi-cafe-web/)

### 📄 Page Links

| Page | Description | URL |
|------|-------------|-----|
| 🏠 Home | Landing page | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/home.html) |
| 🍣 Menu | Browse sushi menu | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/menu.html) |
| 🛒 Cart | Shopping cart | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/cart.html) |
| 📦 Orders | Order history | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/orders.html) |
| 👤 Profile | User profile | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/profile.html) |
| 📅 Reserve | Table reservations | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/reserve.html) |
| ❓ Help | Help center | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/help.html) |
| 🔐 Admin | Admin dashboard | [View](https://morsalin012.github.io/sushi-cafe-web/Home%20page/admin.html) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Morsalin012/sushi-cafe-web.git
cd sushi-cafe-web
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**
```bash
copy .env.example .env
# Edit .env with your settings
```

4. **Start MongoDB** (if running locally)
```bash
mongod --dbpath <your-data-path>
```

5. **Seed the database** (optional)
```bash
node seedProducts.js
node createTestUser.js
```

6. **Start the server**
```bash
npm start
# or for development:
npx nodemon server.js
```

7. **Open the website**
- Frontend: Open `Home page/home.html` in browser
- Backend API: `http://localhost:4000`

---

## 👨‍💼 Admin Access

To access the admin dashboard:

1. Navigate to the admin login page
2. Use the admin credentials:
   - **Email:** `admin@harusora.cafe`
   - **Password:** `admin123`

Or create an admin user:
```bash
cd backend
node createTestUser.js
```

---

## 📁 Project Structure

```
sushi-cafe-web/
├── index.html              # Entry point
├── login.html              # User login
├── sign-up.html            # User registration
├── cafe-ecommerce.js       # Main e-commerce logic
├── main.js                 # Core JavaScript
│
├── Home page/              # Main application pages
│   ├── home.html           # Landing page
│   ├── menu.html           # Menu with products
│   ├── cart.html           # Shopping cart
│   ├── orders.html         # Order history
│   ├── profile.html        # User profile
│   ├── reserve.html        # Reservations
│   ├── help.html           # Help center
│   ├── admin.html          # Admin dashboard
│   └── admin-login.html    # Admin login
│
├── CSS files/              # Stylesheets
│   ├── home.css
│   ├── main.css
│   ├── style.css
│   └── admin.css
│
├── Special Page/           # Special promotions
│   ├── Friday.html
│   ├── Friday.css
│   └── Friday.js
│
└── backend/                # Node.js API
    ├── server.js           # Express server
    ├── package.json
    ├── seedProducts.js     # Database seeder
    ├── createTestUser.js   # Admin user creator
    │
    ├── models/             # Mongoose schemas
    │   ├── User.js
    │   ├── Product.js
    │   ├── Cart.js
    │   ├── Order.js
    │   ├── Reservation.js
    │   └── Review.js
    │
    └── routes/             # API endpoints
        ├── auth.js
        ├── products.js
        ├── cart.js
        ├── orders.js
        ├── users.js
        ├── reservations.js
        ├── reviews.js
        └── admin.js
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Register new user |
| POST | `/api/login` | User login |
| POST | `/api/google-login` | Google OAuth login |
| POST | `/api/request-reset` | Request password reset |
| POST | `/api/reset-password` | Reset password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders (admin) |
| GET | `/api/orders/user/:userId` | Get user orders |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Update order status |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/:userId` | Get user cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update` | Update cart item |
| DELETE | `/api/cart/remove` | Remove from cart |

---

## 🚀 Deployment

### Deploy Backend to Render (Free)

1. **Create MongoDB Atlas account** (free): https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>`

2. **Deploy to Render**:
   - Go to https://render.com
   - Click **New** → **Web Service**
   - Connect your GitHub repo
   - Settings:
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Environment Variables:
     - `MONGO_URI` = MongoDB Atlas connection string
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = your-secret-key
     - `FRONTEND_URL` = `https://morsalin012.github.io`

3. **Update Frontend**:
   - Update `cafe-ecommerce.js` with your Render URL

---

## 💰 Currency

All prices are displayed in **৳ (Bangladeshi Taka)**.

---

## 📝 Notes

- Free Render instances sleep after 15 min of inactivity (first request may be slow)
- Password reset links are logged to console if SMTP is not configured
- Google OAuth requires valid Client ID configuration

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 👨‍💻 Author

**Morsalin** - [GitHub](https://github.com/Morsalin012)

---

<p align="center">Made with ❤️ and 🍣</p>

