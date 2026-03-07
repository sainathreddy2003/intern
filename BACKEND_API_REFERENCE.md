# Backend API Endpoints - Quick Reference

## Required New Endpoints for General Expense & Reports

### 1. Expenses API

```javascript
// Create Expense
POST /api/expenses
Body: {
  date: "2024-01-15",
  category: "Rent",
  amount: 50000,
  description: "Office rent for January",
  payment_method: "Cash",
  vendor: "Landlord Name"
}

// Update Expense
PUT /api/expenses/:id
Body: { ...same as create }

// Delete Expense
DELETE /api/expenses/:id
```

### 2. Budget API

```javascript
// Create Budget
POST /api/budgets
Body: {
  period_id: 1,
  category: "Rent",
  allocated_amount: 50000,
  notes: "Monthly rent budget"
}

// Update Budget
PUT /api/budgets/:id
Body: { ...same as create }

// Delete Budget
DELETE /api/budgets/:id
```

### 3. Budget Periods API

```javascript
// Get Budget Periods
GET /api/reports/budget-periods
Response: {
  success: true,
  data: [
    {
      id: 1,
      name: "Q1 2024",
      start_date: "2024-01-01",
      end_date: "2024-03-31",
      is_active: true
    }
  ]
}

// Add Budget Period
POST /api/reports/budget-periods
Body: {
  name: "Q1 2024",
  start_date: "2024-01-01",
  end_date: "2024-03-31"
}

// Update Budget Period
PUT /api/budget/periods/:id
Body: { ...same as add }

// Delete Budget Period
DELETE /api/budget/periods/:id
```

### 4. Employee API

```javascript
// Get Employees
GET /api/reports/employees?startDate=2024-01-01&endDate=2024-12-31
Response: {
  success: true,
  data: [
    {
      id: 1,
      employee_code: "EMP001",
      name: "John Doe",
      designation: "Manager",
      department: "Sales",
      salary: 50000,
      joining_date: "2024-01-01",
      is_active: true
    }
  ]
}

// Add Employee
POST /api/reports/employees
Body: {
  employee_code: "EMP001",
  name: "John Doe",
  designation: "Manager",
  department: "Sales",
  salary: 50000,
  joining_date: "2024-01-01"
}

// Update Employee
PUT /api/reports/employees/:id
Body: { ...same as add }
```

### 5. Salary API

```javascript
// Get Salary Report
GET /api/reports/salary?startDate=2024-01-01&endDate=2024-12-31
Response: {
  success: true,
  data: [
    {
      id: 1,
      employee_id: 1,
      employee_name: "John Doe",
      month: "2024-01",
      basic_salary: 50000,
      allowances: 5000,
      deductions: 2000,
      net_salary: 53000,
      payment_date: "2024-01-31",
      payment_status: "Paid"
    }
  ]
}

// Update Salary
PUT /api/reports/salary/:id
Body: {
  basic_salary: 50000,
  allowances: 5000,
  deductions: 2000,
  payment_date: "2024-01-31",
  payment_status: "Paid"
}
```

### 6. Expense Report API

```javascript
// Get Expense Report
GET /api/reports/expenses?startDate=2024-01-01&endDate=2024-12-31
Response: {
  success: true,
  data: [
    {
      id: 1,
      date: "2024-01-15",
      category: "Rent",
      amount: 50000,
      description: "Office rent",
      payment_method: "Cash",
      vendor: "Landlord"
    }
  ],
  summary: {
    total_expenses: 150000,
    by_category: {
      "Rent": 50000,
      "Utilities": 30000,
      "Salaries": 70000
    }
  }
}
```

## Database Schema Suggestions

### expenses table
```sql
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50),
  vendor VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### budget_periods table
```sql
CREATE TABLE budget_periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### budgets table
```sql
CREATE TABLE budgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  period_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (period_id) REFERENCES budget_periods(id)
);
```

### employees table
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(100),
  department VARCHAR(100),
  salary DECIMAL(15,2),
  joining_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### salaries table
```sql
CREATE TABLE salaries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  basic_salary DECIMAL(15,2),
  allowances DECIMAL(15,2) DEFAULT 0,
  deductions DECIMAL(15,2) DEFAULT 0,
  net_salary DECIMAL(15,2),
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

## Testing Checklist

- [ ] Create expense and verify in database
- [ ] Update expense and check changes
- [ ] Delete expense and confirm removal
- [ ] Create budget period
- [ ] Create budget linked to period
- [ ] Add employee record
- [ ] Update employee details
- [ ] Record salary payment
- [ ] Generate expense report with date filters
- [ ] Generate salary report with date filters
- [ ] Test employee report endpoint
- [ ] Verify all foreign key constraints
- [ ] Test data validation (required fields, date formats)
- [ ] Test error handling for invalid data
