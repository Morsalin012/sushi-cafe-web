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

Quick start (backend)

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

Notes

- If you don't configure SMTP, password reset links are printed to the server console.
- The `/api/users` endpoint lists users (no auth) — remove or protect in production.

```

