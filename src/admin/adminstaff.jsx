import React, { useEffect, useState } from 'react';
import styles from './adminstaffstyle.module.css';

const StaffPage = () => {
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ department: 'all' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const fetchStaffMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department !== 'all') {
        params.append('department', filters.department);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const res = await fetch(`http://localhost:5000/api/auth/admin/staff?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setStaffData(data.staff || []);
      } else {
        console.error('Failed to fetch staff:', data.error);
        setStaffData([]);
      }
    } catch (error) {
      console.error('Error in fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStaffMembers();
    }, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [filters, searchTerm]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (staff) => {
    setSelectedStaff(staff);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/admin/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedStaff.id }),
        credentials: 'include',
      });
      if (res.ok) {
        setStaffData(staffData.filter((s) => s.id !== selectedStaff.id));
        alert('Staff member deleted successfully.');
      } else {
        const data = await res.json();
        alert('Failed to delete staff member: ' + (data.error || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('An error occurred while deleting the staff member.');
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    if (staffData.length === 0) {
      alert('No staff members to export');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Department', 'Assigned Cases', 'Resolved'];
    const csvRows = staffData.map(s => [
      s.id,
      s.name,
      s.email,
      s.department,
      s.assignedCount,
      s.resolvedCount
    ]);
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `staff_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="7" className={styles.loadingCell}>
            <div className={styles.spinner}></div>
            <p>Loading staff members...</p>
          </td>
        </tr>
      );
    }
    if (staffData.length === 0) {
      return (
        <tr>
          <td colSpan="7" className={styles.noDataCell}>
            No staff members found
          </td>
        </tr>
      );
    }
    return staffData.map((staff) => (
      <tr key={staff.id}>
        <td data-label="ID">
          <strong>{staff.id}</strong>
        </td>
        <td data-label="Name" className={styles.truncatedText} title={staff.name}>
          {staff.name}
        </td>
        <td data-label="Email" className={styles.truncatedText} title={staff.email}>
          {staff.email}
        </td>
        <td data-label="Department">{staff.department.charAt(0).toUpperCase() + staff.department.slice(1)}</td>
        <td data-label="Assigned Cases">{staff.assignedCount || 0}</td>
        <td data-label="Resolved">{staff.resolvedCount || 0}</td>
        <td data-label="Actions" className={styles.actionCell}>
          <button className={`${styles.actionBtn} ${styles.view}`} title="View Details" onClick={() => handleViewDetails(staff)}>
            👁️
          </button>
          <button className={`${styles.actionBtn} ${styles.delete}`} title="Delete" onClick={() => handleDeleteClick(staff)}>
            🗑️
          </button>
        </td>
      </tr>
    ));
  };
  
  const getSuccessRate = (resolved, assigned) => {
    if (assigned === 0) {
      return 'N/A';
    }
    const rate = Math.round((resolved / assigned) * 100);
    return `${rate}%`;
  };

  return (
    <div className={styles.contentArea}>
      <div className={styles.pageHeader}>
        <h2>All Staff</h2>
        <div className={styles.pageActions}>
          <button className={styles.btnSecondary} onClick={fetchStaffMembers}>
            🔄 Refresh
          </button>
          <button className={styles.btnSecondary} onClick={handleExportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label>Department:</label>
          <select name="department" className={styles.filterSelect} value={filters.department} onChange={handleFilterChange}>
            <option value="all">All Departments</option>
            <option value="roads">Roads</option>
            <option value="water">Water</option>
            <option value="power">Power</option>
            <option value="sanitation">Sanitation</option>
          </select>
        </div>
        <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="🔍 Search staff..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Assigned Cases</th>
              <th>Resolved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>
      {showDetailModal && selectedStaff && (
        <div className={styles.modalBackdrop} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Staff Details</h3>
              <button className={styles.closeBtn} onClick={() => setShowDetailModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>ID:</strong>
                  <span>{selectedStaff.id}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Name:</strong>
                  <span>{selectedStaff.name}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Email:</strong>
                  <span>{selectedStaff.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Department:</strong>
                  <span>{selectedStaff.department.charAt(0).toUpperCase() + selectedStaff.department.slice(1)}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Assigned Cases:</strong>
                  <span>{selectedStaff.assignedCount || 0}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Resolved Cases:</strong>
                  <span>{selectedStaff.resolvedCount || 0}</span>
                </div>
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <strong>Success Rate:</strong>
                  <span className={styles.successRateValue}>
                    {getSuccessRate(selectedStaff.resolvedCount, selectedStaff.assignedCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && selectedStaff && (
        <div className={styles.modalBackdrop} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Confirm Deletion</h3>
              <button className={styles.closeBtn} onClick={() => setShowConfirmModal(false)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete staff member **{selectedStaff.name}**?</p>
              <div className={styles.modalActions}>
                <button className={styles.btnSecondary} onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className={styles.btnDanger} onClick={handleConfirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;