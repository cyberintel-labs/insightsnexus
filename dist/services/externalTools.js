"use strict";
/**
 * External Tools Service
 *
 * This service handles the execution of external command-line tools used by the application.
 * It provides wrappers for tool execution, command building, and output parsing.
 *
 * Supported Tools:
 * - Sherlock: Username enumeration
 * - Feroxbuster: Directory enumeration
 * - ffuf: Web fuzzing
 *
 * Copyright (c) 2024 Investigating Project
 * Licensed under the MIT License
 * - portscanner: Port scanning
 * - whois: Domain information
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
exports.executeSherlock = executeSherlock;
exports.executeFfufSubdomain = executeFfufSubdomain;
exports.executeFeroxbuster = executeFeroxbuster;
exports.executePortScan = executePortScan;
exports.executeWhois = executeWhois;
exports.executeIpAnalysis = executeIpAnalysis;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Sherlock Command Execution
 *
 * executeSherlock(sherlockPath: string, username: string): Promise<string[]>
 *
 * Executes Sherlock username search and returns found social media platforms.
 *
 * Input:
 * - sherlockPath: string - Path to Sherlock executable
 * - username: string - Username to search
 *
 * Returns:
 * - Promise<string[]> - Array of found platform names
 *
 * Process:
 * 1. Builds Sherlock command with --print-found flag
 * 2. Executes command asynchronously
 * 3. Parses output to extract found services
 * 4. Returns array of platform names
 *
 * Error Handling:
 * - Throws error on command execution failure
 * - Logs execution details for debugging
 */
function executeSherlock(sherlockPath, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = `${sherlockPath} ${username} --print-found`;
        console.log(`Running Sherlock for: ${username}`);
        try {
            const { stdout } = yield execAsync(command);
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
            return foundServices;
        }
        catch (error) {
            console.error("Error running Sherlock:", error);
            throw new Error("Failed to run Sherlock");
        }
    });
}
/**
 * ffuf Subdomain Discovery
 *
 * executeFfufSubdomain(ffufPath: string, domain: string): Promise<string[]>
 *
 * Executes ffuf for subdomain discovery using a wordlist.
 *
 * Input:
 * - ffufPath: string - Path to ffuf executable
 * - domain: string - Target domain for subdomain discovery
 *
 * Returns:
 * - Promise<string[]> - Array of discovered subdomains
 *
 * Process:
 * 1. Builds ffuf command with wordlist and target domain
 * 2. Executes command with CSV output format
 * 3. Parses CSV output to extract subdomains
 * 4. Returns unique subdomain list
 *
 * Error Handling:
 * - Throws error on command execution failure
 * - Handles parsing errors gracefully
 */
