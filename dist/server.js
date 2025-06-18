"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
// Attempt to auto detect sherlock
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
const graphSaveDir = path_1.default.join(__dirname, '../saves/graph');
const resultSaveDir = path_1.default.join(__dirname, '../saves/results');
if (!fs_1.default.existsSync(graphSaveDir))
    fs_1.default.mkdirSync(graphSaveDir, { recursive: true });
if (!fs_1.default.existsSync(resultSaveDir))
    fs_1.default.mkdirSync(resultSaveDir, { recursive: true });
const app = (0, express_1.default)();
const port = 3000;
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
// Serve static files (your HTML, JS, etc.)
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
// Sherlock API Route
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
// List saved files
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
// Load a specific saved graph
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
// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
