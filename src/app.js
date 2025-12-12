const express = require("express");
const path = require("path");
const bodyParser = require("express").json;
const authRoutes = require("./routes/auth");
const boardsRoutes = require("./routes/boards");
const listsRoutes = require("./routes/lists");
const cardsRoutes = require("./routes/cards");

const app = express();
app.use(bodyParser());

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardsRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/cards", cardsRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

module.exports = app;
