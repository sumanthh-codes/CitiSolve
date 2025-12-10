import express from "express";
import { isAuthenticated } from "../middleware/authmiddleware.js";
import * as staffcontrollers from "../controllers/staffcontrollers.js";
import multer from "multer";
const upload = multer();

const router = express.Router()


router.get("/staff/complaints" ,isAuthenticated, staffcontrollers.getstaffcomplaints);
router.put("/staff/complaints/:complaintId",isAuthenticated, staffcontrollers.updatecomplaint);
// router.get("/complaints",isAuthenticated,citizencontrollers.getcomplaintsforuser);
// router.post("/submit", upload.single("image"),isAuthenticated,citizencontrollers.submitcomplaint);

export default router;