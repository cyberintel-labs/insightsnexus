/**
 * Custom Transform Integration
 * 
 * This module manages user-uploaded Python transforms and provides an interface
 * for saving, removing, checking, and executing custom scripts. It allows investigators
 * to expand the graph with arbitrary logic defined in Python, supporting more flexible
 * and specialized workflows.
 * 
 * Custom Transform Features:
 * - Accepts user-uploaded `.py` files stored on the server
 * - Ensures only one active custom transform at a time
 * - Executes the uploaded Python script with a string input
 * - Expects script to return JSON array of results via stdout
 * - Integrates results back into the investigation graph
 * 
 * Security Note:
 * - Uploaded Python scripts are executed directly on the server
 * - This creates a high security risk if untrusted code is uploaded
 * - In production, strict sandboxing and validation should be implemented
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

// Promisified exec to allow async/await execution of shell commands
const execAsync = promisify(exec);

// Path where the uploaded Python transform is stored on the server
// - Only one transform is active at a time
// - File is always named "customTransform.py"
const customTransformPath = path.join(__dirname, "../../saves/customTransform.py");

/**
 * Check Transform Existence
 * 
 * hasCustomTransform(): boolean
 * 
 * Verifies whether a custom transform Python file exists in the saves directory.
 * 
 * Returns:
 * - true if transform file exists
 * - false otherwise
 */
export function hasCustomTransform(): boolean {
    return fs.existsSync(customTransformPath);
}

/**
 * Remove Custom Transform
 * 
 * removeCustomTransform(): Promise<void>
 * 
 * Deletes the uploaded Python transform file from disk.
 * 
 * Process:
 * - Checks if file exists
 * - Removes it synchronously using fs.unlinkSync
 * - Wrapped in async signature for consistency
 */
export async function removeCustomTransform(): Promise<void> {
    if(fs.existsSync(customTransformPath)){
        fs.unlinkSync(customTransformPath);
    }
}

/**
 * Save Custom Transform
 * 
 * saveCustomTransform(fileBuffer: Buffer): Promise<void>
 * 
 * Saves a user-uploaded Python transform to the predefined path.
 * 
 * Input:
 * - fileBuffer: Buffer containing the raw contents of the Python file
 * 
 * Process:
 * - Writes file contents to disk as "customTransform.py"
 * - Overwrites existing file if one already exists
 */
export async function saveCustomTransform(fileBuffer: Buffer): Promise<void> {
    fs.writeFileSync(customTransformPath, fileBuffer);
}

/**
 * Execute Custom Transform
 * 
 * executeCustomTransform(input: string): Promise<{nodes: string[], files: Array<{name: string, content: string, type: string}>}>
 * 
 * Runs the uploaded Python transform against a provided input string.
 * 
 * Input:
 * - input: string - Value to be passed as a command-line argument to the Python script
 * 
 * Process:
 * 1. Confirms that a custom transform exists on disk
 * 2. Builds shell command: python3 "<transformPath>" "<input>"
 * 3. Executes script using execAsync
 * 4. Captures stdout output from script
 * 5. Parses stdout as JSON with nodes and files arrays
 * 
 * Expected Python Script Contract:
 * - Accepts one argument (input string) via sys.argv[1]
 * - Processes the input string
 * - Prints JSON to stdout with nodes and files arrays
 * 
 * Supported Output Formats:
 * 
 * Array Format (simple nodes only):
 * ```json
 * ["result1", "result2", "result3"]
 * ```
 * 
 * Object Format (with file support):
 * ```json
 * {
 *   "nodes": ["result1", "result2", "result3"],
 *   "files": [
 *     {
 *       "name": "report.txt",
 *       "content": "file content here",
 *       "type": "text"
 *     }
 *   ]
 * }
 * ```
 * 
 * Example Python Implementation:
 * ```python
 * import sys, json
 * input_str = sys.argv[1]
 * result = {
 *     "nodes": [f"{ch} = {bin(ord(ch))[2:].zfill(8)}" for ch in input_str],
 *     "files": [{
 *         "name": "analysis.txt",
 *         "content": f"Analysis of: {input_str}",
 *         "type": "text"
 *     }]
 * }
 * print(json.dumps(result))
 * ```
 * 
 * Returns:
 * - Object with nodes array and files array from Python script output
 * - Automatically converts array format to object format
 * 
 * Error Handling:
 * - If file does not exist, throws "No custom transform uploaded"
 * - If execution fails or JSON is invalid, logs error and throws
 */
export async function executeCustomTransform(input: string): Promise<{nodes: string[], files: Array<{name: string, content: string, type: string}>}> {
    if(!fs.existsSync(customTransformPath)){
        throw new Error("No custom transform uploaded");
    }

    const command = `python3 "${customTransformPath}" "${input}"`;
    try{
        const { stdout } = await execAsync(command);
        const result = JSON.parse(stdout.trim());
        
        // Handle array format (simple nodes only) - convert to object format
        if (Array.isArray(result)) {
            return {
                nodes: result,
                files: []
            };
        }
        
        // Handle object format (with nodes and files)
        if (typeof result === 'object' && result !== null) {
            return {
                nodes: result.nodes || [],
                files: result.files || []
            };
        }
        
        // Invalid format
        throw new Error("Invalid output format from custom transform");
        
    }catch(error){
        console.error("Custom transform failed:", error);
        throw new Error("Failed to execute custom transform");
    }
}