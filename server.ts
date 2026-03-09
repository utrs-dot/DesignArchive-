import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database
  const db = new Database("likes.db");
  db.exec("CREATE TABLE IF NOT EXISTS counters (id TEXT PRIMARY KEY, count INTEGER)");
  
  // Initialize counter if not exists
  const row = db.prepare("SELECT count FROM counters WHERE id = ?").get("likes");
  if (!row) {
    db.prepare("INSERT INTO counters (id, count) VALUES (?, ?)").run("likes", 0);
  }

  app.use(express.json());

  // API routes
  app.get("/api/likes", (req, res) => {
    const row = db.prepare("SELECT count FROM counters WHERE id = ?").get("likes") as { count: number };
    res.json({ count: row.count });
  });

  app.post("/api/likes", (req, res) => {
    db.prepare("UPDATE counters SET count = count + 1 WHERE id = ?").run("likes");
    const row = db.prepare("SELECT count FROM counters WHERE id = ?").get("likes") as { count: number };
    res.json({ count: row.count });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
