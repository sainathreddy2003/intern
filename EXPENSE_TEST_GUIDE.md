# Expense Functionality Test Guide

## Summary of Changes

### ✅ Fixed Issues:
1. **Removed hardcoded expense amounts** - Now uses real API data
2. **Verified API connections** - Both GeneralExpense.js and Reports.js use the same endpoints
3. **Updated data parsing** - Correctly extracts expenses from API response

---

## Test Scenarios

### Test 1: Add Sample Expenses
**Steps:**
1. Go to **General Expense Management** page
2. Click **"Add Expense"** button
3. Add the following test expenses:

| Category | Amount | Description | Date | Payment Mode | Status |
|----------|--------|-------------|------|--------------|--------|
| RENT | ₹50,000 | Office rent for January | 2024-01-05 | BANK TRANSFER | PAID |
| UTILITIES | ₹8,500 | Electricity bill | 2024-01-10 | CASH | PAID |
| SALARIES | ₹120,000 | Employee salaries | 2024-01-25 | BANK TRANSFER | PAID |
| MARKETING | ₹15,000 | Digital marketing campaign | 2024-01-15 | CREDIT CARD | PAID |
| MAINTENANCE | ₹3,500 | Office maintenance | 2024-01-20 | CASH | PAID |

**Expected Total:** ₹197,000

---

### Test 2: Verify Expense Totals in GeneralExpense Page

**Navigate to:** General Expense Management → Overview Tab

**Check:**
- ✅ Total Expenses card shows: **₹197,000**
- ✅ Monthly Average is calculated correctly
- ✅ Categories count shows: **5**
- ✅ Top Categories section displays correct amounts

---

### Test 3: Verify Expense Report Connection

**Navigate to:** Reports → Expenses Tab

**Check:**
- ✅ Total Expenses shows: **₹197,000**
- ✅ Operating expenses are calculated
- ✅ Administrative expenses are calculated
- ✅ Expense Breakdown table shows all 5 categories
- ✅ Charts display expense data correctly

---

### Test 4: Add More Expenses and Verify Real-Time Updates

**Add 3 more expenses:**

| Category | Amount | Description | Date | Payment Mode | Status |
|----------|--------|-------------|------|--------------|--------|
| TRAVEL | ₹12,000 | Business travel | 2024-01-18 | CREDIT CARD | PAID |
| INSURANCE | ₹8,000 | Office insurance | 2024-01-12 | BANK TRANSFER | PAID |
| TAXES | ₹25,000 | GST payment | 2024-01-28 | BANK TRANSFER | PAID |

**New Expected Total:** ₹242,000 (197,000 + 45,000)

**Verify in both:**
1. General Expense Management page
2. Reports → Expenses tab

---

### Test 5: Budget Period Filtering

**Steps:**
1. Go to General Expense Management → Budget Tab
2. Select different budget periods (2024-2025, 2025-2026)
3. Verify expenses are filtered correctly by year

**Expected:**
- Expenses from 2024 should appear in 2024-2025 period
- Expenses from 2025 should appear in 2025-2026 period

---

### Test 6: Excel-Style Bulk Entry

**Steps:**
1. Click **"Add Expense"** button
2. Use Excel-style dialog to add multiple expenses at once
3. Fill in 3-5 rows with different categories
4. Click **"Add X Expenses"** button

**Verify:**
- All expenses are added successfully
- Total amount updates correctly
- Expenses appear in both GeneralExpense and Reports pages

---

## Expected API Endpoints

### Backend Should Implement:

```
GET  /api/reports/expenses?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
POST /api/expenses
PUT  /api/expenses/:id
DELETE /api/expenses/:id
```

### Expected Response Format:

```json
{
  "data": {
    "summary": {
      "total_expenses": 197000,
      "operating_expenses": 150000,
      "administrative_expenses": 47000,
      "other_expenses": 0
    },
    "expenses": [
      {
        "id": 1,
        "category": "RENT",
        "amount": 50000,
        "description": "Office rent for January",
        "expense_date": "2024-01-05",
        "payment_mode": "BANK TRANSFER",
        "status": "PAID"
      }
      // ... more expenses
    ]
  }
}
```

---

## Verification Checklist

### ✅ Frontend (Already Done):
- [x] Removed hardcoded expense amounts
- [x] Connected to reportsAPI.getExpenseReport()
- [x] Updated data parsing to use data.data.expenses
- [x] Verified connection between GeneralExpense and Reports pages

### ⚠️ Backend (Needs Implementation):
- [ ] Implement GET /api/reports/expenses endpoint
- [ ] Implement POST /api/expenses endpoint
- [ ] Implement PUT /api/expenses/:id endpoint
- [ ] Implement DELETE /api/expenses/:id endpoint
- [ ] Return data in expected format (see above)

---

## Quick Test Commands

### 1. Check if API endpoint exists:
```bash
curl -X GET "http://localhost:3000/api/reports/expenses?fromDate=2024-01-01&toDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Add test expense:
```bash
curl -X POST "http://localhost:3000/api/expenses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "expense_category": "RENT",
    "expense_description": "Office rent",
    "amount": 50000,
    "expense_date": "2024-01-05",
    "payment_mode": "BANK TRANSFER",
    "status": "PAID"
  }'
```

---

## Troubleshooting

### Issue: "No expense report data" message
**Solution:** Backend endpoint not implemented or returning wrong format

### Issue: Expenses not showing in Reports page
**Solution:** Check API response format matches expected structure

### Issue: Total amounts don't match
**Solution:** Verify backend calculation logic for summary totals

---

## Success Criteria

✅ **Test Passed When:**
1. Can add expenses through UI
2. Expenses appear in GeneralExpense page with correct totals
3. Same expenses appear in Reports → Expenses tab
4. Totals match between both pages
5. Charts and analytics display correctly
6. Budget period filtering works
7. Excel-style bulk entry works

---

## Notes

- Frontend is now fully connected to backend API
- All hardcoded values have been removed
- Both GeneralExpense.js and Reports.js use the same API endpoints
- Backend implementation is required for full functionality
