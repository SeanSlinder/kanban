const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { models } = require("../models");

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const boards = await models.Board.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: models.List,
          as: "lists",
          include: [{ model: models.Card, as: "cards" }],
        },
      ],
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const board = await models.Board.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: models.List,
          as: "lists",
          include: [
            {
              model: models.Card,
              as: "cards",
            },
          ],
        },
      ],
      order: [
        [{ model: models.List, as: "lists" }, "position", "ASC"],
        [{ model: models.List, as: "lists" }, { model: models.Card, as: "cards" }, "position", "ASC"],
      ],
    });
    
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    
    // Sort manually if Sequelize ordering doesn't work as expected
    if (board.lists) {
      board.lists.sort((a, b) => (a.position || 0) - (b.position || 0));
      board.lists.forEach(list => {
        if (list.cards) {
          list.cards.sort((a, b) => (a.position || 0) - (b.position || 0));
        }
      });
    }
    
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { title } = req.body;
  try {
    const board = await models.Board.create({ title, userId: req.user.id });
    
    // broadcast via websocket
    const wss = req.app.get("wss");
    if (wss) {
      const payload = JSON.stringify({ type: "board:created", board });
      wss.clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const board = await models.Board.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    
    await board.destroy();
    
    // broadcast via websocket
    const wss = req.app.get("wss");
    if (wss) {
      const payload = JSON.stringify({ type: "board:deleted", boardId: req.params.id });
      wss.clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
    
    res.status(200).json({ message: "Board deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
