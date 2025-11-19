import { Request, Response } from "express";
import ClockSession from "../models/clockSession.model";
import { User } from "../models/user.model";
import { PAYROLL_CONFIG } from "../config/payroll.config";

// ----------------------------------------------------
//   Helper: compute current biweekly period
// ----------------------------------------------------
function getBiWeeklyPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    const {
        FIRST_PERIOD_END,
        SECOND_PERIOD_END,
        PAY_PROCESSING_DELAY,
    } = PAYROLL_CONFIG;

    let start: Date;
    let end: Date;

    if (day <= FIRST_PERIOD_END) {
        start = new Date(year, month, 1);
        end = new Date(year, month, FIRST_PERIOD_END);
    } else {
        start = new Date(year, month, FIRST_PERIOD_END + 1);
        end = new Date(year, month, SECOND_PERIOD_END);
    }

    const label = `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;

    const nextPayDate = new Date(end);
    nextPayDate.setDate(end.getDate() + PAY_PROCESSING_DELAY);

    return {
        start,
        end,
        label,
        nextPayDate: nextPayDate.toDateString(),
    };
}

// ----------------------------------------------------
//               GET PAY OVERVIEW
// ----------------------------------------------------
export async function getPayOverview(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const hourly = user.hourlyRate ?? 0;

        const { start, end, label, nextPayDate } = getBiWeeklyPeriod();

        const sessions = await ClockSession.find({
            userId,
            clockInAt: { $gte: start, $lte: end },
        });

        let submittedHours = 0;
        let approvedHours = 0;

        for (const s of sessions) {
            const hrs = (s.totalMinutes ?? 0) / 60;

            submittedHours += hrs;

            if (["approved", "paid"].includes(s.status)) {
                approvedHours += hrs;
            }
        }

        const estimatedPay = submittedHours * hourly;

        // -------------------------
        // Year-to-date
        // -------------------------
        const ytdStart = new Date(new Date().getFullYear(), 0, 1);

        const ytdSessions = await ClockSession.find({
            userId,
            clockInAt: { $gte: ytdStart },
        });

        let ytdHours = 0;
        for (const s of ytdSessions) {
            ytdHours += (s.totalMinutes ?? 0) / 60;
        }

        return res.json({
            nextPayDate,
            frequency: "Every 2 weeks",
            currentPeriodLabel: label,
            approvedHours,
            submittedHours,
            estimatedPay: Math.round(estimatedPay),
            ytdHours,
            ytdEstimatedPay: Math.round(ytdHours * hourly),
        });
    } catch (e) {
        console.error("getPayOverview error:", e);
        return res.status(500).json({ error: "server_error" });
    }
}

// ----------------------------------------------------
//            GET RECENT PAY PERIODS
// ----------------------------------------------------
export async function getPayPeriods(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;

        const user = await User.findById(userId);
        const hourly =
            user?.hourlyRate ?? 0;

        const { HISTORY_PERIODS } = PAYROLL_CONFIG;

        const now = new Date();
        const periods: any[] = [];

        for (let i = 1; i <= HISTORY_PERIODS; i++) {
            const end = new Date(now);
            end.setDate(end.getDate() - 14 * i);

            const start = new Date(end);
            start.setDate(start.getDate() - 13);

            const sessions = await ClockSession.find({
                userId,
                clockInAt: { $gte: start, $lte: end },
            });

            let hours = 0;
            for (const s of sessions) {
                hours += (s.totalMinutes ?? 0) / 60;
            }

            periods.push({
                id: `p${i}`,
                label: `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`,
                status: "Paid",
                hours,
                estimatedPay: Math.round(hours * hourly),
            });
        }
        return res.json({ periods });
    } catch (e) {
        console.error("getPayPeriods error:", e);
        return res.status(500).json({ error: "server_error" });
    }
}
