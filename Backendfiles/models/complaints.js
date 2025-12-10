import {supabase} from "../config/supabase.js";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
const upload = multer();
import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

export const getcomplaintstatsforuser = async (userId)=>{
    const { data: total1, error: checkError } = await supabase
          .from('complaints')
          .select('*')
          .eq('user_id', userId);
    if(checkError){
        throw new Error(checkError.message)
    }
    const total = total1.length;
    const pending = total1.filter(p=>p.status=='pending').length;
    const progress = total1.filter(p=>p.status==='progress').length;
    const resolved = total1.filter(p=>p.status==='resolved').length;
    const water = total1.filter(p=>p.category==='water').length;
    const road = total1.filter(p=>p.category=='roads').length;
    const power = total1.filter(p=>p.category==='power').length;
    const sanitation = total1.filter(p=>p.category==='sanitation').length;
    const other = total1.filter(p=>p.category==='other').length;

    return ({
      totalcomplaints : total,
      resolved:resolved,
      pending:pending,
      inprogress:progress,
      roads : road,
      water : water,
      power : power,
      sanitation : sanitation,
      other : other,
    });
}

export const getcomplaintforuser = async (userId)=>{
        let query = supabase
          .from('complaints')
          .select('*')
          .eq('user_id', userId);
    
        // Sort by newest first
        query = query.order('created_at', { ascending: false });
    
        const { data: allComplaints, error } = await query;
    
        if (error) {
          throw new Error(error.message);
        }    
        // Apply search filter if query exists
        let complaints = allComplaints || [];
        return({
          complaints
        });
}

export const submitnewcomplaint = async (file,complaintdata)=>{
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
        const { error: uploadError } = await supabase.storage
            .from("complaints")
            .upload(`images/${fileName}`, file.buffer, {
                contentType: file.mimetype,
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // Get public URL
        const publicUrl = supabase.storage
            .from("complaints")
            .getPublicUrl(`images/${fileName}`).data.publicUrl;
        
        console.log("✅ Image uploaded:", publicUrl);

        // Insert the complaint data
        const { data: complaintData, error: complaintError } = await supabase
            .from('complaints')
            .insert([{
                user_id: complaintdata.userId,
                user_email: complaintdata.userEmail,
                title : complaintdata.title,
                category : complaintdata.category,
                location : complaintdata.location,
                description : complaintdata.description,
                priority: complaintdata.priority || "medium",
                status: complaintdata.status || "pending",
                imageurl: publicUrl,
            }])
            .select()
            .single();

        if (complaintError) {
            throw new Error(complaintError);
        }

        return ({complaintData});
}

// Backendfiles/models/complaints.js

export const departmentcomplaints = async (id)=>{
    
    // Get user info to check role and department
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, department')
      .eq('id', id)
      .single();

    if (userError || !user) {
      // THROW INSTEAD OF SENDING RESPONSE
      throw new Error("Failed to fetch user info: " + (userError?.message || 'User not found'));
    }

    // Build query based on role
    let query = supabase.from('complaints').select('*');
    
    // If not admin, filter by department
    query = query.eq('assignedtoid', user.id);

    // Sort by date (newest first)
    query = query.order('created_at', { ascending: false });

    // Execute the query
    const { data: complaints, error: complaintsError } = await query;

    if (complaintsError) {
      // THROW INSTEAD OF SENDING RESPONSE
      throw new Error("Failed to fetch complaints: " + complaintsError.message);
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
      // The output format is DD/MM/YYYY
      date: new Date(c.created_at).toLocaleDateString('en-IN'), 
      department: c.category, // category is used as department
    }));

    return ({ complaints: formattedComplaints,total:total,pending:pending,resolved:resolved,inprogress:inprogress });
}

export const updatecomplaint = async(id,status,userId,userFullname)=>{
    const { data: user } = await supabase
          .from('users')
          .select('role, department')
          .eq('id', userId)
          .single();
    
        // Get the complaint to check if staff has permission
        const { data: complaint } = await supabase
          .from('complaints')
          .select('category')
          .eq('id', id)
          .single();
    
        
    
        if (!complaint) {
          return res.status(404).json({ error: "Complaint not found" });
        }
    
        // Check permissions: staff can only update their department complaints
        if (user.role === 'staff' && complaint.category !== user.department) {
          throw new Error("You can only update complaints from your department" );
        }
        // Prepare update object
        const updateData = { status: status };
        const { data: staff } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        const resolved = staff.resolved || 0;
        // If complaint is being resolved, increment staff's resolved count
        if (status === "resolved") {
          const { error: updateError } = await supabase
            .from('users')
            .update({ resolved: resolved + 1 })
            .eq('id', userId);
          if (updateError) {
            console.error("❌ Staff resolved count update error:", updateError);
            throw new Error("Failed to update staff resolved count" );
          }
        }
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
          .eq('id', id)
          .select()
          .single();
    
        if (updateError) {
          console.error("❌ Update error:", updateError);
          throw new Error("Failed to update complaint" );
        }

        return({
            message : "complaint status updated succesfully",
            complaint: updatedComplaint,

        })

        

}

