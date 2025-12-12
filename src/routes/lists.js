const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { models } = require("../models");

router.use(auth);

router.post("/", async (req, res) => {
  const { title, boardId } = req.body;
  try {
    // Verify board belongs to user
    const board = await models.Board.findOne({
      where: { id: boardId, userId: req.user.id },
    });
    
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    
    // Get max position for this board
    const maxPosition = await models.List.max("position", {
      where: { boardId },
    });
    
    const list = await models.List.create({
      title,
      boardId,
      position: (maxPosition || 0) + 1,
    });
    
    // broadcast via websocket
    const wss = req.app.get("wss");
    if (wss) {
      const payload = JSON.stringify({ type: "list:created", list });
      wss.clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
    
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const list = await models.List.findOne({
      where: { id: req.params.id },
      include: [{ model: models.Board, as: "board" }],
    });
    
    if (!list || list.board.userId !== req.user.id) {
      return res.status(404).json({ error: "List not found" });
    }
    
    await list.destroy();
    
    // broadcast via websocket
    const wss = req.app.get("wss");
    if (wss) {
      const payload = JSON.stringify({ type: "list:deleted", listId: req.params.id });
      wss.clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
    
    res.status(200).json({ message: "List deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
