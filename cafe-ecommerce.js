/**
 * Haru Sora Café - E-Commerce Frontend
 * Cart, User Profile, Orders, and Wishlist functionality
 */

// ============================================
// Configuration
// ============================================

const API_BASE = 'http://localhost:4000/api';

// Get current user from localStorage
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function getUserId() {
  const user = getCurrentUser();
  return user?.id || user?._id || null;
}

// ============================================
// API Helper
// ============================================

async function api(method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.error('API Error:', e);
    return { ok: false, error: e.message };
  }
}

// ============================================
// Cart System
// ============================================

const Cart = {
  // Get cart from server or localStorage
  async get() {
    const userId = getUserId();
    if (userId) {
      const result = await api('GET', `/cart/${userId}`);
      if (result.ok) {
        return result.data;
      }
    }
    // Fallback to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"totals":{"subtotal":0,"tax":0,"deliveryFee":0,"total":0,"itemCount":0}}');
    cart.items = cart.items || [];
    cart.totals = cart.totals || this._calculateTotals(cart.items);
    return cart;
  },

  // Add item to cart
  async add(productId, quantity = 1, specialInstructions = '') {
    const userId = getUserId();
    if (userId) {
      const result = await api('POST', '/cart/add', {
        userId,
        productId,
        quantity,
        specialInstructions
      });
      if (result.ok) {
        this.updateCartUI(result.data);
        this.showNotification('Added to cart!');
        return result.data;
      }
    }
    // Fallback to localStorage cart
    return this.addLocal(productId, quantity);
  },

  // Local cart fallback
  addLocal(productId, quantity) {
    const cart = this._getLocalCart();
    const existingIndex = cart.items.findIndex(i => i.productId === productId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    cart.totals = this._calculateTotals(cart.items);
    this._saveLocalCart(cart);
    this.updateCartUI(cart);
    this.showNotification('Added to cart!');
    return cart;
  },

  _getLocalCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"totals":{"subtotal":0,"tax":0,"deliveryFee":0,"total":0,"itemCount":0}}');
    cart.items = cart.items || [];
    cart.totals = cart.totals || this._calculateTotals(cart.items);
    return cart;
  },

  _saveLocalCart(cart) {
    localStorage.setItem('cart', JSON.stringify({
      items: cart.items,
      totals: cart.totals
    }));
  },

  _calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      const price = item?.product?.price ?? item.price ?? 0;
      return sum + (price * (item.quantity || 0));
    }, 0);
    const tax = Math.round(subtotal * 0.05);
    const deliveryFee = subtotal > 1000 ? 0 : 50;
    const total = subtotal + tax + deliveryFee;
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return { subtotal, tax, deliveryFee, total, itemCount };
  },

  // Update item quantity
  async update(productId, quantity) {
    const userId = getUserId();
    if (userId) {
      const result = await api('PUT', '/cart/update', {
        userId,
        productId,
        quantity
      });
      if (result.ok) {
        this.updateCartUI(result.data);
        return result.data;
      }
    }
    return this.updateLocal(productId, quantity);
  },

  updateLocal(productId, quantity) {
    const cart = this._getLocalCart();
    const existingIndex = cart.items.findIndex(i => i.productId === productId || i.product === productId);
    if (existingIndex === -1) return null;
    if (quantity <= 0) {
      cart.items.splice(existingIndex, 1);
    } else {
      cart.items[existingIndex].quantity = quantity;
    }
    cart.totals = this._calculateTotals(cart.items);
    this._saveLocalCart(cart);
    this.updateCartUI(cart);
    return cart;
  },

  // Remove item from cart
  async remove(productId) {
    const userId = getUserId();
    if (userId) {
      const result = await api('DELETE', '/cart/remove', {
        userId,
        productId
      });
      if (result.ok) {
        this.updateCartUI(result.data);
        this.showNotification('Removed from cart');
        return result.data;
      }
    }
    return this.removeLocal(productId);
  },

  removeLocal(productId) {
    const cart = this._getLocalCart();
    cart.items = cart.items.filter(
      item => item.productId !== productId && item.product !== productId
    );
    cart.totals = this._calculateTotals(cart.items);
    this._saveLocalCart(cart);
    this.updateCartUI(cart);
    this.showNotification('Removed from cart');
    return cart;
  },

  // Clear cart
  async clear() {
    const userId = getUserId();
    if (userId) {
      const result = await api('DELETE', `/cart/clear/${userId}`);
      if (result.ok) {
        this.updateCartUI(result.data);
        return result.data;
      }
    }
    const emptyCart = { items: [], totals: this._calculateTotals([]) };
    this._saveLocalCart(emptyCart);
    this.updateCartUI(emptyCart);
    this.updateCartBadge(0);
    return emptyCart;
  },

  // Update cart badge in header
  updateCartBadge(count) {
    const badge = document.getElementById('cart-badge') || document.getElementById('cartBadge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  // Update cart UI (sidebar or page)
  updateCartUI(cartData) {
    if (cartData.totals) {
      this.updateCartBadge(cartData.totals.itemCount || 0);
    }
    // Dispatch event for cart page to listen
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartData }));
  },

  // Show notification toast
  showNotification(message) {
    // Create or reuse notification element
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #d4a373, #bc8c5f);
        color: #1a120e;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 2500);
  }
};

