/**
 * Domain to IP Address Resolution Integration
 * 
 * This module integrates with DNS resolution to convert domain names to their IP addresses.
 * It expands the investigation graph by adding new nodes representing resolved IP addresses.
 * 
 * DNS Resolution:
 * - Resolves domain names to their corresponding IP addresses
 * - Supports both IPv4 and IPv6 addresses
 * - Handles multiple IP addresses for a single domain
 * - Helps investigators map domain infrastructure
 * 
 * Key Features:
 * - Automated DNS resolution via server API
 * - Dynamic graph expansion with new IP nodes
 * - Visual connection between original domain and resolved IPs
 * - Status updates during resolution process
 * - Error handling for failed resolutions
 */

import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * Execute Domain to IP Address Resolution
 * 
 * runDomainToIp(node: CytoscapeNode)
 * 
 * Performs DNS resolution for the domain name stored in the node's label.
 * Creates new nodes for each IP address found for the domain.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the domain name to resolve
 * 
 * Process:
 * 1. Extracts domain name from node's label data
 * 2. Updates UI status to show resolution in progress
 * 3. Sends POST request to /domain-to-ip endpoint with domain
 * 4. Processes returned list of resolved IP addresses
 * 5. Creates new nodes for each found IP address
 * 6. Connects new nodes to the original domain node
 * 7. Updates status with resolution completion or error
 * 
 * IP Resolution:
 * - Resolves domain names to their corresponding IP addresses
 * - Supports both IPv4 and IPv6 addresses
 * - Handles multiple IP addresses for a single domain
 * 
 * Server Communication:
 * - POST request to /domain-to-ip endpoint
 * - Request body: {domain: string}
 * - Response: {ips: string[]} - Array of IP addresses
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during resolution process
 * - Completion message with number of new nodes added
 * - Error messages for failed resolutions
 */
export async function runDomainToIp(node){
    const domain = node.data("label");
    setStatusMessage(`Domain to IP: Resolving "${domain}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        const response = await fetch("/domain-to-ip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain })
        });
        
        const data = await response.json();
        let added = false;

            /**
             * Process Each Resolved IP Address
             * 
             * Creates nodes for each IP address found for the domain.
             */
            for (const ip of data.ips) {
                const newId = transformBase.createNodeId("ip", ip);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `IP: ${ip}`, position, parentId);
                    if(createdNode) added = true;
                }
            }

            /**
             * Update UI Status
             * 
             * Provides feedback on the resolution results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            setStatusMessage(`Domain to IP complete for "${domain}"`);
        } catch (err) {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the resolution process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("Domain to IP error:", err);
            setStatusMessage(`Domain to IP failed for "${domain}"`);
        }
} 