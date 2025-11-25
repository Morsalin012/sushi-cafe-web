// ============================================
// Shared Utilities & Setup
// ============================================

const apiKey = ""; // API Key for Gemini (populated by environment)

// DOM Helpers
const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelectorAll(selector);

// LocalStorage Helpers
// Normalize emails on load and save (trim + lowercase) to avoid mismatch issues
const getLocalUsers = () => {
    const raw = JSON.parse(localStorage.getItem('users') || '[]');
    const normalized = raw.map(u => ({
        ...u,
        email: (u.email || '').toString().trim().toLowerCase()
    }));
    // Persist back if normalization changed anything
    if (JSON.stringify(raw) !== JSON.stringify(normalized)) {
        localStorage.setItem('users', JSON.stringify(normalized));
    }
    return normalized;
};
const setLocalUsers = (users) => {
    const normalized = users.map(u => ({ ...u, email: (u.email || '').toString().trim().toLowerCase() }));
    localStorage.setItem('users', JSON.stringify(normalized));
};

// Global Init on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Icons (Lucide)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Generate Background Graffiti Pattern
    const patternContainer = document.getElementById('bg-pattern');
    if (patternContainer) {
        const icons = ['coffee', 'utensils-crossed', 'fish', 'bean', 'soup', 'cup-soda', 'candy-cane', 'ice-cream'];
        for(let i=0; i<90; i++) {
            const iconName = icons[Math.floor(Math.random() * icons.length)];
            const size = Math.floor(Math.random() * 20) + 18; 
            const rotation = Math.floor(Math.random() * 360);
            
            const el = document.createElement('i');
            el.setAttribute('data-lucide', iconName);
            el.classList.add('mini-icon');
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.transform = `rotate(${rotation}deg)`;
            
            patternContainer.appendChild(el);
        }
        // Re-run icon creation for the new elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // 3. Attach Global Event Listeners (Password Toggle, View Switching)
    setupPasswordToggles();
    setupAuthLogic();
    setupAILogic();
    checkRedirects();
});

// ============================================
// UI Functions
// ============================================

function togglePassword(inputId) {
    const input = $(inputId);
    if(input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function setupPasswordToggles() {
    // Attach to any button with class .toggle-password
    $$('.toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find sibling input
            const inputWrapper = btn.closest('.input-wrapper');
            const input = inputWrapper.querySelector('input');
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    });
}

function showMsg(elementId, text, type) {
    const el = $(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = `message ${type}`;
    el.style.display = 'block';
}

// Function to switch sub-views (Used in login.html mainly)
window.switchView = function(viewId) {
    $$('.view').forEach(el => el.classList.remove('active'));
    $$('.message').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
    
    const target = $(viewId);
    if (target) {
        target.classList.add('active');
    }
}

// ============================================
// Authentication Logic
// ============================================



// Backend API base - set to your deployed backend URL, or leave empty for localStorage-only mode
// For GitHub Pages without a backend, set to empty string ''
// For local development with backend, use 'http://localhost:4000/api'
// For deployed backend, use something like 'https://your-app.onrender.com/api'
const API_BASE = ''; // Empty = localStorage-only mode (works on GitHub Pages)

async function apiPost(path, body) {
    // If no backend configured, return null to trigger localStorage fallback
    if (!API_BASE) {
        return null;
    }
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, body: json };
    } catch (e) {
        // network error - return null to signal fallback
        return null;
    }
}

