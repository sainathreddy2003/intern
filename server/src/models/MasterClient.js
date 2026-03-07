const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getMasterConnection } = require('../config/db');

const masterClientSchema = new mongoose.Schema(
  {
    client_name: {
      type: String,
      required: true,
      trim: true,
    },
    database_name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    domain_user: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'inactive'],
    },
    securityQuestion: {
      type: String,
      trim: true,
    },
    securityAnswer: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'master_clients',
  }
);

masterClientSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

masterClientSchema.pre('save', async function hashSecurityAnswer(next) {
  if (!this.isModified('securityAnswer') || Object.keys(this.securityAnswer || {}).length === 0 || !this.securityAnswer) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.securityAnswer = await bcrypt.hash(this.securityAnswer, salt);
  next();
});

masterClientSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  if (!this.password) {
    return false;
  }

  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  return Promise.resolve(enteredPassword === this.password);
};

masterClientSchema.methods.matchSecurityAnswer = function matchSecurityAnswer(enteredAnswer) {
  if (!this.securityAnswer || !enteredAnswer) {
    return false;
  }

  // To handle case-insensitivity on plain text questions, we should technically compare normalized string.
  // We'll normalize user input down the line to lowercase before checking.
  return bcrypt.compare(enteredAnswer, this.securityAnswer);
};

const resolveModel = () => {
  const conn = getMasterConnection();
  return conn.models.MasterClient || conn.model('MasterClient', masterClientSchema);
};

module.exports = new Proxy(
  function masterClientProxy() { },
  {
    get(_target, prop) {
      const model = resolveModel();
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    },
    construct(_target, args) {
      const Model = resolveModel();
      return new Model(...args);
    },
    apply(_target, thisArg, args) {
      const Model = resolveModel();
      return Model.apply(thisArg, args);
    },
  }
);
