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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectTools = detectTools;
exports.validateTool = validateTool;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
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
function detectTools() {
    const tools = {
        sherlock: "",
        feroxbuster: "",
        ffuf: ""
    };
    const isWindows = process.platform === "win32";
    const commands = isWindows ? ["where"] : ["which", "command -v"];
    const homeDir = os.homedir();
    const detect = (tool) => {
        for (const cmd of commands) {
            try {
                const output = (0, child_process_1.execSync)(`${cmd} ${tool}`, { encoding: "utf8" })
                    .split("\n")[0]
                    .trim();
                if (output && (0, fs_1.existsSync)(output))
                    return output;
            }
            catch (_a) {
                continue;
            }
        }
        // Fallback: check local directory
        const localPath = path.resolve(process.cwd(), `${tool}${isWindows ? ".exe" : ""}`);
        if ((0, fs_1.existsSync)(localPath))
            return localPath;
        // Additional fallback for Linux pipx/pip installs
        if (!isWindows) {
            const possibleLinuxPaths = [
                path.join(homeDir, ".local", "bin", tool),
                path.join("/usr/local/bin", tool),
                path.join("/usr/bin", tool),
                path.join("/bin", tool),
            ];
            for (const p of possibleLinuxPaths) {
                if ((0, fs_1.existsSync)(p)) {
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
function validateTool(toolName, toolPath) {
    const isAvailable = toolPath !== "";
    if (!isAvailable) {
        console.error(`${toolName} executable not found in system PATH.`);
    }
    return isAvailable;
}