function executeFfufSubdomain(ffufPath, domain) {
    return __awaiter(this, void 0, void 0, function* () {
        // Clean domain by removing common prefixes
        const cleanDomain = domain
            .replace(/^https?:\/\//, '') // Remove http:// or https://
            .replace(/^www\./, '') // Remove www.
            .replace(/\/$/, ''); // Remove trailing slash
        const wordlistPath = path_1.default.join(__dirname, "../../data/subdomains-top1million-110000.txt");
        const command = `${ffufPath} -u https://FUZZ.${cleanDomain} -w ${wordlistPath} -mc 200,301,302 -v -of csv -o -`;
        console.log(`Running ffuf for subdomains of: ${cleanDomain} (cleaned from: ${domain})`);
        console.log("Executing command:", command);
        try {
            const { stdout } = yield execAsync(command, { maxBuffer: 1024 * 1024 * 20 });
            const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
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
            console.log(`ffuf found ${uniqueSubs.length} subdomains for ${cleanDomain}`);
            return uniqueSubs;
        }
        catch (error) {
            console.error("ffuf error:", error);
            throw new Error("Failed to run ffuf");
        }
    });
}
/**
 * Feroxbuster Directory Enumeration
 *
 * executeFeroxbuster(feroxPath: string, domain: string): Promise<string[]>
 *
 * Executes Feroxbuster for directory/file enumeration.
 *
 * Input:
 * - feroxPath: string - Path to Feroxbuster executable
 * - domain: string - Target domain for enumeration
 *
 * Returns:
 * - Promise<string[]> - Array of discovered endpoints
 *
 * Process:
 * 1. Builds Feroxbuster command with wordlist and target domain
 * 2. Executes command with silent output
 * 3. Parses output to extract endpoint paths
 * 4. Returns unique endpoint list
 *
 * Error Handling:
 * - Throws error on command execution failure
 * - Handles parsing errors gracefully
 */
function executeFeroxbuster(feroxPath, domain) {
    return __awaiter(this, void 0, void 0, function* () {
        const wordlistPath = path_1.default.join(__dirname, "../../data/raft-medium-directories.txt");
        const command = `${feroxPath} -u https://${domain}/ -w ${wordlistPath} --silent`;
        console.log(`Running Feroxbuster for domain: ${domain}`);
        console.log("Executing command:", command);
        try {
            const { stdout } = yield execAsync(command, { maxBuffer: 1024 * 1024 * 20 });
            const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
            const endpoints = lines.map(url => {
                try {
                    const u = new URL(url);
                    return u.pathname;
                }
                catch (_a) {
                    return null;
                }
            }).filter((endpoint) => endpoint !== null);
            const uniqueEndpoints = Array.from(new Set(endpoints));
            console.log(`Feroxbuster found ${uniqueEndpoints.length} endpoints`);
            return uniqueEndpoints;
        }
        catch (error) {
            console.error("Feroxbuster error:", error);
            throw new Error("Failed to run Feroxbuster");
        }
    });
}
/**
 * Port Scanner
 *
 * executePortScan(target: string): Promise<Array<{port: number, service: string}>>
 *
 * Executes port scan using the portscanner library with top 1000 ports.
 *
 * Input:
 * - target: string - Target IP address or hostname
 *
 * Returns:
 * - Promise<Array<{port: number, service: string}>> - Array of open ports with services
 *
 * Process:
 * 1. Reads top 1000 most common ports from data file
 * 2. Scans ports using portscanner library in batches
 * 3. Identifies open ports and attempts service detection
 * 4. Returns sorted port list with service information
 *
 * Error Handling:
 * - Handles network errors gracefully
 * - Provides meaningful error messages
 * - Returns empty array on scan failure
 */
function executePortScan(target) {
    return __awaiter(this, void 0, void 0, function* () {
        const portscanner = require('portscanner');
        console.log(`Running port scan for target: ${target}`);
        try {
            // Read top 1000 ports from data file
            const portsFilePath = path_1.default.join(__dirname, "../../data/top-1000-ports.txt");
            const portsData = fs_1.default.readFileSync(portsFilePath, 'utf-8');
            const topPorts = portsData
                .split('\n')
                .map(line => parseInt(line.trim(), 10))
                .filter(port => !isNaN(port) && port > 0 && port <= 65535);
            console.log(`Loaded ${topPorts.length} ports from top 1000 list`);
            const ports = [];
            // Scan ports in batches to avoid overwhelming the target
            const batchSize = 50;
            for (let i = 0; i < topPorts.length; i += batchSize) {
                const batch = topPorts.slice(i, i + batchSize);
                const promises = batch.map((port) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const status = yield portscanner.checkPortStatus(port, target, { timeout: 3000 });
                        if (status === 'open') {
                            const service = getServiceName(port);
                            return { port, service };
                        }
                        return null;
                    }
                    catch (error) {
                        return null;
                    }
                }));
                const results = yield Promise.all(promises);
                const openPorts = results.filter(result => result !== null);
                ports.push(...openPorts);
            }
            ports.sort((a, b) => a.port - b.port);
            console.log(`Port scan completed for ${target}. Found ${ports.length} open ports:`, ports);
            return ports;
        }
        catch (error) {
            console.error("Error running port scan:", error);
            throw new Error("Failed to run port scan");
        }
    });
}
/**
 * Get Service Name for Port
 *
 * getServiceName(port: number): string
 *
 * Returns the common service name for a given port number.
 *
 * Input:
 * - port: number - Port number to identify service for
 *
 * Returns:
 * - string - Service name or "unknown" if not recognized
 */
function getServiceName(port) {
    const serviceMap = {
        20: 'ftp-data', 21: 'ftp', 22: 'ssh', 23: 'telnet', 25: 'smtp', 26: 'smtp', 37: 'time',
        42: 'nameserver', 43: 'whois', 49: 'tacacs', 53: 'dns', 70: 'gopher', 79: 'finger',
        80: 'http', 88: 'kerberos', 102: 'iso-tsap', 106: 'pop3pw', 109: 'pop2', 110: 'pop3',
        111: 'rpcbind', 113: 'ident', 115: 'sftp', 118: 'sqlserv', 119: 'nntp', 123: 'ntp',
        135: 'msrpc', 136: 'profile', 137: 'netbios-ns', 138: 'netbios-dgm', 139: 'netbios-ssn',
        143: 'imap', 161: 'snmp', 162: 'snmptrap', 179: 'bgp', 194: 'irc', 199: 'smux',
        201: 'at-rtmp', 209: 'qmtp', 210: 'z39.50', 211: '914c/g', 212: 'anet', 213: 'ipx',
        220: 'imap3', 225: 'ldap', 443: 'https', 444: 'snpp', 445: 'microsoft-ds',
        993: 'imaps', 995: 'pop3s', 1723: 'pptp', 3306: 'mysql', 3389: 'rdp',
        5432: 'postgresql', 5900: 'vnc', 8080: 'http-alt', 8443: 'https-alt',
        8888: 'http-alt', 9000: 'http-alt', 9090: 'http-alt'
    };
    return serviceMap[port] || 'unknown';
}
/**
 * Whois Command Execution
 *
 * executeWhois(domain: string): Promise<{registrar: string, nameServers: string[], creationDate: string, expiryDate: string}>
 *
 * Executes whois command with retry logic and timeout handling.
 *
 * Input:
 * - domain: string - Domain to query for WHOIS information
 *
 * Returns:
 * - Promise<{registrar: string, nameServers: string[], creationDate: string, expiryDate: string}> - Parsed WHOIS data
 *
 * Process:
 * 1. Executes whois command with timeout
 * 2. Implements retry logic with exponential backoff
 * 3. Parses output to extract relevant information
 * 4. Returns structured WHOIS data
 *
 * Error Handling:
 * - Implements retry logic for timeout errors
 * - Handles parsing errors gracefully
 * - Provides meaningful error messages
 */
