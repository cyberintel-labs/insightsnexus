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
const dns_1 = __importDefault(require("dns"));
const util_1 = require("util");
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
// Detect feroxbuster executable
/**
 * Feroxbuster Path Detection
 *
 * Attempts to automatically detect the feroxbuster executable in the main directory.
 * Feroxbuster is used to search for subdomains from a domain in this project.
 *
 * Detection Strategy:
 * 1. First tries Windows 'where' command
 * 2. Falls back to Unix 'which' command
 * 3. Sets empty string if not found (will cause API errors)
 */
let feroxPath = "";
try {
    // Attempt to find for windows systems
    feroxPath = (0, child_process_1.execSync)("where feroxbuster", { encoding: "utf8" }).split("\n")[0].trim();
    console.log("Feroxbuster found at (Windows):", feroxPath);
}
catch (_c) {
    try {
        // Try finding for unix systems
        feroxPath = (0, child_process_1.execSync)("which feroxbuster", { encoding: "utf8" }).trim();
        console.log("Feroxbuster found at (Unix):", feroxPath);
    }
    catch (_d) {
        console.error("Feroxbuster not found in path.");
        feroxPath = ""; // No path detected
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
 * Domain to IP Address Resolution Endpoint
 *
 * POST /domain-to-ip
 *
 * Resolves domain names to their corresponding IP addresses using DNS lookup.
 *
 * Input:
 * - domain: string - The domain name to resolve
 *
 * Output:
 * - ips: string[] - Array of resolved IP addresses
 * - error: string - Error message if resolution fails
 *
 * Process:
 * 1. Validates domain input
 * 2. Performs DNS lookup using Node.js dns module
 * 3. Returns both IPv4 and IPv6 addresses if available
 * 4. Handles errors gracefully with appropriate status codes
 */
app.post("/domain-to-ip", (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json({ error: "Domain is required" });
        return;
    }
    // Use imported dns module for DNS resolution
    const resolve4 = (0, util_1.promisify)(dns_1.default.resolve4);
    const resolve6 = (0, util_1.promisify)(dns_1.default.resolve6);
    console.log(`Resolving domain: ${domain}`);
    // Resolve both IPv4 and IPv6 addresses
    Promise.all([
        resolve4(domain).catch(() => []),
        resolve6(domain).catch(() => [])
    ])
        .then(([ipv4Addresses, ipv6Addresses]) => {
        const allIps = [...ipv4Addresses, ...ipv6Addresses];
        console.log(`Domain ${domain} resolved to:`, allIps);
        res.json({ ips: allIps });
    })
        .catch(err => {
        console.error("Error resolving domain:", err);
        res.status(500).json({ error: "Failed to resolve domain" });
    });
});
/**
 * Domain to DNS Records Endpoint
 *
 * POST /domain-to-dns
 *
 * Retrieves comprehensive DNS information for a domain including MX, NS, A, CNAME, and TXT records.
 *
 * Input:
 * - domain: string - The domain name to query for DNS records
 *
 * Output:
 * - mx: string[] - Array of mail exchange records
 * - ns: string[] - Array of name server records
 * - a: string[] - Array of IPv4 address records
 * - cname: string[] - Array of canonical name records
 * - txt: string[] - Array of text records
 * - error: string - Error message if query fails
 *
 * Process:
 * 1. Validates required domain parameter
 * 2. Performs DNS lookups for various record types using Node.js dns module
 * 3. Returns all discovered DNS records organized by type
 * 4. Handles errors gracefully with appropriate status codes
 */
app.post("/domain-to-dns", (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json({ error: "Domain is required" });
        return;
    }
    // Use imported dns module for DNS resolution
    const resolveMx = (0, util_1.promisify)(dns_1.default.resolveMx);
    const resolveNs = (0, util_1.promisify)(dns_1.default.resolveNs);
    const resolve4 = (0, util_1.promisify)(dns_1.default.resolve4);
    const resolveCname = (0, util_1.promisify)(dns_1.default.resolveCname);
    const resolveTxt = (0, util_1.promisify)(dns_1.default.resolveTxt);
    console.log(`Retrieving DNS records for domain: ${domain}`);
    // Resolve all DNS record types
    Promise.all([
        resolveMx(domain).catch(() => []),
        resolveNs(domain).catch(() => []),
        resolve4(domain).catch(() => []),
        resolveCname(domain).catch(() => []),
        resolveTxt(domain).catch(() => [])
    ])
        .then(([mxRecords, nsRecords, aRecords, cnameRecords, txtRecords]) => {
        const records = {
            mx: mxRecords.map(record => record.exchange),
            ns: nsRecords,
            a: aRecords,
            cname: cnameRecords,
            txt: txtRecords.flat()
        };
        console.log(`DNS records for ${domain}:`, records);
        res.json(records);
    })
        .catch(err => {
        console.error("Error retrieving DNS records:", err);
        res.status(500).json({ error: "Failed to retrieve DNS records" });
    });
});
/**
 * Whois Information Endpoint
 *
 * POST /whois
 *
 * Retrieves domain registration information using the whois command including registrar,
 * name servers, creation date, and expiry date.
 *
 * Input:
 * - domain: string - The domain name to query for WHOIS information
 *
 * Output:
 * - registrar: string - Domain registrar information
 * - nameServers: string[] - Array of name server records (duplicates removed)
 * - creationDate: string - Domain creation date
 * - expiryDate: string - Domain expiry date
 * - error: string - Error message if query fails
 *
 * Process:
 * 1. Validates required domain parameter
 * 2. Executes whois command with timeout and retry logic
 * 3. Parses output to extract relevant domain information
 * 4. Removes duplicate name servers
 * 5. Returns structured domain information
 * 6. Handles errors gracefully with appropriate status codes
 */
