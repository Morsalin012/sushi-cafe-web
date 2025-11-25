// ===============================
// Tiny DOM helpers
// ===============================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Initialize users array in localStorage if it doesn't exist
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify([]));
}

// ===============================
// Single DOMContentLoaded event listener
// ===============================
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in and redirect from login/signup pages
  if (window.location.pathname.includes('login.html') || 
      window.location.pathname.includes('sign-up.html')) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      window.location.href = 'home.html';
    }
  }

  // ===============================
  // Password visibility toggles with SVG icons
  // ===============================
  $$('[data-toggle="visibility"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
        if (!input) return;

      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      
      // Toggle SVG icon for open/closed eye
      const svg = btn.querySelector('svg');
            if (svg) {
        if (showing) {
          svg.innerHTML = '<ellipse cx="12" cy="12" rx="8" ry="5"/><circle cx="12" cy="12" r="2.5"/>';
          svg.setAttribute('stroke', '#888');
        } else {
          svg.innerHTML = '<ellipse cx="12" cy="12" rx="8" ry="5"/><path d="M4 4l16 16"/>';
          svg.setAttribute('stroke', '#e05d5d');
        }
            }
        });
    });

  // ===============================
  // Login Form Handler
  // ===============================
  const loginForm = $('#loginForm');
    if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
      
      const email = $('#login-email').value;
      const password = $('#login-password').value;
      const statusDiv = $('.status');
      
      // Check if user exists in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
        // Successful login
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', user.name);
        
        statusDiv.textContent = 'Login successful! Redirecting...';
        statusDiv.style.color = '#4caf50';
        
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 1000);
            } else {
        // Failed login
        statusDiv.textContent = 'Invalid email or password. Please try again.';
        statusDiv.style.color = '#e05d5d';
            }
        });
    }

  // ===============================
  // Sign-up Form Handler
  // ===============================
  const signupForm = $('#signupForm');
    if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
      
      const name = $('#name').value;
      const email = $('#signup-email').value;
      const password = $('#signup-password').value;
      const confirmPassword = $('#signup-confirm-password').value;
      const mismatchHint = $('#password-mismatch-hint');
      const statusDiv = $('.status');

      // Check if passwords match
            if (password !== confirmPassword) {
        mismatchHint.style.display = 'block';
        return false;
            } else {
        mismatchHint.style.display = 'none';
            }

      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = users.some(user => user.email === email);
      
      if (userExists) {
        statusDiv.textContent = 'An account with this email already exists.';
        statusDiv.style.color = '#e05d5d';
        return false;
            }

      if (name && email && password.length >= 8) {
        // Store user data
        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message and redirect to login page
        statusDiv.textContent = 'Account created successfully! Please log in.';
        statusDiv.style.color = '#4caf50';
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }
        });
    }

  // ===============================
  // Logout Functionality
  // ===============================
  const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
      
      // Clear all user data
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      
      // Redirect to login page
      window.location.href = 'login.html';
        });
    }
});

// ===============================
// Authentication Check Function
// (Call this at the top of protected pages)
// ===============================
function checkAuthentication() {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ===============================
// Get Current User Info
// ===============================
function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// ===============================
// Check if User is Logged In
// ===============================
function isLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}