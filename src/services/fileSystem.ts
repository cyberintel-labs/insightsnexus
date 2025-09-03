/**
 * File System Service
 * 
 * This service handles all file system operations including directory creation,
 * file read/write operations, path sanitization, and file listing.
 * 
 * Key Features:
 * - Directory setup and management
 * - File read/write operations with error handling
 * - Path sanitization for security
 * - File listing and filtering
 * - JSON file operations
 */

import fs from "fs";
import path from "path";

/**
 * Directory Paths Configuration
 * 
 * Interface defining the structure for application directory paths.
 * Contains paths for graph saves and result caching.
 */
export interface DirectoryPaths {
    graphSaveDir: string;
    resultSaveDir: string;
}

/**
 * Initialize Application Directories
 * 
 * initializeDirectories(): DirectoryPaths
 * 
 * Creates necessary directories for storing investigation data.
 * Sets up directories for graph saves and result caching.
 * 
 * Process:
 * 1. Defines paths relative to the application root
 * 2. Creates directories if they don't exist
 * 3. Uses recursive creation to handle nested directories
 * 4. Returns the configured directory paths
 * 
 * Returns:
 * - DirectoryPaths object with configured directory paths
 * 
 * Error Handling:
 * - Uses fs.mkdirSync with recursive option for safe creation
 * - Continues execution even if directories already exist
 */
export function initializeDirectories(): DirectoryPaths {
    const graphSaveDir = path.join(__dirname, '../../saves/graph');
    const resultSaveDir = path.join(__dirname, '../../saves/results');

    if (!fs.existsSync(graphSaveDir)) {
        fs.mkdirSync(graphSaveDir, { recursive: true });
    }
    if (!fs.existsSync(resultSaveDir)) {
        fs.mkdirSync(resultSaveDir, { recursive: true });
    }

    return { graphSaveDir, resultSaveDir };
}

/**
 * Sanitize Filename
 * 
 * sanitizeFilename(filename: string): string
 * 
 * Sanitizes a filename to prevent path traversal attacks and ensure
 * filesystem compatibility.
 * 
 * Input:
 * - filename: string - The original filename to sanitize
 * 
 * Returns:
 * - string - Sanitized filename safe for filesystem use
 * 
 * Process:
 * 1. Replaces unsafe characters with underscores
 * 2. Removes path traversal characters
 * 3. Ensures filename is filesystem-safe
 * 
 * Security:
 * - Prevents directory traversal attacks
 * - Removes potentially dangerous characters
 * - Ensures safe file operations
 */
export function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

/**
 * Write JSON File
 * 
 * writeJsonFile(filePath: string, data: any): Promise<void>
 * 
 * Writes data to a JSON file with proper formatting and error handling.
 * 
 * Input:
 * - filePath: string - Path where the file should be written
 * - data: any - Data to be written as JSON
 * 
 * Returns:
 * - Promise<void> - Resolves when file is written successfully
 * 
 * Process:
 * 1. Converts data to formatted JSON string
 * 2. Writes to specified file path
 * 3. Handles errors gracefully
 * 
 * Error Handling:
 * - Returns rejected promise on write errors
 * - Logs errors for debugging
 * - Provides meaningful error messages
 */
export function writeJsonFile(filePath: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
            if (err) {
                console.error("Error writing JSON file:", err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Read JSON File
 * 
 * readJsonFile(filePath: string): Promise<any>
 * 
 * Reads and parses a JSON file with error handling.
 * 
 * Input:
 * - filePath: string - Path to the JSON file to read
 * 
 * Returns:
 * - Promise<any> - Parsed JSON data
 * 
 * Process:
 * 1. Reads file content as UTF-8
 * 2. Parses JSON content
 * 3. Returns parsed data
 * 
 * Error Handling:
 * - Returns rejected promise on read/parse errors
 * - Logs errors for debugging
 * - Provides meaningful error messages
 */
export function readJsonFile(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                console.error("Error reading JSON file:", err);
                reject(err);
                return;
            }

            try {
                const json = JSON.parse(data);
                resolve(json);
            } catch (parseErr) {
                console.error("Error parsing JSON file:", parseErr);
                reject(parseErr);
            }
        });
    });
}

/**
 * List Files in Directory
 * 
 * listFiles(directoryPath: string, filter?: string): Promise<string[]>
 * 
 * Lists files in a directory with optional filtering.
 * 
 * Input:
 * - directoryPath: string - Path to the directory to list
 * - filter?: string - Optional file extension filter (e.g., ".json")
 * 
 * Returns:
 * - Promise<string[]> - Array of filenames in the directory
 * 
 * Process:
 * 1. Reads directory contents
 * 2. Applies optional filter if provided
 * 3. Returns filtered file list
 * 
 * Error Handling:
 * - Returns empty array on directory read errors
 * - Logs errors for debugging
 * - Continues execution gracefully
 */
export function listFiles(directoryPath: string, filter?: string): Promise<string[]> {
    return new Promise((resolve) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error("Failed to list files:", err);
                resolve([]);
                return;
            }

            let filteredFiles = files;
            if (filter) {
                filteredFiles = files.filter(file => file.endsWith(filter));
            }

            resolve(filteredFiles);
        });
    });
}

/**
 * Check File Exists
 * 
 * fileExists(filePath: string): boolean
 * 
 * Checks if a file exists at the specified path.
 * 
 * Input:
 * - filePath: string - Path to check for file existence
 * 
 * Returns:
 * - boolean - True if file exists, false otherwise
 * 
 * Process:
 * 1. Uses fs.existsSync for synchronous check
 * 2. Returns boolean result
 */
export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}
