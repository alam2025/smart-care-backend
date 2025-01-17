import express from "express";
import {
  createDonor,
  deleteDonor,
  editDonor,
  getAllDonors,
  getSingleDonor,
} from "./donor.controller.mjs";
import verifyToken from "../../middlewares/auth.mjs";
const router = express.Router();

router.route("/add-donor").post(verifyToken, createDonor);
router.route("/all-donors").get(verifyToken, getAllDonors);
router.route("/single-donor/:uuid").get(verifyToken, getSingleDonor);
router.route("/edit/:uuid").put(verifyToken, editDonor);
router.route("/delete/:uuid").delete(verifyToken, deleteDonor);

export default router;
