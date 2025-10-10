import React, { useState, useEffect } from 'react';
import styles from './gueststyle.module.css';
import { useNavigate } from 'react-router-dom';

const CitiSolveLanding = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [menuOpen, setMenuOpen] = useState(false);
  const [detail, setdetail] = useState("citizen");
  const [showloader, setShowloader] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((prev) => (prev + 1) % 4), 3000);
    return () => clearInterval(interval);
  }, []);

  // Reset error message when switching between login/signup
  useEffect(() => {
    setErrorMessage('');
    setdetail("citizen");
  }, [authMode]);

  const features = [
    { icon: "📝", title: "Submit Complaints", description: "Report civic issues instantly with photos and location tracking" },
    { icon: "📊", title: "Track Progress", description: "Monitor your complaints in real-time with detailed status updates" },
    { icon: "🔔", title: "Get Notifications", description: "Stay informed with instant alerts on municipal updates and resolutions" },
    { icon: "📈", title: "Analytics Dashboard", description: "Access comprehensive data insights and community complaint trends" }
  ];

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "5K+", label: "Complaints Resolved" },
    { number: "95%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support Available" }
  ];

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const formData = new FormData(e.target);

    let userData;
    if (authMode === 'signup' && detail === "citizen") {
      userData = {
        fullname: formData.get('fullname'),
        email: formData.get('email'),
        password: formData.get('password'),
        ward_department: formData.get('ward'),
        role: detail,
      };
    } else if (authMode === 'signup' && detail === "staff") {
      userData = {
        fullname: formData.get('fullname'),
        email: formData.get('email'),
        password: formData.get('password'),
        ward_department: formData.get('category'),
        role: detail,
      };
    } else if (authMode === 'login') {
      userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        role: detail,
      };
    }

    try {
      setShowloader(true);
      const res = await fetch(`http://localhost:5000/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log('✅ Authentication successful:', data);
        
        // Navigate based on role
        if (detail === 'citizen') {
          navigate('/citizen/home');
        } else if (detail === 'staff') {
          navigate('/staff/home');
        } else if (detail === 'admin') {
          navigate('/admin/home');
        }
      } else {
        console.error('❌ Authentication failed:', data.message);
        setErrorMessage(data.message || 'Authentication failed');
        setShowloader(false);
      }
    } catch (err) {
      console.error('❌ Request error:', err);
      setErrorMessage('Something went wrong! Please check your connection.');
      setShowloader(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ User is logged in:', data.user);
        return data.user;
      } else {
        console.log('❌ User not authenticated');
        return null;
      }
    } catch (err) {
      console.error('❌ Auth check failed:', err);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (res.ok) {
        console.log('✅ Logged out successfully');
        navigate('/');
      }
    } catch (err) {
      console.error('❌ Logout failed:', err);
    }
  };

  // Loader styles
  const loaderStyles = {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const errorMessageStyles = {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '12px',
    marginBottom: '8px',
    padding: '10px',
    backgroundColor: '#fee2e2',
    borderRadius: '6px',
    textAlign: 'center',
  };

  return (
    <div className={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Navigation */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>CitiSolve</span>
          </div>

          <div className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span><span></span><span></span>
          </div>

          <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
            <a href="#features" className={styles.navLink} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className={styles.navLink} onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#about" className={styles.navLink} onClick={() => setMenuOpen(false)}>About</a>
            <button className={styles.authBtn} onClick={() => setShowAuthModal(true)}>Login / Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAuthModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowAuthModal(false)}>×</button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Welcome to CitiSolve</h2>
              <div className={styles.tabContainer}>
                <button className={`${styles.tab} ${authMode === 'login' ? styles.tabActive : ''}`} onClick={() => setAuthMode('login')}>
                  Login
                  <img className={styles.signupimg} src='unicycle.png' alt="login" />
                </button>
                <button className={`${styles.tab} ${authMode === 'signup' ? styles.tabActive : ''}`} onClick={() => setAuthMode('signup')}>
                  Sign Up
                  <img className={styles.signupimg} src='circus-tent.png' alt="signup" />
                </button>
              </div>
            </div>
            <div className={styles.profilesections}>
              <button className={`${styles.profiles} ${detail === "citizen" ? styles.active : ""}`} onClick={(e) => {
                e.preventDefault();
                setdetail("citizen");
                setErrorMessage('');
              }}>
                <img src="/citizen.png" className={styles.profilesimg} alt="citizen" />
                citizen
              </button>
              <button className={`${styles.profiles} ${detail === "staff" ? styles.active : ""}`} onClick={(e) => {
                e.preventDefault();
                setdetail("staff");
                setErrorMessage('');
              }}>
                <img src="/staff.png" className={styles.profilesimg} alt="staff" />
                Staff
              </button>
              {authMode === 'login' && (
                <button className={`${styles.profiles} ${detail === "admin" ? styles.active : ""}`} onClick={(e) => {
                  e.preventDefault();
                  setdetail("admin");
                  setErrorMessage('');
                }}>
                  <img src="/admin.png" className={styles.profilesimg} alt="admin" />
                  admin
                </button>
              )}
            </div>

            <form onSubmit={handleAuthSubmit} className={styles.formContainer}>
              {authMode === 'signup' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input type="text" name='fullname' className={styles.input} placeholder="Enter your name" required />
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input type="email" name='email' className={styles.input} placeholder="Enter your email" required />
              </div>
              {authMode === 'signup' && detail === 'citizen' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ward/Zone</label>
                  <input type="text" name='ward' className={styles.input} placeholder="Enter your ward" required />
                </div>
              )}
              {authMode === 'signup' && detail === 'staff' && (
                <div className={styles.formgroup}>
                  <label htmlFor="complaint-category">Category *</label>
                  <select id="complaint-category" name="category" required>
                    <option value="">Select a category</option>
                    <option value="roads">🛣️ Roads & Infrastructure</option>
                    <option value="water">💧 Water Supply</option>
                    <option value="power">💡 Power & Electricity</option>
                    <option value="sanitation">🗑️ Sanitation & Garbage</option>
                    <option value="other">📋 Other</option>
                  </select>
                  <span className={styles.formerror}>Please select a category</span>
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input type="password" name='password' className={styles.input} placeholder="Enter your password" required />
              </div>

              {errorMessage && (
                <div style={errorMessageStyles}>
                  {errorMessage}
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={showloader}>
                {showloader ? (
                  <div style={loaderStyles}></div>
                ) : (
                  authMode === 'login' ? 'Login 🚀' : 'Create Account 🚀'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Your Voice for a <span className={styles.highlightText}>Better City</span>
            </h1>
            <p className={styles.heroSubtitle}>
              CitiSolve connects citizens with municipal services, making it easier than ever to report issues, track progress, and build stronger communities together.
            </p>
            <div className={styles.heroCta}>
              <button className={styles.primaryBtn} onClick={() => setShowAuthModal(true)}>Get Started Now</button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.floatingCard}>
              <div className={styles.cardIcon}>🏛️</div>
              <h3 className={styles.cardTitle}>Smart City Solutions</h3>
              <p className={styles.cardText}>Empowering citizens, one complaint at a time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statNumber}>{stat.number}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose CitiSolve?</h2>
          <p className={styles.sectionSubtitle}>Everything you need to make your city better, all in one place</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature, i) => (
            <div key={i} className={`${styles.featureCard} ${activeFeature === i ? styles.featureCardActive : ''}`} onMouseEnter={() => setActiveFeature(i)}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>Three simple steps to make a difference</p>
        </div>
        <div className={styles.stepsContainer}>
          {[{ num: "1", title: "Report", desc: "Submit your complaint with photos and location" },
          { num: "2", title: "Track", desc: "Monitor progress with real-time updates" },
          { num: "3", title: "Resolve", desc: "Get notified when your issue is resolved" }].map((step, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.num}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Make a Difference?</h2>
          <p className={styles.ctaSubtitle}>Join thousands of citizens working together to build better communities</p>
          <button className={styles.ctaButton} onClick={() => setShowAuthModal(true)}>Create Your Account</button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>CitiSolve</div>
            <p className={styles.footerTagline}>Empowering citizens, transforming cities</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerColumnTitle}>Product</h4>
              <a href="#" className={styles.footerLink}>Features</a>
              <a href="#" className={styles.footerLink}>Pricing</a>
              <a href="#" className={styles.footerLink}>FAQ</a>
            </div>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerColumnTitle}>Company</h4>
              <a href="#" className={styles.footerLink}>About Us</a>
              <a href="#" className={styles.footerLink}>Contact</a>
              <a href="#" className={styles.footerLink}>Careers</a>
            </div>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerColumnTitle}>Legal</h4>
              <a href="#" className={styles.footerLink}>Privacy</a>
              <a href="#" className={styles.footerLink}>Terms</a>
              <a href="#" className={styles.footerLink}>Security</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2025 CitiSolve. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CitiSolveLanding;