export const deletedbcomplaint = async(compid)=>{
    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('status, resolvedby_id')
      .eq('id', compid)
      .single();

    if (fetchError) {
      console.error("❌ Fetch complaint error:", fetchError);
      throw new Error("Error fetching complaint");
    }

    if (!complaint) {
      throw new Error("Complaint not found");
    }

    // If complaint is resolved and has a resolver, decrement their resolved count
    if (complaint.status === 'resolved' && complaint.resolvedby_id) {
      const resolverUserId = complaint.resolvedby_id;
      
      // Get the current resolved count for the resolver
      const { data: resolverUser, error: userFetchError } = await supabase
        .from('users')
        .select('resolved')
        .eq('id', resolverUserId)
        .single();

      if (userFetchError) {
        console.error("❌ Error fetching resolver user:", userFetchError);
        // Continue with deletion even if we can't update the count
      } else {
        const currentResolved = resolverUser.resolved || 0;
        const newResolvedCount = Math.max(0, currentResolved - 1); // Ensure it doesn't go below 0

        // Decrement the resolved count
        const { error: updateError } = await supabase
          .from('users')
          .update({ resolved: newResolvedCount })
          .eq('id', resolverUserId);

        if (updateError) {
          console.error("❌ Error updating resolver's resolved count:", updateError);
          // Continue with deletion even if count update fails
        } else {
          console.log(`✅ Decremented resolved count for user ${resolverUserId}: ${currentResolved} -> ${newResolvedCount}`);
        }
      }
    }

    // Now delete the complaint
    const { error: deleteError } = await supabase
      .from('complaints')
      .delete()
      .eq('id', compid);

    if (deleteError) {
      console.error("❌ Deletion failed:", deleteError);
      return res.status(500).json({ message: "Error deleting complaint" });
    }
    return({
            message :`✅ Complaint ${compid} deleted successfully`,
        })
    

}

export const getadmincomplaints = async()=>{
      const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
      if(error){
        throw new Error("error fetching complaints");
      }
  
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
        throw new Error("Error fetching data");
      }
      const totalusers = users.length;
      const staff = users.filter(u => u.role === 'staff').length;
      const citizens = users.filter(u => u.role === 'citizen').length;
  
      return({
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
    // console.error("❌ Admin complaints error:", err);
    // res.status(500).json({ error: "Server error" });

}

export const getadmincomplaintsallocation = async()=>{
      const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('status','pending')
      .order('created_at', { ascending: false });
      if(error){
        throw new Error("error fetching complaints");
      }

      const {data :users,error1} = await supabase
      .from('users')
      .select('*');
      if(error || error1){
        throw new Error("Error fetching data");
      }
  
      return({
        complaints: complaints,
        users: users,
      });
    // console.error("❌ Admin complaints error:", err);
    // res.status(500).json({ error: "Server error" });

}

// Backendfiles/models/complaints.js

export const getadmincomplaintsallocate = async(compid,staffid)=>{

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('fullname')
        .eq('id',staffid)
        .single(); // Use single() to get a single object

      if (userError || !user) {
        throw new Error("Staff user not found");
      }
      
      const assignedtoname = user.fullname; // Extract the string value

      const { data: complaints, error } = await supabase
      .from('complaints')
      .update({
        assignedtoid: staffid,
        assignedtoname: assignedtoname, // Use the extracted string here
        status: 'progress'
      })
      .eq('id',compid)
      .select(); // Corrected update and select syntax

      if(error){
        console.error("❌ Allocation update error:", error); // Added logging
        throw new Error("Error updating complaint allocation");
      }

      return({
        complaints: complaints,
      });
}

export const docomplaintsedit = async(complaintId,editform)=>{
      const { data: complaint, error } = await supabase
        .from('complaints')
        .update(editform)
        .eq('id', complaintId)
        .select()
        .single();
      
      if (error) {
        console.error("❌ Update error:", error);
        throw new Error("Error updating complaint");
      }
      const status = editform.status;
      
      // If status is resolved, increment the resolved count for the user
      if (status === 'resolved') {
        // Fetch current user data
        const { data: userData, error: fetchError } = await supabase
          .from('users') // Replace with your actual users table name
          .select('resolved')
          .eq('id', req.session.userId)
          .single();
        
        if (fetchError) {
          throw new Error("❌ User fetch error:", fetchError);
        } else {
          // Increment and update
          const newResolvedCount = (userData.resolved || 0) + 1;
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({ resolved: newResolvedCount })
            .eq('id', req.session.userId);
          
          if (userUpdateError) {
            console.error("❌ User update error:", userUpdateError);
          }
        }
      }
      
      res.status(200).json({ complaint });
}

// Ensure the try...catch block at the bottom of departmentcomplaints is completely removed.