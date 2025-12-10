import {supabase} from "../config/supabase.js";
import bcrypt from "bcrypt";

export const checkuser = async (email, password, role) => {
  try {
    console.log("🔐 Login attempt:", { email, role });

    if (!email || !password || !role) {
      return { success: false, status: 400, message: "Email, password, and role are required" };
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Fetch error:", fetchError);
      return { success: false, status: 500, message: "Database error during login" };
    }

    if (!user) {
      return { success: false, status: 401, message: "User not found or invalid role" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { success: false, status: 401, message: "Invalid password" };
    }

    // ✅ Return user data for session creation
    return {
      success: true,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        ward: user.ward,
        department: user.department,
        role: user.role
      }
    };

  } catch (err) {
    console.error("❌ Login error:", err);
    return { success: false, status: 500, message: "Server error during login" };
  }
};


export const createuser = async(fullname, email, password, ward_department, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      fullname,
      email,
      password: hashedPassword,
      role,
      ward: role === "citizen" ? ward_department : null,
      department: role === "staff" ? ward_department : null
    };
    const {data:data, error} = await supabase
    .from('users')
    .insert([userData])
    .select()
    if(error){
        throw new Error(error.message);
    }
    return data[0];
}

export const deleteuser = async(userid)=>{
    let query = supabase
          .from('users')
          .delete()
          .eq('id', userid);
    const { data: User, error } = await query;
    if (error) {
        console.error("❌ Deletion failed", error);
        throw new Error("Error deleting user");
    }
    return({ message: "User deleted successfully" });
}

export const getstaff = async(department,search)=>{
            // Build base query to get staff members with role 'staff'
        let query = supabase
          .from('users')
          .select('id, fullname, email, department, created_at, resolved') // Include resolved count
          .eq('role', 'staff');
    
        if (department !== 'all') {
          query = query.eq('department', department);
        }
    
        // Fetch staff members
        const { data: staffMembers, error } = await query;
    
        if (error) {
          console.error("❌ Staff fetch error:", error);
          throw new Error("Failed to fetch staff members");
        }
    
        // Get unique departments from staff members
        const uniqueDepartments = [...new Set(staffMembers.map(s => s.department))];
    
        // Fetch complaint counts per department
        const assignedCounts = {};
        for (const dept of uniqueDepartments) {
          const { count } = await supabase
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('category', dept);
          assignedCounts[dept] = count || 0;
        }
    
        // Map staff data with counts
        const staffWithCounts = staffMembers.map(staff => {
          const assignedCount = assignedCounts[staff.department] || 0;
          const resolvedCount = staff.resolved || 0;
          return {
            id: staff.id,
            name: staff.fullname,
            email: staff.email,
            department: staff.department,
            created: new Date(staff.created_at).toISOString().split('T')[0],
            assignedCount,
            resolvedCount
          };
        });
    
        // Filter based on search query
        const filteredStaff = staffWithCounts.filter(s =>
          s.name?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.department?.toLowerCase().includes(search) ||
          s.id?.toString().includes(search) ||
          s.assignedCount?.toString().includes(search) ||
          s.resolvedCount?.toString().includes(search)
        );
    
        // Send response
        return({ staff: filteredStaff });
}

export const checkExistingUser = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email') // We only need to know if they exist
      .eq('email', email)
      .maybeSingle(); // Returns null if not found (instead of error)

    if (error) {
      console.error("Database error checking user:", error);
      return null; 
    }

    return data; // Returns the user object if found, or NULL if not found
  } catch (err) {
    console.error("Error in checkExistingUser:", err);
    return null;
  }
};