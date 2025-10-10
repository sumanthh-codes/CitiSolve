import express from "express";
import bodyParser from "body-parser";
import {supabase} from './supabase.js';
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== Authentication Routes ====================

// SIGNUP - Supabase version
router.post("/signup", async (req, res) => {
  const { fullname, email, password, ward_department, role } = req.body;

  console.log("📝 Signup request:", { fullname, email, ward_department, role });

  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Check error:", checkError);
      return res.status(500).json({ message: "Error checking existing user" });
    }

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      fullname,
      email,
      password: hashedPassword,
      role,
      ward: role === "citizen" ? ward_department : null,
      department: role === "staff" ? ward_department : null
    };

    console.log("📤 Inserting user:", userData);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Insert error:", insertError);
      return res.status(500).json({ 
        message: "Server error during signup",
        error: insertError.message 
      });
    }

    console.log("✅ User created:", newUser);

    // Store user info in session
    req.session.userId = newUser.id;
    req.session.userRole = newUser.role;
    req.session.userEmail = newUser.email;
    req.session.userFullname = newUser.fullname;
    req.session.userWard = newUser.ward;
    req.session.userDepartment = newUser.department;

    console.log("✅ Session created for user:", req.session.userId);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        fullname: newUser.fullname,
        email: newUser.email,
        ward: newUser.ward,
        department: newUser.department,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ 
      message: "Server error during signup",
      error: err.message 
    });
  }
});

// LOGIN - Supabase version
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("🔐 Login attempt:", { email, role });

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required" });
  }

  try {
    // Find user by email and role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', role)
      .maybeSingle();

    if (fetchError) {
      console.error("❌ Fetch error:", fetchError);
      return res.status(500).json({ message: "Database error during login" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or role" });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Store user in session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userEmail = user.email;
    req.session.userFullname = user.fullname;
    req.session.userWard = user.ward;
    req.session.userDepartment = user.department;

    console.log("✅ Session created for user:", req.session.userId);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        ward: user.ward,
        department: user.department,
        role: user.role
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Logout error:", err);
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// GET CURRENT USER SESSION
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.status(200).json({
    user: {
      id: req.session.userId,
      fullname: req.session.userFullname,
      email: req.session.userEmail,
      ward: req.session.userWard,
      department: req.session.userDepartment,
      role: req.session.userRole
    }
  });
});

// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  console.log("🔍 Checking authentication, userId:", req.session.userId);
  
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated. Please login." });
  }
};

