let data = JSON.parse(localStorage.getItem("financeData")) || [];

// Charts instances
let pieChart, barChart;

function showPage(page) {
  document.getElementById("homePage").classList.add("hidden");
  document.getElementById("analysisPage").classList.add("hidden");
  
  // Update nav UI
  document.getElementById("nav-home").classList.remove("active");
  document.getElementById("nav-analysis").classList.remove("active");

  if (page === "home") {
    document.getElementById("homePage").classList.remove("hidden");
    document.getElementById("nav-home").classList.add("active");
  } else {
    document.getElementById("analysisPage").classList.remove("hidden");
    document.getElementById("nav-analysis").classList.add("active");
    loadAnalysis();
  }
  
  // Scroll to top when switching pages
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addData() {
  let income = parseFloat(document.getElementById("income").value);
  let incomeDesc = document.getElementById("incomeDesc").value || "Income";
  let expense = parseFloat(document.getElementById("expense").value);
  let expenseDesc = document.getElementById("expenseDesc").value || "Expense";

  // Create an entry only if values exist
  if (!income && !expense) return;

  if (income > 0) {
    data.push({ type: 'income', amount: income, desc: incomeDesc, date: new Date().toISOString() });
  }
  if (expense > 0) {
    data.push({ type: 'expense', amount: expense, desc: expenseDesc, date: new Date().toISOString() });
  }

  localStorage.setItem("financeData", JSON.stringify(data));

  displayData();
  clearInputs();
}

function displayData() {
  let list = document.getElementById("transactionList");
  list.innerHTML = "";

  let totalIncome = 0;
  let totalExpense = 0;

  // Render backward (newest first)
  const reversedData = [...data].reverse();

  if (reversedData.length === 0) {
    list.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px 0;">No recent activity.</p>`;
  }

  reversedData.forEach(item => {
    // Handling legacy data format vs new format
    let type = item.type;
    let amount = item.amount;
    let desc = item.desc;
    
    // Legacy support (older data structure used in previous version)
    let legacyIncome = parseFloat(item.income) || 0;
    let legacyExpense = parseFloat(item.expense) || 0;

    if (legacyIncome > 0) {
      totalIncome += legacyIncome;
      list.appendChild(createTransactionEl('income', legacyIncome, item.incomeDesc || 'Income'));
    }
    if (legacyExpense > 0) {
      totalExpense += legacyExpense;
      list.appendChild(createTransactionEl('expense', legacyExpense, item.expenseDesc || 'Expense'));
    }

    // New format support
    if (type === 'income') {
      totalIncome += amount;
      list.appendChild(createTransactionEl('income', amount, desc));
    } else if (type === 'expense') {
      totalExpense += amount;
      list.appendChild(createTransactionEl('expense', amount, desc));
    }
  });

  let balance = totalIncome - totalExpense;

  // Update Home Page DOM
  document.getElementById("finalTotal").innerText = `₹${balance.toLocaleString('en-IN')}`;
  document.getElementById("cardTotalIncome").innerText = `₹${totalIncome.toLocaleString('en-IN')}`;
  document.getElementById("cardTotalExpense").innerText = `₹${totalExpense.toLocaleString('en-IN')}`;
}

function createTransactionEl(type, amount, desc) {
  let li = document.createElement("li");
  li.className = "transaction-item";
  
  let isIncome = type === 'income';
  let iconClass = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
  let bgClass = isIncome ? 'income-icon' : 'expense-icon';
  let amountClass = isIncome ? 'amount-inc' : 'amount-exp';
  let prefix = isIncome ? '+' : '-';

  li.innerHTML = `
    <div class="t-info">
      <div class="t-icon ${bgClass}">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div class="t-details">
        <p>${desc}</p>
        <span>${isIncome ? 'Received' : 'Spent'}</span>
      </div>
    </div>
    <div class="t-amount ${amountClass}">
      ${prefix}₹${amount.toLocaleString('en-IN')}
    </div>
  `;
  return li;
}

function clearInputs() {
  document.getElementById("income").value = "";
  document.getElementById("incomeDesc").value = "";
  document.getElementById("expense").value = "";
  document.getElementById("expenseDesc").value = "";
}

function loadAnalysis() {
  let totalIncome = 0;
  let totalExpense = 0;

  let labels = [];
  let incomeData = [];
  let expenseData = [];

  let count = 0;

  data.forEach((item) => {
    let inc = parseFloat(item.income) || (item.type === 'income' ? item.amount : 0);
    let exp = parseFloat(item.expense) || (item.type === 'expense' ? item.amount : 0);
    
    // For legacy data, income and expense might be in the same row. For new data, they are separate.
    if(inc > 0 || exp > 0) {
        if(inc > 0) totalIncome += inc;
        if(exp > 0) totalExpense += exp;
        
        count++;
        labels.push("T" + count);
        incomeData.push(inc);
        expenseData.push(exp);
    }
  });

  let balance = totalIncome - totalExpense;

  document.getElementById("totalIncome").innerText = `₹${totalIncome.toLocaleString('en-IN')}`;
  document.getElementById("totalExpense").innerText = `₹${totalExpense.toLocaleString('en-IN')}`;
  document.getElementById("balance").innerText = `₹${balance.toLocaleString('en-IN')}`;

  // Destroy old charts if exist to prevent overlay bugs
  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  // Chart styling basics
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = "#64748B";

  // Check if we have any data to show
  let pieData = totalIncome === 0 && totalExpense === 0 ? [1] : [totalIncome, totalExpense];
  let pieColors = totalIncome === 0 && totalExpense === 0 ? ["#e2e8f0"] : ["#10B981", "#EF4444"];
  let pieLabels = totalIncome === 0 && totalExpense === 0 ? ["No Data"] : ["Income", "Expense"];

  let ctx1 = document.getElementById("pieChart").getContext("2d");
  pieChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: pieColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '75%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
        }
      }
    }
  });

  let ctx2 = document.getElementById("barChart").getContext("2d");
  barChart = new Chart(ctx2, {
    type: "bar",
    data: {
      // slice last 10 points to avoid cluttering in mobile screens
      labels: labels.slice(-10), 
      datasets: [
        {
          label: "In",
          data: incomeData.slice(-10),
          backgroundColor: "#10B981",
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: "Out",
          data: expenseData.slice(-10),
          backgroundColor: "#EF4444",
          borderRadius: 6,
          barPercentage: 0.6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true, 
          grid: { display: true, color: "#f1f5f9", drawBorder: false },
          ticks: { maxTicksLimit: 5 }
        },
        x: { 
          grid: { display: false, drawBorder: false } 
        }
      },
      plugins: {
        legend: { 
          position: 'top',
          align: 'end',
          labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } }
        }
      }
    }
  });
}

// Load data on start
displayData();