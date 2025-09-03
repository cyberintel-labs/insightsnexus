"use strict";
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
 * - Data Processing: Validation and transformation
 */
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
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
// Import services
const toolDetection_js_1 = require("../services/toolDetection.js");
const fileSystem_js_1 = require("../services/fileSystem.js");
const externalTools_js_1 = require("../services/externalTools.js");
const dataProcessing_js_1 = require("../services/dataProcessing.js");
const router = (0, express_1.Router)();
// Initialize directories and tool paths
let directories;
let toolPaths;
// Initialize on module load
try {
    directories = (0, fileSystem_js_1.initializeDirectories)();
    toolPaths = (0, toolDetection_js_1.detectTools)();
}
catch (error) {
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
router.post("/sherlock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.body;
    if (!username) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Username is required"));
        return;
    }
    if (!(0, toolDetection_js_1.validateTool)("Sherlock", toolPaths.sherlock)) {
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Sherlock executable not found in system PATH."));
        return;
    }
    try {
        const services = yield (0, externalTools_js_1.executeSherlock)(toolPaths.sherlock, username);
        // Cache results
        const resultFilePath = path_1.default.join(directories.resultSaveDir, `${username}.json`);
        yield (0, fileSystem_js_1.writeJsonFile)(resultFilePath, services);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ services }));
    }
    catch (error) {
        console.error("Sherlock error:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to run Sherlock"));
    }
}));
/**
 * Website Screenshot Capture Endpoint
 *
 * POST /website-screenshot
 *
 * Captures a visual snapshot of a website using Puppeteer.
 */
router.post("/website-screenshot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.body;
    if (!url) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "URL is required"));
        return;
    }
    if (!(0, dataProcessing_js_1.validateUrl)(url)) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Invalid URL format - Must include domain and TLD"));
        return;
    }
    try {
        const screenshot = yield (0, dataProcessing_js_1.captureScreenshot)(url);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ screenshot }));
    }
    catch (error) {
        console.error("Error capturing website screenshot:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to capture screenshot"));
    }
}));
/**
 * Domain to Subdomain Enumeration Endpoint
 *
 * POST /domain-to-sub
 *
 * Executes ffuf for subdomain discovery.
 */
router.post("/domain-to-sub", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Domain is required"));
        return;
    }
    if (!(0, toolDetection_js_1.validateTool)("ffuf", toolPaths.ffuf)) {
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(null, "ffuf executable not found"));
        return;
    }
    try {
        const subdomains = yield (0, externalTools_js_1.executeFfufSubdomain)(toolPaths.ffuf, domain);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ subdomains }));
    }
    catch (error) {
        console.error("ffuf error:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to run ffuf"));
    }
}));
/**
 * Domain to Endpoint Enumeration Endpoint
 *
 * POST /domain-to-end
 *
 * Executes Feroxbuster for directory/file enumeration.
 */
router.post("/domain-to-end", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Domain is required"));
        return;
    }
    if (!(0, toolDetection_js_1.validateTool)("Feroxbuster", toolPaths.feroxbuster)) {
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Feroxbuster executable not found"));
        return;
    }
    try {
        const endpoints = yield (0, externalTools_js_1.executeFeroxbuster)(toolPaths.feroxbuster, domain);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ endpoints }));
    }
    catch (error) {
        console.error("Feroxbuster error:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to run Feroxbuster"));
    }
}));
/**
 * Domain to IP Resolution Endpoint
 *
 * POST /domain-to-ip
 *
 * Resolves domain names to IP addresses using DNS lookup.
 */
router.post("/domain-to-ip", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Domain is required"));
        return;
    }
    try {
        const ips = yield (0, dataProcessing_js_1.resolveDomain)(domain);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ ips }));
    }
    catch (error) {
        console.error("Error resolving domain:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to resolve domain"));
    }
}));
/**
 * Domain to DNS Records Endpoint
 *
 * POST /domain-to-dns
 *
 * Retrieves comprehensive DNS information for a domain.
 */
router.post("/domain-to-dns", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Domain is required"));
        return;
    }
    try {
        const records = yield (0, dataProcessing_js_1.getDnsRecords)(domain);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)(records));
    }
    catch (error) {
        console.error("Error retrieving DNS records:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to retrieve DNS records"));
    }
}));
/**
 * Whois Information Endpoint
 *
 * POST /whois
 *
 * Retrieves domain registration information using whois command.
 */
