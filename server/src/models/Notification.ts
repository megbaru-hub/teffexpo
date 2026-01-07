import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'order_assigned' | 'order_confirmed' | 'order_ready' | 'order_completed' | 'payment_received';
export type NotificationStatus = 'unread' | 'read';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId; // Merchant who receives the notification
  type: NotificationType;
  title: string;
  message: string;
  order?: mongoose.Types.ObjectId;
  status: NotificationStatus;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user'],
      index: true
    },
    type: {
      type: String,
      enum: ['order_assigned', 'order_confirmed', 'order_ready', 'order_completed', 'payment_received'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    status: {
      type: String,
      enum: ['unread', 'read'],
      default: 'unread',
      index: true
    },
    readAt: Date
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
notificationSchema.index({ order: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;


