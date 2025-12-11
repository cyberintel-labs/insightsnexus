/**
 * API Routes Module
 * 
 * This module contains all API endpoints for the OSINT investigation tool.
 * It organizes routes by functionality and uses extracted services for
 * business logic implementation.
 * 
 * Route Categories:
 * - OSINT Tools: Sherlock, port scanning, DNS, etc.
 * - File Operations: Save/load graph data
 * 
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)
 * - Data Processing: Validation and transformation
 */

import { Router, Request, Response } from "express";
import path from "path";
import multer from "multer";

// Import services
import { ToolPaths, validateTool, detectTools } from "../services/toolDetection.js";
import { 
    initializeDirectories, 
    sanitizeFilename, 
    writeJsonFile, 
    readJsonFile, 
    listFiles 
} from "../services/fileSystem.js";
import {
    executeSherlock,
    executeFfufSubdomain,
    executeFeroxbuster,
    executePortScan,
    executeWhois,
    executeIpAnalysis
} from "../services/externalTools.js";
import {
    validateUrl,
    validateIpAddress,
    validateDomain,
    resolveDomain,
    getDnsRecords,
    getGeolocation,
    captureScreenshot,
    detectNodeType,
    formatErrorResponse,
    formatSuccessResponse
} from "../services/dataProcessing.js";

const router = Router();

import{ 
    hasCustomTransform, 
    saveCustomTransform, 
    removeCustomTransform, 
    executeCustomTransform 
}from "../services/customTransform.js";


const upload = multer(); // memory storage

// Upload a Python transform
router.post("/upload-transform", upload.single("file"), async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    if(!req.file || !req.file.originalname.endsWith(".py")){
        res.status(400).json({ error: "Only .py files are allowed" });
        return;
    }

    try{
        await saveCustomTransform(req.file.buffer);
        res.json({ message: "Custom transform uploaded successfully" });
    }catch(err){
        res.status(500).json({ error: "Failed to save custom transform" });
    }
});

// Remove custom transform
router.delete("/remove-transform", async (_req: Request, res: Response) => {
    try{
        await removeCustomTransform();
        res.json({ message: "Custom transform removed" });
    }catch(err){
        res.status(500).json({ error: "Failed to remove custom transform" });
    }
});

// Check if transform exists
router.get("/has-transform", (_req: Request, res: Response) => {
    res.json({ exists: hasCustomTransform() });
});

// Run transform
router.post("/run-transform", async (req: Request, res: Response) => {
    const { nodeLabel } = req.body;
    if(!nodeLabel){
        res.status(400).json({ error: "nodeLabel is required" });
        return;
    }

    try{
        const result = await executeCustomTransform(nodeLabel);
        res.json({ 
            nodes: result.nodes,
            files: result.files
        });
    }catch(err){
        res.status(500).json({ error: "Failed to execute custom transform" });
    }
});

// Initialize directories and tool paths
let directories: any;
let toolPaths: ToolPaths;

// Initialize on module load
try {
    directories = initializeDirectories();
    toolPaths = detectTools();
} catch (error) {
    console.error("Failed to initialize API routes:", error);
    process.exit(1);
}

/**
 * Sherlock Username Search Endpoint
 * 
 * POST /sherlock
 * 
 * Executes Sherlock username search and returns found social media platforms.
 */
router.post("/sherlock", async (req: Request, res: Response): Promise<void> => {
    const { username } = req.body;
    
    if (!username) {
        res.status(400).json(formatErrorResponse(null, "Username is required"));
        return;
    }
    
    if (!validateTool("Sherlock", toolPaths.sherlock)) {
        res.status(500).json(formatErrorResponse(null, "Sherlock executable not found in system PATH."));
        return;
    }

    try {
        const services = await executeSherlock(toolPaths.sherlock, username);
        
        // Cache results
        const resultFilePath = path.join(directories.resultSaveDir, `${username}.json`);
        await writeJsonFile(resultFilePath, services);
        
        res.json(formatSuccessResponse({ services }));
    } catch (error) {
        console.error("Sherlock error:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to run Sherlock"));
    }
});

/**
 * Website Screenshot Capture Endpoint
 * 
 * POST /website-screenshot
 * 
 * Captures a visual snapshot of a website using Puppeteer.
 */
