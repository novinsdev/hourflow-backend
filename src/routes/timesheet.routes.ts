import { Router } from "express";
import { authJwt, roleGuard } from "../middleware/authJwt";
import {
  getMyTimesheets,
  getPendingTimesheets,
  submitEditRequest,
  approveTimesheet,
  rejectTimesheet,
  bulkApprove,
  getAuditLog,
} from "../controllers/timesheet.controller";

const router = Router();

router.get("/", authJwt, getMyTimesheets);
router.get("/pending", authJwt, roleGuard("manager", "admin"), getPendingTimesheets);
router.post("/:id/submit-edit", authJwt, submitEditRequest);
router.post("/:id/approve", authJwt, roleGuard("manager", "admin"), approveTimesheet);
router.post("/:id/reject", authJwt, roleGuard("manager", "admin"), rejectTimesheet);
router.post("/bulk-approve", authJwt, roleGuard("manager", "admin"), bulkApprove);
router.get("/:id/audit", authJwt, getAuditLog);

export default router;
