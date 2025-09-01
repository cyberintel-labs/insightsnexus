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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
// Detect ffuf executable
/**
 * ffuf Path Detection
 *
 * Attempts to automatically detect the ffuf executable in the system PATH.
 * ffuf is used for fuzzing and subdomain discovery in this project.
 *
 * Detection Strategy:
 * 1. First tries Windows 'where' command
 * 2. Falls back to Unix 'which' command
 * 3. Sets empty string if not found (will cause API errors)
 */
let ffufPath = "";
try {
    // Attempt to find for windows systems
    ffufPath = (0, child_process_1.execSync)("where ffuf", { encoding: "utf8" }).split("\n")[0].trim();
    console.log("ffuf found at (Windows):", ffufPath);
}
catch (_e) {
    try {
        // Try finding for unix systems
        ffufPath = (0, child_process_1.execSync)("which ffuf", { encoding: "utf8" }).trim();
        console.log("ffuf found at (Unix):", ffufPath);
    }
    catch (_f) {
        console.error("ffuf not found in path.");
        ffufPath = ""; // No path detected
    }
}
// Detect nmap executable
/**
 * Nmap Path Detection
 *
 * Attempts to automatically detect the nmap executable in the system PATH.
 * Nmap is used for port scanning to identify open ports on target systems.
 *
 * Detection Strategy:
 * 1. First tries Windows 'where' command
 * 2. Falls back to Unix 'which' command
 * 3. Sets empty string if not found (will cause API errors)
 */
