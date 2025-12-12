const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET || "secret";

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const parts = authHeader.split(" ");
  const token = parts[0] === "Bearer" && parts[1] ? parts[1] : null;
  if (!token) return res.status(401).json({ error: "Invalid token format" });
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = auth;