// ============================================
// Orders System
// ============================================

const Orders = {
  // Create a new order from cart
  async create(orderData = {}) {
    const userId = getUserId();
    if (!userId) {
      Cart.showNotification('Please login to place an order');
      return null;
    }

    const result = await api('POST', '/orders', {
      userId,
      orderType: orderData.orderType || 'dine-in',
      tableNumber: orderData.tableNumber,
      deliveryAddress: orderData.deliveryAddress,
      paymentMethod: orderData.paymentMethod || 'cash',
      notes: orderData.notes
    });

    if (result.ok) {
      Cart.showNotification(`Order placed! #${result.data.order.orderNumber}`);
      Cart.updateCartBadge(0);
      return result.data;
    } else {
      Cart.showNotification(result.data?.message || 'Failed to place order');
      return null;
    }
  },

  // Get user's orders
  async getHistory(page = 1) {
    const userId = getUserId();
    if (!userId) return { orders: [] };

    const result = await api('GET', `/orders/user/${userId}?page=${page}`);
    return result.ok ? result.data : { orders: [] };
  },

  // Track order by order number
  async track(orderNumber) {
    const result = await api('GET', `/orders/track/${orderNumber}`);
    return result.ok ? result.data : null;
  },

  // Cancel an order
  async cancel(orderId, reason = '') {
    const result = await api('POST', `/orders/${orderId}/cancel`, { reason });
    if (result.ok) {
      Cart.showNotification('Order cancelled');
    }
    return result.ok ? result.data : null;
  }
};

// ============================================
// User Profile System
// ============================================