router.post("/website-screenshot", async (req: Request, res: Response): Promise<void> => {
    const { url } = req.body;
    
    if (!url) {
        res.status(400).json(formatErrorResponse(null, "URL is required"));
        return;
    }

    if (!validateUrl(url)) {
        res.status(400).json(formatErrorResponse(null, "Invalid URL format - Must include domain and TLD"));
        return;
    }

    try {
        const screenshot = await captureScreenshot(url);
        res.json(formatSuccessResponse({ screenshot }));
    } catch (error) {
        console.error("Error capturing website screenshot:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to capture screenshot"));
    }
});

/**
 * Domain to Subdomain Enumeration Endpoint
 * 
 * POST /domain-to-sub
 * 
 * Executes ffuf for subdomain discovery.
 */
router.post("/domain-to-sub", async (req: Request, res: Response): Promise<void> => {
    const { domain } = req.body;

    if (!domain) {
        res.status(400).json(formatErrorResponse(null, "Domain is required"));
        return;
    }
    
    if (!validateTool("ffuf", toolPaths.ffuf)) {
        res.status(500).json(formatErrorResponse(null, "ffuf executable not found"));
        return;
    }

    try {
        const subdomains = await executeFfufSubdomain(toolPaths.ffuf, domain);
        res.json(formatSuccessResponse({ subdomains }));
    } catch (error) {
        console.error("ffuf error:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to run ffuf"));
    }
});

/**
 * Domain to Endpoint Enumeration Endpoint
 * 
 * POST /domain-to-end
 * 
 * Executes Feroxbuster for directory/file enumeration.
 */
router.post("/domain-to-end", async (req: Request, res: Response): Promise<void> => {
    const { domain } = req.body;

    if (!domain) {
        res.status(400).json(formatErrorResponse(null, "Domain is required"));
        return;
    }
    
    if (!validateTool("Feroxbuster", toolPaths.feroxbuster)) {
        res.status(500).json(formatErrorResponse(null, "Feroxbuster executable not found"));
        return;
    }

    try {
        const endpoints = await executeFeroxbuster(toolPaths.feroxbuster, domain);
        res.json(formatSuccessResponse({ endpoints }));
    } catch (error) {
        console.error("Feroxbuster error:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to run Feroxbuster"));
    }
});

/**
 * Domain to IP Resolution Endpoint
 * 
 * POST /domain-to-ip
 * 
 * Resolves domain names to IP addresses using DNS lookup.
 */
router.post("/domain-to-ip", async (req: Request, res: Response): Promise<void> => {
    const { domain } = req.body;
    
    if (!domain) {
        res.status(400).json(formatErrorResponse(null, "Domain is required"));
        return;
    }

    try {
        const ips = await resolveDomain(domain);
        res.json(formatSuccessResponse({ ips }));
    } catch (error) {
        console.error("Error resolving domain:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to resolve domain"));
    }
});

/**
 * Domain to DNS Records Endpoint
 * 
 * POST /domain-to-dns
 * 
 * Retrieves comprehensive DNS information for a domain.
 */
router.post("/domain-to-dns", async (req: Request, res: Response): Promise<void> => {
    const { domain } = req.body;

    if (!domain) {
        res.status(400).json(formatErrorResponse(null, "Domain is required"));
        return;
    }

    try {
        const records = await getDnsRecords(domain);
        res.json(formatSuccessResponse(records));
    } catch (error) {
        console.error("Error retrieving DNS records:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to retrieve DNS records"));
    }
});

/**
 * Whois Information Endpoint
 * 
 * POST /whois
 * 
 * Retrieves domain registration information using whois command.
 */
router.post("/whois", async (req: Request, res: Response): Promise<void> => {
    const { domain } = req.body;

    if (!domain) {
        res.status(400).json(formatErrorResponse(null, "Domain is required"));
        return;
    }

    try {
        const whoisInfo = await executeWhois(domain);
        res.json(formatSuccessResponse(whoisInfo));
    } catch (error) {
        console.error("Error executing whois:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to retrieve WHOIS information"));
    }
});

/**
 * IP to Netblock Network Analysis Endpoint
 * 
 * POST /ip-to-netblock
 * 
 * Analyzes IP addresses to identify network ranges and ownership information.
 */
router.post("/ip-to-netblock", async (req: Request, res: Response): Promise<void> => {
    const { ip } = req.body;
    
    if (!ip) {
        res.status(400).json(formatErrorResponse(null, "IP address is required"));
        return;
    }

    if (!validateIpAddress(ip)) {
        res.status(400).json(formatErrorResponse(null, "Invalid IP address format"));
        return;
    }

    try {
        const networkInfo = await executeIpAnalysis(ip);
        res.json(formatSuccessResponse(networkInfo));
    } catch (error) {
        console.error("Error running IP analysis:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to analyze IP address"));
    }
});

