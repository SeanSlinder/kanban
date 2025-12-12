const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { models } = require("../models");

router.use(auth);

router.post("/", async (req, res) => {
  const { title, description, listId } = req.body;
  try {
    // Verify list belongs to user's board
    const list = await models.List.findOne({
      where: { id: listId },
      include: [{ model: models.Board, as: "board" }],
    });
    
    if (!list || list.board.userId !== req.user.id) {
      return res.status(404).json({ error: "List not found" });
    }
    
    // Get max position for this list
    const maxPosition = await models.Card.max("position", {
      where: { listId },
    });
    
    const card = await models.Card.create({
      title,
      description: description || "",
      listId,
      position: (maxPosition || 0) + 1,
    });
    
    // broadcast via websocket
    const wss = req.app.get("wss");
    if (wss) {
      const payload = JSON.stringify({ type: "card:created", card });
      wss.clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
    
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const card = await models.Card.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: models.List,
          as: "list",
          include: [{ model: models.Board, as: "board" }],
        },
      ],
    });
    
    if (!card || card.list.board.userId !== req.user.id) {
      return res.status(404).json({ error: "Card not found" });
    }
    
    await card.destroy();
    
    // broadcast via websocket
    const wss = req.app.get("wss");
    if (wss) {
      const payload = JSON.stringify({ type: "card:deleted", cardId: req.params.id });
      wss.clients.forEach((c) => {
        if (c.readyState === 1) c.send(payload);
      });
    }
    
    res.status(200).json({ message: "Card deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
