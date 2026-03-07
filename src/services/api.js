import axios from 'axios';
import toast from 'react-hot-toast';
import { offlineDB } from './offlineDB';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');
const isBrowser = typeof window !== 'undefined';
const isLocalHost =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1');

const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_URL || (isLocalHost ? 'http://localhost:5002/api' : '/api')
);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        success: false,
        message: `Network error. Cannot reach API at ${API_BASE_URL}.`,
        isNetworkError: true,
      });
    }

    const responseData = error.response?.data;
    const responseType = String(error.response?.headers?.['content-type'] || '').toLowerCase();
    const isHtmlResponse =
      responseType.includes('text/html') ||
      (typeof responseData === 'string' &&
        (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html')));
    if (isHtmlResponse) {
      return Promise.reject({
        success: false,
        message: `API misconfigured. Backend not reachable at ${API_BASE_URL}. Start backend from server folder.`,
      });
    }

    // Handle auth errors
    if (error.response.status === 401) {
      if (error.config && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Also clear offline auth cache to avoid auto-login bounce back to dashboard.
        offlineDB.auth.delete('current').catch(() => { });
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
      return Promise.reject(error.response.data);
    }

    // Handle server errors
    if (error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    if (typeof responseData === 'string') {
      return Promise.reject({ success: false, message: responseData });
    }
    return Promise.reject(responseData);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  updateProfile: (userData) => api.put('/auth/profile', userData),

  // Security Question Recovery endpoints
  setupSecurityQuestion: (payload) => api.post('/auth/setup-security-question', payload),
  getSecurityQuestion: (email) => api.post('/auth/forgot-password-question', { email }),
  verifySecurityAnswer: (payload) => api.post('/auth/forgot-password-verify', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

// Items API
export const itemsAPI = {
  getItems: (params) => api.get('/items', { params }),
  getItem: (id) => api.get(`/items/${id}`),
  getItemByBarcode: (barcode) => api.get(`/items/by-barcode/${encodeURIComponent(barcode)}`),
  createItem: (itemData) => api.post('/items', itemData),
  updateItem: (id, itemData) => api.put(`/items/${id}`, itemData),
  deleteItem: (id) => api.delete(`/items/${id}`),
  getItemGroups: () => api.get('/items/groups/all'),
  getUnits: () => api.get('/items/units/all'),
  getTaxes: () => api.get('/items/tax/all'),
  searchItems: (query) => api.get('/items/search', { params: { q: query } }),
};

// Sales API
export const salesAPI = {
  getBills: (params) => api.get('/sales', { params }),
  getBill: (id) => api.get(`/sales/${id}`),
  createBill: (billData) => api.post('/sales', billData),
  updateBill: (id, billData) => api.put(`/sales/${id}`, billData),
  addPayment: (id, paymentData) => api.put(`/sales/${id}/payment`, paymentData),
  holdBill: (id, isHold) => api.put(`/sales/${id}/hold`, { isHold }),
  cancelBill: (id, reason) => api.put(`/sales/${id}/cancel`, { reason }),
  deleteBill: (id) => api.delete(`/sales/${id}`),
  getDayEndSummary: (date) => api.get('/sales/day-end/summary', { params: { date } }),
  reprintBill: (id) => api.get(`/sales/${id}/print`),
};

// Purchase API
export const purchaseAPI = {
  getOrders: (params) => api.get('/purchase', { params }),
  getOrder: (id) => api.get(`/purchase/${id}`),
  createOrder: (orderData) => api.post('/purchase', orderData),
  addPayment: (id, paymentData) => api.put(`/purchase/${id}/payment`, paymentData),
  updateOrder: (id, orderData) => api.put(`/purchase/${id}`, orderData),
  deleteOrder: (id) => api.delete(`/purchase/${id}`),
  getSuppliers: () => api.get('/purchase/suppliers/all'),
};

// Inventory API
export const inventoryAPI = {
  getStock: (params) => api.get('/inventory/stock', { params }),
  getStockLedger: (params) => api.get('/inventory/ledger', { params }),
  adjustStock: (adjustmentData) => api.post('/inventory/adjust', adjustmentData),
  getBatches: (itemId) => api.get(`/inventory/batches/${itemId}`),
  getLowStockItems: () => api.get('/inventory/low-stock'),
  getExpiringItems: (days) => api.get('/inventory/expiring', { params: { days } }),
};

// Reports API
export const reportsAPI = {
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getInventoryReport: (params) => api.get('/reports/inventory', { params }),
  getTaxReport: (params) => api.get('/reports/tax', { params }),
  getCustomerReport: (params) => api.get('/reports/customers', { params }),
  getSupplierReport: (params) => api.get('/reports/suppliers', { params }),
  getDayEndReport: (dateOrParams) => {
    const params = typeof dateOrParams === 'string'
      ? { date: dateOrParams }
      : (dateOrParams || {});
    return api.get('/reports/day-end', { params });
  },
  getProfitLossReport: (params) => api.get('/reports/profit-loss', { params }),
  getExpenseReport: (params) => api.get('/reports/expenses', { params }),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  createBudget: (budgetData) => api.post('/budgets', budgetData),
  updateBudget: (id, budgetData) => api.put(`/budgets/${id}`, budgetData),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
  getBudgets: (params) => api.get('/budgets', { params }),
  getSalaryReport: (params) => api.get('/reports/salary', { params }),
  getCashFlowReport: (params) => api.get('/reports/cash-flow', { params }),
  getEmployeeReport: (params) => api.get('/reports/employees', { params }),
  updateSalary: (salaryData) => api.put('/payroll/salary', salaryData),
  addEmployee: (employeeData) => api.post('/payroll/employees', employeeData),
  updateEmployee: (employeeData) => api.put(`/payroll/employees/${employeeData.id}`, employeeData),
  deleteEmployee: (employeeId) => api.delete(`/payroll/employees/${employeeId}`),
  // Budget Period API
  getBudgetPeriods: () => api.get('/budgets/periods'),
  addBudgetPeriod: (periodData) => api.post('/budgets/periods', periodData),
  updateBudgetPeriod: (periodData) => api.put(`/budgets/periods/${periodData.id}`, periodData),
  deleteBudgetPeriod: (periodId) => api.delete(`/budgets/periods/${periodId}`),
  exportReport: (reportType, params) => api.get(`/reports/export/${reportType}`, {
    params,
    responseType: 'blob',
  }),
};

// Sync API
export const syncAPI = {
  getSyncStatus: (params) => api.get('/sync/status', { params }),
  downloadMasterData: () => api.get('/sync/download/master'),
  uploadTransactions: (transactions) => api.post('/sync/upload', { transactions }),
  getOfflineQueue: (params) => api.get('/sync/queue', { params }),
  clearOfflineQueue: (params) => api.delete('/sync/queue', { params }),
};

// Customers API
export const customersAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomerByCode: (code) => api.get(`/customers/by-code/${encodeURIComponent(code)}`),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  searchCustomers: (query) => api.get('/customers/search', { params: { q: query } }),
};

// Suppliers API
export const suppliersAPI = {
  getSuppliers: (params) => api.get('/suppliers', { params }),
  getSupplier: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (supplierData) => api.post('/suppliers', supplierData),
  updateSupplier: (id, supplierData) => api.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
  searchSuppliers: (query) => api.get('/suppliers/search', { params: { q: query } }),
};

// Security API
export const securityAPI = {
  getDashboard: () => api.get('/security/dashboard'),
  getAuditLogs: (params) => api.get('/security/audit-logs', { params }),
  getUserSessions: (params) => api.get('/security/sessions', { params }),
  getFailedLogins: (params) => api.get('/security/failed-logins', { params }),
  getSettings: () => api.get('/security/settings'),
  updateSettings: (settingsData) => api.put('/security/settings', settingsData),
  getRolePermissions: (roleId) => api.get(`/security/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId, permissions) => api.put(`/security/roles/${roleId}/permissions`, { permissions }),
  terminateSession: (sessionId) => api.post(`/security/sessions/${sessionId}/terminate`),
  unlockUser: (userId, reason) => api.post(`/security/users/${userId}/unlock`, { reason }),
};

// Warehouse API
export const warehouseAPI = {
  getWarehouses: (params) => api.get('/warehouse', { params }),
  getWarehouse: (id) => api.get(`/warehouse/${id}`),
  createWarehouse: (warehouseData) => api.post('/warehouse', warehouseData),
  updateWarehouse: (id, warehouseData) => api.put(`/warehouse/${id}`, warehouseData),
  deleteWarehouse: (id) => api.delete(`/warehouse/${id}`),
  addManualEntry: (entryData) => api.post('/warehouse/manual-entry', entryData),
};

// Returns API
export const returnsAPI = {
  getReturns: (params) => api.get('/returns', { params }),
  processReturn: (returnData) => api.post('/returns', returnData),
};

// Utility functions
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error, customMessage = null) => {
    const message = customMessage || error.message || 'An error occurred';

    if (error.isNetworkError) {
      toast.error('Network error. Working in offline mode.');
    } else {
      toast.error(message);
    }

    console.error('API Error:', error);
    return { success: false, error: message };
  },

  // Format API response
  formatResponse: (response, successMessage = null) => {
    if (response.success) {
      if (successMessage) {
        toast.success(successMessage);
      }
      return { success: true, data: response.data };
    } else {
      return apiUtils.handleError(response);
    }
  },

  // Debounce API calls
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  // Retry failed requests
  retry: async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await apiCall();
        return response;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },
};

export default api;
