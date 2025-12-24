import { Request, Response } from "express";
import ClockSession from "../models/clockSession.model";
import TimesheetAudit from "../models/timesheetAudit.model";
import { AuthUser } from "../middleware/authJwt";
import { User } from "../models/user.model";

// -------------------------
// Helpers
// -------------------------
function parseRange(from?: any, to?: any) {
  const now = new Date();
  const start = from ? new Date(String(from)) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const end = to ? new Date(String(to)) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

function computeMinutes(clockInAt?: Date, clockOutAt?: Date, breakMinutes = 0) {
  if (!clockInAt || !clockOutAt) return undefined;
  const diff = Math.max(0, +clockOutAt - +clockInAt);
  return Math.max(0, Math.round(diff / 60000) - (breakMinutes || 0));
}

function currentWeekWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay()); // Sunday as week start
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end, today: now };
}

async function logAudit(sessionId: string, actor: AuthUser, action: string, payload?: any, fromStatus?: string, toStatus?: string, note?: string) {
  await TimesheetAudit.create({
    sessionId,
    actorId: actor.id,
    actorEmail: (actor as any).email || "",
    action,
    payload,
    fromStatus,
    toStatus,
    note,
  });
}

function buildAnomalies(session: any, user: any) {
  const anomalies: string[] = [];

  const start = session.clockInAt ? new Date(session.clockInAt) : null;
  const end = session.clockOutAt ? new Date(session.clockOutAt) : null;
  const minutes = session.totalMinutes ?? computeMinutes(start || undefined, end || undefined, session.breakMinutes);

  if (user?.shiftType && start) {
    const expectedStart = new Date(start);
    if (user.shiftType === "MORNING") expectedStart.setHours(6, 0, 0, 0);
    else if (user.shiftType === "AFTERNOON") expectedStart.setHours(14, 0, 0, 0);
    else expectedStart.setHours(22, 0, 0, 0);

    const delta = Math.abs(+start - +expectedStart) / 60000;
    if (delta > 15) anomalies.push("start_offset");
  }

  if (minutes != null) {
    if (minutes < 300) anomalies.push("short_shift");
    if (minutes > 720) anomalies.push("long_shift");
  }

  if (session.pendingEdit?.clockInAt || session.pendingEdit?.clockOutAt) {
    anomalies.push("pending_edit");
  }

  return anomalies;
}

// -------------------------
// Controllers
// -------------------------
export async function getMyTimesheets(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });
  const { start, end } = parseRange(req.query.from, req.query.to);
  const userId = auth.id;
  const sessions = await ClockSession.find({
    userId,
    clockInAt: { $gte: start, $lte: end },
  }).sort({ clockInAt: -1 });

  const user = await User.findById(userId).lean();
  const data = sessions.map((s) => ({
    ...s.toObject(),
    anomalies: buildAnomalies(s, user),
  }));

  res.json(data);
}

export async function getPendingTimesheets(req: Request, res: Response) {
  const { start, end } = parseRange(req.query.from, req.query.to);
  const status = (req.query.status as string) || "submitted";
  const { userId } = req.query;

  const query: any = {
    clockInAt: { $gte: start, $lte: end },
    status,
  };
  if (userId) query.userId = userId;

  const sessions = await ClockSession.find(query).sort({ clockInAt: -1 });
  const userIds = sessions.map((s) => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("name email shiftType").lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const data = sessions.map((s) => {
    const u = userMap.get(s.userId.toString());
    return {
      ...s.toObject(),
      user: u,
      anomalies: buildAnomalies(s, u),
    };
  });

  res.json(data);
}

export async function submitEditRequest(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });
  const sessionId = req.params.id;
  const { clockInAt, clockOutAt, breakMinutes, reason } = req.body || {};

  const session = await ClockSession.findById(sessionId);
  if (!session) return res.status(404).json({ error: "not_found" });

  const isOwner = session.userId.toString() === auth.id;
  if (!isOwner && !["manager", "admin"].includes(auth.role)) {
    return res.status(403).json({ error: "forbidden" });
  }

  if (["approved", "paid"].includes(session.status)) {
    return res.status(400).json({ error: "locked", message: "Approved timesheets cannot be edited." });
  }

  session.pendingEdit = {
    clockInAt: clockInAt ? new Date(clockInAt) : session.clockInAt,
    clockOutAt: clockOutAt ? new Date(clockOutAt) : session.clockOutAt,
    breakMinutes: typeof breakMinutes === "number" ? breakMinutes : session.breakMinutes,
    reason: reason || "Edit requested",
    requestedAt: new Date(),
    requestedBy: auth.id as any,
  };
  if (session.status === "approved") {
    session.status = "submitted";
  }
  await session.save();

  await logAudit(session.id, auth, "submit_edit", { clockInAt, clockOutAt, breakMinutes, reason }, session.status);
  res.json(session);
}

