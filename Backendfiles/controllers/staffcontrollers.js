import * as usermodal from "../models/complaints.js";
import session from "express-session";

export const getstaffcomplaints = async (req,res)=>{
  const userId = req.session.userId;

  try {
    const data = await usermodal.departmentcomplaints(userId);

    res.status(200).json(data);

  } catch (err) {
    console.error("❌ Staff complaints error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updatecomplaint = async (req,res)=>{
      const { complaintId } = req.params;
      const { status } = req.body;
      const userId = req.session.userId;
      const userFullname = req.session.userFullname;
    
      // Validate status
      const validStatuses = ['pending', 'progress', 'resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
    
      try {
        // Get user info to verify permissions
        const data = await usermodal.updatecomplaint(complaintId,status,userId,userFullname);
        if(data){
        res.status(200).json(data);
        }
    
      } catch (err) {
        console.error("❌ Update complaint error:", err);
        res.status(500).json({ error: "Server error" });
      }
}