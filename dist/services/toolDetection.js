"use strict";
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
 * - Port scanning: Now handled by portscanner library with top 1000 ports (no external tool required)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectTools = detectTools;
exports.validateTool = validateTool;
const child_process_1 = require("child_process");
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
function detectTools() {
    const tools = {
        sherlock: "",
        feroxbuster: "",
        ffuf: ""
    };
    // Detect Sherlock
    try {
        tools.sherlock = (0, child_process_1.execSync)("where sherlock", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("Sherlock found at (Windows):", tools.sherlock);
    }
    catch (_a) {
        try {
            tools.sherlock = (0, child_process_1.execSync)("which sherlock", { encoding: "utf8" }).trim();
            console.log("Sherlock found at (Unix):", tools.sherlock);
        }
        catch (_b) {
            console.error("Sherlock not found in path.");
            tools.sherlock = "";
        }
    }
    // Detect Feroxbuster
    try {
        tools.feroxbuster = (0, child_process_1.execSync)("where feroxbuster", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("Feroxbuster found at (Windows):", tools.feroxbuster);
    }
    catch (_c) {
        try {
            tools.feroxbuster = (0, child_process_1.execSync)("which feroxbuster", { encoding: "utf8" }).trim();
            console.log("Feroxbuster found at (Unix):", tools.feroxbuster);
        }
        catch (_d) {
            console.error("Feroxbuster not found in path.");
            tools.feroxbuster = "";
        }
    }
    // Detect ffuf
    try {
        tools.ffuf = (0, child_process_1.execSync)("where ffuf", { encoding: "utf8" }).split("\n")[0].trim();
        console.log("ffuf found at (Windows):", tools.ffuf);
    }
    catch (_e) {
        try {
            tools.ffuf = (0, child_process_1.execSync)("which ffuf", { encoding: "utf8" }).trim();
            console.log("ffuf found at (Unix):", tools.ffuf);
        }
        catch (_f) {
            console.error("ffuf not found in path.");
            tools.ffuf = "";
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
function validateTool(toolName, toolPath) {
    const isAvailable = toolPath !== "";
    if (!isAvailable) {
        console.error(`${toolName} executable not found in system PATH.`);
    }
    return isAvailable;
}
