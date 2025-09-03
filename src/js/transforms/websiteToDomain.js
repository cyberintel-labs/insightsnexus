/**
 * Website to Domain Transform
 * 
 * This module extracts domain names from website URLs and creates new nodes
 * representing the discovered domains. It expands the investigation graph by
 * adding new nodes for each unique domain found in URL paths.
 * 
 * Key Features:
 * - Automated domain extraction from URL paths
 * - Dynamic graph expansion with new domain nodes
 * - Visual connection between original URL node and extracted domains
 * - Status updates during extraction process
 * - Error handling for invalid URLs
 * 
 * Transform Logic:
 * - Input: Node with label containing URL (e.g., "www.example.com/path/listed/here")
 * - Output: New node with extracted domain (e.g., "www.example.com")
 * - Creates directed edge from original URL node to domain node
 * - Prevents duplicate domain nodes
 * - Detects when node already contains just a domain and provides notification
 */

import { ur, cy } from "../main.js";
import { resolveNodeOverlap } from "../nodePositioning.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * Extract Domain from URL
 * 
 * extractDomain(url: string) -> string
 * 
 * Extracts the domain portion from a URL string.
 * 
 * Input:
 * - url: string - The URL to extract domain from
 * 
 * Returns:
 * - string - The extracted domain, or null if invalid URL
 * 
 * Process:
 * 1. Removes protocol (http://, https://) if present
 * 2. Extracts domain portion before first slash
 * 3. Handles various URL formats (with/without protocol, with/without www)
 * 4. Returns null for invalid URLs
 */
function extractDomain(url) {
    try {
        // Remove protocol if present
        let cleanUrl = url.replace(/^https?:\/\//, '');
        
        // Remove any path after domain
        const domain = cleanUrl.split('/')[0];
        
        // Basic validation - domain should contain at least one dot
        if (domain && domain.includes('.')) {
            return domain;
        }
        
        return null;
    } catch (error) {
        console.error("Error extracting domain:", error);
        return null;
    }
}

/**
 * Execute Website to Domain Transform
 * 
 * runWebsiteToDomain(node: CytoscapeNode)
 * 
 * Extracts domain from the URL stored in the node's label.
 * Creates a new node for the extracted domain if it doesn't already exist.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the URL to extract domain from
 * 
 * Process:
 * 1. Checks if node already contains just a domain (no path)
 * 2. If already a domain, notifies user and exits
 * 3. Extracts domain from node's label data
 * 4. Updates UI status to show extraction in progress
 * 5. Validates extracted domain
 * 6. Creates new node for the domain if it doesn't exist
 * 7. Connects new domain node to the original URL node
 * 8. Updates status with extraction completion or error
 * 
 * Node Creation:
 * - New node represents the extracted domain
 * - Node ID format: "domain:{domain}"
 * - Node label format: "{domain}" (just the domain, no prefix)
 * - Positioned near the original node with overlap prevention
 * 
 * Edge Creation:
 * - Creates directed edge from original URL node to domain node
 * - Edge ID format: "e-{parentId}-{domainId}"
 * - Uses undo/redo system for all additions
 * 
 * Error Handling:
 * - Invalid URLs are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during extraction process
 * - Completion message with domain extracted
 * - Error messages for invalid URLs
 */
export function runWebsiteToDomain(node) {
    const url = node.data("label");
    setStatusMessage(`Website to Domain: Extracting from "${url}"...`);

    try {
        /**
         * Domain Detection Check
         * 
         * Checks if the node already contains just a domain without any path:
         * - url.includes('.') - Ensures it contains a dot (domain requirement)
         * - !url.includes('/') - Ensures no path separator
         * - !url.includes('?') - Ensures no query parameters
         * 
         * If these conditions are met, the node is already displaying a domain
         * and no extraction is needed.
         */
        if (url && url.includes('.') && !url.includes('/') && !url.includes('?')) {
            setStatusMessage(`Website to Domain: Node already contains domain "${url}"`);
            return;
        }
        
        // Extract domain from URL
        const domain = extractDomain(url);
        
        if (!domain) {
            setStatusMessage(`Website to Domain: Invalid URL format`);
            return;
        }

        const parentId = node.id();
        const domainId = `domain:${domain}`;
        
        // Check if domain node already exists
        if (cy.getElementById(domainId).length > 0) {
            setStatusMessage(`Website to Domain: Domain "${domain}" already exists`);
            return;
        }

        /**
         * New Domain Node Configuration
         * 
         * Creates a node representing the extracted domain:
         * - group: "nodes" - Identifies as a node element
         * - data.id: Unique identifier for the domain node
         * - data.label: The extracted domain (no prefix, just the domain)
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
                id: domainId,
                label: domain
            },
            position: safePosition
        };
        
        /**
         * Edge Configuration
         * 
         * Creates a directed edge from the original URL node
         * to the newly extracted domain node:
         * - group: "edges" - Identifies as an edge element
         * - data.id: Unique identifier for the edge
         * - data.source: ID of the original URL node
         * - data.target: ID of the new domain node
         */
        const newEdge = {
            group: "edges",
            data: {
                id: `e-${parentId}-${domainId}`,
                source: parentId,
                target: domainId
            }
        };
        
        // Add both node and edge to graph using undo/redo system
        ur.do("add", newNode);
        ur.do("add", newEdge);
        
        /**
         * Update UI Status
         * 
         * Provides feedback on the extraction results:
         * - Shows completion message with extracted domain
         * - Indicates successful domain extraction and node creation
         */
        setStatusMessage(`Website to Domain: Extracted "${domain}" from URL`);
        
    } catch (error) {
        /**
         * Error Handling
         * 
         * Catches and handles any errors during the extraction process:
         * - Logs error details to console for debugging
         * - Updates UI status with error message
         * - Preserves original node state
         */
        console.error("Website to Domain error:", error);
        setStatusMessage(`Website to Domain: Extraction failed`);
    }
} 