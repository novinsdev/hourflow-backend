import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: false }, // 👈 add this
    clockInAt: { type: Date, required: true },
    clockOutAt: { type: Date },
    totalMinutes: { type: Number },
    status: { type: String, enum: ["open", "submitted", "approved", "rejected"], default: "open" },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approverComment: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("ClockSession", schema);
