import express from "express";
import {
  createProfile,
  getProfiles,
  getProfile,
  deleteProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/profiles", createProfile);
router.get("/profiles", getProfiles);
router.get("/profiles/:id", getProfile);
router.delete("/profiles/:id", deleteProfile);

export default router;