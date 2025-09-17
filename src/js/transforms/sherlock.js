/**
 * Sherlock Username Search Integration
 * 
 * This module integrates with the Sherlock tool to search for usernames across hundreds
 * of social media platforms. It expands the investigation graph by adding new nodes
 * representing found social media accounts.
 * 
 * Sherlock Tool:
 * - Searches for usernames across 350+ social media platforms
 * - Returns list of platforms where the username exists
 * - Helps investigators discover additional online presence
 * 
 * Key Features:
 * - Automated username search via server API
 * - Dynamic graph expansion with new nodes
 * - Visual connection between original node and found accounts
 * - Status updates during search process
 * - Error handling for failed searches
 */

import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * Execute Sherlock Username Search
 * 
 * runSherlock(node: CytoscapeNode)
 * 
 * Performs a Sherlock search for the username stored in the node's label.
 * Creates new nodes for each social media platform where the username is found.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the username to search
 * 
 * Process:
 * 1. Extracts username from node's label data
 * 2. Updates UI status to show search in progress
 * 3. Sends POST request to /sherlock endpoint with username
 * 4. Processes returned list of found social media platforms
 * 5. Creates new nodes for each found platform
 * 6. Connects new nodes to the original username node
 * 7. Updates status with search completion or error
 * 
 * Sherlock Tool:
 * - Searches for usernames across 350+ social media platforms
 * - Returns list of platforms where the username exists
 * - Helps investigators discover additional online presence
 * 
 * Server Communication:
 * - POST request to /sherlock endpoint
 * - Request body: {username: string}
 * - Response: {services: string[]} - Array of platform names
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during search process
 * - Completion message with number of new nodes added
 * - Error messages for failed searches
 */
export async function runSherlock(node){
    const username = node.data("label");
    setStatusMessage(`Sherlock: Searching "${username}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        // Start progress tracking
        transformBase.startTransformProgress('sherlock');
        transformBase.updateTransformProgress(10, `Sherlock: Searching "${username}"...`);

        const response = await fetch("/sherlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        
        transformBase.updateTransformProgress(60, `Sherlock: Processing results for "${username}"...`);
        
        const data = await response.json();
        let added = false;

        /**
         * Process Each Found Social Media Platform
         * 
         * Creates nodes for each platform where the username was found.
         */
        const totalServices = data.services.length;
        for (let i = 0; i < data.services.length; i++) {
            const service = data.services[i];
            const newId = transformBase.createNodeId(service, username);
            if(!transformBase.nodeExists(newId)){
                const position = transformBase.generatePositionNearNode(node);
                const createdNode = await transformBase.createNode(newId, `${service}: ${username}`, position, parentId);
                if(createdNode) added = true;
            }
            
            // Update progress based on services processed
            const serviceProgress = 60 + (i / totalServices) * 30;
            transformBase.updateTransformProgress(serviceProgress, `Sherlock: Processing ${i + 1}/${totalServices} services...`);
        }

        transformBase.updateTransformProgress(95, `Sherlock: Finalizing results...`);

        /**
         * Update UI Status
         * 
         * Provides feedback on the search results:
         * - Shows completion message with number of new nodes added
         * - Indicates if no new nodes were found (duplicates filtered out)
         */
        if(added){
            setStatusMessage(`Sherlock complete for "${username}"`);
            transformBase.completeTransformProgress(true, `Sherlock: Found ${data.services.length} platforms for "${username}"`);
        }else{
            setStatusMessage(`No new additions found for "${username}"`);
            transformBase.completeTransformProgress(true, `Sherlock: No new platforms found for "${username}"`);
        }
    } catch (err) {
        /**
         * Error Handling
         * 
         * Catches and handles any errors during the search process:
         * - Logs error details to console for debugging
         * - Updates UI status with error message
         * - Preserves original node state
         */
        console.error("Sherlock error:", err);
        setStatusMessage(`Sherlock failed for "${username}"`);
        transformBase.completeTransformProgress(false, `Sherlock: Failed for "${username}"`);
    }
}