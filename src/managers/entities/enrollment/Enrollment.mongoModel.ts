import mongoose, { Schema, Document } from "mongoose";

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  status: "ACTIVE" | "COMPLETED" | "TRANSFERRED";
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "TRANSFERRED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

EnrollmentSchema.index({ studentId: 1 });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