// Handle complaint submission - Now uses session
router.post("/submit",upload.single("image"), isAuthenticated, async (req, res) => {
  const { title, category, location, description, priority, status } = req.body;
  const userId = req.session.userId; // Get from session
  const userEmail = req.session.userEmail; // Get from session
  let imageurl = null;
  const file = req.file; // Access the uploaded file

  console.log("📝 Complaint submission from user:", userId);
  if (file) {
    const { data, error } = await supabase.storage
      .from("complaints")
      .upload(`images/${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    imageurl = supabase.storage
      .from("complaints")
      .getPublicUrl(`images/${file.originalname}`).data.publicUrl;
  }

  if (!title || !category || !location || !description) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        user_id: userId,
        user_email: userEmail,
        title,
        category,
        location,
        description,
        priority: priority || "medium",
        status: status || "pending",
        imageurl:imageurl,
        
      }])
      .select()
      .single();

    if (error) {
      console.error("❌ Complaint insert error:", error);
      return res.status(500).json({ message: "Error submitting complaint" });
    }

    console.log("✅ Complaint submitted:", data.id);

    res.status(201).json({ 
      message: "Complaint submitted successfully",
      complaint: data
    });
  } catch (err) {
    console.error("❌ Complaint insert error:", err);
    res.status(500).json({ message: "Error submitting complaint" });
  }
});

// Get user's complaints
router.get("/complaints", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  console.log("📋 Fetching complaints for user:", userId);

  try {
    // Build query based on role
    let query = supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId);

    // Sort by newest first
    query = query.order('created_at', { ascending: false });

    const { data: allComplaints, error } = await query;

    if (error) {
      console.error("❌ Fetch complaints error:", error);
      return res.status(500).json({ message: "Error fetching complaints" });
    }

    // Apply search filter if query exists
    let complaints = allComplaints || [];
    res.status(200).json({
      complaints
    });

  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ message: "Error fetching complaints" });
  }
});

router.post("/complaints/delete", isAuthenticated, async (req, res) => {
  const compid = req.body.id;

  try {
    // Build query based on role
    let query = supabase
      .from('complaints')
      .delete()
      .eq('id', compid);

    const { data: Complaint, error } = await query;
    res.status(200).json({ message: "Complaint deleted successfully" });

    if (error) {
      console.error("❌ Deletion failed", error);
      return res.status(500).json({ message: "Error deleting complaints" });
    }

  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ message: "Error deleting complaints" });
  }
});

router.get("/complaints/data", isAuthenticated, async (req, res)=>{
  const userId = req.session.userId;
  console.log("📋 Fetching complaints data for user:", userId);
  try {
    // Build query based on role
    const { data: total1, error: checkError } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId);

    const { data: pending1, error: checkError2 } = await supabase
      .from('complaints')
      .select('*')
      .eq('status', 'pending')
      .eq('user_id', userId);

    const { data: resolved1, error: checkError3 }= await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'resolved');

    const { data: inprogress1, error: checkError4 }= await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'inprogress');

    const { data: water1, error: checkError5 } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'water')

    const { data: roads1, error: checkError6 } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('category', "roads")

    const { data: power1, error: checkError7 } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'power')

    const { data: sanitation1, error: checkError8 } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'sanitation')

    const { data: other1, error: checkError9 } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'other')
    res.status(200).json ({
      totalcomplaints : total1.length,
      resolved:resolved1.length,
      pending:pending1.length,
      inprogress:inprogress1.length,
      roads : roads1.length,
      water : water1.length,
      power : power1.length,
      sanitation : sanitation1.length,
      other : other1.length,
    });

  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ message: "Error fetching complaints" });
  }
})

router.get("/staff/complaints", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    // Get user info to check role and department
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, department')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(500).json({ error: "Failed to fetch user info" });
    }

    // Build query based on role
    let query = supabase.from('complaints').select('*');
    
    // If not admin, filter by department
    
    query = query.eq('category', user.department);

    // Sort by date (newest first)
    query = query.order('created_at', { ascending: false });

    // Execute the query
    const { data: complaints, error: complaintsError } = await query;

    if (complaintsError) {
      console.error("❌ Complaints fetch error:", complaintsError);
      return res.status(500).json({ error: "Failed to fetch complaints" });
    }
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const inprogress = complaints.filter(c => c.status === 'progress').length;
    // Format the data to match frontend expectations
    const formattedComplaints = complaints.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category,
      location: c.location,
      description: c.description,
      priority: c.priority,
      status: c.status,
      date: new Date(c.created_at).toLocaleDateString('en-IN'),
      department: c.category, // category is used as department
    }));

    res.status(200).json({ complaints: formattedComplaints,total:total,pending:pending,resolved:resolved,inprogress:inprogress });

  } catch (err) {
    console.error("❌ Staff complaints error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/staff/complaints/:complaintId",isAuthenticated, async (req, res) => {
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
    const { data: user } = await supabase
      .from('users')
      .select('role, department')
      .eq('id', userId)
      .single();

    // Get the complaint to check if staff has permission
    const { data: complaint } = await supabase
      .from('complaints')
      .select('category')
      .eq('id', complaintId)
      .single();

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Check permissions: staff can only update their department complaints
    if (user.role === 'staff' && complaint.category !== user.department) {
      return res.status(403).json({ error: "You can only update complaints from your department" });
    }
    // Prepare update object
    const updateData = { status: status };

    // If status is resolved, add additional fields
    if (status === "resolved") {
      updateData.resolvedby_id = userId;
      updateData.resolvedby_name = userFullname;
      updateData.resolved_on = new Date().toISOString();
      }

    // Update the complaint status
    const { data: updatedComplaint, error: updateError } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Update error:", updateError);
      return res.status(500).json({ error: "Failed to update complaint" });
    }

    res.status(200).json({
      message: "Complaint status updated successfully",
      complaint: updatedComplaint
    });

  } catch (err) {
    console.error("❌ Update complaint error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/support", isAuthenticated, async (req, res) => {
  const { subject, category, message } = req.body;
  const userId = req.session.userId;

  if (!subject || !category || !message) {
    return res.status(400).send("❌ Please fill in all fields");
  }

  try {
    // Get staff user email and name
    const { data: user } = await supabase
      .from('users')
      .select('email, fullname')
      .eq('id', userId)
      .single();

    const userEmail = user.email;
    const userName = user.fullname;

    // Insert into support messages table
    const { error: insertError } = await supabase
      .from('supportmessages')
      .insert([{
        user_id: userId,
        user_email: userEmail,
        name: userName,
        subject: `[${category.toUpperCase()}] ${subject}`,
        message: message
      }]);

    if (insertError) {
      console.error("❌ Support insert error:", insertError);
      return res.status(500).send("❌ Failed to send message");
    }

    res.send(`✅ Message sent successfully to administrator!`);

  } catch (err) {
    console.error("❌ Support form error:", err);
    res.status(500).send("❌ Something went wrong. Please try again later.");
  }
});

router.get("/admin/complaints", async (req, res) => {
  try{
    const { data: complaints, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inprogress = complaints.filter(c => c.status === 'progress').length;
    const total = complaints.length;
    const roads = complaints.filter(c => c.category === 'roads').length;
    const water = complaints.filter(c => c.category === 'water').length;
    const power = complaints.filter(c => c.category === 'power').length;
    const sanitation = complaints.filter(c => c.category === 'sanitation').length;
    const other = complaints.filter(c => c.category === 'other').length;
    const roadsdata = complaints.filter(c => c.category === 'roads')
    const waterdata = complaints.filter(c => c.category === 'water')
    const powerdata = complaints.filter(c => c.category === 'power')
    const sanitationdata = complaints.filter(c => c.category === 'sanitation')
    const otherdata = complaints.filter(c => c.category === 'other')
    const totaldepartments = (roads>0?1:0) + (water>0?1:0) + (power>0?1:0) + (sanitation>0?1:0) + (other>0?1:0); // Hardcoded for now
    const {data :users,error1} = await supabase
    .from('users')
    .select('*');
    if(error || error1){
      return res.status(500).json({message:"Error fetching data"});
    }
    const totalusers = users.length;
    const staff = users.filter(u => u.role === 'staff').length;
    const citizens = users.filter(u => u.role === 'citizen').length;

    res.status(200).json({
      stats: {
        totalcomplaints: total,
        resolved: resolved,
        pending: pending,
        inprogress: inprogress,
        roads: roads,
        water: water,
        power: power,
        sanitation: sanitation,
        other: other,
        totalusers: totalusers,
        staff: staff,
        citizens: citizens,
        totaldepartments: totaldepartments,
        roadsdata: roadsdata,
        waterdata: waterdata,
        powerdata: powerdata,
        sanitationdata: sanitationdata,
        otherdata: otherdata
      },
      complaints: complaints,
      users: users,
    });
  }catch(err){
    console.error("❌ Admin complaints error:", err);
    res.status(500).json({ error: "Server error" });
  };
});

router.post("/admin/complaints/edit", isAuthenticated, async (req, res) => {
  const complaintId = req.body.id;
  const editform = req.body.editForm;
  if (!complaintId || !editform) {
    return res.status(400).json({ message: "Missing complaint ID or edit data" });
  }
  const statusOptions = ['pending', 'progress', 'resolved'];
  const status = editform.status;
  if (!statusOptions.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });}
  if (status=='resolved'){
    editform.resolved_on = new Date().toISOString();
    editform.resolvedby_id = req.session.userId;
    editform.resolvedby_name = req.session.userFullname;
  }

  try {
    // Fetch the complaint by ID
    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(editform)
      .eq('id', complaintId)
      .select()
      .single();
    if (error) {
      console.error("❌ Fetch error:", error);
      return res.status(500).json({ message: "Error fetching complaint" });
    }
    res.status(200).json({ complaint });
} catch (err) {
    console.error("❌ Fetch complaint x:", err);
    res.status(500).json({ message: "Server error" });
  }
}
)

router.post("/admin/users/delete", isAuthenticated, async (req, res) => {

  const userid = req.body.id;

  try {
    // Build query based on role
    let query = supabase
      .from('users')
      .delete()
      .eq('id', userid);
    const { data: User, error } = await query;
    res.status(200).json({ message: "User deleted successfully" });
    if (error) {
      console.error("❌ Deletion failed", error);
      return res.status(500).json({ message: "Error deleting user" });
    }
  } catch (err) {
    console.error("❌ DB error:", err);
    res.status(500).json({ message: "Error deleting user" });
  }
})

router.post("/admin/users/edit", isAuthenticated, async (req, res) => {
  const userid = req.body.id;
  const editform = req.body.editForm;
  if (!userid || !editform) {
    return res.status(400).json({ message: "Missing user ID or edit data" });
  }
  const roleOptions = ['citizen', 'staff'];
  const role = editform.role;
  if (!roleOptions.includes(role)) {
    return res.status(400).json({ message: "Invalid role value" });}
  try {
    // Fetch the complaint by ID
    const { data: user, error } = await supabase
      .from('users')
      .update(editform)
      .eq('id', userid)
      .select()
      .single();
    if (error) {
      console.error("❌ Fetch error:", error);
      return res.status(500).json({ message: "Error fetching user" });
    }
    res.status(200).json({ user });
} catch (err) {
    console.error("❌ Fetch user x:", err);
    res.status(500).json({ message: "Server error" });
  }
})



export default router;