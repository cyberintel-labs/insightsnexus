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

import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

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
 * Network Analysis:
 * - Identifies CIDR network ranges containing the IP address
 * - Discovers network ownership and ASN information
 * - Maps IP addresses to their network infrastructure
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
export async function runIpToNetblock(node){
    const ip = node.data("label");
    setStatusMessage(`IP to Netblock: Analyzing "${ip}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        // Start progress tracking
        transformBase.startTransformProgress('ip-to-netblock');
        transformBase.updateTransformProgress(20, `IP to Netblock: Analyzing "${ip}"...`);

        const response = await fetch("/ip-to-netblock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip })
        });
        
        transformBase.updateTransformProgress(60, `IP to Netblock: Processing results for "${ip}"...`);
        
        const data = await response.json();
        let added = false;
        let processedItems = 0;
        const totalItems = 2; // netblocks and owners

            /**
             * Process Each Found Network Block
             * 
             * Creates nodes for each network block found for the IP address.
             */
            if (data.netblocks) {
                for (const netblock of data.netblocks) {
                    const newId = transformBase.createNodeId("netblock", netblock);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `Netblock: ${netblock}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(60 + (processedItems / totalItems) * 30, `IP to Netblock: Processing netblocks...`);

            /**
             * Process Each Found Network Owner
             * 
             * Creates nodes for each network owner found for the IP address.
             */
            if (data.owners) {
                for (const owner of data.owners) {
                    const newId = transformBase.createNodeId("owner", owner);
                    if(!transformBase.nodeExists(newId)){
                        const position = transformBase.generatePositionNearNode(node);
                        const createdNode = await transformBase.createNode(newId, `Owner: ${owner}`, position, parentId);
                        if(createdNode) added = true;
                    }
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(95, `IP to Netblock: Finalizing results...`);

            /**
             * Update UI Status
             * 
             * Provides feedback on the analysis results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            if(added){
                setStatusMessage(`IP to Netblock complete for "${ip}"`);
                transformBase.completeTransformProgress(true, `IP to Netblock: Found data for "${ip}"`);
            }else{
                setStatusMessage(`No new additions found for "${ip}"`);
                transformBase.completeTransformProgress(true, `IP to Netblock: No new data found for "${ip}"`);
            }
        } catch (err) {
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
            transformBase.completeTransformProgress(false, `IP to Netblock: Failed for "${ip}"`);
        }
}
