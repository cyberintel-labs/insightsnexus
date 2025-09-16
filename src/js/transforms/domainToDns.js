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

import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

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
 * DNS Record Types:
 * - MX (Mail Exchange) records for email servers
 * - NS (Name Server) records for DNS servers
 * - A (IPv4) records for IP addresses
 * - CNAME (Canonical Name) records for aliases
 * - TXT records for text-based information
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
export async function runDomainToDns(node){
    const domain = node.data("label");
    setStatusMessage(`DNS Resolution: Querying "${domain}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        const response = await fetch("/domain-to-dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
        });
        
        const data = await response.json();
            let added = false;

            /**
             * Process Each DNS Record Type
             * 
             * For each DNS record type (MX, NS, A, CNAME, TXT):
             * 1. Creates unique node IDs using TransformBase.createNodeId()
             * 2. Checks if nodes already exist using TransformBase.nodeExists()
             * 3. Creates new nodes with DNS record information using TransformBase.createNode()
             * 4. Automatically creates edges connecting to original domain node
             * 5. Uses undo/redo system for all graph modifications via TransformBase
             */
            
            // Process MX (Mail Exchange) records
            if (data.mx && Array.isArray(data.mx)) {
                for (const mxRecord of data.mx) {
                    const newId = transformBase.createNodeId("mx", mxRecord);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `MX: ${mxRecord}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }

            // Process NS (Name Server) records
            if (data.ns && Array.isArray(data.ns)) {
                for (const nsRecord of data.ns) {
                    const newId = transformBase.createNodeId("ns", nsRecord);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `NS: ${nsRecord}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }

            // Process A (IPv4) records
            if (data.a && Array.isArray(data.a)) {
                for (const aRecord of data.a) {
                    const newId = transformBase.createNodeId("a", aRecord);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `A: ${aRecord}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }

            // Process CNAME (Canonical Name) records
            if (data.cname && Array.isArray(data.cname)) {
                for (const cnameRecord of data.cname) {
                    const newId = transformBase.createNodeId("cname", cnameRecord);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `CNAME: ${cnameRecord}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }

            // Process TXT records
            if (data.txt && Array.isArray(data.txt)) {
                for (const txtRecord of data.txt) {
                    const newId = transformBase.createNodeId("txt", txtRecord);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `TXT: ${txtRecord}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
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
        } catch (err) {
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
        }
} 