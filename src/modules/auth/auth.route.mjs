import express from "express";
import { signUp, login } from "./auth.controller.mjs";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);

export default router;
