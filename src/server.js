require("dotenv").config();
const http = require("http");
const WebSocket = require("ws");
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "welcome", now: Date.now() }));
  ws.on("message", (msg) => {
    try {
      /* пока игнорим клиентские сообщения */
    } catch (e) {}
  });
});

app.set("wss", wss);

async function start() {
  try {
    await sequelize.authenticate();
    // sync models in development
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync();
    }
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error("Failed to start", err);
    process.exit(1);
  }
}

start();
