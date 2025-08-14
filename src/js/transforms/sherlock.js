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

import { ur, cy } from "../main.js";
import { resolveNodeOverlap } from "../nodePositioning.js";

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
 * Node Creation:
 * - Each found platform becomes a new node
 * - Node ID format: "{platform}:{username}"
 * - Node label format: "{platform}: {username}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original node to each new node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
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
export function runSherlock(node){
    const username = node.data("label");
    document.getElementById("sherlock-status").innerText = `Sherlock: Searching "${username}"...`;

    fetch("/sherlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
        .then(res => res.json())
        .then(data => {
            const parentId = node.id();
            let added = false;

            /**
             * Process Each Found Social Media Platform
             * 
             * For each platform where the username was found:
             * 1. Creates a unique node ID combining platform and username
             * 2. Checks if node already exists to avoid duplicates
             * 3. Creates new node with platform information
             * 4. Creates edge connecting to original username node
             * 5. Uses undo/redo system for all graph modifications
             */
            data.services.forEach(service => {
                const newId = `${service}:${username}`;
                if(!cy.getElementById(newId).length){
                    /**
                     * New Node Configuration
                     * 
                     * Creates a node representing a social media account:
                     * - group: "nodes" - Identifies as a node element
                     * - data.id: Unique identifier for the node
                     * - data.label: Human-readable label showing platform and username
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
                            label: `${service}: ${username}`
                        },
                        position: safePosition
                    };
                    
                    /**
                     * Edge Configuration
                     * 
                     * Creates a directed edge from the original username node
                     * to the newly discovered social media account:
                     * - group: "edges" - Identifies as an edge element
                     * - data.id: Unique identifier for the edge
                     * - data.source: ID of the original username node
                     * - data.target: ID of the new social media account node
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
             * Provides feedback on the search results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            document.getElementById("sherlock-status").innerText = added
                ? `Sherlock complete for "${username}"`
                : `Sherlock complete (no new nodes)`;
        })
        .catch(err => {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the search process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("Sherlock error:", err);
            document.getElementById("sherlock-status").innerText = `Sherlock failed for "${username}"`;
        });
}