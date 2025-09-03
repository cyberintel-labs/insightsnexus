/**
 * IP to Netblock Network Range Identification Integration
 * 
 * This module integrates with network analysis tools to identify network ranges and ownership
 * information for IP addresses. It expands the investigation graph by adding new nodes
 * representing network blocks and ownership details.
 * 
 * Network Analysis:
 * - Identifies CIDR network ranges containing the IP address
 * - Discovers network ownership and ASN information
 * - Maps IP addresses to their network infrastructure
 * - Helps investigators understand network topology and ownership
 * 
 * Key Features:
 * - Automated network analysis via server API
 * - Dynamic graph expansion with new network nodes
 * - Visual connection between original IP and network information
 * - Status updates during analysis process
 * - Error handling for failed analyses
 */

import { ur, cy } from "../main.js";
import { resolveNodeOverlap } from "../nodePositioning.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * Execute IP to Netblock Network Analysis
 * 
 * runIpToNetblock(node: CytoscapeNode)
 * 
 * Performs network analysis for the IP address stored in the node's label.
 * Creates new nodes for each network block and ownership detail found.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the IP address to analyze
 * 
 * Process:
 * 1. Extracts IP address from node's label data
 * 2. Updates UI status to show analysis in progress
 * 3. Sends POST request to /ip-to-netblock endpoint with IP address
 * 4. Processes returned list of network blocks and ownership details
 * 5. Creates new nodes for each found network information
 * 6. Connects new nodes to the original IP address node
 * 7. Updates status with analysis completion or error
 * 
 * Node Creation:
 * - Each network block becomes a new node
 * - Node ID format: "netblock:{networkRange}"
 * - Node label format: "Netblock: {networkRange}"
 * - Each ownership detail becomes a new node
 * - Node ID format: "owner:{ownerName}"
 * - Node label format: "Owner: {ownerName}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original node to each new network node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
 * 
 * Server Communication:
 * - POST request to /ip-to-netblock endpoint
 * - Request body: {ip: string}
 * - Response: {netblocks: string[], owners: string[]} - Arrays of network ranges and owners
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during analysis process
 * - Completion message with number of new nodes added
 * - Error messages for failed analyses
 */
export function runIpToNetblock(node){
    const ip = node.data("label");
    setStatusMessage(`IP to Netblock: Analyzing "${ip}"...`);

    fetch("/ip-to-netblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip })
    })
        .then(res => res.json())
        .then(data => {
            const parentId = node.id();
            let added = false;

            /**
             * Process Each Found Network Block
             * 
             * For each network block found for the IP address:
             * 1. Creates a unique node ID combining "netblock" prefix and network range
             * 2. Checks if node already exists to avoid duplicates
             * 3. Creates new node with network block information
             * 4. Creates edge connecting to original IP address node
             * 5. Uses undo/redo system for all graph modifications
             */
            if (data.netblocks) {
                data.netblocks.forEach(netblock => {
                    const newId = `netblock:${netblock}`;
                    if(!cy.getElementById(newId).length){
                        /**
                         * New Node Configuration
                         * 
                         * Creates a node representing a network block:
                         * - group: "nodes" - Identifies as a node element
                         * - data.id: Unique identifier for the node
                         * - data.label: Human-readable label showing network range
                         * - position: Non-overlapping position near original node
                         */
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        // Apply overlap prevention to ensure new node doesn't overlap existing nodes
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `Netblock: ${netblock}`
                            },
                            position: safePosition
                        };
                        
                        /**
                         * Edge Configuration
                         * 
                         * Creates a directed edge from the original IP address node
                         * to the newly discovered network block:
                         * - group: "edges" - Identifies as an edge element
                         * - data.id: Unique identifier for the edge
                         * - data.source: ID of the original IP address node
                         * - data.target: ID of the new network block node
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
            }

            /**
             * Process Each Found Network Owner
             * 
             * For each network owner found for the IP address:
             * 1. Creates a unique node ID combining "owner" prefix and owner name
             * 2. Checks if node already exists to avoid duplicates
             * 3. Creates new node with ownership information
             * 4. Creates edge connecting to original IP address node
             * 5. Uses undo/redo system for all graph modifications
             */
            if (data.owners) {
                data.owners.forEach(owner => {
                    const newId = `owner:${owner}`;
                    if(!cy.getElementById(newId).length){
                        /**
                         * New Node Configuration
                         * 
                         * Creates a node representing a network owner:
                         * - group: "nodes" - Identifies as a node element
                         * - data.id: Unique identifier for the node
                         * - data.label: Human-readable label showing owner name
                         * - position: Non-overlapping position near original node
                         */
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        // Apply overlap prevention to ensure new node doesn't overlap existing nodes
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `Owner: ${owner}`
                            },
                            position: safePosition
                        };
                        
                        /**
                         * Edge Configuration
                         * 
                         * Creates a directed edge from the original IP address node
                         * to the newly discovered network owner:
                         * - group: "edges" - Identifies as an edge element
                         * - data.id: Unique identifier for the edge
                         * - data.source: ID of the original IP address node
                         * - data.target: ID of the new network owner node
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
            }

            /**
             * Update UI Status
             * 
             * Provides feedback on the analysis results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            if(added){
                setStatusMessage(`IP to Netblock complete for "${ip}"`);
            }else{
                setStatusMessage(`No new additions found for "${ip}"`);
            }
        })
        .catch(err => {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the analysis process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("IP to Netblock error:", err);
            setStatusMessage(`IP to Netblock failed for "${ip}"`);
        });
}