const UserProfile = {
  // Get user profile
  async get() {
    const userId = getUserId();
    if (!userId) return null;

    const result = await api('GET', `/users/${userId}`);
    return result.ok ? result.data : null;
  },

  // Update profile
  async update(data) {
    const userId = getUserId();
    if (!userId) return null;

    const result = await api('PUT', `/users/${userId}`, data);
    if (result.ok) {
      // Update localStorage
      const user = getCurrentUser();
      if (user) {
        Object.assign(user, result.data);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      Cart.showNotification('Profile updated!');
    }
    return result.ok ? result.data : null;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const userId = getUserId();
    if (!userId) return null;

    const result = await api('PUT', `/users/${userId}/password`, {
      currentPassword,
      newPassword
    });
    if (result.ok) {
      Cart.showNotification('Password changed!');
    }
    return result.ok ? result.data : null;
  },

  // Add address
  async addAddress(address) {
    const userId = getUserId();
    if (!userId) return null;

    const result = await api('POST', `/users/${userId}/addresses`, address);
    return result.ok ? result.data : null;
  },

  // Delete address
  async deleteAddress(addressId) {
    const userId = getUserId();
    if (!userId) return null;

    const result = await api('DELETE', `/users/${userId}/addresses/${addressId}`);
    return result.ok ? result.data : null;
  }
};

// ============================================
// Wishlist System
// ============================================

const Wishlist = {
  // Get wishlist
  async get() {
    const userId = getUserId();
    if (!userId) {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    }

    const result = await api('GET', `/users/${userId}/wishlist`);
    return result.ok ? result.data : [];
  },

  // Add to wishlist
  async add(productId) {
    const userId = getUserId();
    if (userId) {
      const result = await api('POST', `/users/${userId}/wishlist`, { productId });
      if (result.ok) {
        Cart.showNotification('Added to wishlist!');
        return true;
      }
    }
    // Fallback to localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      Cart.showNotification('Added to wishlist!');
    }
    return true;
  },

  // Remove from wishlist
  async remove(productId) {
    const userId = getUserId();
    if (userId) {
      const result = await api('DELETE', `/users/${userId}/wishlist/${productId}`);
      if (result.ok) {
        Cart.showNotification('Removed from wishlist');
        return true;
      }
    }
    // Fallback
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist = wishlist.filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    return true;
  },

  // Check if product is in wishlist
  async isInWishlist(productId) {
    const wishlist = await this.get();
    return wishlist.some(item => (item._id || item) === productId);
  }
};

// ============================================
// Products System
// ============================================

const Products = {
  // Get all products
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const result = await api('GET', `/products${params ? '?' + params : ''}`);
    return result.ok ? result.data : { products: [] };
  },

  // Get single product
  async getById(id) {
    const result = await api('GET', `/products/${id}`);
    return result.ok ? result.data : null;
  },

  // Get categories
  async getCategories() {
    const result = await api('GET', '/products/categories');
    return result.ok ? result.data : [];
  },

  // Get featured products
  async getFeatured() {
    const result = await api('GET', '/products/featured');
    return result.ok ? result.data : [];
  }
};

// ============================================
// Reservations System
// ============================================

const Reservations = {
  // Create reservation
  async create(data) {
    const userId = getUserId();
    const result = await api('POST', '/reservations', {
      ...data,
      userId
    });
    if (result.ok) {
      Cart.showNotification(`Reservation confirmed! Code: ${result.data.reservation.confirmationCode}`);
    }
    return result.ok ? result.data : null;
  },

  // Lookup reservation
  async lookup(code) {
    const result = await api('GET', `/reservations/lookup/${code}`);
    return result.ok ? result.data : null;
  },

  // Get user's reservations
  async getMyReservations() {
    const userId = getUserId();
    if (!userId) return [];

    const result = await api('GET', `/reservations/user/${userId}`);
    return result.ok ? result.data : [];
  },

  // Cancel reservation
  async cancel(reservationId, reason = '') {
    const result = await api('POST', `/reservations/${reservationId}/cancel`, { reason });
    if (result.ok) {
      Cart.showNotification('Reservation cancelled');
    }
    return result.ok ? result.data : null;
  },

  // Get available slots
  async getAvailableSlots(date) {
    const result = await api('GET', `/reservations/available-slots/${date}`);
    return result.ok ? result.data : [];
  }
};

// ============================================
// Initialize on Page Load
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Update cart badge on page load
  const cart = await Cart.get();
  if (cart.totals) {
    Cart.updateCartBadge(cart.totals.itemCount || 0);
  }

  // Setup cart button click handlers
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = btn.dataset.addToCart;
      await Cart.add(productId);
    });
  });

  // Setup wishlist button click handlers
  document.querySelectorAll('[data-add-to-wishlist]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = btn.dataset.addToWishlist;
      await Wishlist.add(productId);
    });
  });
});

// ============================================
// Export for global use
// ============================================

window.HaruSora = {
  Cart,
  Orders,
  UserProfile,
  Wishlist,
  Products,
  Reservations,
  getCurrentUser,
  getUserId
};

console.log('🍣 Haru Sora Café - E-Commerce System Loaded');
