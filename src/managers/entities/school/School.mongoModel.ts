import mongoose, { Schema, Document } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  },
  { timestamps: true }
);

export default mongoose.model<ISchool>('School', SchoolSchema);
