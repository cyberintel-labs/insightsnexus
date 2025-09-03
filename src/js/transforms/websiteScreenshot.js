/**
 * Website Screenshot Integration
 * 
 * This module integrates with Puppeteer to capture visual snapshots of websites.
 * It takes a website URL from a node and captures a screenshot, then uploads
 * the image directly to the node using the existing file upload system.
 * 
 * Puppeteer Integration:
 * - Captures full webpage screenshots at 1280x720 resolution
 * - Handles various URL formats (with/without protocol, subdomains, paths)
 * - Automatically normalizes URLs for consistent processing
 * - Provides visual evidence for website investigation nodes
 * 
 * Key Features:
 * - Automated website screenshot capture via server API
 * - Direct image upload to existing node (no new nodes created)
 * - URL normalization and validation
 * - Status updates during capture process
 * - Error handling for failed captures
 * - Integration with existing image management system
 */

import { ur, cy } from "../main.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * Execute Website Screenshot Capture
 * 
 * runWebsiteScreenshot(node: CytoscapeNode)
 * 
 * Performs a website screenshot capture for the URL stored in the node's label.
 * Captures the webpage and uploads the screenshot directly to the existing node.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the website URL to screenshot
 * 
 * Process:
 * 1. Extracts website URL from node's label data
 * 2. Normalizes URL format (adds protocol if missing, validates domain structure)
 * 3. Updates UI status to show capture in progress
 * 4. Sends POST request to /website-screenshot endpoint with normalized URL
 * 5. Receives base64 encoded screenshot data
 * 6. Converts base64 to blob and uploads image to node
 * 7. Updates status with capture completion or error
 * 
 * URL Normalization:
 * - Adds 'https://' protocol if missing
 * - Validates second-level domain and top-level domain presence
 * - Handles subdomains, paths, and query parameters
 * - Ensures URL is properly formatted for Puppeteer
 * 
 * Image Processing:
 * - Receives base64 encoded PNG screenshot from server
 * - Converts to blob for file upload system
 * - Creates File object with appropriate metadata
 * - Uses existing uploadFiles function for node integration
 * 
 * Server Communication:
 * - POST request to /website-screenshot endpoint
 * - Request body: {url: string} - Normalized website URL
 * - Response: {screenshot: string} - Base64 encoded PNG image data
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - Invalid URL format errors are handled gracefully
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during capture process
 * - Completion message with screenshot upload success
 * - Error messages for failed captures or invalid URLs
 */
export function runWebsiteScreenshot(node) {
    const urlInput = node.data("label");
    
    // Normalize URL format
    let normalizedUrl = urlInput.trim();
    
    // Add protocol if missing
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate URL structure (must have second-level domain and top-level domain)
    try {
        const url = new URL(normalizedUrl);
        const hostnameParts = url.hostname.split('.');
        
        if (hostnameParts.length < 2) {
            setStatusMessage(`Invalid URL format: "${urlInput}" - Must include domain and TLD`);
            return;
        }
        
        // Check if we have at least a second-level domain and top-level domain
        if (hostnameParts.length < 2 || hostnameParts[hostnameParts.length - 1].length < 2) {
            setStatusMessage(`Invalid URL format: "${urlInput}" - Must include valid domain and TLD`);
            return;
        }
        
    } catch (error) {
        setStatusMessage(`Invalid URL format: "${urlInput}"`);
        return;
    }
    
    setStatusMessage(`Website Screenshot: Capturing "${normalizedUrl}"...`);

    fetch("/website-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (!data.screenshot) {
                throw new Error("No screenshot data received from server");
            }
            
            /**
             * Process Screenshot Data
             * 
             * Converts the base64 screenshot data to a File object
             * and uploads it directly to the existing node:
             * 1. Converts base64 string to blob
             * 2. Creates File object with appropriate metadata
             * 3. Uses existing uploadFiles function for node integration
             * 4. Triggers node update to display new image
             */
            
            // Clean and validate base64 string
            let base64String = data.screenshot;
            
            // Remove any whitespace, newlines, or invalid characters
            base64String = base64String.replace(/[\s\n\r]/g, '');
            
            // Validate base64 format
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
                throw new Error("Invalid base64 format received from server");
            }
            
            let screenshotFile;
            
            try {
                // Convert base64 to blob
                const byteCharacters = atob(base64String);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/png' });
                
                // Validate blob size
                if (blob.size === 0) {
                    throw new Error("Screenshot blob is empty");
                }
                
                // Create File object for upload
                screenshotFile = new File([blob], `screenshot_${Date.now()}.png`, { 
                    type: 'image/png',
                    lastModified: Date.now()
                });
                
            } catch (base64Error) {
                console.error("Base64 conversion error:", base64Error);
                throw new Error(`Failed to convert base64 to image: ${base64Error.message}`);
            }
            
            // Import uploadFiles function dynamically to avoid circular imports
            import('../fileUploadHandler.js').then(({ uploadFiles }) => {
                uploadFiles(node, [screenshotFile]);
                setStatusMessage(`Website Screenshot complete for "${normalizedUrl}"`);
            }).catch(err => {
                console.error("Error importing uploadFiles:", err);
                setStatusMessage(`Failed to upload screenshot for "${normalizedUrl}"`);
            });
        })
        .catch(err => {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the screenshot process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("Website Screenshot error:", err);
            setStatusMessage(`Website Screenshot failed for "${normalizedUrl}": ${err.message}`);
        });
}
