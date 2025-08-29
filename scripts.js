// Global Variables
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginModal = document.getElementById('login-modal');
const closeModal = document.querySelector('.close');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
    loadInitialData();
});

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        fetch(`${API_BASE_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                currentUser = data.user;
                updateUIForAuth(true);
            } else {
                localStorage.removeItem('authToken');
                updateUIForAuth(false);
            }
        })
        .catch(error => {
            console.error('Auth verification failed:', error);
            updateUIForAuth(false);
        });
    } else {
        updateUIForAuth(false);
    }
}

// Update UI based on authentication status
function updateUIForAuth(isAuthenticated) {
    if (isAuthenticated) {
        loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        // Enable admin features if user is admin
        if (currentUser && currentUser.role === 'admin') {
            document.querySelectorAll('.admin-feature').forEach(el => {
                el.style.display = 'block';
            });
        }
    } else {
        loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        // Redirect to login if trying to access protected page
        if (window.location.pathname.includes('admin')) {
            window.location.href = '../index.html';
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Login modal
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('show');
        });
    }

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            loginModal.classList.remove('show');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
        }
    });

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            currentUser = data.user;
            updateUIForAuth(true);
            loginModal.classList.remove('show');
            window.location.reload();
        } else {
            showAlert('Invalid credentials', 'error');
        }
    })
    .catch(error => {
        console.error('Login failed:', error);
        showAlert('Login failed. Please try again.', 'error');
    });
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    updateUIForAuth(false);
    window.location.href = '../index.html';
}

// Load initial data for the current page
function loadInitialData() {
    const path = window.location.pathname;
    
    if (path.includes('dashboard.html')) {
        loadDashboardData();
    } else if (path.includes('users.html')) {
        loadUsersData();
    } else if (path.includes('books')) {
        loadBooksData();
    } else if (path.includes('members')) {
        loadMembersData();
    } else if (path.includes('transactions')) {
        loadTransactionsData();
    }
}

// Dashboard specific functions
function loadDashboardData() {
    fetch(`${API_BASE_URL}/stats`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('total-books').textContent = data.totalBooks;
        document.getElementById('active-members').textContent = data.activeMembers;
        document.getElementById('current-checkouts').textContent = data.currentCheckouts;
        document.getElementById('pending-returns').textContent = data.pendingReturns;
    })
    .catch(error => {
        console.error('Failed to load dashboard data:', error);
    });
}

// Users management functions
function loadUsersData() {
    fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    })
    .then(response => response.json())
    .then(users => {
        const tableBody = document.querySelector('#users-table tbody');
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td><input type="checkbox" class="user-checkbox" data-id="${user._id}"></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${new Date(user.lastLogin).toLocaleString()}</td>
                <td><span class="status ${user.active ? 'active' : 'inactive'}">${user.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn icon edit-user" data-id="${user._id}"><i class="fas fa-edit"></i></button>
                    <button class="btn icon danger delete-user" data-id="${user._id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to action buttons
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                editUser(userId);
            });
        });

        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                deleteUser(userId);
            });
        });
    })
    .catch(error => {
        console.error('Failed to load users:', error);
        showAlert('Failed to load users. Please try again.', 'error');
    });
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('fade-out');
        setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
}

// Helper function for API calls
async function makeApiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    };

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
// Example using fetch API for real logout
function logoutUser() {
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('libraTechToken')}`
        }
    })
    .then(response => {
        if (response.ok) {
            // Clear client-side storage
            localStorage.removeItem('libraTechUser');
            localStorage.removeItem('libraTechToken');
            document.cookie = 'libraTechSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '../index.html';
        }
    })
    .catch(error => {
        console.error('Logout failed:', error);
    });
}
// In your index.html scripts section
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Simulate successful login
    localStorage.setItem('libraTechUser', JSON.stringify({
        name: "Admin User",
        email: "admin@libratech.com",
        role: "admin"
    }));
    
    localStorage.setItem('libraTechToken', 'simulated-auth-token');
    
    // Redirect to dashboard
    window.location.href = "admin/dashboard.html";
});
