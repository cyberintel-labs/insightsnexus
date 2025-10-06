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

// Security headers middleware
app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Strict Transport Security (HTTPS only)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://unpkg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: blob:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'"
    );
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
    
    next();
});

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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