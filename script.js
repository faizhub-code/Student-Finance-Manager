// State Management
const state = {
    allowance: 0,
    goal: 0,
    expenses: []
};

// DOM Elements
const elements = {
    currentDate: document.getElementById('current-date'),
    currentBalance: document.getElementById('current-balance'),
    totalAllowance: document.getElementById('total-allowance'),
    totalSpent: document.getElementById('total-spent'),
    daysLeft: document.getElementById('days-left'),
    healthIndicator: document.getElementById('health-indicator'),
    savingsProgressText: document.getElementById('savings-progress-text'),
    savingsPercentage: document.getElementById('savings-percentage'),
    savingsBar: document.getElementById('savings-bar'),
    expenseForm: document.getElementById('expense-form'),
    transactionsList: document.getElementById('transactions-list'),
    allowanceModal: document.getElementById('allowance-modal'),
    goalModal: document.getElementById('goal-modal'),
    allowanceForm: document.getElementById('allowance-form'),
    goalForm: document.getElementById('goal-form'),
    editAllowanceBtn: document.getElementById('edit-allowance-btn'),
    editGoalBtn: document.getElementById('edit-goal-btn'),
    closeModals: document.querySelectorAll('.close-modal'),
    filterBtns: document.querySelectorAll('.filter-btn')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDate();
    updateDashboard();
    renderExpenses();
    setupEventListeners();
});

// Data Persistence
function loadData() {
    const savedData = localStorage.getItem('hostelFinanceData');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        state.allowance = parsed.allowance || 0;
        state.goal = parsed.goal || 0;
        state.expenses = parsed.expenses || [];
    }
}

function saveData() {
    localStorage.setItem('hostelFinanceData', JSON.stringify(state));
    updateDashboard();
    renderExpenses();
}

// Core Logic
function updateDashboard() {
    // Calculate totals
    const totalSpent = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balance = state.allowance - totalSpent;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const today = new Date().getDate();
    const remainingDays = daysInMonth - today;

    // Update UI Text
    elements.totalAllowance.textContent = formatCurrency(state.allowance);
    elements.totalSpent.textContent = formatCurrency(totalSpent);
    elements.currentBalance.textContent = formatCurrency(balance);
    elements.daysLeft.textContent = remainingDays;

    // Health Indicator Logic
    updateHealthIndicator(balance, remainingDays, daysInMonth);

    // Savings Progress Logic
    updateSavingsProgress(balance);
}

function updateHealthIndicator(balance, remainingDays, totalDays) {
    const dailyBudget = balance / (remainingDays || 1); // Avoid division by zero
    const dot = elements.healthIndicator.querySelector('.status-dot');
    const text = elements.healthIndicator.querySelector('.status-text');
    
    let status = 'neutral';
    let color = '#94a3b8'; // Default gray

    if (state.allowance === 0) {
        text.textContent = 'Set Allowance';
        dot.style.backgroundColor = color;
        dot.style.boxShadow = `0 0 10px ${color}`;
        return;
    }

    // Simple logic: if daily budget is healthy (> Rs. 100 is arbitrary but a start)
    // Better logic: Compare current spending rate vs ideal rate
    // Ideal spending per day = Allowance / Total Days
    const idealDaily = state.allowance / totalDays;
    
    if (balance < 0) {
        status = 'Critical';
        color = '#ef4444'; // Red
    } else if (dailyBudget < (idealDaily * 0.5)) {
        status = 'Tight';
        color = '#f59e0b'; // Orange
    } else if (dailyBudget >= idealDaily) {
        status = 'Healthy';
        color = '#10b981'; // Green
    } else {
        status = 'Careful';
        color = '#f59e0b'; // Yellow/Orange
    }

    text.textContent = `Health: ${status}`;
    dot.style.backgroundColor = color;
    dot.style.boxShadow = `0 0 10px ${color}`;
}

