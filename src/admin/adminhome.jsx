import React, { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import styles from './adminhomestyle.module.css'; // Updated import to the new CSS file
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ User data fetched:", data);
          setUser(data);
        } else {
          console.log("❌ User not authenticated");
          navigate('/');
        }
      } catch (err) {
        console.error('❌ Error fetching user:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchstats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/admin/complaints',{
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Stats data fetched:", data.stats);
          setStats(data.stats);
        } else {
          console.log("❌ Failed to fetch stats");
        }
      } catch (err) {
        console.error('❌ Error fetching stats:', err);
      }
    };

    fetchstats();
  }, [navigate]);

  useEffect(() => {
    if (stats) {
      const chartCanvas = document.getElementById('departmentChart');
      if (chartCanvas) {
        const existingChart = Chart.getChart(chartCanvas);
        if (existingChart) existingChart.destroy();

        // Create department data from stats
        const departments = [
          { name: 'Roads', total: stats.roads || 0, resolved: stats.roadsdata?.filter(c => c.status === 'resolved').length || 0 },
          { name: 'Water', total: stats.water || 0, resolved: stats.waterdata?.filter(c => c.status === 'resolved').length || 0 },
          { name: 'Power', total: stats.power || 0, resolved: stats.powerdata?.filter(c => c.status === 'resolved').length || 0 },
          { name: 'Sanitation', total: stats.sanitation || 0, resolved: stats.sanitationdata?.filter(c => c.status === 'resolved').length || 0 },
          { name: 'Others', total: stats.others || 0, resolved: stats.otherdata?.filter(c => c.status === 'resolved').length || 0 }
        ];

        const labels = departments.map(d => d.name);
        const activeComplaints = departments.map(d => d.total - d.resolved);

        new Chart(chartCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Active Complaints',
              data: activeComplaints,
              backgroundColor: ['#666', '#3b82f6', '#f59e0b', '#10b981','red'],
              borderColor: ['#666', '#3b82f6', '#f59e0b', '#10b981','red'],
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { color: '#888' }, grid: { color: '#2a2a2a' } },
              x: { ticks: { color: '#888' }, grid: { display: false } },
            },
          },
        });
      }
    }
  }, [stats]);

  const renderStats = () => {
    if (!stats) {
      return (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p style={{ color: '#888' }}>Loading stats...</p>
        </div>
      );
    }

    const statItems = [
      { id: 'totalComplaints', icon: '📋', value: stats.totalcomplaints || 0, label: 'Total Complaints', className: styles.statPrimary },
      { id: 'pendingComplaints', icon: '⏳', value: stats.pending || 0, label: 'Pending', className: styles.statWarning },
      { id: 'progressComplaints', icon: '🔄', value: stats.inprogress || 0, label: 'In Progress', className: styles.statInfo },
      { id: 'resolvedComplaints', icon: '✅', value: stats.resolved || 0, label: 'Resolved', className: styles.statSuccess },
      { id: 'totalUsers', icon: '👥', value: stats.totalusers || 0, label: 'Total Users', className: styles.statUsers },
      { id: 'citizenCount', icon: '👨‍💼', value: stats.citizens || 0, label: 'Citizens', className: styles.statCitizens },
      { id: 'staffCount', icon: '👔', value: stats.staff || 0, label: 'Staff Members', className: styles.statStaff },
      { id: 'departmentCount', icon: '🏢', value: stats.totaldepartments || 0, label: 'Departments', className: styles.statDepartments },
    ];

    return (
      <div className={styles.statsGrid}>
        {statItems.map(item => (
          <div key={item.id} className={`${styles.statCard} ${item.className}`}>
            <div className={styles.statIcon}>{item.icon}</div>
            <div className={styles.statInfo}>
              <h3>{item.value}</h3>
              <p>{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.contentArea}>
      <a className = {styles.allocationbtn} onClick={()=>navigate("/admin/allocate")}>📑Allocate complaints</a>
      {renderStats()}
      <div className={styles.dashboardGrid}>
        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}><h2>Department Workload</h2></div>
          <div className={styles.chartContainer}>
            <canvas id="departmentChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;