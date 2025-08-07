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

import { ur, cy } from "../main.js";

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
 * Node Creation:
 * - Each resolved IP becomes a new node
 * - Node ID format: "ip:{ipAddress}"
 * - Node label format: "IP: {ipAddress}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original node to each new IP node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
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
export function runDomainToIp(node){
    const domain = node.data("label");
    document.getElementById("domain-to-ip-status").innerText = `Domain to IP: Resolving "${domain}"...`;

    fetch("/domain-to-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
    })
        .then(res => res.json())
        .then(data => {
            const parentId = node.id();
            let added = false;

            /**
             * Process Each Resolved IP Address
             * 
             * For each IP address found for the domain:
             * 1. Creates a unique node ID combining "ip" prefix and IP address
             * 2. Checks if node already exists to avoid duplicates
             * 3. Creates new node with IP information
             * 4. Creates edge connecting to original domain node
             * 5. Uses undo/redo system for all graph modifications
             */
            data.ips.forEach(ip => {
                const newId = `ip:${ip}`;
                if(!cy.getElementById(newId).length){
                    /**
                     * New Node Configuration
                     * 
                     * Creates a node representing an IP address:
                     * - group: "nodes" - Identifies as a node element
                     * - data.id: Unique identifier for the node
                     * - data.label: Human-readable label showing IP address
                     * - position: Random offset from original node for visual separation
                     */
                    const newNode = {
                        group: "nodes",
                        data: {
                            id: newId,
                            label: `IP: ${ip}`
                        },
                        position: {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        }
                    };
                    
                    /**
                     * Edge Configuration
                     * 
                     * Creates a directed edge from the original domain node
                     * to the newly resolved IP address:
                     * - group: "edges" - Identifies as an edge element
                     * - data.id: Unique identifier for the edge
                     * - data.source: ID of the original domain node
                     * - data.target: ID of the new IP address node
                     */
                    const newEdge = {
                        group: "edges",
                        data: {
                            id: `e-${parentId}-${newId}`,
                            source: parentId,
                            target: newId
                        }
                    };
                    
                    // Add both node and edge to graph using undo/redo system
                    ur.do("add", newNode);
                    ur.do("add", newEdge);
                    added = true;
                }
            });

            /**
             * Update UI Status
             * 
             * Provides feedback on the resolution results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            document.getElementById("domain-to-ip-status").innerText = added
                ? `Domain to IP complete for "${domain}"`
                : `Domain to IP complete (no new nodes)`;
        })
        .catch(err => {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the resolution process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("Domain to IP error:", err);
            document.getElementById("domain-to-ip-status").innerText = `Domain to IP failed for "${domain}"`;
        });
} 