import { Routes,Route, useLocation } from "react-router-dom";
// Remove the import of ScrollRestoration
import CitiSolveLanding from "./guest/guest.jsx";
import CitizenPortal from "./citizenfolder/citizenportal.jsx";
import Complaint from "./citizenfolder/complaint.jsx";
import SubmitComplaint from "./citizenfolder/submitcomplaint.jsx";
import FAQ from "./citizenfolder/faq.jsx";
import UserGuide from "./citizenfolder/userguide.jsx";
import StaffPortal from "./staffolder/staffportal.jsx";
import DepartmentComplaints from "./staffolder/departmentcomplaints.jsx";
import SupportStaff from "./staffolder/supportstaff.jsx";
import UserGuideStaff from "./staffolder/staffuserguide.jsx";
import FaqStaff from "./staffolder/stafffaq.jsx";
import SearchStaff from "./staffolder/staffsearch.jsx";
import { useEffect } from "react";
import AdminLayout from "./admin/adminportal.jsx";


function App() {
  // Add this hook to listen for location changes
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
    {/* Remove or keep this line commented out: <ScrollRestoration /> */}
    <Routes>
        <Route path="/" element={<CitiSolveLanding />} />
        <Route path="/citizen/home" element={<CitizenPortal />} />
        <Route path="/citizen/complaints" element={<Complaint />} />
        <Route path="/citizen/submit" element = {<SubmitComplaint/>} />
        <Route path="/citizen/faq" element = {<FAQ/>} />
        <Route path="/citizen/userguide" element = {<UserGuide/>} />
        <Route path="/staff/home" element={<StaffPortal />} />
        <Route path="/staff/departmentcomplaints" element={<DepartmentComplaints />} />
        <Route path="/staff/support" element={<SupportStaff />} />
        <Route path="/staff/userguide" element={<UserGuideStaff />} />
        <Route path="/staff/faq" element={<FaqStaff />} />
        <Route path="/staff/search" element={<SearchStaff />} />
        <Route path="/admin/*" element={<AdminLayout />} />
    </Routes>
    </>
  )
}

export default App;