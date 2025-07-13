import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since this is primarily a frontend calculator application,
  // most functionality is handled on the client side.
  // We could add endpoints for saving/loading calculations if needed.
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Placeholder for future loan calculation storage endpoints
  // app.post("/api/loan-calculations", async (req, res) => {
  //   // Save loan calculation to storage
  // });
  
  // app.get("/api/loan-calculations/:id", async (req, res) => {
  //   // Retrieve saved loan calculation
  // });

  const httpServer = createServer(app);

  return httpServer;
}
