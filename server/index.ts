import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createServer as createHTTPServer } from "http";
import { GameServer } from "./game-server";

export function createServer() {
  const app = express();
  const httpServer = createHTTPServer(app);

  // Initialize game server with WebSocket support
  new GameServer(httpServer);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  return httpServer;
}