function setupAuthLogic() {
    
    // LOGIN FORM
    const loginForm = $('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = ($('login-email').value || '').toString().trim().toLowerCase();
            const password = ($('login-password').value || '').toString();

            // Try server login first
            const result = await apiPost('/login', { email, password });
            if (result === null) {
                // Network error -> fallback to localStorage
                const users = getLocalUsers();
                const user = users.find(u => u.email === email && u.password === password);
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('isLoggedIn', 'true');
                    showMsg('login-msg', `Welcome back, ${user.name}!`, 'success');
                    setTimeout(() => window.location.href = encodeURI('Home page/home.html'), 800);
                    return;
                }
                showMsg('login-msg', 'Invalid email or password.', 'error');
                return;
            }

            if (result.ok) {
                const user = result.body.user || { name: 'Guest', email };
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('isLoggedIn', 'true');
                showMsg('login-msg', `Welcome back, ${user.name}!`, 'success');
                setTimeout(() => window.location.href = encodeURI('Home page/home.html'), 800);
            } else if (result.status === 401) {
                showMsg('login-msg', 'Invalid email or password.', 'error');
            } else {
                showMsg('login-msg', result.body?.message || 'Login failed.', 'error');
            }
        });
    }

    // SIGNUP FORM
    const signupForm = $('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = $('signup-name').value || '';
            const email = ($('signup-email').value || '').toString().trim().toLowerCase();
            const password = ($('signup-password').value || '').toString();

            // Try server signup
            const result = await apiPost('/signup', { name, email, password });
            if (result === null) {
                // Network error -> fallback to localStorage
                const users = getLocalUsers();
                if (users.some(u => u.email === email)) {
                    showMsg('signup-msg', 'This email is already registered.', 'error');
                    return;
                }
                users.push({ name, email, password });
                setLocalUsers(users);
                showMsg('signup-msg', 'Account created! Redirecting...', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                e.target.reset();
                return;
            }

            if (result.ok) {
                showMsg('signup-msg', 'Account created! Redirecting...', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 1400);
                e.target.reset();
            } else if (result.status === 409) {
                showMsg('signup-msg', 'This email is already registered.', 'error');
            } else {
                showMsg('signup-msg', result.body?.message || 'Signup failed.', 'error');
            }
        });
    }

    // FORGOT PASSWORD FORM (In login.html)
    const forgotForm = $('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = ($('forgot-email').value || '').toString().trim().toLowerCase();

            // Try server request-reset
            const result = await apiPost('/request-reset', { email });
            if (result === null) {
                // Network error -> fallback to localStorage behavior
                const users = getLocalUsers();
                if (users.some(u => u.email === email)) {
                    $('reset-email-display').textContent = email;
                    $('resetForm').dataset.email = email;
                    switchView('view-reset');
                } else {
                    showMsg('forgot-msg', 'No account found with that email.', 'error');
                }
                return;
            }

            // Server returns generic success even if email not found
            showMsg('forgot-msg', result.body?.message || 'If that email exists, a reset link was sent.', 'success');
        });
    }

    // RESET PASSWORD FORM (In login.html)
    const resetForm = $('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (e.target.dataset.email || '').toString().trim().toLowerCase();
            const newPass = ($('reset-password').value || '').toString();

            // Try server reset endpoint: This flow assumes user received a token via email and is on a dedicated reset page.
            // For the inline reset view (local flow), we still support updating localStorage when server isn't reachable.
            const result = await apiPost('/reset-password', { email, token: e.target.dataset.token || '', newPassword: newPass });
            if (result === null) {
                // Network -> fallback local
                let users = getLocalUsers();
                const idx = users.findIndex(u => u.email === email);
                if (idx !== -1) {
                    users[idx].password = newPass;
                    setLocalUsers(users);
                    showMsg('reset-msg', 'Password updated!', 'success');
                    setTimeout(() => {
                        $('forgotForm').reset();
                        $('resetForm').reset();
                        switchView('view-login');
                    }, 1500);
                } else {
                    showMsg('reset-msg', 'No local account found to update.', 'error');
                }
                return;
            }

            if (result.ok) {
                showMsg('reset-msg', result.body?.message || 'Password updated', 'success');
                setTimeout(() => { $('forgotForm').reset(); $('resetForm').reset(); switchView('view-login'); }, 1500);
            } else {
                showMsg('reset-msg', result.body?.message || 'Reset failed', 'error');
            }
        });
    }

    // LOGOUT BUTTON (In home.html)
    const logoutBtn = $('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
}

function checkRedirects() {
    const path = window.location.pathname;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    // Protect Home Page
    if (path.includes('home.html') && !isLoggedIn) {
        window.location.href = 'login.html';
    }

    // Redirect Logged In Users away from Auth Pages
    if ((path.includes('login.html') || path.includes('sign-up.html')) && isLoggedIn) {
        // Redirect logged-in users to the app home (encode spaces)
        window.location.href = encodeURI('Home page/home.html');
    }
    
    // Update Greeting on Home Page
    if (path.includes('home.html') && isLoggedIn) {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const greetingEl = $('home-greeting');
        if (greetingEl && user.name) {
            greetingEl.textContent = `Hello, ${user.name.split(' ')[0]}.`;
        }
    }
}

// ============================================
// AI Logic (Gemini)
// ============================================

async function callGemini(promptText) {
    if (!apiKey) {
      alert("API Key is missing. This feature works in the preview environment.");
      return "I'm sorry, I cannot connect to the kitchen right now.";
    }

    const systemPrompt = "You are an expert chef and barista at a high-end fusion cafe called 'Sushi & Mocha'. " +
                         "Your goal is to suggest ONE specific sushi roll and ONE specific coffee/espresso drink pairing based on the user's mood or description. " +
                         "Be elegant, poetic, and brief (max 2-3 sentences). Explain why the pairing works with their mood. " +
                         "Format the output with Markdown, bolding the food items.";

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "The chef is pondering...";
    } catch (e) {
      console.error(e);
      return "The connection to the kitchen was lost.";
    }
}

function setupAILogic() {
    const aiForm = $('aiForm');
    if (aiForm) {
        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prompt = $('ai-prompt').value;
            const resultDiv = $('ai-result');
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;

            // UI Loading State
            btn.disabled = true;
            btn.innerHTML = 'Consulting the Chef<span class="loading-dots"></span>';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<span style="color:var(--text-muted)">Thinking...</span>';

            // Call API
            const answer = await callGemini(prompt);

            // Render result
            if (typeof marked !== 'undefined') {
                resultDiv.innerHTML = marked.parse(answer);
            } else {
                resultDiv.textContent = answer;
            }
            
            // Reset UI
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
    }
}