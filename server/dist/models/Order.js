"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const orderItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    merchant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teffType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [0.1, 'Quantity must be at least 0.1 kg']
    },
    pricePerKilo: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    }
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    customer: {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Customer phone is required'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        address: {
            type: String,
            required: [true, 'Customer address is required'],
            trim: true
        },
        kebele: {
            type: String,
            required: [true, 'Kebele is required'],
            trim: true
        },
        googleMapsLink: {
            type: String,
            trim: true
        }
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'assigned', 'processing', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
        index: true
    },
    paymentProof: {
        type: String,
        trim: true
    },
    assignedToMerchants: [{
            merchant: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            status: {
                type: String,
                enum: ['pending', 'notified', 'confirmed', 'completed'],
                default: 'pending'
            },
            notifiedAt: Date,
            notificationMethod: {
                type: String,
                enum: ['phone', 'dashboard']
            },
            phoneCalled: {
                type: Boolean,
                default: false
            },
            messageSent: {
                type: Boolean,
                default: false
            }
        }],
    merchantBreakdown: [{
            merchant: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            merchantName: {
                type: String,
                required: true
            },
            amount: {
                type: Number,
                required: true,
                min: 0
            },
            items: [orderItemSchema]
        }],
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: Date,
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});
// Indexes for efficient queries
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'assignedToMerchants.merchant': 1 });
orderSchema.index({ createdAt: -1 });
const Order = mongoose_1.default.model('Order', orderSchema);
exports.default = Order;
