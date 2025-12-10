import session from "express-session";
import * as usermodal from "../models/usermodel.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {config} from "../config/config.js";


export const handleLogout = async(req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Logged out successfully" });
  });
};

export const getMe = async(req, res) => {
    try{
        if(!req.session.userId){
            return res.status(401).json({ message: "Not authenticated" });
        }
        return res.status(200).json({ 
            id: req.session.userId,
            role: req.session.role,
            email: req.session.email,
            fullname: req.session.fullname,
            ward: req.session.ward,
            department: req.session.department
         });
    }catch(err){
        console.error("❌ Error fetching user data:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getotp = async(req, res) => {
  const loginData = req.body.email||req.session?.pendingUser?.email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Login data received:', loginData);
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: config.gmail,
            pass: config.app_password, // Gmail App password
        },
    });

    const mailOptions = {
        from: config.gmail,
        to: loginData,
        subject: "Login OTP",
        html:`<h1>Your OTP is <b>${otp}</b></h1><img style="display: block; width: 100%; max-width: 300px; height: auto;" src="https://res.cloudinary.com/dooityhzp/image/upload/v1765341313/CiS_tpditl.jpg"  alt="Ci S" border="0">
        <p>CitiSolve sends a secure, time-bound OTP to verify your identity whenever you log in or sign up. Enter the OTP sent to your email/mobile to proceed.</p>`,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("OTP sent successfully");
        res.json({ success: true, message: "OTP sent successfully!",otp: otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error sending email" });
    }
}

export const handlesubmit = async(req, res) => {
    const { fullname, email, password, ward_department, role } = req.body;
    console.log("🔍 Signup data received:", req.body)
    try{
        const data = await usermodal.checkExistingUser(email);
        if(data){
            return res.status(400).json({ message: "User already exists" });
        }
        let ward = null;
        let department = null;
        if (role==="citizen"){
        ward = ward_department;
        }
        if (role==="staff"||role==="admin"){
        department = ward_department;
        }
        
        // ✅ Store in temporary session (not authenticated yet)
        req.session.pendingUser = {
            role: role,
            email:email,
            fullname:fullname,
            ward: ward,
            department: department
        };
        
        console.log("🔍 Pending user stored in session:", req.sessionID);
        return res.status(201).json({ 
            message: "waiting for conformation"
        });

    }catch(err){
        console.error("❌ Error checking user existence:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const handlelogin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("🔍 Login data received:", req.body);

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required" });
    }

    const data = await usermodal.checkuser(email, password, role);

    if (!data.success) {
      return res.status(data.status || 400).json({ message: data.message });
    }

    // ✅ Store in temporary session (not authenticated yet)
    req.session.pendingUser = {
        id: data.user.id,
        role: data.user.role,
        email: data.user.email,
        fullname: data.user.fullname,
        ward: data.user.ward,
        department: data.user.department
    };

    console.log("✅ Pending user stored in session:", data.user.id);
    return res.status(200).json({ 
        message: "Login successful", 
        data: data.user
    });

  } catch (err) {
    console.error("❌ Error during login:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setsessiondata = async(req, res) => {
    try {
        // ✅ Check if there's a pending user in session
        if (!req.session.pendingUser) {
            return res.status(401).json({ message: "No pending authentication. Please login again." });
        }

        // ✅ Move pending user to active session (OTP verified)
        const pendingUser = req.session.pendingUser;
        
        req.session.userId = pendingUser.id;
        req.session.role = pendingUser.role;
        req.session.email = pendingUser.email;
        req.session.fullname = pendingUser.fullname;
        req.session.ward = pendingUser.ward;
        req.session.department = pendingUser.department;

        // ✅ Clear pending user
        delete req.session.pendingUser;

        // ✅ Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error("❌ Error saving session:", err);
                return res.status(500).json({ message: "Error saving session" });
            }
            console.log("✅ Session data set for user ID:", req.session.userId);
            return res.status(200).json({ message: "Session data set successfully" });
        });

    } catch (err) {
        console.error("❌ Error setting session data:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const createuser = async(req, res) => {
    const { fullname, email,ward_department, role } = req.session.pendingUser;
    const password = req.body.password;
    try{
    const newdata = await usermodal.createuser(fullname, email, password, ward_department, role);
    req.session.pendingUser.id = newdata.id; // Store new user ID in pending session
    return res.status(201).json({ 
        message: "User created successfully",
        user: newdata
     });
    }catch(err){
        console.error("❌ Error creating user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}