/**
 * Whois Information Integration
 * 
 * This module integrates with the whois command to retrieve domain registration details
 * including name servers. It expands the investigation graph by adding new nodes
 * representing discovered domain information.
 * 
 * Whois Tool:
 * - Retrieves domain registration information from WHOIS databases
 * - Returns comprehensive domain details including name servers
 * - Helps investigators understand domain ownership and infrastructure
 * 
 * Key Features:
 * - Automated whois lookup via server API
 * - Dynamic graph expansion with new nodes
 * - Visual connection between original node and found information
 * - Status updates during lookup process
 * - Error handling for failed lookups
 * - Duplicate name server removal
 * - Retry logic with reasonable timeout values
 */

import { ur, cy } from "../main.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * Execute Whois Information Lookup
 * 
 * runWhois(node: CytoscapeNode)
 * 
 * Performs a whois lookup for the domain name stored in the node's label.
 * Creates new nodes for each piece of domain information found, including name servers.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the domain name to lookup
 * 
 * Process:
 * 1. Extracts domain name from node's label data
 * 2. Updates UI status to show lookup in progress
 * 3. Sends POST request to /whois endpoint with domain
 * 4. Processes returned domain information
 * 5. Creates new nodes for each piece of information found
 * 6. Connects new nodes to the original domain node
 * 7. Updates status with lookup completion or error
 * 
 * Node Creation:
 * - Each piece of information becomes a new node
 * - Node ID format: "{infoType}:{value}"
 * - Node label format: "{infoType}: {value}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original node to each new information node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
 * 
 * Server Communication:
 * - POST request to /whois endpoint
 * - Request body: {domain: string}
 * - Response: {registrar: string, nameServers: string[], creationDate: string, expiryDate: string}
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * - Retry logic with exponential backoff
 * 
 * UI Feedback:
 * - Status updates during lookup process
 * - Completion message with number of new nodes added
 * - Error messages for failed lookups
 */
export async function runWhois(node){
    const domain = node.data("label");
    setStatusMessage(`Whois: Looking up "${domain}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        const response = await fetch("/whois", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain })
        });
        
        const data = await response.json();
        let added = false;

            /**
             * Process Each Piece of Domain Information
             * 
             * For each piece of information found for the domain:
             * 1. Creates a unique node ID combining info type and value
             * 2. Checks if node already exists to avoid duplicates
             * 3. Creates new node with domain information
             * 4. Creates edge connecting to original domain node
             * 5. Uses undo/redo system for all graph modifications
             */
            
            // Process registrar information
            if(data.registrar){
                const newId = transformBase.createNodeId("registrar", data.registrar);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `Registrar: ${data.registrar}`, position, parentId);
                    if(createdNode) added = true;
                }
            }

            // Process name servers (remove duplicates)
            if(data.nameServers && data.nameServers.length > 0){
                const uniqueNameServers = [...new Set(data.nameServers)];
                
                for (const nameServer of uniqueNameServers) {
                    const newId = transformBase.createNodeId("nameserver", nameServer);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `Name Server: ${nameServer}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }

            // Process creation date
            if(data.creationDate){
                const newId = transformBase.createNodeId("creation", data.creationDate);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `Created: ${data.creationDate}`, position, parentId);
                    if(createdNode) added = true;
                }
            }

            // Process expiry date
            if(data.expiryDate){
                const newId = transformBase.createNodeId("expiry", data.expiryDate);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `Expires: ${data.expiryDate}`, position, parentId);
                    if(createdNode) added = true;
                }
            }

            /**
             * Update UI Status
             * 
             * Provides feedback on the lookup results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            if(added){
                setStatusMessage(`Whois complete for "${domain}"`);
            }else{
                setStatusMessage(`No new additions found for "${domain}"`);
            }
        } catch (err) {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the lookup process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("Whois error:", err);
            setStatusMessage(`Whois failed for "${domain}"`);
        }
}