let nmapPath = "";
try {
    // Attempt to find for windows systems
    nmapPath = (0, child_process_1.execSync)("where nmap", { encoding: "utf8" }).split("\n")[0].trim();
    console.log("Nmap found at (Windows):", nmapPath);
}
catch (_g) {
    try {
        // Try finding for unix systems
        nmapPath = (0, child_process_1.execSync)("which nmap", { encoding: "utf8" }).trim();
        console.log("Nmap found at (Unix):", nmapPath);
    }
    catch (_h) {
        console.error("Nmap not found in path.");
        nmapPath = ""; // No path detected
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
 * Website Screenshot Capture Endpoint
 *
 * POST /website-screenshot
 *
 * Captures a visual snapshot of a website using Puppeteer and returns the image as base64 data.
 *
 * Input:
 * - url: string - The website URL to capture (must include valid domain and TLD)
 *
 * Output:
 * - screenshot: string - Base64 encoded PNG image data
 * - error: string - Error message if capture fails
 *
 * Process:
 * 1. Validates URL input and domain structure
 * 2. Launches Puppeteer browser instance
 * 3. Navigates to the specified URL
 * 4. Captures full webpage screenshot at 1280x720 resolution
 * 5. Converts screenshot to base64 PNG format
 * 6. Returns image data for frontend processing
 * 7. Handles errors gracefully with appropriate status codes
 *
 * Screenshot Configuration:
 * - Viewport: 1280x720 pixels for consistent capture
 * - Format: PNG for lossless quality
 * - Full page: Captures entire webpage content
 * - Timeout: 30 seconds for page load and rendering
 */
app.post("/website-screenshot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.body;
    if (!url) {
        res.status(400).json({ error: "URL is required" });
        return;
    }
    // Validate URL format
    try {
        const urlObj = new URL(url);
        const hostnameParts = urlObj.hostname.split('.');
        if (hostnameParts.length < 2) {
            res.status(400).json({ error: "Invalid URL format - Must include domain and TLD" });
            return;
        }
        // Check if we have at least a second-level domain and top-level domain
        if (hostnameParts.length < 2 || hostnameParts[hostnameParts.length - 1].length < 2) {
            res.status(400).json({ error: "Invalid URL format - Must include valid domain and TLD" });
            return;
        }
    }
    catch (error) {
        res.status(400).json({ error: "Invalid URL format" });
        return;
    }
    console.log(`Capturing website screenshot for: ${url}`);
    try {
        // Dynamic import to avoid loading Puppeteer if not needed
        const puppeteer = yield Promise.resolve().then(() => __importStar(require('puppeteer')));
        const browser = yield puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = yield browser.newPage();
        // Set viewport for consistent screenshot size
        yield page.setViewport({ width: 1280, height: 720 });
        // Set timeout for page load
        yield page.setDefaultNavigationTimeout(30000);
        // Navigate to the URL
        yield page.goto(url, { waitUntil: 'networkidle2' });
        // Wait a bit for any dynamic content to load
        yield new Promise(resolve => setTimeout(resolve, 2000));
        // Capture screenshot
        const screenshot = yield page.screenshot({
            type: 'png',
            fullPage: true
        });
        // Ensure we have a Buffer and convert to base64
        let base64Screenshot;
        if (screenshot instanceof Buffer) {
            base64Screenshot = screenshot.toString('base64');
        }
        else if (screenshot instanceof Uint8Array) {
            base64Screenshot = Buffer.from(screenshot).toString('base64');
        }
        else {
            throw new Error(`Unexpected screenshot type: ${typeof screenshot}`);
        }
        yield browser.close();
        console.log(`Website screenshot captured successfully for: ${url}`);
        res.json({ screenshot: base64Screenshot });
    }
    catch (error) {
        console.error("Error capturing website screenshot:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ error: `Failed to capture screenshot: ${errorMessage}` });
    }
}));
// Domain to Subdomain Enumeration
app.post("/domain-to-sub", (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json({ error: "Domain is required" });
        return;
    }
    if (!ffufPath) {
        res.status(500).json({ error: "ffuf executable not found" });
        return;
    }
    // Use ffuf with a wordlist for subdomain discovery
    const wordlistPath = path_1.default.join(__dirname, "../Datalist/subdomains-top1million-110000.txt");
    const command = `${ffufPath} -u https://FUZZ.${domain} -w ${wordlistPath} -mc 200,301,302 -v -of csv -o -`;
    console.log(`Running ffuf for subdomains of: ${domain}`);
    console.log("Executing command:", command);
    (0, child_process_1.exec)(command, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
        if (err) {
            console.error("ffuf error:", err, stderr);
            return res.status(500).json({ error: "Failed to run ffuf" });
        }
        try {
            const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
            // ffuf CSV output → parse out valid subdomains
            const subdomains = [];
            for (const line of lines) {
                if (line.startsWith("input"))
                    continue; // skip header
                const cols = line.split(",");
                if (cols.length > 0) {
                    const host = cols[0].replace("https://", "").replace("/", "");
                    if (host.includes("."))
                        subdomains.push(host);
                }
            }
            const uniqueSubs = Array.from(new Set(subdomains));
            console.log(`ffuf found ${uniqueSubs.length} subdomains`);
            return res.json({ subdomains: uniqueSubs });
        }
        catch (parseErr) {
            console.error("ffuf parse error:", parseErr);
            return res.status(500).json({ error: "Failed to parse ffuf output" });
        }
    });
});
// Domain to endpoint
app.post("/domain-to-end", (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json({ error: "Domain is required" });
        return;
    }
    if (!feroxPath) {
        res.status(500).json({ error: "Feroxbuster executable not found" });
        return;
    }
    // Use feroxbuster with a wordlist for endpoint discovery
    const wordlistPath = path_1.default.join(__dirname, "../Datalist/raft-medium-directories.txt");
    const command = `${feroxPath} -u https://${domain}/ -w ${wordlistPath} --silent`;
    console.log(`Running Feroxbuster for domain: ${domain}`);
    console.log("Executing command:", command);
    (0, child_process_1.exec)(command, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
        if (err) {
            console.error("Feroxbuster error:", err, stderr);
            return res.status(500).json({ error: "Failed to run Feroxbuster" });
        }
        try {
            const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
            // Extract only the path part (/admin, /api/login)
            const endpoints = lines.map(url => {
                try {
                    const u = new URL(url);
                    return u.pathname; // just the path, not the whole domain
                }
                catch (_a) {
                    return null;
                }
            }).filter(Boolean);
            const uniqueEndpoints = Array.from(new Set(endpoints));
            console.log(`Feroxbuster found ${uniqueEndpoints.length} endpoints`);
            return res.json({ endpoints: uniqueEndpoints });
        }
        catch (parseErr) {
            console.error("Feroxbuster parse error:", parseErr);
            return res.status(500).json({ error: "Failed to parse Feroxbuster output" });
        }
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
 * IP to Netblock Network Analysis Endpoint
 *
 * POST /ip-to-netblock
 *
 * Analyzes IP addresses to identify network ranges and ownership information.
 * Uses network analysis tools to discover CIDR blocks and ASN details.
 *
 * Input:
 * - ip: string - The IP address to analyze
 *
 * Output:
 * - netblocks: string[] - Array of CIDR network ranges containing the IP
 * - owners: string[] - Array of network ownership and ASN information
 * - error: string - Error message if analysis fails
 *
 * Process:
 * 1. Validates IP address input
 * 2. Performs network analysis using whois and network tools
 * 3. Extracts CIDR network ranges and ownership details
 * 4. Returns structured network information
 * 5. Handles errors gracefully with appropriate status codes
 */
app.post("/ip-to-netblock", (req, res) => {
    const { ip } = req.body;
    if (!ip) {
        res.status(400).json({ error: "IP address is required" });
        return;
    }
    // Validate IP address format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
        res.status(400).json({ error: "Invalid IP address format" });
        return;
    }
    console.log(`Analyzing network information for IP: ${ip}`);
    // Use whois to get network information
    const command = `whois ${ip}`;
    const timeout = 30000; // 30 second timeout
    (0, child_process_1.exec)(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running IP analysis:", error);
            return res.status(500).json({ error: "Failed to analyze IP address" });
        }
        try {
            // Parse whois output to extract network information
            const lines = stdout.split("\n");
            const netblocks = [];
            const owners = [];
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                // Extract network blocks (CIDR ranges)
                if (lowerLine.includes("inetnum:") || lowerLine.includes("netrange:") || lowerLine.includes("cidr:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        const netblock = match[1].trim();
                        if (netblock && !netblocks.includes(netblock)) {
                            netblocks.push(netblock);
                        }
                    }
                }
                // Extract organization/owner information
                if (lowerLine.includes("organization:") || lowerLine.includes("org-name:") || lowerLine.includes("descr:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        const owner = match[1].trim();
                        if (owner && !owners.includes(owner)) {
                            owners.push(owner);
                        }
                    }
                }
                // Extract ASN information
                if (lowerLine.includes("origin:") || lowerLine.includes("as-name:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        const asn = match[1].trim();
                        if (asn && !owners.includes(asn)) {
                            owners.push(asn);
                        }
                    }
                }
            }
            // Remove duplicates
            const uniqueNetblocks = [...new Set(netblocks)];
            const uniqueOwners = [...new Set(owners)];
            const networkInfo = {
                netblocks: uniqueNetblocks,
                owners: uniqueOwners
            };
            console.log(`IP analysis completed for ${ip}:`, networkInfo);
            res.json(networkInfo);
        }
        catch (parseErr) {
            console.error("Error parsing IP analysis output:", parseErr);
            res.status(500).json({ error: "Failed to parse network information" });
        }
    });
});
/**
 * Port Scan API Endpoint
 *
 * POST /port-scan
 *
 * Executes nmap port scan on target systems and returns discovered open ports.
 *
 * Input:
 * - target: string - The target IP address or hostname to scan
 *
 * Output:
 * - ports: Array<{port: number, service: string}> - Array of open ports with service names
 * - error: string - Error message if scan fails
 *
 * Process:
 * 1. Validates target input
 * 2. Checks if nmap is available
 * 3. Executes nmap command with top 1000 ports scan
 * 4. Parses output to extract open ports and services
 * 5. Returns JSON response with discovered ports
 *
 * Nmap Command:
 * - Scans top 1000 ports (-F flag)
 * - Identifies service names (-sV flag)
 * - Provides machine-readable output (-oG flag)
 * - Includes host discovery (-sn flag)
 */
