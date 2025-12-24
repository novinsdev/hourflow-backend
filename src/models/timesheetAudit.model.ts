import mongoose, { Schema } from "mongoose";

const AuditSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "ClockSession", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, required: true },
    action: {
      type: String,
      enum: ["create", "submit", "submit_edit", "cancel_edit", "approve", "reject", "auto_submit"],
      required: true,
    },
    fromStatus: { type: String },
    toStatus: { type: String },
    note: { type: String },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model("TimesheetAudit", AuditSchema);
