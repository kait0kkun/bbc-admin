// API Base URL
const API_URL = '/api';

// Authentication Token
let authToken = localStorage.getItem('authToken');

// State
let members = [];
let events = [];
let registrations = [];
let donations = [];

// Chart instances
let registrationChart = null;
let donationChart = null;

// Chart year selection
let selectedRegistrationYear = new Date().getFullYear();
let selectedDonationYear = new Date().getFullYear();

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// ============================================
// AUTHENTICATION
// ============================================

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const loginPage = document.getElementById('loginPage');
    const dashboardApp = document.getElementById('dashboardApp');
    
    if (token) {
        // User is logged in
        loginPage.style.display = 'none';
        dashboardApp.style.display = 'flex';
        loadData();
    } else {
        // User not logged in
        loginPage.style.display = 'flex';
        dashboardApp.style.display = 'none';
    }
}

function clearLoginErrors() {
    const loginError = document.getElementById('loginError');
    const emailError = document.getElementById('error-loginEmail');
    const passwordError = document.getElementById('error-loginPassword');
    
    if (loginError) {
        loginError.style.display = 'none';
        loginError.querySelector('span').textContent = '';
    }
    if (emailError) {
        emailError.style.display = 'none';
        emailError.querySelector('span').textContent = '';
    }
    if (passwordError) {
        passwordError.style.display = 'none';
        passwordError.querySelector('span').textContent = '';
    }
}

function showLoginError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.querySelector('span').textContent = message;
        loginError.style.display = 'flex';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    clearLoginErrors();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validate
    let isValid = true;
    if (!email) {
        const error = document.getElementById('error-loginEmail');
        error.querySelector('span').textContent = 'Email is required';
        error.style.display = 'flex';
        isValid = false;
    }
    if (!password) {
        const error = document.getElementById('error-loginPassword');
        error.querySelector('span').textContent = 'Password is required';
        error.style.display = 'flex';
        isValid = false;
    }
    
    if (!isValid) return;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            authToken = data.token;
            
            // Clear form
            document.getElementById('loginForm').reset();
            
            // Show dashboard
            checkAuthStatus();
        } else {
            const errorData = await response.json();
            showLoginError(errorData.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Connection error. Please try again.');
    }
}

function showLogoutConfirm() {
    document.getElementById('deleteConfirmMessage').textContent = 'Are you sure you want to sign out? You will need to log in again.';
    document.getElementById('confirmModalTitle').innerHTML = '<i class="fas fa-sign-out-alt" style="margin-right: 12px; color: #e67e22;"></i>Sign Out';
    document.getElementById('confirmBtn').innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
    document.getElementById('deleteConfirmModal').classList.add('active');
    pendingDeleteAction = 'logout';
}

function performLogout() {
    localStorage.removeItem('authToken');
    authToken = null;
    
    // Clear sensitive data
    members = [];
    events = [];
    registrations = [];
    donations = [];
    
    // Show success notification
    showNotification('You have been signed out successfully', 'success');
    
    // Redirect to login after brief delay
    setTimeout(() => {
        checkAuthStatus();
    }, 1000);
}

function handleLogout() {
    showLogoutConfirm();
}

// Load all data
async function loadData() {
    await Promise.all([
        loadMembers(),
        loadEvents(),
        loadRegistrations(),
        loadDonations(),
        loadUsers()
    ]);
    updateDashboard();
    initCharts();  // Reinitialize charts with real data after loading
}

// ============================================
// HELPER FUNCTION
// ============================================

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// ============================================
// SECTION SWITCHING
// ============================================

function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update nav menu
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('.nav-link').classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        events: 'Events Management',
        members: 'Members Directory',
        registrations: 'Event Registrations',
        donations: 'Donations',
        birthdays: 'Birthday Calendar',
        users: 'User Management'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || sectionName;
    
    // Special rendering for birthdays
    if (sectionName === 'birthdays') {
        renderBirthdays();
    }
}

