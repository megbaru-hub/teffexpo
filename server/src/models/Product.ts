import mongoose, { Document, Schema } from 'mongoose';

export type TeffType = 'White' | 'Red' | 'Mixed';

export interface IProduct extends Document {
  merchant: mongoose.Types.ObjectId;
  teffType: TeffType;
  pricePerKilo: number; // in ETB
  stockAvailable: number; // in kilos
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    merchant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product must belong to a merchant'],
      index: true
    },
    teffType: {
      type: String,
      enum: ['White', 'Red', 'Mixed'],
      required: [true, 'Please specify teff type']
    },
    pricePerKilo: {
      type: Number,
      required: [true, 'Please provide price per kilo'],
      min: [0, 'Price cannot be negative']
    },
    stockAvailable: {
      type: Number,
      required: [true, 'Please provide available stock'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
productSchema.index({ merchant: 1, teffType: 1 });
productSchema.index({ active: 1 });

// Query middleware to filter out inactive products
productSchema.pre(/^find/, function (next) {
  if (this instanceof mongoose.Query) {
    this.find({ active: { $ne: false } });
  }
  next();
});

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;


