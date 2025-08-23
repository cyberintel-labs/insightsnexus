/**
 * Domain to DNS Records Integration
 * 
 * This module integrates with DNS resolution to retrieve comprehensive DNS information
 * for domains including MX, NS, A, CNAME, and TXT records. It expands the investigation
 * graph by adding new nodes representing discovered DNS records.
 * 
 * DNS Resolution:
 * - Retrieves multiple DNS record types for comprehensive domain analysis
 * - Supports MX (mail exchange), NS (name server), A (IPv4), CNAME (canonical name), and TXT records
 * - Helps investigators understand domain infrastructure and configuration
 * 
 * Key Features:
 * - Automated DNS resolution via server API
 * - Dynamic graph expansion with new nodes
 * - Visual connection between original domain and discovered records
 * - Status updates during resolution process
 * - Error handling for failed resolutions
 */

import { ur, cy } from "../main.js";
import { resolveNodeOverlap } from "../nodePositioning.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * Execute Domain to DNS Records Resolution
 * 
 * runDomainToDns(node: CytoscapeNode)
 * 
 * Performs DNS resolution for the domain name stored in the node's label.
 * Creates new nodes for each discovered DNS record type and value.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the domain name to resolve
 * 
 * Process:
 * 1. Extracts domain name from node's label data
 * 2. Updates UI status to show resolution in progress
 * 3. Sends POST request to /domain-to-dns endpoint with domain
 * 4. Processes returned DNS records (MX, NS, A, CNAME, TXT)
 * 5. Creates new nodes for each discovered record
 * 6. Connects new nodes to the original domain node
 * 7. Updates status with resolution completion or error
 * 
 * Node Creation:
 * - Each discovered DNS record becomes a new node
 * - Node ID format: "{recordType}:{recordValue}"
 * - Node label format: "{recordType}: {recordValue}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original domain node to each new DNS record node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
 * 
 * Server Communication:
 * - POST request to /domain-to-dns endpoint
 * - Request body: {domain: string}
 * - Response: {mx: string[], ns: string[], a: string[], cname: string[], txt: string[]}
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
export function runDomainToDns(node){
    const domain = node.data("label");
    setStatusMessage(`DNS Resolution: Querying "${domain}"...`);

    fetch("/domain-to-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
    })
        .then(res => res.json())
        .then(data => {
            const parentId = node.id();
            let added = false;

            /**
             * Process Each DNS Record Type
             * 
             * For each DNS record type (MX, NS, A, CNAME, TXT):
             * 1. Creates unique node IDs combining record type and value
             * 2. Checks if nodes already exist to avoid duplicates
             * 3. Creates new nodes with DNS record information
             * 4. Creates edges connecting to original domain node
             * 5. Uses undo/redo system for all graph modifications
             */
            
            // Process MX (Mail Exchange) records
            if (data.mx && Array.isArray(data.mx)) {
                data.mx.forEach(mxRecord => {
                    const newId = `mx:${mxRecord}`;
                    if(!cy.getElementById(newId).length){
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `MX: ${mxRecord}`
                            },
                            position: safePosition
                        };
                        
                        const newEdge = {
                            group: "edges",
                            data: {
                                id: `e-${parentId}-${newId}`,
                                source: parentId,
                                target: newId
                            }
                        };
                        
                        ur.do("add", newNode);
                        ur.do("add", newEdge);
                        added = true;
                    }
                });
            }

            // Process NS (Name Server) records
            if (data.ns && Array.isArray(data.ns)) {
                data.ns.forEach(nsRecord => {
                    const newId = `ns:${nsRecord}`;
                    if(!cy.getElementById(newId).length){
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `NS: ${nsRecord}`
                            },
                            position: safePosition
                        };
                        
                        const newEdge = {
                            group: "edges",
                            data: {
                                id: `e-${parentId}-${newId}`,
                                source: parentId,
                                target: newId
                            }
                        };
                        
                        ur.do("add", newNode);
                        ur.do("add", newEdge);
                        added = true;
                    }
                });
            }

            // Process A (IPv4) records
            if (data.a && Array.isArray(data.a)) {
                data.a.forEach(aRecord => {
                    const newId = `a:${aRecord}`;
                    if(!cy.getElementById(newId).length){
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `A: ${aRecord}`
                            },
                            position: safePosition
                        };
                        
                        const newEdge = {
                            group: "edges",
                            data: {
                                id: `e-${parentId}-${newId}`,
                                source: parentId,
                                target: newId
                            }
                        };
                        
                        ur.do("add", newNode);
                        ur.do("add", newEdge);
                        added = true;
                    }
                });
            }

            // Process CNAME (Canonical Name) records
            if (data.cname && Array.isArray(data.cname)) {
                data.cname.forEach(cnameRecord => {
                    const newId = `cname:${cnameRecord}`;
                    if(!cy.getElementById(newId).length){
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `CNAME: ${cnameRecord}`
                            },
                            position: safePosition
                        };
                        
                        const newEdge = {
                            group: "edges",
                            data: {
                                id: `e-${parentId}-${newId}`,
                                source: parentId,
                                target: newId
                            }
                        };
                        
                        ur.do("add", newNode);
                        ur.do("add", newEdge);
                        added = true;
                    }
                });
            }

            // Process TXT records
            if (data.txt && Array.isArray(data.txt)) {
                data.txt.forEach(txtRecord => {
                    const newId = `txt:${txtRecord}`;
                    if(!cy.getElementById(newId).length){
                        const proposedPosition = {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        };
                        
                        const safePosition = resolveNodeOverlap(null, proposedPosition);
                        
                        const newNode = {
                            group: "nodes",
                            data: {
                                id: newId,
                                label: `TXT: ${txtRecord}`
                            },
                            position: safePosition
                        };
                        
                        const newEdge = {
                            group: "edges",
                            data: {
                                id: `e-${parentId}-${newId}`,
                                source: parentId,
                                target: newId
                            }
                        };
                        
                        ur.do("add", newNode);
                        ur.do("add", newEdge);
                        added = true;
                    }
                });
            }

            /**
             * Update UI Status
             * 
             * Provides feedback on the resolution results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            if(added){
                setStatusMessage(`DNS Resolution complete for "${domain}"`);
            }else{
                setStatusMessage(`No new DNS records found for "${domain}"`);
            }
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
            console.error("DNS Resolution error:", err);
            setStatusMessage(`DNS Resolution failed for "${domain}"`);
        });
} 