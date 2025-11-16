import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../middleware/authJwt";
import { User, ShiftType } from "../models/user.model";

// Extend Request so TypeScript knows there is a user attached by auth middleware
interface AuthRequest extends Request {
  user?: AuthUser;
}

type GeneratedShift = {
  start: Date;
  end: Date;
  notes?: string;
};

function generateShiftsForRange(
  shiftType: ShiftType,
  fromDate: Date,
  toDate: Date
): GeneratedShift[] {
  const shifts: GeneratedShift[] = [];

  // normalize to midnight
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= toDate) {
    const day = cursor.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // Only Monday–Friday
    if (day >= 1 && day <= 5) {
      if (shiftType === "MORNING") {
        const start = new Date(cursor);
        const end = new Date(cursor);

        start.setHours(6, 0, 0, 0);
        end.setHours(14, 0, 0, 0);

        shifts.push({
          start,
          end,
          notes: "Mon–Fri 6:00 AM – 2:00 PM",
        });
      } else if (shiftType === "AFTERNOON") {
        const start = new Date(cursor);
        const end = new Date(cursor);

        start.setHours(14, 0, 0, 0);
        end.setHours(22, 0, 0, 0);

        shifts.push({
          start,
          end,
          notes: "Mon–Fri 2:00 PM – 10:00 PM",
        });
      } else {
        // NIGHT shift: 10 PM → 6 AM next day
        const start = new Date(cursor);
        start.setHours(22, 0, 0, 0);

        const end = new Date(cursor);
        end.setDate(end.getDate() + 1); // next day
        end.setHours(6, 0, 0, 0);

        shifts.push({
          start,
          end,
          notes: "Mon–Fri 10:00 PM – 6:00 AM",
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return shifts;
}

// GET /api/v1/shifts?from&to
// Returns upcoming shifts for the current authenticated user.
export const getShifts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { from, to } = req.query;

    // Default window: today -> today + 14 days
    const now = new Date();
    const defaultFrom = new Date(now.toDateString()); // today at 00:00
    const defaultTo = new Date(defaultFrom);
    defaultTo.setDate(defaultTo.getDate() + 14);

    const fromDate = from ? new Date(String(from)) : defaultFrom;
    const toDate = to ? new Date(String(to)) : defaultTo;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: "invalid_date_range",
        message: "from and to must be valid ISO date strings",
      });
    }

    // 1) Load current user to get shiftType
    const user = await User.findById(req.user.id)
      .select("shiftType")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    if (!user.shiftType) {
      // User has no assigned schedule yet
      return res.json([]);
    }

    const shiftType = user.shiftType as ShiftType;

    // 2) Generate schedule based on fixed pattern
    const generated = generateShiftsForRange(shiftType, fromDate, toDate);

    // 3) Map to the DTO the mobile app expects
    const result = generated.map((s, index) => ({
      id: `${req.user!.id}-${s.start.toISOString()}-${index}`,
      start: s.start,
      end: s.end,
      notes: s.notes,
    }));

    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
