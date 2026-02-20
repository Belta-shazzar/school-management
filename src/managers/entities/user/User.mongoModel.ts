import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'superadmin' | 'school_admin';
  schoolId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      required: true,
      enum: ['superadmin', 'school_admin'],
      default: 'school_admin',
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