function executeWhois(domain) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = `whois ${domain}`;
        const timeout = 30000; // 30 second timeout
        const maxRetries = 3;
        let retryCount = 0;
        const executeWithRetry = () => __awaiter(this, void 0, void 0, function* () {
            console.log(`Running whois for domain: ${domain} (attempt ${retryCount + 1}/${maxRetries + 1})`);
            try {
                const { stdout } = yield execAsync(command, { timeout });
                return stdout;
            }
            catch (error) {
                console.error(`Whois error for ${domain}:`, error);
                if (retryCount < maxRetries && (String(error.code) === 'ETIMEDOUT' || error.signal === 'SIGTERM')) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`Retrying whois for ${domain} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                    yield new Promise(resolve => setTimeout(resolve, delay));
                    return executeWithRetry();
                }
                throw new Error("Failed to retrieve WHOIS information");
            }
        });
        try {
            const stdout = yield executeWithRetry();
            const lines = stdout.split("\n");
            let registrar = "";
            const nameServers = [];
            let creationDate = "";
            let expiryDate = "";
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes("registrar:") || lowerLine.includes("registrar name:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        registrar = match[1].trim();
                    }
                }
                if (lowerLine.includes("name server:") || lowerLine.includes("nserver:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        const ns = match[1].trim();
                        if (ns && !nameServers.includes(ns)) {
                            nameServers.push(ns);
                        }
                    }
                }
                if (lowerLine.includes("creation date:") || lowerLine.includes("created:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        creationDate = match[1].trim();
                    }
                }
                if (lowerLine.includes("expiry date:") || lowerLine.includes("expires:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        expiryDate = match[1].trim();
                    }
                }
            }
            const uniqueNameServers = [...new Set(nameServers)];
            const whoisInfo = {
                registrar: registrar || "Unknown",
                nameServers: uniqueNameServers,
                creationDate: creationDate || "Unknown",
                expiryDate: expiryDate || "Unknown"
            };
            console.log(`Whois completed for ${domain}:`, whoisInfo);
            return whoisInfo;
        }
        catch (error) {
            console.error("Error executing whois:", error);
            throw error;
        }
    });
}
/**
 * IP Network Analysis
 *
 * executeIpAnalysis(ip: string): Promise<{netblocks: string[], owners: string[]}>
 *
 * Executes whois command for IP address network analysis.
 *
 * Input:
 * - ip: string - IP address to analyze
 *
 * Returns:
 * - Promise<{netblocks: string[], owners: string[]}> - Network information
 *
 * Process:
 * 1. Validates IP address format
 * 2. Executes whois command for IP
 * 3. Parses output to extract network information
 * 4. Returns structured network data
 *
 * Error Handling:
 * - Validates IP format before execution
 * - Handles parsing errors gracefully
 */
function executeIpAnalysis(ip) {
    return __awaiter(this, void 0, void 0, function* () {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(ip)) {
            throw new Error("Invalid IP address format");
        }
        const command = `whois ${ip}`;
        const timeout = 30000;
        console.log(`Analyzing network information for IP: ${ip}`);
        try {
            const { stdout } = yield execAsync(command, { timeout });
            const lines = stdout.split("\n");
            const netblocks = [];
            const owners = [];
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes("inetnum:") || lowerLine.includes("netrange:") || lowerLine.includes("cidr:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        const netblock = match[1].trim();
                        if (netblock && !netblocks.includes(netblock)) {
                            netblocks.push(netblock);
                        }
                    }
                }
                if (lowerLine.includes("organization:") || lowerLine.includes("org-name:") || lowerLine.includes("descr:")) {
                    const match = line.match(/:\s*(.+)/);
                    if (match && match[1]) {
                        const owner = match[1].trim();
                        if (owner && !owners.includes(owner)) {
                            owners.push(owner);
                        }
                    }
                }
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
            const uniqueNetblocks = [...new Set(netblocks)];
            const uniqueOwners = [...new Set(owners)];
            const networkInfo = {
                netblocks: uniqueNetblocks,
                owners: uniqueOwners
            };
            console.log(`IP analysis completed for ${ip}:`, networkInfo);
            return networkInfo;
        }
        catch (error) {
            console.error("Error running IP analysis:", error);
            throw new Error("Failed to analyze IP address");
        }
    });
}
