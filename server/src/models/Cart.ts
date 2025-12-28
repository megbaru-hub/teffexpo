import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  merchant: mongoose.Types.ObjectId;
  teffType: string;
  quantity: number; // in kilos
  pricePerKilo: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
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
    }
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cart must belong to a user'],
      unique: true,
      index: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Cart = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;