router.post("/whois", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { domain } = req.body;
    if (!domain) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Domain is required"));
        return;
    }
    try {
        const whoisInfo = yield (0, externalTools_js_1.executeWhois)(domain);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)(whoisInfo));
    }
    catch (error) {
        console.error("Error executing whois:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to retrieve WHOIS information"));
    }
}));
/**
 * IP to Netblock Network Analysis Endpoint
 *
 * POST /ip-to-netblock
 *
 * Analyzes IP addresses to identify network ranges and ownership information.
 */
router.post("/ip-to-netblock", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ip } = req.body;
    if (!ip) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "IP address is required"));
        return;
    }
    if (!(0, dataProcessing_js_1.validateIpAddress)(ip)) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Invalid IP address format"));
        return;
    }
    try {
        const networkInfo = yield (0, externalTools_js_1.executeIpAnalysis)(ip);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)(networkInfo));
    }
    catch (error) {
        console.error("Error running IP analysis:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to analyze IP address"));
    }
}));
/**
 * IP to Location Geographic Analysis Endpoint
 *
 * POST /ip-to-location
 *
 * Performs geolocation analysis on IP addresses using external API.
 */
router.post("/ip-to-location", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ip } = req.body;
    if (!ip) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "IP address is required"));
        return;
    }
    if (!(0, dataProcessing_js_1.validateIpAddress)(ip)) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Invalid IP address format"));
        return;
    }
    try {
        const data = yield (0, dataProcessing_js_1.getGeolocation)(ip);
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
        res.json((0, dataProcessing_js_1.formatSuccessResponse)(locationInfo));
    }
    catch (error) {
        console.error("Error performing geolocation analysis:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to perform geolocation analysis"));
    }
}));
/**
 * Port Scan Endpoint
 *
 * POST /port-scan
 *
 * Executes nmap port scan on target systems.
 */
router.post("/port-scan", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { target } = req.body;
    if (!target) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Target is required"));
        return;
    }
    if (!(0, toolDetection_js_1.validateTool)("Nmap", toolPaths.nmap)) {
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Nmap executable not found in system PATH."));
        return;
    }
    try {
        const ports = yield (0, externalTools_js_1.executeNmapScan)(toolPaths.nmap, target);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ ports }));
    }
    catch (error) {
        console.error("Error running port scan:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to run port scan"));
    }
}));
/**
 * Graph Save Endpoint
 *
 * POST /save
 *
 * Saves the current graph state to a JSON file.
 */
router.post("/save", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { filename, graphData } = req.body;
    if (!filename || !graphData) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Missing filename or graph data"));
        return;
    }
    try {
        const safeName = (0, fileSystem_js_1.sanitizeFilename)(filename);
        const filePath = path_1.default.join(directories.graphSaveDir, `${safeName}.json`);
        yield (0, fileSystem_js_1.writeJsonFile)(filePath, graphData);
        console.log(`Graph saved to ${filePath}`);
        res.status(200).json((0, dataProcessing_js_1.formatSuccessResponse)({}, "Saved successfully"));
    }
    catch (error) {
        console.error("Error saving file:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to save file"));
    }
}));
/**
 * List Saved Graphs Endpoint
 *
 * GET /saves
 *
 * Returns a list of all saved graph files.
 */
router.get("/saves", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield (0, fileSystem_js_1.listFiles)(directories.graphSaveDir, ".json");
        res.json(files);
    }
    catch (error) {
        console.error("Failed to list saves:", error);
        res.status(500).json([]);
    }
}));
/**
 * Load Graph Endpoint
 *
 * GET /load/:filename
 *
 * Loads a specific saved graph file.
 */
router.get("/load/:filename", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filename = req.params.filename;
    const filePath = path_1.default.join(directories.graphSaveDir, filename);
    try {
        const json = yield (0, fileSystem_js_1.readJsonFile)(filePath);
        res.json(json);
    }
    catch (error) {
        console.error("Error loading file:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to load file"));
    }
}));
/**
 * Automatic Node Type Detection Endpoint
 *
 * POST /detect-node-type
 *
 * Automatically detects the appropriate node type based on the provided label.
 */
router.post("/detect-node-type", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { label } = req.body;
    if (!label) {
        res.status(400).json((0, dataProcessing_js_1.formatErrorResponse)(null, "Label is required"));
        return;
    }
    try {
        const nodeType = (0, dataProcessing_js_1.detectNodeType)(label);
        res.json((0, dataProcessing_js_1.formatSuccessResponse)({ nodeType }));
    }
    catch (error) {
        console.error("Error detecting node type:", error);
        res.status(500).json((0, dataProcessing_js_1.formatErrorResponse)(error, "Failed to detect node type"));
    }
}));
exports.default = router;
