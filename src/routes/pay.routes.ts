// src/routes/pay.route.ts
import { Router } from "express";
import { authJwt } from "../middleware/authJwt";
import {
  getPayOverview,
  getPayPeriods,
} from "../controllers/pay.controller";

const router = Router();

router.get("/overview", authJwt, getPayOverview);
router.get("/periods", authJwt, getPayPeriods);

export default router;
