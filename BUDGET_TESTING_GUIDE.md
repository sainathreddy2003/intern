# Budget Tab Testing Guide

## ✅ Backend Status
- Backend is running on port 5002
- Budget API endpoint is working: `http://localhost:5002/api/budgets`
- Response: `{"success":true,"data":[]}`

## Quick Test Steps

### 1. Add Budget
1. Open browser: `http://localhost:3000`
2. Navigate to: **General Expense** → **Budget** tab
3. Click **"Add Budget"** button (top right)
4. Excel-style dialog opens
5. Fill in one row:
   - Category: `RENT`
   - Budget Amount: `50000`
   - Description: `Monthly rent budget`
   - Budget Year: `2024`
   - Department: `Operations`
   - Manager: `John Doe`
6. Click **"Add 1 Budgets"**
7. ✅ Should see: "Budget added successfully!" toast
8. ✅ Budget card should appear in the grid

### 2. Edit Budget
1. Find the RENT budget card
2. Click the **Edit** icon (pencil)
3. Excel dialog opens with pre-filled data
4. Change Budget Amount to: `55000`
5. Click **"Add 1 Budgets"**
6. ✅ Should see: "Budget updated successfully!" toast
7. ✅ Budget card should show updated amount

### 3. Delete Budget
1. Find the RENT budget card
2. Click the **Delete** icon (trash)
3. Confirm deletion in popup
4. ✅ Should see: "Budget deleted successfully!" toast
5. ✅ Budget card should disappear

### 4. Add Multiple Budgets
1. Click **"Add Budget"** button
2. Fill in multiple rows:
   - Row 1: RENT, 50000, 2024
   - Row 2: UTILITIES, 15000, 2024
   - Row 3: SALARIES, 200000, 2024
3. Click **"Add New Row"** to add more rows if needed
4. Click **"Add 3 Budgets"**
5. ✅ Should see: "3 budgets added successfully!" toast
6. ✅ All 3 budget cards should appear

## Expected Behavior

### Budget Card Display
- Shows category name with trend chip
- Displays budget, spent, and remaining amounts
- Shows utilization progress bar (color-coded)
- Edit and Delete buttons visible
- Monthly average and last month spent shown

### Color Coding
- **Green**: < 80% utilization (healthy)
- **Orange**: 80-100% utilization (warning)
- **Red**: > 100% utilization (exceeded)

### Data Persistence
- All budgets are saved to MongoDB
- Refresh page → budgets should still be there
- Backend restart → budgets should still be there

## Troubleshooting

### "Failed to add budget" error
- Check backend console for errors
- Verify MongoDB is running
- Check network tab in browser DevTools

### Budget not appearing after add
- Check browser console for errors
- Verify API response in Network tab
- Try refreshing the page

### Edit/Delete not working
- Ensure budget has `_id` field from backend
- Check browser console for errors
- Verify backend logs

## Backend Verification

### Check MongoDB
```bash
# Connect to MongoDB
mongosh

# Switch to database
use retail_erp

# View budgets
db.budgets.find().pretty()

# Count budgets
db.budgets.countDocuments()
```

### Check Backend Logs
```bash
cd /Users/sainathreddy/Desktop/client/server
npm start
# Watch for budget-related logs
```

### Test API Directly
```bash
# Get all budgets
curl http://localhost:5002/api/budgets

# Create budget
curl -X POST http://localhost:5002/api/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "category": "TEST",
    "budget": 10000,
    "budget_year": 2024,
    "description": "Test budget"
  }'

# Get budgets again (should see TEST budget)
curl http://localhost:5002/api/budgets
```

## Success Criteria
✅ Add Budget button works
✅ Excel dialog opens and accepts input
✅ Budget is saved to backend
✅ Budget card appears in grid
✅ Edit button opens dialog with pre-filled data
✅ Edit saves changes to backend
✅ Delete button removes budget
✅ Success toasts appear for all operations
✅ Data persists after page refresh
