import {supabase} from "../config/supabase.js";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

export const getdepartmentdetails = async()=>{
        const departments = ['roads', 'water', 'power', 'sanitation', 'other'];
        const departmentStats = {};
    
        // Fetch all complaints and staff users in a single query
        const { data: allComplaints, error: complaintsError } = await supabase
          .from('complaints')
          .select('*');
    
        if (complaintsError) {
          console.error("❌ Complaints fetch error:", complaintsError);
          throw new Error("Error fetching complaints data");
        }
    
        const { data: staffUsers, error: usersError } = await supabase
          .from('users')
          .select('department')
          .eq('role', 'staff');
    
        if (usersError) {
          console.error("❌ Users fetch error:", usersError);
          throw new Error("Error fetching staff data");
        }
    
        const allStaff = staffUsers || [];
    
        // Process data for each department
        departments.forEach(deptName => {
          const complaintsForDept = allComplaints.filter(c => c.category === deptName);
          const staffForDept = allStaff.filter(s => s.department === deptName);
    
          const totalComplaints = complaintsForDept.length;
          const pending = complaintsForDept.filter(c => c.status === 'pending').length;
          const resolved = complaintsForDept.filter(c => c.status === 'resolved').length;
          const inProgress = totalComplaints - pending - resolved;
          const staffCount = staffForDept.length;
          
          const resolutionRate = totalComplaints > 0 
            ? Math.round((resolved / totalComplaints) * 100) 
            : 0;
    
          departmentStats[deptName] = {
            totalStaff: staffCount,
            totalComplaints: totalComplaints,
            pending: pending,
            resolved: resolved,
            inProgress: inProgress,
            resolutionRate: resolutionRate,
          };
        });
        return({ departments: departmentStats });
}