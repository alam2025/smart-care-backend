import express from "express";
import { agentJoin, generateToken } from "./agent.controller.mjs";

const router = express.Router();

router.post("/token-2", generateToken);
router.post("/agent-join", agentJoin);

export default router;
