export const isAuthenticated = (req, res, next) => {
  console.log("🔍 Checking authentication, userId:", req.session.userId);
  
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated. Please login." });
  }
};