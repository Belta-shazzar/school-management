import mongoose, { Schema, Document } from 'mongoose';

export interface IClassroom extends Document {
  name: string;
  schoolId: mongoose.Types.ObjectId;
  capacity: number;
  resources?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    resources: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IClassroom>('Classroom', ClassroomSchema);
