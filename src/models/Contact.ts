import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  name: string;
  phone: string;
  email: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    match: [/^(0|\+84)[1-9][0-9]{8,9}$/, 'Please enter a valid Vietnamese phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for better performance
ContactSchema.index({ email: 1 });
ContactSchema.index({ phone: 1 });
ContactSchema.index({ createdAt: -1 });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
