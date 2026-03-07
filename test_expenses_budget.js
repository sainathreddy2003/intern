#!/usr/bin/env node

// Simple test script to verify expenses and budget functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5002/api';

async function testEndpoint(name, method, url, data = null) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    let response;
    
    if (method === 'GET') {
      response = await axios.get(`${API_BASE}${url}`);
    } else if (method === 'POST') {
      response = await axios.post(`${API_BASE}${url}`, data);
    }
    
    console.log(`✅ ${name} - SUCCESS`);
    console.log(`   Status: ${response.status}`);
    if (response.data.data) {
      if (Array.isArray(response.data.data)) {
        console.log(`   Records: ${response.data.data.length}`);
      } else if (response.data.data.periods) {
        console.log(`   Periods: ${response.data.data.periods.length}`);
      }
    }
    return true;
  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Expenses and Budget API Tests');
  console.log('==========================================');
  
  const tests = [
    ['Get Expenses', 'GET', '/expenses'],
    ['Get Expense Reports', 'GET', '/reports/expenses?fromDate=2024-01-01&toDate=2024-12-31'],
    ['Get Budgets', 'GET', '/budgets'],
    ['Get Budget Periods', 'GET', '/budgets/periods'],
    ['Create Expense', 'POST', '/expenses', {
      expense_category: 'OTHER',
      expense_description: 'Test expense from script',
      amount: 1000,
      payment_mode: 'CASH',
      expense_date: '2024-02-25',
      budget_year: 2024,
      budget_period: '2024-2025'
    }],
    ['Create Budget', 'POST', '/budgets', {
      category: 'OTHER',
      allocated_amount: 5000,
      budget_year: 2024,
      budget_period: '2024-2025',
      description: 'Test budget from script'
    }]
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, method, url, data] of tests) {
    const result = await testEndpoint(name, method, url, data);
    if (result) passed++;
    else failed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The expenses and budget functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

runTests().catch(console.error);
