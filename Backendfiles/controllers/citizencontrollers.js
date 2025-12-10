import session from "express-session";
import * as usermodal from "../models/complaints.js";
import bcrypt from "bcrypt";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";


export const getcomplaintstatsforuser = async(req, res)=>{
    const userId = req.session.userId;
    console.log("📋 Fetching complaints data for user:", userId);

    try{
        const stats = await usermodal.getcomplaintstatsforuser(userId)
        
        res.json(stats);
        
    }catch(error){
        console.log("❌ Error fetching complaint stats :", error)
        console.error("Error fetching complaint stats")
    }
}

export const getcomplaintsforuser = async(req,res)=>{
    const userId = req.session.userId;
    console.log("📋 Fetching complaints data for user:", userId);
    try{
        const stats = await usermodal.getcomplaintforuser(userId)
        
        res.json(stats);
        
    }catch(error){
        console.log("❌ Error fetching complaint stats :", error)
        console.error("Error fetching complaint stats")
    }
}

export const submitcomplaint = async (req, res) => {
    const { title, category, location, description, priority, status } = req.body;
    const userId = req.session.userId;
    const userEmail = req.session.email;
    const file = req.file;
    const details = {
        title : req.body.title,
        category : req.body.title,
        location : req.body.title,
        description : req.body.title,
        priority : req.body.priority,
        status : req.body.status,
        userId : userId,
        userEmail : userEmail,
    }

    console.log("📝 Complaint submission from user:", userId);
    console.log("📎 File received:", file ? file.originalname : "No file");

    if (!file) {
        return res.status(400).json({ message: "Image is required" });
    }

    if (!title || !category || !location || !description) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const setcomplaint = await usermodal.submitnewcomplaint(req.file,details)

        console.log("✅ Complaint submitted:", setcomplaint.id);

        res.status(201).json({
            message: "Complaint submitted successfully",
            complaint: setcomplaint
        });
    } catch (err) {
        console.error("❌ Complaint submission error:", err);
        res.status(500).json({ 
            message: "Error submitting complaint",
            error: err.message 
        });
    }
};

export const deletecomplaint = async (req, res) => {
  const compid = req.body.id;
  const userId = req.session.userId;

  try {

    const data = await usermodal.deletedbcomplaint(compid)
    if(data){
        res.status(201).json(data)
    }
    // First, fetch the complaint to check if it's resolved and who resolved it
    

  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ message: "Error deleting complaint" });
  }
}
