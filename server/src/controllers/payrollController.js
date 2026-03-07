const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

const STATUS_MAP = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  ONLEAVE: 'On Leave',
  TERMINATED: 'Terminated'
};

const DEPARTMENT_VALUES = ['Sales', 'Purchase', 'Inventory', 'HR', 'Finance', 'IT', 'Marketing', 'General'];

const toDepartment = (value) => {
  if (!value) return 'General';
  const normalized = String(value).trim().toLowerCase();
  const found = DEPARTMENT_VALUES.find((d) => d.toLowerCase() === normalized);
  return found || 'General';
};

const toStatus = (value) => {
  if (!value) return 'Active';
  const raw = String(value).trim();
  return STATUS_MAP[raw.toUpperCase()] || raw;
};

const normalizeEmployeePayload = (payload = {}) => {
  const employeeIdRaw = payload.employee_id || payload.employee_code || payload.employeeCode;
  const generatedEmployeeId = `EMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const employee_id = String(employeeIdRaw || generatedEmployeeId).trim();

  const emailRaw = payload.email || payload.email_id || payload.emailId;
  const fallbackEmail = `${employee_id.toLowerCase()}@local.invalid`;

  return {
    ...payload,
    name: (payload.name || payload.employee_name || 'Unknown').trim(),
    employee_id,
    email: String(emailRaw || fallbackEmail).trim().toLowerCase(),
    department: toDepartment(payload.department),
    salary: Number(payload.salary || payload.total_salary || 0),
    status: toStatus(payload.status),
    position: payload.position || 'Staff',
    hire_date: payload.hire_date || new Date()
  };
};

// Get all employees
const getEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find({ status: { $ne: 'Terminated' } }).sort({ name: 1 });

    const summary = {
      total_employees: employees.length,
      active_employees: employees.filter(e => e.status === 'Active').length,
      total_salary: employees.reduce((sum, e) => sum + (e.salary || 0), 0),
      average_salary: employees.length > 0 ? employees.reduce((sum, e) => sum + (e.salary || 0), 0) / employees.length : 0
    };

    const departments = await Employee.aggregate([
      { $match: { status: { $ne: 'Terminated' } } },
      {
        $group: {
          _id: '$department',
          employee_count: { $sum: 1 },
          total_salary: { $sum: '$salary' },
          average_salary: { $avg: '$salary' }
        }
      },
      {
        $project: {
          department: '$_id',
          employee_count: 1,
          total_salary: 1,
          average_salary: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        detailed: employees,
        summary,
        departments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create employee
const createEmployee = async (req, res, next) => {
  try {
    const employeeData = normalizeEmployeePayload(req.body);

    // Auth user making request
    employeeData.created_by = req.user?._id || req.user?.id;

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// Update employee
const updateEmployee = async (req, res, next) => {
  try {
    const normalized = normalizeEmployeePayload(req.body);
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
      data: employee
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
      { status: 'Terminated' },
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

// Update salary
const updateSalary = async (req, res, next) => {
  try {
    const { id, employee_id, salary, total_salary, deduction, reduction, ...rest } = req.body;
    const resolvedEmployeeId = employee_id || id;
    const normalizedSalary = Number(salary ?? total_salary ?? 0);
    const normalizedDeduction = Number(deduction ?? reduction ?? 0);

    // If this call carries an employee id, update employee salary directly.
    if (resolvedEmployeeId) {
      const updatedEmployee = await Employee.findByIdAndUpdate(
        resolvedEmployeeId,
        {
          salary: normalizedSalary,
          updated_at: new Date(),
          ...(rest.status ? { status: toStatus(rest.status) } : {}),
          ...(rest.department ? { department: toDepartment(rest.department) } : {})
        },
        { new: true, runValidators: true }
      );

      if (updatedEmployee) {
        return res.json({
          success: true,
          message: 'Salary updated successfully',
          data: updatedEmployee
        });
      }
    }

    const payroll = await Payroll.findByIdAndUpdate(
      id,
      {
        ...rest,
        basic_salary: normalizedSalary,
        deductions: normalizedDeduction,
        net_salary: Math.max(0, normalizedSalary - normalizedDeduction)
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: payroll
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateSalary
};
