import session from "express-session";
import * as usermodal from "../models/complaints.js";
import * as usermodal2 from "../models/usermodel.js";
import * as usermodal3 from "../models/departmentdetails.js";
import bcrypt from "bcrypt";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";

export const admincomplaints = async (req, res) => {
  try{
    const complaints = await usermodal.getadmincomplaints();
    return res.status(200).json(complaints);
  }catch(err){
    console.error("❌ Admin complaints error:", err.message);
    res.status(500).json({ error: "Server error" });
  };
}

export const admincomplaintsallocation = async (req, res) => {
  try{
    const complaints = await usermodal.getadmincomplaintsallocation();
    return res.status(200).json(complaints);
  }catch(err){
    console.error("❌ Admin complaints error:", err.message);
    res.status(500).json({ error: "Server error" });
  };
}

export const admincomplaintsallocate = async (req, res) => {
  try{
    const complaints = await usermodal.getadmincomplaintsallocate(req.body.complaintId,req.body.staffId);
    return res.status(200).json(complaints);
  }catch(err){
    console.error("❌ Admin complaints error:", err.message);
    res.status(500).json({ error: "Server error" });
  };
}

export const admincomplaintsedit = async (req, res) => {
    const complaintId = req.body.id;
    const editform = req.body.editForm;
    
    if (!complaintId || !editform) {
    return res.status(400).json({ message: "Missing complaint ID or edit data" });
  }
  
  const statusOptions = ['pending', 'progress', 'resolved'];
  const status = editform.status;
  
  if (!statusOptions.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  
  if (status === 'resolved') {
    editform.resolved_on = new Date().toISOString();
    editform.resolvedby_id = req.session.userId;
    editform.resolvedby_name = req.session.userFullname;
  }
  try{
    const complaints = await usermodal.docomplaintsedit(complaintId,editform);
    return res.status(200).json(complaints);
  }catch(err){
    console.error("❌ Admin complaints edit error:", err.message);
    res.status(500).json({ error: "Server error" });
  };
}

export const adminusersdelete = async(req,res)=>{
     const userid = req.body.id;
      try {
        const user = await usermodal2.deleteuser(userid); 
        res.status(201).json(user);
      } catch (err) {
        console.error("❌ DB error:", err.message);
        res.status(500).json({ message: "Error deleting user" });
      }
}

export const admingetdepartments = async(req,res)=>{
      try {
        const data = await usermodal3.getdepartmentdetails(); 
        res.status(201).json(data);
      } catch (err) {
        console.error("❌ DB error:", err.message);
        res.status(500).json({ message: "Error getting department details" });
      }
}

export const getstaffdetails = async(req,res)=>{
    try {
        const department = req.query.department || 'all';
        const search = req.query.search?.toLowerCase() || '';
        const data = await usermodal2.getstaff(department,search);
        res.status(201).json(data);
      } catch (err) {
        console.error("❌ Staff list error:", err.mesage);
        res.status(500).json({ error: "Server error fetching staff members" });
      }
}