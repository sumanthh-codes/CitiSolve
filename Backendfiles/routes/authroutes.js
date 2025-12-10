import express from "express";
import { isAuthenticated } from "../middleware/authmiddleware.js";
import * as authcontrollers from "../controllers/authcontrollers.js";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";
import e from "express";
// import

const router = express.Router();

router.post('/signup', authcontrollers.handlesubmit);
router.post('/login', authcontrollers.handlelogin);
router.get('/logout',authcontrollers.handleLogout);
router.get('/me', isAuthenticated, authcontrollers.getMe);
router.post('/generateotp',authcontrollers.getotp);
router.post('/setsession',authcontrollers.setsessiondata);
router.post('/createuser',authcontrollers.createuser);

export default router;

// ==================== Handlers ====================