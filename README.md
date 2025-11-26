# Sushi-Cafe-web
# 🌸 Sakura Mocha Rolls – Premium Sushi & Coffee Experience  

A **frontend web project** built with **HTML, CSS, and JavaScript**, showcasing a modern, responsive multipage website for a fictional café that blends Japanese sushi culture with artisanal coffee.  

---

## 🚀 Features  
- 🍣 Elegant landing page with sushi & coffee theme  
- 📱 Fully responsive design (mobile, tablet, desktop)  
- 🎨 Smooth animations & hover effects  
- 📖 Multipage navigation (Home, Menu, About, Contact)  
- ☕ Interactive elements (menu highlights, image sliders, or popups)  

---

## 🛠️ Tech Stack  
- **HTML5** – structure  
- **CSS3** – styling, animations, responsiveness  
- **JavaScript (ES6+)** – interactivity & DOM manipulation  

---


## 🌐 Live Demo
[View Live Website](https://morsalin012.github.io/sushi-cafe-web/)

### 📄 Page Links
| Page | URL |
|------|-----|
| Home | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/home.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/home.html) |
| Menu | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/menu.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/menu.html) |
| Cart | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/cart.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/cart.html) |
| Orders | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/orders.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/orders.html) |
| Profile | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/profile.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/profile.html) |
| Reservations | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/reserve.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/reserve.html) |
| Help Center | [https://morsalin012.github.io/sushi-cafe-web/Home%20page/help.html](https://morsalin012.github.io/sushi-cafe-web/Home%20page/help.html) |

---

## Backend

This repository includes a minimal Node + MongoDB backend used by the Sushi Cafe project. It provides endpoints to:

- create users (`/api/signup`)
- login (`/api/login`)
- request a password reset (`/api/request-reset`) — creates a token and emails/logs a reset link
- reset password (`/api/reset-password`)

### Quick start (local)

1. Open a terminal in `backend`:

```pwsh
cd backend
npm install
```

2. Copy `.env.example` to `.env` and edit values (optional SMTP credentials):

```pwsh
copy .env.example .env
# edit .env with your editor
```

3. Start the server:

```pwsh
npm start
# or for development with auto-reload (nodemon):
npx nodemon server.js
```

Default server: `http://localhost:4000`

### 🚀 Deploy Backend to Render (Free)

To make the live GitHub Pages site work with real data:

1. **Create a MongoDB Atlas account** (free): https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string: `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/sushi-cafe`

2. **Deploy to Render**:
   - Go to https://render.com and sign up (free)
   - Click **New** → **Web Service**
   - Connect your GitHub repo
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `npm install`
   - Set **Start Command**: `npm start`
   - Add **Environment Variables**:
     - `MONGO_URI` = your MongoDB Atlas connection string
     - `NODE_ENV` = `production`
     - `FRONTEND_URL` = `https://morsalin012.github.io`
   - Click **Create Web Service**

3. **Update Frontend**:
   - After deployment, Render gives you a URL like `https://sushi-cafe-api.onrender.com`
   - Update `cafe-ecommerce.js` line 12 with your actual Render URL

4. **Seed Products** (optional):
   - Open Render shell or run locally with production MONGO_URI:
   ```bash
   node seedProducts.js
   ```

Notes

- If you don't configure SMTP, password reset links are printed to the server console.
- The `/api/users` endpoint lists users (no auth) — remove or protect in production.
- Free Render instances sleep after 15 min of inactivity (first request may be slow).

