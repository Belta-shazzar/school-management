import mongoose, { Schema, Document } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
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
      maxlength: 300,
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
      maxlength: 100,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISchool>('School', SchoolSchema);
