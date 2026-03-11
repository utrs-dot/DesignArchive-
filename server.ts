import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  const PORT = 3000;

  // Initialize SQLite database
  const dbPath = path.join(__dirname, "likes.db");
  const db = new Database(dbPath);
  
  db.exec("CREATE TABLE IF NOT EXISTS counters (id TEXT PRIMARY KEY, count INTEGER)");
  
  // Initialize counter if not exists
  const row = db.prepare("SELECT count FROM counters WHERE id = ?").get("likes") as { count: number } | undefined;
  if (!row) {
    db.prepare("INSERT INTO counters (id, count) VALUES (?, ?)").run("likes", 0);
  }

  const getLikes = () => {
    const row = db.prepare("SELECT count FROM counters WHERE id = ?").get("likes") as { count: number };
    return row.count || 0;
  };

  const updateLikes = (newCount: number) => {
    db.prepare("UPDATE counters SET count = ? WHERE id = ?").run(newCount, "likes");
    io.emit("likes_update", { count: newCount });
  };

  app.use(express.json());

  // API routes (Legacy support + Initial fetch)
  app.get("/api/likes", (req, res) => {
    const count = getLikes();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ count });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
    
    // Send initial count
    socket.emit("likes_update", { count: getLikes() });

    socket.on("sync_likes", (data) => {
      const { localCount } = data;
      const currentCount = getLikes();
      if (typeof localCount === "number" && localCount > currentCount) {
        console.log(`[${new Date().toISOString()}] RESTORE from ${socket.id}: ${localCount}`);
        updateLikes(localCount);
      }
    });

    socket.on("click_like", () => {
      const newCount = getLikes() + 1;
      console.log(`[${new Date().toISOString()}] CLICK from ${socket.id}: ${newCount}`);
      updateLikes(newCount);
    });

    socket.on("disconnect", () => {
      console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