app.post("/port-scan", (req, res) => {
    const { target } = req.body;
    if (!target) {
        res.status(400).json({ error: "Target is required" });
        return;
    }
    if (!nmapPath) {
        res.status(500).json({ error: "Nmap executable not found in system PATH." });
        return;
    }
    // Use nmap to scan top 1000 ports with service detection
    const command = `${nmapPath} -F -sV -oG - ${target}`;
    const timeout = 60000; // 60 second timeout for port scanning
    console.log(`Running port scan for target: ${target}`);
    (0, child_process_1.exec)(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running port scan:", error);
            return res.status(500).json({ error: "Failed to run port scan" });
        }
        try {
            // Parse nmap output to extract open ports and services
            const lines = stdout.split("\n");
            const ports = [];
            for (const line of lines) {
                // Look for lines containing port information (e.g., "22/open/tcp//ssh//OpenSSH")
                if (line.includes("/open/")) {
                    const portMatch = line.match(/(\d+)\/open\/(tcp|udp)\/\/([^\/]+)/);
                    if (portMatch && portMatch[1] && portMatch[3]) {
                        const port = parseInt(portMatch[1]);
                        const service = portMatch[3].trim();
                        if (port && service && !ports.some(p => p.port === port)) {
                            ports.push({
                                port: port,
                                service: service || "unknown"
                            });
                        }
                    }
                }
            }
            // Sort ports by port number for consistent output
            ports.sort((a, b) => a.port - b.port);
            console.log(`Port scan completed for ${target}. Found ${ports.length} open ports:`, ports);
            res.json({ ports: ports });
        }
        catch (parseErr) {
            console.error("Error parsing port scan output:", parseErr);
            res.status(500).json({ error: "Failed to parse port scan results" });
        }
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
