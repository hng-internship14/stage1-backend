import express from "express";
import {
  createProfile,
  getProfiles,
  getProfile,
  deleteProfile,
} from "../controllers/profileController";

const router = express.Router();

router.post("/", createProfile);
router.get("/", getProfiles);
router.get("/:id", getProfile);
router.delete("/:id", deleteProfile);

export default router;