function updateSavingsProgress(balance) {
    if (state.goal === 0) {
        elements.savingsProgressText.textContent = 'No goal set';
        elements.savingsPercentage.textContent = '0%';
        elements.savingsBar.style.width = '0%';
        return;
    }

    // Assuming "Savings" is what's left (Balance)
    // Or we could have a specific "saved" amount. 
    // For this simple app, let's treat current balance as potential savings.
    const progress = Math.min(100, Math.max(0, (balance / state.goal) * 100));
    
    elements.savingsProgressText.textContent = `${formatCurrency(Math.max(0, balance))} of ${formatCurrency(state.goal)} goal`;
    elements.savingsPercentage.textContent = `${Math.round(progress)}%`;
    elements.savingsBar.style.width = `${progress}%`;
}

function renderExpenses(filter = 'all') {
    elements.transactionsList.innerHTML = '';
    
    let filteredExpenses = [...state.expenses];
    const now = new Date();

    if (filter === 'today') {
        filteredExpenses = filteredExpenses.filter(exp => isSameDay(new Date(exp.date), now));
    } else if (filter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= oneWeekAgo);
    }

    // Sort by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredExpenses.length === 0) {
        elements.transactionsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-receipt"></i>
                <p>No expenses found.</p>
            </div>
        `;
        return;
    }

    filteredExpenses.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div class="t-left">
                <div class="category-icon">${getCategoryIcon(exp.category)}</div>
                <div class="t-details">
                    <h4>${capitalize(exp.category)}</h4>
                    <p>${formatDate(exp.date)} ${exp.note ? '• ' + exp.note : ''}</p>
                </div>
            </div>
            <div class="t-right">
                <div class="t-amount">-${formatCurrency(exp.amount)}</div>
                <button class="delete-btn" onclick="deleteExpense(${exp.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        elements.transactionsList.appendChild(item);
    });
}

// Event Listeners
function setupEventListeners() {
    // Modals
    elements.editAllowanceBtn.addEventListener('click', () => {
        elements.allowanceModal.style.display = 'flex';
        document.getElementById('allowance-input').value = state.allowance || '';
    });

    elements.editGoalBtn.addEventListener('click', () => {
        elements.goalModal.style.display = 'flex';
        document.getElementById('goal-input').value = state.goal || '';
    });

    elements.closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.allowanceModal.style.display = 'none';
            elements.goalModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.allowanceModal) elements.allowanceModal.style.display = 'none';
        if (e.target === elements.goalModal) elements.goalModal.style.display = 'none';
    });

    // Forms
    elements.allowanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('allowance-input').value);
        if (amount > 0) {
            state.allowance = amount;
            saveData();
            elements.allowanceModal.style.display = 'none';
        }
    });

    elements.goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('goal-input').value);
        if (amount > 0) {
            state.goal = amount;
            saveData();
            elements.goalModal.style.display = 'none';
        }
    });

    elements.expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const note = document.getElementById('expense-note').value;

        if (amount > 0 && date) {
            const newExpense = {
                id: Date.now(),
                amount,
                category,
                date,
                note
            };
            state.expenses.push(newExpense);
            saveData();
            elements.expenseForm.reset();
            // Reset date to today
            document.getElementById('expense-date').valueAsDate = new Date();
        }
    });

    // Filters
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderExpenses(btn.dataset.filter);
        });
    });

    // Set default date to today
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Helpers
function formatCurrency(amount) {
    return 'Rs. ' + amount.toLocaleString('en-PK');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = new Date().toLocaleDateString('en-US', options);
}

function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getCategoryIcon(category) {
    const icons = {
        food: '🍔',
        transport: '🚌',
        entertainment: '🎬',
        stationary: '✏️',
        bills: '💡',
        shopping: '🛍️',
        other: '📦'
    };
    return icons[category] || '📦';
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

// Expose delete function to global scope
window.deleteExpense = function(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        state.expenses = state.expenses.filter(exp => exp.id !== id);
        saveData();
    }
};
