"use strict";
/**
 * OSINT Investigation Graph Analysis Server
 *
 * This server provides the backend functionality for the OSINT investigation graph analysis tool.
 * It handles Sherlock username searches, graph data persistence, and serves the frontend application.
 *
 * Key Features:
 * - Sherlock integration for username enumeration across social media platforms
 * - Graph data save/load functionality for investigation persistence
 * - Static file serving for the web interface
 * - RESTful API endpoints for frontend communication
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
/**
 * Sherlock Path Detection
 *
 * Attempts to automatically detect the Sherlock executable in the system PATH.
 * Sherlock is a tool that searches for usernames across hundreds of social media platforms.
 *
 * Detection Strategy:
 * 1. First tries Windows 'where' command
 * 2. Falls back to Unix 'which' command
 * 3. Sets empty string if not found (will cause API errors)
 */
let sherlockPath = "";
try {
    // Attempt to find for windows systems
    sherlockPath = (0, child_process_1.execSync)("where sherlock", { encoding: "utf8" }).split("\n")[0].trim();
    console.log("Sherlock found at (Windows):", sherlockPath);
}
catch (_a) {
    try {
        // Try finding for unix systems
        sherlockPath = (0, child_process_1.execSync)("which sherlock", { encoding: "utf8" }).trim();
        console.log("Sherlock found at (Unix):", sherlockPath);
    }
    catch (_b) {
        console.error("Sherlock not found in path.");
        sherlockPath = ""; // No path detected
    }
}
// const savesDir = path.join(__dirname, "../saves");
// if(!fs.existsSync(savesDir)) fs.mkdirSync(savesDir);
/**
 * Directory Setup for Data Persistence
 *
 * Creates necessary directories for storing investigation data:
 * - graphSaveDir: Stores complete graph states for investigations
 * - resultSaveDir: Caches Sherlock search results to avoid re-searching
 */
const graphSaveDir = path_1.default.join(__dirname, '../saves/graph');
const resultSaveDir = path_1.default.join(__dirname, '../saves/results');
if (!fs_1.default.existsSync(graphSaveDir))
    fs_1.default.mkdirSync(graphSaveDir, { recursive: true });
if (!fs_1.default.existsSync(resultSaveDir))
    fs_1.default.mkdirSync(resultSaveDir, { recursive: true });
/**
 * Express Application Setup
 *
 * Initializes the web server with middleware and static file serving.
 * Port 3000 is used for local development.
 */
const app = (0, express_1.default)();
const port = 3000;
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
// Serve static files (your HTML, JS, etc.)
app.use(express_1.default.static(path_1.default.join(__dirname, "../src")));
/**
 * Sherlock API Endpoint
 *
 * POST /sherlock
 *
 * Executes Sherlock username search and returns found social media platforms.
 *
 * Input:
 * - username: string - The username to search across social media platforms
 *
 * Output:
 * - services: string[] - Array of platform names where the username was found
 * - error: string - Error message if search fails
 *
 * Process:
 * 1. Validates username input
 * 2. Checks if Sherlock is available
 * 3. Executes Sherlock command with --print-found flag
 * 4. Parses output to extract found services
 * 5. Caches results to avoid re-searching
 * 6. Returns JSON response with found services
 */
app.post("/sherlock", (req, res) => {
    const { username } = req.body;
    if (!username) {
        res.status(400).json({ error: "Username is required" });
        return;
    }
    if (!sherlockPath) {
        res.status(500).json({ error: "Sherlock executable not found in system PATH." });
        return;
    }
    const command = `${sherlockPath} ${username} --print-found`;
    (0, child_process_1.exec)(command, (error, stdout, stderr) => {
        console.log(`Running Sherlock for: ${username}`);
        if (error) {
            console.error("Error running Sherlock:", error);
            return res.status(500).json({ error: "Failed to run Sherlock" });
        }
        const foundServices = [];
        const lines = stdout.split("\n");
        for (const line of lines) {
            if (line.startsWith("[+]")) {
                const match = line.match(/^\[\+\] (.*?):/);
                if (match && match[1]) {
                    foundServices.push(match[1].toLowerCase());
                }
            }
        }
        console.log(`Sherlock finished for ${username}. Found:`, foundServices);
        res.json({ services: foundServices });
        const resultFilePath = path_1.default.join(resultSaveDir, `${username}.json`);
        fs_1.default.writeFile(resultFilePath, JSON.stringify(foundServices, null, 2), err => {
            if (err)
                console.warn('Failed to cache Sherlock result:', err);
        });
    });
});
/**
 * Graph Save Endpoint
 *
 * POST /save
 *
 * Saves the current graph state to a JSON file for later retrieval.
 *
 * Input:
 * - filename: string - Name for the saved file (sanitized for filesystem safety)
 * - graphData: object - Complete Cytoscape graph data including nodes, edges, and layout
 *
 * Output:
 * - message: string - Success confirmation
 * - error: string - Error message if save fails
 *
 * Process:
 * 1. Validates required parameters
 * 2. Sanitizes filename to prevent path traversal attacks
 * 3. Writes graph data as formatted JSON
 * 4. Returns success/error status
 */
app.post("/save", (req, res) => {
    const { filename, graphData } = req.body;
    if (!filename || !graphData) {
        res.status(400).json({ error: "Missing filename or graph data" });
        return;
    }
    const safeName = filename.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filePath = path_1.default.join(graphSaveDir, `${safeName}.json`);
    fs_1.default.writeFile(filePath, JSON.stringify(graphData, null, 2), (err) => {
        if (err) {
            console.error("Error saving file:", err);
            res.status(500).json({ error: "Failed to save file" });
            return;
        }
        console.log(`Graph saved to ${filePath}`);
        res.status(200).json({ message: "Saved successfully" });
    });
});
/**
 * List Saved Graphs Endpoint
 *
 * GET /saves
 *
 * Returns a list of all saved graph files for the load dropdown.
 *
 * Output:
 * - string[] - Array of available .json filenames
 *
 * Process:
 * 1. Reads the graph save directory
 * 2. Filters for .json files only
 * 3. Returns array of filenames
 */
app.get("/saves", (req, res) => {
    fs_1.default.readdir(graphSaveDir, (err, files) => {
        if (err) {
            console.error("Failed to list saves:", err);
            return res.status(500).json([]);
        }
        // Only return .json files
        const jsonFiles = files.filter(file => file.endsWith(".json"));
        res.json(jsonFiles);
    });
});
/**
 * Load Graph Endpoint
 *
 * GET /load/:filename
 *
 * Loads a specific saved graph file and returns its data.
 *
 * Input:
 * - filename: string (URL parameter) - Name of the file to load
 *
 * Output:
 * - object - Complete graph data in Cytoscape format
 * - error: string - Error message if load fails
 *
 * Process:
 * 1. Constructs file path from filename parameter
 * 2. Reads and parses JSON file
 * 3. Returns graph data or error
 */
app.get("/load/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path_1.default.join(graphSaveDir, filename);
    fs_1.default.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error loading file:", err);
            return res.status(500).json({ error: "Failed to load file" });
        }
        try {
            const json = JSON.parse(data);
            res.json(json);
        }
        catch (e) {
            console.error("Invalid JSON:", e);
            res.status(500).json({ error: "Corrupted save file" });
        }
    });
});
/**
 * Server Startup
 *
 * Starts the Express server on the configured port.
 * Logs the server URL for easy access during development.
 */
if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
exports.default = app;