export async function approveTimesheet(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });
  const session = await ClockSession.findById(req.params.id);
  if (!session) return res.status(404).json({ error: "not_found" });

  if (session.pendingEdit) {
    session.clockInAt = session.pendingEdit.clockInAt || session.clockInAt;
    session.clockOutAt = session.pendingEdit.clockOutAt || session.clockOutAt;
    session.breakMinutes = session.pendingEdit.breakMinutes ?? session.breakMinutes;
    const start = session.clockInAt ? new Date(session.clockInAt) : undefined;
    const end = session.clockOutAt ? new Date(session.clockOutAt) : undefined;
    session.totalMinutes = computeMinutes(start, end, session.breakMinutes);
    session.pendingEdit = undefined;
  }

  const fromStatus = session.status;
  session.status = "approved";
  session.reviewedAt = new Date();
  session.approverId = auth.id as any;
  session.approverComment = req.body?.comment;
  await session.save();

  await logAudit(session.id, auth, "approve", undefined, fromStatus, "approved", req.body?.comment);
  res.json(session);
}

export async function rejectTimesheet(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });
  const session = await ClockSession.findById(req.params.id);
  if (!session) return res.status(404).json({ error: "not_found" });
  const fromStatus = session.status;
  session.status = "rejected";
  session.reviewedAt = new Date();
  session.approverId = auth.id as any;
  session.approverComment = req.body?.comment;
  await session.save();
  await logAudit(session.id, auth, "reject", undefined, fromStatus, "rejected", req.body?.comment);
  res.json(session);
}

export async function bulkApprove(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });
  const { ids } = req.body as { ids?: string[] };
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "bad_request", message: "ids required" });
  }

  const sessions = await ClockSession.find({ _id: { $in: ids } });
  for (const session of sessions) {
    const fromStatus = session.status;
  if (session.pendingEdit) {
    session.clockInAt = session.pendingEdit.clockInAt || session.clockInAt;
    session.clockOutAt = session.pendingEdit.clockOutAt || session.clockOutAt;
    session.breakMinutes = session.pendingEdit.breakMinutes ?? session.breakMinutes;
    const start = session.clockInAt ? new Date(session.clockInAt) : undefined;
    const end = session.clockOutAt ? new Date(session.clockOutAt) : undefined;
    session.totalMinutes = computeMinutes(start, end, session.breakMinutes);
    session.pendingEdit = undefined;
  }
    session.status = "approved";
    session.reviewedAt = new Date();
    session.approverId = auth.id as any;
    await session.save();
    await logAudit(session.id, auth, "approve", undefined, fromStatus, "approved");
  }

  res.json({ updated: sessions.length });
}

export async function getAuditLog(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });
  const sessionId = req.params.id;
  const session = await ClockSession.findById(sessionId).select("userId");
  if (!session) return res.status(404).json({ error: "not_found" });

  const isOwner = session.userId.toString() === auth.id;
  if (!isOwner && !["manager", "admin"].includes(auth.role)) {
    return res.status(403).json({ error: "forbidden" });
  }

  const events = await TimesheetAudit.find({ sessionId }).sort({ createdAt: -1 });
  res.json(events);
}

export async function createManualTimesheet(req: Request, res: Response) {
  const auth = (req as any).user as AuthUser | undefined;
  if (!auth) return res.status(401).json({ error: "unauthorized" });

  const { clockInAt, clockOutAt, breakMinutes } = req.body || {};
  if (!clockInAt || !clockOutAt) {
    return res.status(400).json({ error: "bad_request", message: "clockInAt and clockOutAt are required." });
  }

  const start = new Date(clockInAt);
  const end = new Date(clockOutAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "bad_request", message: "Invalid date format." });
  }
  if (end <= start) {
    return res.status(400).json({ error: "bad_request", message: "clockOutAt must be after clockInAt." });
  }

  const { start: weekStart, end: weekEnd, today } = currentWeekWindow();
  if (start > today || end > today) {
    return res.status(400).json({ error: "bad_request", message: "Manual timesheets must be in the past." });
  }
  if (start < weekStart || end > weekEnd) {
    return res.status(400).json({ error: "bad_request", message: "Manual timesheets must be within this week." });
  }
  // enforce "day before" semantics: not for today
  const todayDate = new Date(today.toDateString()).getTime();
  const startDateOnly = new Date(start.toDateString()).getTime();
  if (startDateOnly === todayDate) {
    return res.status(400).json({ error: "bad_request", message: "Use clock in/out for today's shift." });
  }

  const breakMins = typeof breakMinutes === "number" ? breakMinutes : 0;
  const totalMinutes = computeMinutes(start, end, breakMins);

  const session = await ClockSession.create({
    userId: auth.id,
    userEmail: (auth as any).email || "",
    clockInAt: start,
    clockOutAt: end,
    breakMinutes: breakMins,
    totalMinutes,
    status: "submitted",
    submittedAt: new Date(),
  });

  await logAudit(session.id, auth, "submit", { manual: true });
  return res.json(session);
}
