const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const warehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },
        location: {
            type: String,
            trim: true,
            default: ''
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE'],
            default: 'ACTIVE'
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
            }
        }
    }
);

module.exports = createTenantModel('Warehouse', warehouseSchema);
