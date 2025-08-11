// import express from "express";
// import { login, signUp } from "./auth.controller.mjs";

// const router = express.Router();

// router.route("/sign-up").post(signUp);
// router.route("/login").post(login);

// export default router;
// auth.route.mjs
import express from "express";
import { signUp, login } from "./auth.controller.mjs";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);

export default router;