/**
 * IP to Location Geographic Analysis Endpoint
 * 
 * POST /ip-to-location
 * 
 * Performs geolocation analysis on IP addresses using external API.
 */
router.post("/ip-to-location", async (req: Request, res: Response): Promise<void> => {
    const { ip } = req.body;
    
    if (!ip) {
        res.status(400).json(formatErrorResponse(null, "IP address is required"));
        return;
    }

    if (!validateIpAddress(ip)) {
        res.status(400).json(formatErrorResponse(null, "Invalid IP address format"));
        return;
    }

    try {
        const data = await getGeolocation(ip);
        const locationInfo = {
            countryName: data.countryName || "Unknown",
            countryCode: data.countryCode || "Unknown",
            cityName: data.cityName || "Unknown",
            regionName: data.regionName || "Unknown",
            latitude: data.latitude || "Unknown",
            longitude: data.longitude || "Unknown",
            zipCode: data.zipCode || "Unknown",
            asn: data.asn || "Unknown",
            asnOrganization: data.asnOrganization || "Unknown",
            isProxy: data.isProxy || false
        };
        
        res.json(formatSuccessResponse(locationInfo));
    } catch (error) {
        console.error("Error performing geolocation analysis:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to perform geolocation analysis"));
    }
});

/**
 * Port Scan Endpoint
 * 
 * POST /port-scan
 * 
 * Executes port scan using portscanner library with top 1000 ports.
 */
router.post("/port-scan", async (req: Request, res: Response): Promise<void> => {
    const { target } = req.body;
    
    if (!target) {
        res.status(400).json(formatErrorResponse(null, "Target is required"));
        return;
    }

    try {
        const ports = await executePortScan(target);
        res.json(formatSuccessResponse({ ports }));
    } catch (error) {
        console.error("Error running port scan:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to run port scan"));
    }
});

/**
 * Graph Save Endpoint
 * 
 * POST /save
 * 
 * Saves the current graph state to a JSON file.
 */
router.post("/save", async (req: Request, res: Response): Promise<void> => {
    const { filename, graphData, notes } = req.body;

    if (!filename || !graphData) {
        res.status(400).json(formatErrorResponse(null, "Missing filename or graph data"));
        return;
    }

    try {
        const safeName = sanitizeFilename(filename);
        const filePath = path.join(directories.graphSaveDir, `${safeName}.json`);
        
        // Create save data object with notes
        const saveData = {
            graphData,
            notes: notes || ''
        };
        
        await writeJsonFile(filePath, saveData);
        
        console.log(`Graph and notes saved to ${filePath}`);
        res.status(200).json(formatSuccessResponse({}, "Saved successfully"));
    } catch (error) {
        console.error("Error saving file:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to save file"));
    }
});

/**
 * List Saved Graphs Endpoint
 * 
 * GET /saves
 * 
 * Returns a list of all saved graph files.
 */
router.get("/saves", async (req: Request, res: Response): Promise<void> => {
    try {
        const files = await listFiles(directories.graphSaveDir, ".json");
        res.json(files);
    } catch (error) {
        console.error("Failed to list saves:", error);
        res.status(500).json([]);
    }
});

/**
 * Load Graph Endpoint
 * 
 * GET /load/:filename
 * 
 * Loads a specific saved graph file.
 */
router.get("/load/:filename", async (req: Request, res: Response): Promise<void> => {
    const filename = req.params.filename;
    const filePath = path.join(directories.graphSaveDir, filename);

    try {
        const json = await readJsonFile(filePath);
        res.json(json);
    } catch (error) {
        console.error("Error loading file:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to load file"));
    }
});

/**
 * Automatic Node Type Detection Endpoint
 * 
 * POST /detect-node-type
 * 
 * Automatically detects the appropriate node type based on the provided label.
 */
router.post("/detect-node-type", async (req: Request, res: Response): Promise<void> => {
    const { label } = req.body;
    
    if (!label) {
        res.status(400).json(formatErrorResponse(null, "Label is required"));
        return;
    }

    try {
        const nodeType = detectNodeType(label);
        res.json(formatSuccessResponse({ nodeType }));
    } catch (error) {
        console.error("Error detecting node type:", error);
        res.status(500).json(formatErrorResponse(error, "Failed to detect node type"));
    }
});

export default router;
