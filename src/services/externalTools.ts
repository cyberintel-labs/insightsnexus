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
 * - nmap: Port scanning
 * - whois: Domain information
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { ToolPaths } from "./toolDetection.js";

const execAsync = promisify(exec);

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
export async function executeSherlock(sherlockPath: string, username: string): Promise<string[]> {
    const command = `${sherlockPath} ${username} --print-found`;
    console.log(`Running Sherlock for: ${username}`);

    try {
        const { stdout } = await execAsync(command);
        const foundServices: string[] = [];
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
    } catch (error) {
        console.error("Error running Sherlock:", error);
        throw new Error("Failed to run Sherlock");
    }
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
export async function executeFfufSubdomain(ffufPath: string, domain: string): Promise<string[]> {
    const wordlistPath = path.join(__dirname, "../../../Datalist/subdomains-top1million-110000.txt");
    const command = `${ffufPath} -u https://FUZZ.${domain} -w ${wordlistPath} -mc 200,301,302 -v -of csv -o -`;

    console.log(`Running ffuf for subdomains of: ${domain}`);
    console.log("Executing command:", command);

    try {
        const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 * 20 });
        const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);

        const subdomains: string[] = [];
        for (const line of lines) {
            if (line.startsWith("input")) continue; // skip header
            const cols = line.split(",");
            if (cols.length > 0) {
                const host = cols[0].replace("https://", "").replace("/", "");
                if (host.includes(".")) subdomains.push(host);
            }
        }

        const uniqueSubs = Array.from(new Set(subdomains));
        console.log(`ffuf found ${uniqueSubs.length} subdomains`);
        return uniqueSubs;
    } catch (error) {
        console.error("ffuf error:", error);
        throw new Error("Failed to run ffuf");
    }
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
export async function executeFeroxbuster(feroxPath: string, domain: string): Promise<string[]> {
    const wordlistPath = path.join(__dirname, "../../../Datalist/raft-medium-directories.txt");
    const command = `${feroxPath} -u https://${domain}/ -w ${wordlistPath} --silent`;

    console.log(`Running Feroxbuster for domain: ${domain}`);
    console.log("Executing command:", command);

    try {
        const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 * 20 });
        const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);

        const endpoints = lines.map(url => {
            try {
                const u = new URL(url);
                return u.pathname;
            } catch {
                return null;
            }
        }).filter((endpoint): endpoint is string => endpoint !== null);

        const uniqueEndpoints = Array.from(new Set(endpoints));
        console.log(`Feroxbuster found ${uniqueEndpoints.length} endpoints`);
        return uniqueEndpoints;
    } catch (error) {
        console.error("Feroxbuster error:", error);
        throw new Error("Failed to run Feroxbuster");
    }
}

/**
 * Nmap Port Scan
 * 
 * executeNmapScan(nmapPath: string, target: string): Promise<Array<{port: number, service: string}>>
 * 
 * Executes nmap port scan on target systems.
 * 
 * Input:
 * - nmapPath: string - Path to nmap executable
 * - target: string - Target IP address or hostname
 * 
 * Returns:
 * - Promise<Array<{port: number, service: string}>> - Array of open ports with services
 * 
 * Process:
 * 1. Builds nmap command with service detection
 * 2. Executes command with grepable output
 * 3. Parses output to extract open ports and services
 * 4. Returns sorted port list
 * 
 * Error Handling:
 * - Throws error on command execution failure
 * - Handles parsing errors gracefully
 */
export async function executeNmapScan(nmapPath: string, target: string): Promise<Array<{port: number, service: string}>> {
    const command = `${nmapPath} -F -sV -oG - ${target}`;
    const timeout = 60000; // 60 second timeout

    console.log(`Running port scan for target: ${target}`);

    try {
        const { stdout } = await execAsync(command, { timeout });
        const lines = stdout.split("\n");
        const ports: Array<{port: number, service: string}> = [];

        for (const line of lines) {
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

        ports.sort((a, b) => a.port - b.port);
        console.log(`Port scan completed for ${target}. Found ${ports.length} open ports:`, ports);
        return ports;
    } catch (error) {
        console.error("Error running port scan:", error);
        throw new Error("Failed to run port scan");
    }
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
export async function executeWhois(domain: string): Promise<{registrar: string, nameServers: string[], creationDate: string, expiryDate: string}> {
    const command = `whois ${domain}`;
    const timeout = 30000; // 30 second timeout
    const maxRetries = 3;
    let retryCount = 0;

    const executeWithRetry = async (): Promise<string> => {
        console.log(`Running whois for domain: ${domain} (attempt ${retryCount + 1}/${maxRetries + 1})`);

        try {
            const { stdout } = await execAsync(command, { timeout });
            return stdout;
        } catch (error: any) {
            console.error(`Whois error for ${domain}:`, error);
            
            if (retryCount < maxRetries && (String(error.code) === 'ETIMEDOUT' || error.signal === 'SIGTERM')) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying whois for ${domain} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return executeWithRetry();
            }
            
            throw new Error("Failed to retrieve WHOIS information");
        }
    };

    try {
        const stdout = await executeWithRetry();
        const lines = stdout.split("\n");
        let registrar = "";
        const nameServers: string[] = [];
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
    } catch (error) {
        console.error("Error executing whois:", error);
        throw error;
    }
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
export async function executeIpAnalysis(ip: string): Promise<{netblocks: string[], owners: string[]}> {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
        throw new Error("Invalid IP address format");
    }

    const command = `whois ${ip}`;
    const timeout = 30000;

    console.log(`Analyzing network information for IP: ${ip}`);

    try {
        const { stdout } = await execAsync(command, { timeout });
        const lines = stdout.split("\n");
        const netblocks: string[] = [];
        const owners: string[] = [];

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
    } catch (error) {
        console.error("Error running IP analysis:", error);
        throw new Error("Failed to analyze IP address");
    }
}
