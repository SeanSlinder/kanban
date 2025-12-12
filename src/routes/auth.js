const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { models } = require("../models");
require("dotenv").config();

const secret = process.env.JWT_SECRET || "secret";

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const exists = await models.User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email exists" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await models.User.create({ email, passwordHash });
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const user = await models.User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
