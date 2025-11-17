import { Router } from "express";
import {
  getShifts
} from "../controllers/schedule.controller";
import { authJwt } from "../middleware/authJwt";

const router = Router();

// GET /api/v1/shifts?from&to
router.get("/", authJwt, getShifts);

export default router;
