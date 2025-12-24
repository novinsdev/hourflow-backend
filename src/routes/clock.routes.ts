import { Router } from "express";
import { authJwt } from "../middleware/authJwt";
import ClockSession from "../models/clockSession.model";

const router = Router();

// GET /api/v1/clock/sessions?from=&to=
router.get("/sessions", authJwt, async (req, res) => {
  try {
    const auth = (req as any).user;
    if (!auth?.id) return res.status(401).json({ error: "unauthorized" });
    const userId = auth.id;
    const { from, to } = req.query;

    const sessions = await ClockSession.find({
      userId,
      clockInAt: {
        $gte: new Date(from as string),
        $lte: new Date(to as string),
      },
    }).sort({ clockInAt: -1 });

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

// POST /api/v1/clock/in
router.post("/in", authJwt, async (req, res) => {
  try {
    const auth = (req as any).user;
    if (!auth?.id) return res.status(401).json({ error: "unauthorized" });
    const userId = auth.id;
    const userEmail = auth.email;

    const open = await ClockSession.findOne({
      userId,
      clockOutAt: null,
      status: "open",
    });

    if (open) {
      return res.status(400).json({ error: "You already have an open session" });
    }

    const session = await ClockSession.create({
      userId,
      userEmail,
      clockInAt: new Date(),
      status: "open",
    });

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clock in" });
  }
});


// POST /api/v1/clock/out
router.post("/out", authJwt, async (req, res) => {
  try {
    const auth = (req as any).user;
    if (!auth?.id) return res.status(401).json({ error: "unauthorized" });
    const userId = auth.id;
    const breakMinutes = typeof req.body?.breakMinutes === "number" ? req.body.breakMinutes : 0;

    const open = await ClockSession.findOne({
      userId,
      clockOutAt: null,
      status: "open",
    });

    if (!open) {
      return res.status(400).json({ error: "No active session to clock out" });
    }

    open.clockOutAt = new Date();

    // auto-calc totalMinutes
    const start = new Date(open.clockInAt).getTime();
    const end = open.clockOutAt.getTime();
    open.breakMinutes = breakMinutes;
    open.totalMinutes = Math.max(0, Math.round((end - start) / 60000) - breakMinutes);

    open.status = "submitted"; // for demo
    open.submittedAt = new Date();

    await open.save();

    res.json(open);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clock out" });
  }
});

export default router;
