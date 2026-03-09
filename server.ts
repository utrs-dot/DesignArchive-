import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize JSON storage
  const dbPath = path.join(__dirname, "likes.json");
  
  const getLikes = () => {
    try {
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ count: 0 }));
        return 0;
      }
      const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      return data.count || 0;
    } catch (error) {
      console.error("Error reading likes.json:", error);
      return 0;
    }
  };

  const saveLikes = (count: number) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify({ count }));
    } catch (error) {
      console.error("Error writing likes.json:", error);
    }
  };

  app.use(express.json());

  // API routes
  app.get("/api/likes", (req, res) => {
    const count = getLikes();
    console.log(`GET /api/likes: ${count}`);
    res.json({ count });
  });

  app.post("/api/likes", (req, res) => {
    const currentCount = getLikes();
    const newCount = currentCount + 1;
    saveLikes(newCount);
    console.log(`POST /api/likes: ${newCount}`);
    res.json({ count: newCount });
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
