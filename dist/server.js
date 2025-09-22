"use strict";
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
 *
 * Copyright (c) 2024 Investigating Project
 * Licensed under the MIT License
 * - RESTful API endpoints for frontend communication
 *
 * Architecture:
 * - Modular design with separated concerns
 * - Service-based architecture for business logic
 * - Middleware for error handling and logging
 * - Route-based API organization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
// Import middleware
const errorHandler_js_1 = require("./middleware/errorHandler.js");
// Import routes
const api_js_1 = __importDefault(require("./routes/api.js"));
/**
 * Express Application Setup
 *
 * Initializes the web server with middleware and static file serving.
 * Port 3000 is used for local development.
 */
const app = (0, express_1.default)();
const port = 3000;
// Middleware setup
app.use(express_1.default.json());
app.use(errorHandler_js_1.requestLogger);
// Serve static files (HTML, JS, CSS)
app.use(express_1.default.static(path_1.default.join(__dirname, "../src")));
// API routes
app.use("/", api_js_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_js_1.errorHandler);
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
exports.default = app;
