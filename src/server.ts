/**
 * OSINT Investigation Graph Analysis Server
 * 
 * This server provides the backend functionality for the OSINT investigation graph analysis tool.
 * It serves the frontend application and provides RESTful API endpoints for OSINT operations.
 * 
 * Key Features:
 * - Modular service-based architecture for business logic
 * - Graph data save/load functionality for investigation persistence
 * - Static file serving for the web interface
 * - RESTful API endpoints for frontend communication
 * 
 * Architecture:
 * - Modular design with separated concerns
 * - Service-based architecture for business logic
 * - Middleware for error handling and logging
 * - Route-based API organization
 */

import express from "express";
import path from "path";

// Import middleware
import { errorHandler, requestLogger } from "./middleware/errorHandler.js";

// Import routes
import apiRoutes from "./routes/api.js";

/**
 * Express Application Setup
 * 
 * Initializes the web server with middleware and static file serving.
 * Port 3000 is used for local development.
 */
const app = express();
const port = 3000;

// Middleware setup
app.use(express.json());
app.use(requestLogger);

// Serve static files (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, "../src")));

// API routes
app.use("/", apiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

/**
 * Server Startup
 * 
 * Starts the Express server on the configured port.
 * Logs the server URL for easy access during development.
 */
if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log("OSINT Investigation Graph Analysis Tool");
        console.log("========================================");
    });
}

export default app;