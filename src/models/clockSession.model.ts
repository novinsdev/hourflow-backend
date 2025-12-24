import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true }, // 👈 add this
    clockInAt: { type: Date, required: true },
    clockOutAt: { type: Date },
    totalMinutes: { type: Number },
    breakMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "submitted", "approved", "rejected", "paid"], default: "open" },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approverComment: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    // Optional edit request from employee (or manager on behalf)
    pendingEdit: {
      clockInAt: { type: Date },
      clockOutAt: { type: Date },
      breakMinutes: { type: Number },
      reason: { type: String },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      requestedAt: { type: Date },
    },
  },
  { timestamps: true }
);

schema.index({ userId: 1, clockInAt: -1 });
schema.index({ status: 1, clockInAt: -1 });

export default mongoose.model("ClockSession", schema);
