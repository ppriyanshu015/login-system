const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const COOKIE_NAME = "login_token";
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
});

function publicUser(user) {
  return { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt };
}
function issueCookie(res, userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if ([username, email, password].some(value => typeof value !== "string")) {
      return res.status(400).json({ message: "Username, email and password are required." });
    }
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      return res.status(400).json({ message: "Username must be 3–24 characters using letters, numbers or underscores." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: "Password must be between 8 and 72 characters." });
    }
    const duplicate = await User.findOne({ $or: [{ username: cleanUsername }, { email: cleanEmail }] });
    if (duplicate) return res.status(409).json({ message: "That username or email is already registered." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username: cleanUsername, email: cleanEmail, passwordHash });
    issueCookie(res, user._id);
    return res.status(201).json({ message: "Registration successful.", user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That username or email is already registered." });
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Could not complete registration." });
  }
});

// POST /api/auth/login — accepts username or email in `identifier`.
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (typeof identifier !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Username/email and password are required." });
    }
    const key = identifier.trim().toLowerCase();
    const user = await User.findOne({ $or: [{ username: key }, { email: key }] }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid username/email or password." });
    }
    issueCookie(res, user._id);
    return res.json({ message: "Login successful.", user: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Could not complete login." });
  }
});

// GET /api/auth/profile — retrieves the currently authenticated user's public data.
router.get("/profile", async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ message: "Please log in to view your profile." });
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch (error) {
      res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }
    const user = await User.findById(payload.userId);
    if (!user) {
      res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
      return res.status(401).json({ message: "User account was not found." });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Could not retrieve profile." });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  return res.json({ message: "Logged out successfully." });
});

module.exports = router;
