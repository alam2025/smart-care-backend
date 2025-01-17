import express from "express";
import { getAllUsers } from "./user.controller.mjs";
import verifyToken from "../../middlewares/auth.mjs";

const router = express.Router();

router.route("/all").get(getAllUsers);

export default router;
