/**
 * Tool Detection Service
 * 
 * This service handles the detection and validation of external tools required by the application.
 * It attempts to automatically detect tool executables in the system PATH and provides
 * validation methods to check tool availability.
 * 
 * Supported Tools:
 * - Sherlock: Username enumeration across social media platforms
 * - Feroxbuster: Directory/file enumeration
 * - ffuf: Web fuzzing and subdomain discovery
 * - nmap: Port scanning and network discovery
 */

import { execSync } from "child_process";

/**
 * Tool Path Detection Results
 * 
 * Interface defining the structure for tool detection results.
 * Each tool has a path property that contains the executable path or empty string if not found.
 */
export interface ToolPaths {
    sherlock: string;
    feroxbuster: string;
    ffuf: string;
    nmap: string;
}

/**
 * Detect Tool Executables
 * 
 * detectTools(): ToolPaths
 * 
 * Attempts to automatically detect all required tool executables in the system PATH.
 * Uses platform-specific commands (Windows 'where' vs Unix 'which') to locate tools.
 * 
 * Process:
 * 1. Attempts Windows 'where' command for each tool
 * 2. Falls back to Unix 'which' command if Windows fails
 * 3. Sets empty string if tool is not found
 * 4. Logs detection results for debugging
 * 
 * Returns:
 * - ToolPaths object with detected paths for each tool
 * 
 * Error Handling:
 * - Catches and logs detection failures
 * - Continues detection process even if individual tools fail
 * - Provides empty string fallback for missing tools
 */
export function detectTools(): ToolPaths {
    const tools: ToolPaths = {
        sherlock: "",
        feroxbuster: "",
        ffuf: "",
        nmap: ""
    };

    // Detect Sherlock
    try {
        tools.sherlock = execSync("where sherlock", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("Sherlock found at (Windows):", tools.sherlock);
    } catch {
        try {
            tools.sherlock = execSync("which sherlock", { encoding: "utf8" }).trim();
            console.log("Sherlock found at (Unix):", tools.sherlock);
        } catch {
            console.error("Sherlock not found in path.");
            tools.sherlock = "";
        }
    }

    // Detect Feroxbuster
    try {
        tools.feroxbuster = execSync("where feroxbuster", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("Feroxbuster found at (Windows):", tools.feroxbuster);
    } catch {
        try {
            tools.feroxbuster = execSync("which feroxbuster", { encoding: "utf8" }).trim();
            console.log("Feroxbuster found at (Unix):", tools.feroxbuster);
        } catch {
            console.error("Feroxbuster not found in path.");
            tools.feroxbuster = "";
        }
    }

    // Detect ffuf
    try {
        tools.ffuf = execSync("where ffuf", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("ffuf found at (Windows):", tools.ffuf);
    } catch {
        try {
            tools.ffuf = execSync("which ffuf", { encoding: "utf8" }).trim();
            console.log("ffuf found at (Unix):", tools.ffuf);
        } catch {
            console.error("ffuf not found in path.");
            tools.ffuf = "";
        }
    }

    // Detect nmap
    try {
        tools.nmap = execSync("where nmap", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("Nmap found at (Windows):", tools.nmap);
    } catch {
        try {
            tools.nmap = execSync("which nmap", { encoding: "utf8" }).trim();
            console.log("Nmap found at (Unix):", tools.nmap);
        } catch {
            console.error("Nmap not found in path.");
            tools.nmap = "";
        }
    }

    return tools;
}

/**
 * Validate Tool Availability
 * 
 * validateTool(toolName: string, toolPath: string): boolean
 * 
 * Validates that a specific tool is available and executable.
 * 
 * Input:
 * - toolName: string - Name of the tool for error messages
 * - toolPath: string - Path to the tool executable
 * 
 * Returns:
 * - boolean - True if tool is available, false otherwise
 * 
 * Process:
 * 1. Checks if tool path is not empty
 * 2. Logs validation result
 * 3. Returns availability status
 */
export function validateTool(toolName: string, toolPath: string): boolean {
    const isAvailable = toolPath !== "";
    if (!isAvailable) {
        console.error(`${toolName} executable not found in system PATH.`);
    }
    return isAvailable;
}