// ============================================
// CHART DATA CALCULATION
// ============================================

function calculateRegistrationData(year) {
    // Calculate registrations by month for the selected year
    const monthData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Count registrations for each month in the selected year
    registrations.forEach(reg => {
        const regDate = new Date(reg.created_at);
        if (regDate.getFullYear() === year) {
            monthData[regDate.getMonth()]++;
        }
    });
    
    return { labels, data: monthData };
}

function calculateDonationData(year) {
    // Calculate donations by month for the selected year
    const monthData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sum donations for each month in the selected year
    donations.forEach(donation => {
        const donDate = new Date(donation.created_at);
        if (donDate.getFullYear() === year) {
            monthData[donDate.getMonth()] += parseFloat(donation.amount) || 0;
        }
    });
    
    return { labels, data: monthData };
}

// ============================================
// CHART INITIALIZATION
// ============================================

function initCharts() {
    // Destroy existing charts to prevent memory leaks
    if (registrationChart) {
        registrationChart.destroy();
        registrationChart = null;
    }
    if (donationChart) {
        donationChart.destroy();
        donationChart = null;
    }
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#2c3e50',
                    font: { size: 12 }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#7f8c8d' },
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
                ticks: { color: '#7f8c8d' },
                grid: { color: 'rgba(0,0,0,0.05)' }
            }
        }
    };

    // Get dynamic data
    const regData = calculateRegistrationData(selectedRegistrationYear);
    const donData = calculateDonationData(selectedDonationYear);

    // Registration Chart
    const regCtx = document.getElementById('registrationChart');
    if (regCtx) {
        registrationChart = new Chart(regCtx, {
            type: 'line',
            data: {
                labels: regData.labels,
                datasets: [{
                    label: `Registrations - ${selectedRegistrationYear}`,
                    data: regData.data,
                    borderColor: '#e67e22',
                    backgroundColor: 'rgba(230, 126, 34, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: chartOptions
        });
    }

    // Donation Chart
    const donCtx = document.getElementById('donationChart');
    if (donCtx) {
        donationChart = new Chart(donCtx, {
            type: 'bar',
            data: {
                labels: donData.labels,
                datasets: [{
                    label: `Monthly Donations (₱) - ${selectedDonationYear}`,
                    data: donData.data,
                    backgroundColor: '#27ae60',
                    borderRadius: 8
                }]
            },
            options: chartOptions
        });
    }
}

// ============================================
// YEAR SELECTION
// ============================================

function populateYearSelectors() {
    // Get all years from registrations and donations
    const years = new Set();
    
    registrations.forEach(reg => {
        const year = new Date(reg.created_at).getFullYear();
        years.add(year);
    });
    
    donations.forEach(don => {
        const year = new Date(don.created_at).getFullYear();
        years.add(year);
    });
    
    // Add current year if no data exists
    if (years.size === 0) {
        years.add(new Date().getFullYear());
    }
    
    // Sort years in descending order
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    // Populate registration year selector
    const regYearSelect = document.getElementById('registrationYearSelect');
    if (regYearSelect) {
        regYearSelect.innerHTML = sortedYears
            .map(year => `<option value="${year}" ${year === selectedRegistrationYear ? 'selected' : ''}>${year}</option>`)
            .join('');
    }
    
    // Populate donation year selector
    const donYearSelect = document.getElementById('donationYearSelect');
    if (donYearSelect) {
        donYearSelect.innerHTML = sortedYears
            .map(year => `<option value="${year}" ${year === selectedDonationYear ? 'selected' : ''}>${year}</option>`)
            .join('');
    }
}

function handleYearChange() {
    const regYearSelect = document.getElementById('registrationYearSelect');
    const donYearSelect = document.getElementById('donationYearSelect');
    
    if (regYearSelect) {
        selectedRegistrationYear = parseInt(regYearSelect.value);
    }
    if (donYearSelect) {
        selectedDonationYear = parseInt(donYearSelect.value);
    }
    
    // Reinitialize charts with new year selection
    initCharts();
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
    updateStats();
    populateYearSelectors();
    renderUpcomingEvents();
    renderUpcomingBirthdays();
}

function updateStats() {
    document.getElementById('totalMembers').textContent = members.length;
    
    // Calculate upcoming events
    const today = new Date();
    const upcomingCount = events.filter(e => new Date(e.date) >= today).length;
    document.getElementById('upcomingEvents').textContent = upcomingCount;
    
    document.getElementById('totalRegistrations').textContent = registrations.length;
    
    // Calculate monthly donations
    const today2 = new Date();
    const monthStart = new Date(today2.getFullYear(), today2.getMonth(), 1);
    const monthlyTotal = donations
        .filter(d => new Date(d.created_at) >= monthStart)
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    document.getElementById('monthlyDonations').textContent = '₱' + monthlyTotal.toLocaleString();
    
    // Calculate donation change percentage
    calculateDonationChange();
}

function calculateDonationChange() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // This month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthTotal = donations
        .filter(d => {
            const donDate = new Date(d.created_at);
            return donDate >= monthStart && donDate.getMonth() === currentMonth && donDate.getFullYear() === currentYear;
        })
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    // Last month
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    const lastMonthTotal = donations
        .filter(d => {
            const donDate = new Date(d.created_at);
            return donDate >= lastMonthStart && donDate <= lastMonthEnd;
        })
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    // Calculate percentage change
    let percentageChange = 0;
    let isIncrease = true;
    
    if (lastMonthTotal === 0) {
        // If last month was 0, any amount this month is a 100% increase
        percentageChange = thisMonthTotal > 0 ? 100 : 0;
        isIncrease = thisMonthTotal >= 0;
    } else {
        percentageChange = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
        isIncrease = thisMonthTotal >= lastMonthTotal;
    }
    
    // Update UI
    const indicator = document.getElementById('donationChangeIndicator');
    const text = document.getElementById('donationChangeText');
    
    if (indicator && text) {
        indicator.className = 'stat-change ' + (isIncrease ? 'up' : 'down');
        const icon = indicator.querySelector('i');
        if (icon) {
            icon.className = isIncrease ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        }
        text.textContent = Math.abs(percentageChange) + '% ' + (isIncrease ? 'increase' : 'decrease');
    }
}

function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    const today = new Date();
    const upcoming = events
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <h3>No Upcoming Events</h3>
                <p>Create an event to get started</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%;">
            <tbody>
                ${upcoming.map(event => `
                    <tr>
                        <td style="padding: 12px;">
                            <div style="font-weight: 600; color: #2c3e50;">${event.name}</div>
                            <div style="font-size: 0.85em; color: #7f8c8d;">
                                <i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderUpcomingBirthdays() {
    const container = document.getElementById('upcomingBirthdaysList');
    
    // Filter members with birthdays in current week
    const today = new Date();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingBirthdays = members
        .filter(m => {
            if (!m.birthday) return false;
            const birthday = new Date(m.birthday);
            const thisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
            return thisYear >= today && thisYear <= weekEnd;
        })
        .sort((a, b) => {
            const aDate = new Date(a.birthday);
            const bDate = new Date(b.birthday);
            return (aDate.getMonth() - bDate.getMonth()) || (aDate.getDate() - bDate.getDate());
        });
    
    if (upcomingBirthdays.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-birthday-cake"></i>
                <h3>No Birthdays This Week</h3>
                <p>Check back later for celebrations</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%;">
            <tbody>
                ${upcomingBirthdays.map(member => {
                    const birthday = new Date(member.birthday);
                    return `
                        <tr>
                            <td style="padding: 12px;">
                                <div style="font-weight: 600; color: #2c3e50;">
                                    <i class="fas fa-birthday-cake" style="color: #e67e22; margin-right: 8px;"></i>
                                    ${member.name}
                                </div>
                                <div style="font-size: 0.85em; color: #7f8c8d;">
                                    ${birthday.toLocaleDateString()}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================

let pendingDeleteAction = null;
let pendingDeleteId = null;

function showDeleteConfirm(message, type, id) {
    document.getElementById('deleteConfirmMessage').textContent = message;
    
    // Update modal title based on action type
    let titleText = 'Confirm Delete';
    let btnText = '<i class="fas fa-trash"></i> Delete';
    
    if (type === 'logout') {
        titleText = 'Sign Out';
        btnText = '<i class="fas fa-sign-out-alt"></i> Sign Out';
    }
    
    document.getElementById('confirmModalTitle').innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right: 12px; color: #e74c3c;"></i>${titleText}`;
    document.getElementById('confirmBtn').innerHTML = btnText;
    
    pendingDeleteAction = type;
    pendingDeleteId = id;
    document.getElementById('deleteConfirmModal').classList.add('active');
}

function closeDeleteConfirmModal() {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    pendingDeleteAction = null;
    pendingDeleteId = null;
}

async function confirmDelete() {
    // Handle logout confirmation
    if (pendingDeleteAction === 'logout') {
        closeDeleteConfirmModal();
        performLogout();
        return;
    }
    
    if (!pendingDeleteAction || !pendingDeleteId) return;
    
    try {
        let response;
        let errorMessage = '';
        
        switch(pendingDeleteAction) {
            case 'member':
                response = await fetch(`${API_URL}/members/${pendingDeleteId}`, { 
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (response.ok) {
                    await loadMembers();
                    updateDashboard();
                    showNotification('Member deleted successfully', 'success');
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Failed to delete member', 'error');
                }
                break;
            case 'event':
                response = await fetch(`${API_URL}/events/${pendingDeleteId}`, { 
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (response.ok) {
                    await loadEvents();
                    updateDashboard();
                    showNotification('Event deleted successfully', 'success');
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Failed to delete event', 'error');
                }
                break;
            case 'registration':
                response = await fetch(`${API_URL}/registrations/${pendingDeleteId}`, { 
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (response.ok) {
                    await loadRegistrations();
                    showNotification('Registration deleted successfully', 'success');
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Failed to delete registration', 'error');
                }
                break;
            case 'donation':
                response = await fetch(`${API_URL}/donations/${pendingDeleteId}`, { 
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (response.ok) {
                    await loadDonations();
                    updateDonationStats();
                    showNotification('Donation deleted successfully', 'success');
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Failed to delete donation', 'error');
                }
                break;
            case 'user':
                response = await fetch(`${API_URL}/users/${pendingDeleteId}`, { 
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (response.ok) {
                    await loadUsers();
                    showNotification('User deleted successfully', 'success');
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Failed to delete user', 'error');
                }
                break;
        }
        closeDeleteConfirmModal();
    } catch (error) {
        console.error('Error deleting:', error);
        showNotification('Error: ' + error.message, 'error');
        closeDeleteConfirmModal();
    }
}

// ============================================
// FORM VALIDATION
// ============================================

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.form-error').forEach(error => {
            error.style.display = 'none';
            error.querySelector('span').textContent = '';
        });
        form.querySelectorAll('input.error, select.error, textarea.error').forEach(input => {
            input.classList.remove('error');
        });
    }
}

function showFieldError(fieldName, formId, message) {
    const errorElement = document.getElementById(`error-${fieldName}`);
    const form = document.getElementById(formId);
    
    if (errorElement && form) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.classList.add('error');
        }
        errorElement.querySelector('span').textContent = message;
        errorElement.style.display = 'flex';
    }
}

function validateMember(data) {
    clearFormErrors('memberForm');
    let isValid = true;
    
    if (!data.name || data.name.trim() === '') {
        showFieldError('name', 'memberForm', 'Full Name is required');
        isValid = false;
    }
    
    return isValid;
}

function validateEvent(data) {
    clearFormErrors('eventForm');
    let isValid = true;
    
    if (!data.name || data.name.trim() === '') {
        showFieldError('eventName', 'eventForm', 'Event Name is required');
        isValid = false;
    }
    
    if (!data.date || data.date.trim() === '') {
        showFieldError('eventDate', 'eventForm', 'Date is required');
        isValid = false;
    }
    
    return isValid;
}

function validateRegistration(data) {
    clearFormErrors('registrationForm');
    let isValid = true;
    
    if (!data.eventId || data.eventId.trim() === '') {
        showFieldError('eventId', 'registrationForm', 'Please select an event');
        isValid = false;
    }
    
    if (!data.memberId || data.memberId.trim() === '') {
        showFieldError('memberId', 'registrationForm', 'Please select a member');
        isValid = false;
    }
    
    return isValid;
}

function validateDonation(data) {
    clearFormErrors('donationForm');
    let isValid = true;
    
    if (!data.donation_date || data.donation_date.trim() === '') {
        showFieldError('donationDate', 'donationForm', 'Date is required');
        isValid = false;
    }
    
    if (!data.amount || parseFloat(data.amount) <= 0) {
        showFieldError('amount', 'donationForm', 'Amount must be greater than 0');
        isValid = false;
    }
    
    return isValid;
}

async function validateAndSaveMember(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    if (!validateMember(data)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/members`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeMemberModal();
            await loadMembers();
            updateDashboard();
        } else {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            alert('Error saving member: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving member:', error);
        alert('Failed to save member: ' + error.message);
    }
}

async function validateAndSaveEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    if (!validateEvent(data)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeEventModal();
            await loadEvents();
            updateDashboard();
        } else {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            alert('Error saving event: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event: ' + error.message);
    }
}

async function validateAndSaveRegistration(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    if (!validateRegistration(data)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/registrations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                memberId: data.memberId,
                eventId: data.eventId
            })
        });

        if (response.status === 409) {
            showFieldError('eventId', 'registrationForm', 'Member already registered for this event');
            return;
        }

        if (response.ok) {
            closeRegistrationModal();
            await loadRegistrations();
            updateDashboard();
        } else {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            alert('Error saving registration: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving registration:', error);
        alert('Failed to save registration: ' + error.message);
    }
}

async function validateAndSaveDonation(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    if (!validateDonation(data)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/donations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeDonationModal();
            await loadDonations();
            updateDashboard();
        } else {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            alert('Error saving donation: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving donation:', error);
        alert('Failed to save donation: ' + error.message);
    }
}

// ============================================
// MEMBERS
// ============================================

async function loadMembers() {
    try {
        const response = await fetch(`${API_URL}/members`, {
            headers: getHeaders()
        });
        members = await response.json();
        renderMembers();
        updateMemberSelect();
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

function renderMembers() {
    const container = document.getElementById('membersList');
    
    if (members.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Members Yet</h3>
                        <p>Add your first member to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = members.map(member => `
        <tr>
            <td>${member.name}</td>
            <td>${member.email || '-'}</td>
            <td>${member.phone || '-'}</td>
            <td>${member.ministry || '-'}</td>
            <td><span class="status-badge status-approved">Active</span></td>
            <td style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-sm" onclick="viewMemberDetails('${member.id}')" title="View Member" style="padding: 6px 10px; width: auto; background: #3498db;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.id}')" title="Delete Member" style="padding: 6px 10px; width: auto;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openMemberModal() {
    document.getElementById('memberModal').classList.add('active');
}

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('active');
    document.getElementById('memberForm').reset();
}

async function saveMember(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/members`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeMemberModal();
            await loadMembers();
            updateDashboard();
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Failed to save member');
        }
    } catch (error) {
        console.error('Error saving member:', error);
        alert('Failed to save member');
    }
}

async function deleteMember(id) {
    showDeleteConfirm('Are you sure you want to delete this member? This action cannot be undone.', 'member', id);
}

function viewMemberDetails(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    // Populate modal with member details
    document.getElementById('viewMemberName').textContent = member.name;
    document.getElementById('viewMemberEmail').textContent = member.email || 'Not provided';
    document.getElementById('viewMemberPhone').textContent = member.phone || 'Not provided';
    document.getElementById('viewMemberGender').textContent = member.gender || 'Not provided';
    document.getElementById('viewMemberMinistry').textContent = member.ministry || 'Not assigned';
    
    const birthday = member.birthday ? new Date(member.birthday).toLocaleDateString() : 'Not provided';
    document.getElementById('viewMemberBirthday').textContent = birthday;
    
    const joinDate = member.join_date ? new Date(member.join_date).toLocaleDateString() : 'Not provided';
    document.getElementById('viewMemberJoinDate').textContent = joinDate;
    
    document.getElementById('viewMemberStatus').textContent = member.status || 'Active';
    document.getElementById('viewMemberNotes').textContent = member.notes || 'No notes';

    // Calculate age if birthday is available
    if (member.birthday) {
        const today = new Date();
        const birthDate = new Date(member.birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        document.getElementById('viewMemberAge').textContent = age;
    } else {
        document.getElementById('viewMemberAge').textContent = '-';
    }

    document.getElementById('memberDetailsModal').classList.add('active');
}

function closeMemberDetailsModal() {
    document.getElementById('memberDetailsModal').classList.remove('active');
}

// ============================================
// EVENTS
// ============================================

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`, {
            headers: getHeaders()
        });
        events = await response.json();
        renderEvents();
        updateEventSelect();
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function renderEvents() {
    const container = document.getElementById('eventsList');
    
    if (events.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        <h3>No Events Yet</h3>
                        <p>Create your first event to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const today = new Date();
        const eventDate = new Date(event.date);
        let status = 'upcoming';
        let statusLabel = 'Upcoming';
        
        if (eventDate < today) {
            status = 'past';
            statusLabel = 'Past';
        } else if (eventDate.toDateString() === today.toDateString()) {
            status = 'ongoing';
            statusLabel = 'Today';
        }
        
        return `
            <tr>
                <td><strong>${event.name}</strong><br><small>${event.description || ''}</small></td>
                <td>${event.date || '-'}</td>
                <td>${event.time || '-'}</td>
                <td>${event.location || '-'}</td>
                <td><span class="status-badge status-${status}">${statusLabel}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openEventModal() {
    document.getElementById('eventModal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    document.getElementById('eventForm').reset();
}

async function saveEvent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeEventModal();
            await loadEvents();
            updateDashboard();
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event');
    }
}

async function deleteEvent(id) {
    showDeleteConfirm('Are you sure you want to delete this event? This action cannot be undone.', 'event', id);
}

// ============================================
// REGISTRATIONS
// ============================================

async function loadRegistrations() {
    try {
        const response = await fetch(`${API_URL}/registrations`, {
            headers: getHeaders()
        });
        registrations = await response.json();
        renderRegistrations();
    } catch (error) {
        console.error('Error loading registrations:', error);
    }
}

function renderRegistrations() {
    const container = document.getElementById('registrationsList');
    
    if (registrations.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No Registrations Yet</h3>
                        <p>Register members for events</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = registrations.map(reg => {
        const eventName = reg.event?.name || 'Unknown Event';
        const memberName = reg.member?.name || 'Unknown Member';
        const registeredDate = new Date(reg.created_at).toLocaleDateString();
        
        return `
            <tr>
                <td>${eventName}</td>
                <td>${memberName}</td>
                <td>${registeredDate}</td>
                <td><span class="status-badge status-approved">Approved</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteRegistration('${reg.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openRegistrationModal() {
    if (events.length === 0) {
        alert('Please create an event first');
        return;
    }
    if (members.length === 0) {
        alert('Please add a member first');
        return;
    }
    document.getElementById('registrationModal').classList.add('active');
}

function closeRegistrationModal() {
    document.getElementById('registrationModal').classList.remove('active');
    document.getElementById('registrationForm').reset();
}

async function saveRegistration(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/registrations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeRegistrationModal();
            await loadRegistrations();
            updateDashboard();
        } else if (response.status === 409) {
            const errorData = await response.json();
            alert(errorData.error || 'This member is already registered for this event');
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Failed to save registration');
        }
    } catch (error) {
        console.error('Error saving registration:', error);
        alert('Failed to save registration');
    }
}

async function deleteRegistration(id) {
    showDeleteConfirm('Are you sure you want to delete this registration? This action cannot be undone.', 'registration', id);
}

// ============================================
// DONATIONS
// ============================================

async function loadDonations() {
    try {
        const response = await fetch(`${API_URL}/donations`, {
            headers: getHeaders()
        });
        if (!response.ok) {
            console.error('Failed to load donations. Status:', response.status);
            console.error('Response:', await response.text());
            donations = [];
            return;
        }
        donations = await response.json();
        renderDonations();
        updateDonationStats();
    } catch (error) {
        console.error('Error loading donations:', error);
        donations = [];
    }
}

function renderDonations() {
    const container = document.getElementById('donationsList');
    
    if (donations.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-hand-holding-heart"></i>
                        <h3>No Donations Recorded</h3>
                        <p>Record donations to track giving</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = donations.map(donation => {
        const date = new Date(donation.created_at).toLocaleDateString();
        return `
            <tr>
                <td>${date}</td>
                <td>${donation.donor_name || 'Anonymous'}</td>
                <td>₱${parseFloat(donation.amount).toFixed(2)}</td>
                <td>${donation.donation_type || 'General'}</td>
                <td>${donation.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteDonation('${donation.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateDonationStats() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    
    const monthlyTotal = donations
        .filter(d => new Date(d.created_at) >= monthStart)
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    const yearlyTotal = donations
        .filter(d => new Date(d.created_at) >= yearStart)
        .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    const donorCount = new Set(donations.map(d => d.donor_name)).size;
    
    document.getElementById('monthTotal').textContent = '₱' + monthlyTotal.toLocaleString();
    document.getElementById('yearTotal').textContent = '₱' + yearlyTotal.toLocaleString();
    document.getElementById('donorCount').textContent = donorCount;
}

function openDonationModal() {
    document.getElementById('donationModal').classList.add('active');
}

function closeDonationModal() {
    document.getElementById('donationModal').classList.remove('active');
    document.getElementById('donationForm').reset();
}

async function saveDonation(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_URL}/donations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeDonationModal();
            await loadDonations();
            updateDashboard();
        } else {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            alert('Error saving donation: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving donation:', error);
        alert('Failed to save donation: ' + error.message);
    }
}

async function deleteDonation(id) {
    showDeleteConfirm('Are you sure you want to delete this donation? This action cannot be undone.', 'donation', id);
}

// ============================================
// BIRTHDAYS
// ============================================

function renderBirthdays() {
    const container = document.getElementById('birthdaysList');
    
    const membersWithBirthdays = members.filter(m => m.birthday).sort((a, b) => {
        const aDate = new Date(a.birthday);
        const bDate = new Date(b.birthday);
        return (aDate.getMonth() - bDate.getMonth()) || (aDate.getDate() - bDate.getDate());
    });
    
    if (membersWithBirthdays.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-birthday-cake"></i>
                        <h3>No Birthday Data</h3>
                        <p>Add birthday information to members</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = membersWithBirthdays.map(member => {
        const birthday = new Date(member.birthday);
        const today = new Date();
        const age = today.getFullYear() - birthday.getFullYear();
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        
        return `
            <tr>
                <td><strong>${member.name}</strong></td>
                <td>${birthday.toLocaleDateString()}</td>
                <td>${age}</td>
                <td>${member.email || '-'}</td>
                <td>
                    ${daysUntil <= 7 ? `<span style="color: #e67e22; font-weight: bold;">🎉 In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}</span>` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// USERS MANAGEMENT
// ============================================

let users = [];
let editingUserId = null;

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, { 
            headers: getHeaders()
        });
        if (response.ok) {
            users = await response.json();
            renderUsers();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        //showNotification('Failed to load users', 'error');
    }
}

function renderUsers() {
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Users</h3>
                        <p>Create a new user to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = users.map(user => {
        const created = new Date(user.created_at).toLocaleDateString();
        return `
            <tr>
                <td>${user.name || '-'}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.role === 'admin' ? 'status-approved' : 'status-pending'}">${user.role}</span></td>
                <td>${created}</td>
                <td style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-sm" onclick="editUser('${user.id}')" title="Edit User" style="padding: 6px 10px; width: auto; background: #3498db;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')" title="Delete User" style="padding: 6px 10px; width: auto;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openUserModal() {
    editingUserId = null;
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    document.getElementById('passwordGroup').style.display = 'block';
    document.querySelector('input[name="password"]').required = true;
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
    document.getElementById('userForm').reset();
    editingUserId = null;
}

async function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    editingUserId = userId;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userForm').reset();
    
    // Hide password field when editing (only update if explicitly changed)
    document.getElementById('passwordGroup').style.display = 'none';
    document.querySelector('input[name="password"]').required = false;
    
    document.querySelector('input[name="name"]').value = user.name || '';
    document.querySelector('input[name="email"]').value = user.email;
    document.querySelector('select[name="role"]').value = user.role;
    
    document.getElementById('userModal').classList.add('active');
}

function validateUser(data) {
    clearFormErrors('userForm');
    let isValid = true;
    
    if (!data.name || data.name.trim() === '') {
        showFieldError('userName', 'userForm', 'Name is required');
        isValid = false;
    }
    
    if (!data.email || data.email.trim() === '') {
        showFieldError('userEmail', 'userForm', 'Email is required');
        isValid = false;
    }
    
    if (!editingUserId && (!data.password || data.password.trim() === '')) {
        showFieldError('userPassword', 'userForm', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

async function validateAndSaveUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    if (!validateUser(data)) return;
    
    try {
        let response;
        const payload = {
            name: data.name,
            email: data.email,
            role: data.role
        };
        
        if (editingUserId) {
            // Editing existing user
            if (data.password) {
                payload.password = data.password;
            }
            response = await fetch(`${API_URL}/users/${editingUserId}`, { 
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        } else {
            // Creating new user
            payload.password = data.password;
            response = await fetch(`${API_URL}/users`, { 
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        }
        
        if (response.ok) {
            await loadUsers();
            closeUserModal();
            showNotification(`User ${editingUserId ? 'updated' : 'created'} successfully`, 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || `Failed to ${editingUserId ? 'update' : 'create'} user`, 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

async function deleteUser(userId) {
    showDeleteConfirm('Are you sure you want to delete this user? This action cannot be undone.', 'user', userId);
}

function filterUsers() {
    const searchInput = document.getElementById('usersSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#usersList tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ============================================
// UTILITIES
// ============================================

function updateMemberSelect() {
    const select = document.getElementById('memberSelect');
    select.innerHTML = '<option value="">Select a member...</option>' +
        members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function updateEventSelect() {
    const select = document.getElementById('eventSelect');
    select.innerHTML = '<option value="">Select an event...</option>' +
        events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

// ============================================
// SEARCH AND FILTER FUNCTIONS
// ============================================

function filterEvents() {
    const searchInput = document.getElementById('eventsSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#eventsList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterMembers() {
    const searchInput = document.getElementById('membersSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#membersList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterRegistrations() {
    const searchInput = document.getElementById('registrationsSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#registrationsList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterDonations() {
    const searchInput = document.getElementById('donationsSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#donationsList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterBirthdays() {
    const searchInput = document.getElementById('birthdaysSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#birthdaysList tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}
