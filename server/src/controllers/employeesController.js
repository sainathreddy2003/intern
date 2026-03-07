const Employee = require('../models/Employee');

const toCanonicalEmployeePayload = (payload = {}) => {
  return {
    ...payload,
    name: payload.name || payload.employee_name || payload.employeeName || '',
    employee_id: payload.employee_id || payload.employee_code || payload.employeeCode || '',
    email: payload.email || payload.email_id || payload.emailId || '',
    department: payload.department || 'General',
    salary: Number(payload.salary || payload.monthly_salary || 0),
    status: payload.status || 'Active'
  };
};

// Get all employees
const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, department, status } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    const employees = await Employee.find(filter)
      .sort({ hire_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Employee.countDocuments(filter);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single employee
const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
};

// Create employee
const createEmployee = async (req, res, next) => {
  try {
    const normalized = toCanonicalEmployeePayload(req.body);
    const employeeData = {
      ...normalized,
      created_by: req.user.id
    };

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
};

// Update employee
const updateEmployee = async (req, res, next) => {
  try {
    const normalized = toCanonicalEmployeePayload(req.body);
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...normalized, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (error) {
    next(error);
  }
};

// Delete employee (soft delete)
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status: 'Inactive' },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get departments
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Employee.distinct('department');
    res.json({
      success: true,
      data: { departments }
    });
  } catch (error) {
    next(error);
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res, next) => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'Active' });
    const inactive = await Employee.countDocuments({ status: 'Inactive' });
    const onLeave = await Employee.countDocuments({ status: 'On Leave' });

    const deptStats = await Employee.aggregate([
      { $match: {} },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          total_employees: total,
          active_employees: active,
          inactive_employees: inactive,
          employees_on_leave: onLeave,
          total_departments: deptStats.length
        },
        department_breakdown: deptStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getEmployeeStats
};
