import React, { useEffect, useState } from 'react';
import departmentStyles from './admindepartmentstyles.module.css';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/auth/admin/departments', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        const departmentsArray = Object.entries(data.departments).map(([name, stats]) => ({
          name,
          ...stats,
        }));
        setDepartments(departmentsArray);
      } else {
        console.error('Failed to fetch departments:', data.message);
        setError(data.message);
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error in fetch:', err);
      setError('An error occurred while fetching department data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const getDeptInfo = (name) => {
    const icons = { roads: '🛣️', water: '💧', power: '💡', sanitation: '🗑️', other: '❓' };
    const displayNames = {
      roads: 'Roads & Infrastructure',
      water: 'Water Supply',
      power: 'Power & Electricity',
      sanitation: 'Sanitation & Garbage',
      other: 'Other Complaints',
    };
    return {
      icon: icons[name] || '🏢',
      displayName: displayNames[name] || name.charAt(0).toUpperCase() + name.slice(1),
    };
  };

  const renderDepartments = () => {
    if (loading) {
      return (
        <div className={departmentStyles.loadingSpinner}>
          <div className={departmentStyles.spinner}></div>
          <p>Loading departments...</p>
        </div>
      );
    }

    if (error) {
      return <div className={departmentStyles.noData}>Error: {error}</div>;
    }

    if (departments.length === 0) {
      return <div className={departmentStyles.noData}>No departments found</div>;
    }

    return (
      <div className={departmentStyles.departmentsGrid}>
        {departments.map(dept => {
          const { icon, displayName } = getDeptInfo(dept.name);
          const resolutionRate = dept.resolutionRate;

          return (
            <div key={dept.name} className={departmentStyles.departmentCard}>
              <div className={departmentStyles.deptHeader}>
                <h3><span className={departmentStyles.deptIcon}>{icon}</span> {displayName}</h3>
                <span className={departmentStyles.deptBadge}>Active</span>
              </div>
              <div className={departmentStyles.deptMainStats}>
                <div className={departmentStyles.deptStat}>
                  <span className={departmentStyles.deptNumber}>{dept.totalComplaints}</span>
                  <span className={departmentStyles.deptLabel}>Total</span>
                </div>
                <div className={departmentStyles.deptStat}>
                  <span className={departmentStyles.deptNumber}>{dept.totalStaff}</span>
                  <span className={departmentStyles.deptLabel}>Staff</span>
                </div>
                <div className={departmentStyles.deptStat}>
                  <span className={departmentStyles.deptNumber}>{resolutionRate}%</span>
                  <span className={departmentStyles.deptLabel}>Resolved</span>
                </div>
              </div>
              <div className={departmentStyles.deptStatusBreakdown}>
                <div className={`${departmentStyles.statusItem} ${departmentStyles.statusPending}`}>
                  <span className={departmentStyles.statusNumber}>{dept.pending}</span>
                  <span className={departmentStyles.statusLabel}>Pending</span>
                </div>
                <div className={`${departmentStyles.statusItem} ${departmentStyles.statusProgress}`}>
                  <span className={departmentStyles.statusNumber}>{dept.inProgress}</span>
                  <span className={departmentStyles.statusLabel}>In Progress</span>
                </div>
                <div className={`${departmentStyles.statusItem} ${departmentStyles.statusResolved}`}>
                  <span className={departmentStyles.statusNumber}>{dept.resolved}</span>
                  <span className={departmentStyles.statusLabel}>Resolved</span>
                </div>
              </div>
              <div className={departmentStyles.resolutionRate}>
                <div className={departmentStyles.rateHeader}>
                  <span className={departmentStyles.rateLabel}>Resolution Rate</span>
                  <span className={departmentStyles.rateValue}>{resolutionRate}%</span>
                </div>
                <div className={departmentStyles.progressBarContainer}>
                  <div className={departmentStyles.progressBar} style={{ width: `${resolutionRate}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={departmentStyles.contentArea}>
      <div className={departmentStyles.pageHeader}>
        <h2>All Departments</h2>
        <div className={departmentStyles.pageActions}>
          <button className={departmentStyles.btnSecondary} onClick={fetchDepartments}>
            🔄 Refresh
          </button>
        </div>
      </div>
      {renderDepartments()}
    </div>
  );
};

export default DepartmentsPage;