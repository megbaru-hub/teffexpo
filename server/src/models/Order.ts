import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'pending' | 'assigned' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  merchant: mongoose.Types.ObjectId;
  teffType: string;
  quantity: number; // in kilos
  pricePerKilo: number;
  subtotal: number;
  stockDecreased?: boolean;
}

export interface IOrder extends Document {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    kebele: string;
    googleMapsLink?: string;
  };
  items: IOrderItem[];
  totalAmount: number; // Total amount paid by customer
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProof?: string; // URL or reference to payment proof
  assignedToMerchants: Array<{
    merchant: mongoose.Types.ObjectId;
    status: 'pending' | 'notified' | 'confirmed' | 'ready' | 'completed';
    notifiedAt?: Date;
    notificationMethod?: 'phone' | 'dashboard';
    phoneCalled?: boolean;
    messageSent?: boolean;
  }>;
  merchantBreakdown: Array<{
    merchant: mongoose.Types.ObjectId;
    merchantName: string;
    amount: number; // Amount to pay this merchant
    items: IOrderItem[];
  }>;
  createdBy?: mongoose.Types.ObjectId; // User who created the order
  assignedBy?: mongoose.Types.ObjectId; // Admin who assigned the order
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    merchant: {
      type: Schema.Types.ObjectId,
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
    },
    stockDecreased: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
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
        validator: function (items: IOrderItem[]) {
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
      enum: ['pending', 'assigned', 'confirmed', 'processing', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentProof: {
      type: String,
      trim: true
    },
    assignedToMerchants: [{
      merchant: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'notified', 'confirmed', 'ready', 'completed'],
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
        type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'assignedToMerchants.merchant': 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;

