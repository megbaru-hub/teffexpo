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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
        minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator_1.default.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false,
        validate: {
            validator: function (val) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/.test(val);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'merchant'],
        default: 'user'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true
});
// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash password if it was modified
    if (!this.isModified('password'))
        return next();
    // Hash the password
    this.password = await bcryptjs_1.default.hash(this.password, 12);
    // Set passwordChangedAt only if it's NOT a new user (i.e., password was changed on existing user)
    if (!this.isNew) {
        this.passwordChangedAt = new Date(Date.now() - 1000);
    }
    next();
});
userSchema.pre(/^find/, function (next) {
    if (this._conditions) {
        this._conditions.active = { $ne: false };
    }
    else {
        this.find({ active: { $ne: false } });
    }
    next();
});
// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    // @ts-ignore - this will be available at runtime
    return await bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }
    // False means NOT changed
    return false;
};
// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
};
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
