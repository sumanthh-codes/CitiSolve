import express from "express";
import { isAuthenticated } from "../middleware/authmiddleware.js";
import * as citizencontrollers from "../controllers/citizencontrollers.js";
import multer from "multer";
const upload = multer();

const router = express.Router()


router.get("/citizen/complaints/data" ,isAuthenticated, citizencontrollers.getcomplaintstatsforuser);
router.get("/complaints",isAuthenticated,citizencontrollers.getcomplaintsforuser);
router.post("/submit", upload.single("image"),isAuthenticated,citizencontrollers.submitcomplaint);
router.post("/complaints/delete", isAuthenticated, citizencontrollers.deletecomplaint);

export default router;