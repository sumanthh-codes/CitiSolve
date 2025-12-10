import express from "express";
import { isAuthenticated } from "../middleware/authmiddleware.js";
import * as admincontrollers from "../controllers/admincontrollers.js";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";
import e from "express";
// import

const router = express.Router();

router.get("/admin/complaintsallocation",isAuthenticated,admincontrollers.admincomplaintsallocation);
router.post("/admin/complaints/allocate",isAuthenticated,admincontrollers.admincomplaintsallocate);
router.get("/admin/complaints",isAuthenticated,admincontrollers.admincomplaints);
router.get("/admin/complaints/edit",isAuthenticated,admincontrollers.admincomplaintsedit);
router.post("/admin/users/delete",isAuthenticated,admincontrollers.adminusersdelete);
router.get("/admin/departments",isAuthenticated,admincontrollers.admingetdepartments);
router.get("/admin/staff",isAuthenticated,admincontrollers.getstaffdetails);
export default router;