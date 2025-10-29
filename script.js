// Persistent transactions
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

const totalEl = document.getElementById('totalBalance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expenses');
const investEl = document.getElementById('investments');
const listEl = document.getElementById('transactionList');

let expenseChart, trendChart, incomeVsExpenseChart;

// Animated counters
function animateValue(el, start, end, duration) {
  if (start === end) { el.textContent = end.toLocaleString(); return; }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    el.textContent = value.toLocaleString();
    if (progress < 1) window.requestAnimationFrame(step);
    else el.textContent = end.toLocaleString();
  };
  window.requestAnimationFrame(step);
}

document.getElementById('transactionForm').addEventListener('submit', e => {
  e.preventDefault();
  const desc = document.getElementById('desc').value.trim();
  const amount = +document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  if (!desc || !amount || !date) return;

  transactions.push({ desc, amount, category, date });
  localStorage.setItem('transactions', JSON.stringify(transactions));
  e.target.reset();
  updateUI();
});

function updateUI() {
  let income = 0, expense = 0, invest = 0;
  listEl.innerHTML = '';

  // Filtering
  let filtered = [...transactions];
  const selectedCategory = document.getElementById('categoryFilter').value;
  if (selectedCategory !== 'all')
    filtered = filtered.filter(t => t.category === selectedCategory);

  // Sorting
  const selectedSort = document.getElementById('sortFilter').value;
  if (selectedSort === 'asc')
    filtered.sort((a, b) => a.amount - b.amount);
  else if (selectedSort === 'desc')
    filtered.sort((a, b) => b.amount - a.amount);

  filtered.forEach((t, idx) => {
    const realIdx = transactions.indexOf(t); // to get true index for deletion
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.desc}</td>
      <td>₹${t.amount}</td>
      <td>${capitalize(t.category)}</td>
      <td>${formatDate(t.date)}</td>
      <td><button class="delete-btn" data-idx="${realIdx}" aria-label="Delete Transaction">Delete</button></td>
    `;
    listEl.appendChild(tr);

    if (t.category === 'income') income += t.amount;
    else if (t.category === 'expense') expense += t.amount;
    else invest += t.amount;
  });

  // Delete event
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      const index = +this.dataset.idx;
      transactions.splice(index, 1);
      localStorage.setItem('transactions', JSON.stringify(transactions));
      updateUI();
    };
  });

  // Animated counters for stats
  animateValue(totalEl, Number(removeComma(totalEl.textContent)), (income - expense + invest), 650);
  animateValue(incomeEl, Number(removeComma(incomeEl.textContent)), income, 650);
  animateValue(expenseEl, Number(removeComma(expenseEl.textContent)), expense, 650);
  animateValue(investEl, Number(removeComma(investEl.textContent)), invest, 650);

  renderCharts(income, expense, invest);
}

function removeComma(val) {
  return String(val).replace(/[₹,]/g, '') || 0;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('default', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// Corrected Monthly Expense Logic
function monthlyExpenses() {
  const months = Array(12).fill(0);
  transactions.forEach((t) => {
    if (t.category === 'expense') {
      const d = new Date(t.date);
      if (!isNaN(d)) {
        const monthIndex = d.getMonth(); // 0-11
        months[monthIndex] += t.amount;
      }
    }
  });
  return months;
}

function renderCharts(income, expense, invest) {
  if (expenseChart) expenseChart.destroy();
  if (trendChart) trendChart.destroy();
  if (incomeVsExpenseChart) incomeVsExpenseChart.destroy();

  expenseChart = new Chart(document.getElementById('expenseChart'), {
    type: 'pie',
    data: {
      labels: ['Income', 'Expense', 'Investment'],
      datasets: [{
        data: [income, expense, invest],
        backgroundColor: ['#10b981', '#ef4444', '#2563eb'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true, position: 'bottom' } }
    }
  });

  trendChart = new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Expenses',
        data: monthlyExpenses(),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  incomeVsExpenseChart = new Chart(document.getElementById('incomeVsExpense'), {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        label: 'Comparison',
        data: [income, expense],
        backgroundColor: ['#10b981', '#ef4444'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { drawBorder: false, color: '#e5e7eb' } }
      }
    }
  });
}

// Filter + Sort controls
document.getElementById('categoryFilter').onchange = updateUI;
document.getElementById('sortFilter').onchange = updateUI;

updateUI();
