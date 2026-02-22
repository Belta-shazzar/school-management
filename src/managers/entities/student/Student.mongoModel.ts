import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: Date;
  schoolId: mongoose.Types.ObjectId;
  currentClassroomId?: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: "ACTIVE" | "TRANSFERRED" | "GRADUATED";
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    dateOfBirth: {
      type: Date,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    currentClassroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      default: null,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRANSFERRED", "GRADUATED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

// StudentSchema.index({ schoolId: 1 });
StudentSchema.index({ currentClassroomId: 1 });

export default mongoose.model<IStudent>("Student", StudentSchema);
