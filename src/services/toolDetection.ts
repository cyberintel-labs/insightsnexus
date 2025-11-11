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

import { execSync } from "child_process";
import { existsSync } from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Tool Path Detection Results
 * 
 * Interface defining the structure for tool detection results.
 * Each tool has a path property that contains the executable path or empty string if not found.
 * Note: Port scanning no longer requires external tools (uses portscanner library with top 1000 ports).
 */
export interface ToolPaths {
    sherlock: string;
    feroxbuster: string;
    ffuf: string;
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
 * 1. Sets empty string for the tools in case they are not found
 * 2. Determines the platform
 * 3. Commands used to locate tools are determine based on platform
 * 4. For each tool an attempt is made to locate the path
 * 5. If the tool is not found after we tried to locate it, check the local directory
 *      For linux only we check at specific directories just in case
 * 6. Logs detection results for debugging
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
        ffuf: ""
    };

    const isWindows = process.platform === "win32";
    const commands = isWindows ? ["where"] : ["which", "command -v"];
    const homeDir = os.homedir();

    const detect = (tool: string): string => {
        for (const cmd of commands) {
            try {
                const output = execSync(`${cmd} ${tool}`, { encoding: "utf8" })
                    .split("\n")[0]
                    .trim();
                if (output && existsSync(output)) return output;
            } catch {
                continue;
            }
        }

        // Fallback: check local directory
        const localPath = path.resolve(process.cwd(), `${tool}${isWindows ? ".exe" : ""}`);
        if (existsSync(localPath)) return localPath;

        // Additional fallback for Linux pipx/pip installs
        if (!isWindows) {
            const possibleLinuxPaths = [
                path.join(homeDir, ".local", "bin", tool),
                path.join("/usr/local/bin", tool),
                path.join("/usr/bin", tool),
                path.join("/bin", tool),
            ];

            for (const p of possibleLinuxPaths) {
                if (existsSync(p)) {
                    console.log(`${tool} found at fallback path: ${p}`);
                    return p;
                }
            }
        }

        console.error(`${tool} not found in PATH or known fallback directories.`);
        return "";
    };

    tools.sherlock = detect("sherlock");
    tools.feroxbuster = detect("feroxbuster");
    tools.ffuf = detect("ffuf");

    console.log("Detected Tools:", tools);
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