app.post("/whois", (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json({ error: "Domain is required" });
        return;
    }
    const command = `whois ${domain}`;
    const timeout = 30000; // 30 second timeout
    const maxRetries = 3;
    let retryCount = 0;
    /**
     * Execute Whois Command with Retry Logic
     *
     * Attempts to execute the whois command with exponential backoff retry logic.
     * Implements timeout handling and graceful error recovery.
     * Maximum of 3 retry attempts before giving up.
     */
    const executeWhois = () => {
        console.log(`Running whois for domain: ${domain} (attempt ${retryCount + 1}/${maxRetries + 1})`);
        const childProcess = (0, child_process_1.exec)(command, { timeout }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Whois error for ${domain}:`, error);
                // Retry logic with exponential backoff - maximum 3 retries
                if (retryCount < maxRetries && (String(error.code) === 'ETIMEDOUT' || error.signal === 'SIGTERM')) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
                    console.log(`Retrying whois for ${domain} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                    setTimeout(executeWhois, delay);
                    return;
                }
                console.log(`Whois failed for ${domain} after ${retryCount + 1} attempts`);
                return res.status(500).json({ error: "Failed to retrieve WHOIS information" });
            }
            try {
                // Parse whois output to extract relevant information
                const lines = stdout.split("\n");
                let registrar = "";
                const nameServers = [];
                let creationDate = "";
                let expiryDate = "";
                for (const line of lines) {
                    const lowerLine = line.toLowerCase();
                    // Extract registrar information
                    if (lowerLine.includes("registrar:") || lowerLine.includes("registrar name:")) {
                        const match = line.match(/:\s*(.+)/);
                        if (match && match[1]) {
                            registrar = match[1].trim();
                        }
                    }
                    // Extract name servers
                    if (lowerLine.includes("name server:") || lowerLine.includes("nserver:")) {
                        const match = line.match(/:\s*(.+)/);
                        if (match && match[1]) {
                            const ns = match[1].trim();
                            if (ns && !nameServers.includes(ns)) {
                                nameServers.push(ns);
                            }
                        }
                    }
                    // Extract creation date
                    if (lowerLine.includes("creation date:") || lowerLine.includes("created:")) {
                        const match = line.match(/:\s*(.+)/);
                        if (match && match[1]) {
                            creationDate = match[1].trim();
                        }
                    }
                    // Extract expiry date
                    if (lowerLine.includes("expiry date:") || lowerLine.includes("expires:")) {
                        const match = line.match(/:\s*(.+)/);
                        if (match && match[1]) {
                            expiryDate = match[1].trim();
                        }
                    }
                }
                // Remove duplicate name servers
                const uniqueNameServers = [...new Set(nameServers)];
                const whoisInfo = {
                    registrar: registrar || "Unknown",
                    nameServers: uniqueNameServers,
                    creationDate: creationDate || "Unknown",
                    expiryDate: expiryDate || "Unknown"
                };
                console.log(`Whois completed for ${domain}:`, whoisInfo);
                res.json(whoisInfo);
            }
            catch (parseErr) {
                console.error("Error parsing whois output:", parseErr);
                res.status(500).json({ error: "Failed to parse WHOIS information" });
            }
        });
        // Handle process termination for cleanup
        childProcess.on('error', (err) => {
            console.error(`Whois process error for ${domain}:`, err);
            if (retryCount < maxRetries) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying whois for ${domain} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                setTimeout(executeWhois, delay);
            }
            else {
                console.log(`Whois failed for ${domain} after ${retryCount + 1} attempts (process error)`);
                res.status(500).json({ error: "Failed to retrieve WHOIS information" });
            }
        });
    };
    // Start the whois execution process
    executeWhois();
});
// POST /feroxbuster
app.post("/feroxbuster", (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json({ error: "Domain is required" });
        return;
    }
    if (!feroxPath) {
        res.status(500).json({ error: "Feroxbuster executable not found" });
        return;
    }
    // Run feroxbuster silently, outputting discovered URLs to stdout
    const command = `${feroxPath} -u https://${domain} -x html,php,txt,json -q --silent --output -`;
    console.log(`Running Feroxbuster for domain: ${domain}`);
    (0, child_process_1.exec)(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        if (err) {
            console.error("Feroxbuster error:", err, stderr);
            return res.status(500).json({ error: "Failed to run Feroxbuster" });
        }
        try {
            // Extract subdomains from stdout lines
            const lines = stdout.split("\n");
            const subdomains = Array.from(new Set(lines
                .map(line => line.trim())
                .filter(line => line.endsWith(domain) && line.length > domain.length)));
            console.log(`Feroxbuster found ${subdomains.length} subdomains`);
            return res.json({ subdomains });
        }
        catch (parseErr) {
            console.error("Feroxbuster parse error:", parseErr);
            return res.status(500).json({ error: "Failed to parse Feroxbuster output" });
        }
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
