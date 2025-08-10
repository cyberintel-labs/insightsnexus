/**
 * Node Overlap Prevention Utility Module
 * 
 * This module provides utilities to prevent nodes from overlapping when they are created
 * or moved. It ensures that all nodes maintain a minimum distance from each other
 * for better visual clarity and user experience.
 * 
 * Key Features:
 * - Overlap detection between nodes
 * - Automatic position adjustment to prevent overlap
 * - Support for different node sizes and shapes
 * - Integration with existing node creation and drag operations
 * - Reusable functions for future transforms
 * - Option to move underlying nodes instead of dragged nodes
 */

import { cy } from "./cytoscapeConfig.js";

/**
 * Node Dimensions Configuration
 * 
 * Defines the default dimensions for nodes to calculate overlap boundaries.
 * These values should match the actual rendered node sizes in the graph.
 */
const NODE_CONFIG = {
    DEFAULT_WIDTH: 60,  // Default node width in pixels
    DEFAULT_HEIGHT: 60, // Default node height in pixels
    MIN_DISTANCE: 80,   // Minimum distance between node centers to prevent overlap
    MAX_ATTEMPTS: 50    // Maximum attempts to find a non-overlapping position
};

/**
 * Calculate Node Bounds
 * 
 * calculateNodeBounds(node: CytoscapeNode) -> {x, y, width, height}
 * 
 * Determines the bounding box of a node including its position and dimensions.
 * 
 * Input:
 * - node: CytoscapeNode - The node to calculate bounds for
 * 
 * Returns:
 * - object - Bounding box with x, y coordinates and width, height dimensions
 * 
 * Process:
 * 1. Gets node position from Cytoscape
 * 2. Determines node dimensions based on styling and content
 * 3. Returns bounding box information for overlap calculations
 */
function calculateNodeBounds(node) {
    const position = node.position();
    const width = node.width() || NODE_CONFIG.DEFAULT_WIDTH;
    const height = node.height() || NODE_CONFIG.DEFAULT_HEIGHT;
    
    return {
        x: position.x,
        y: position.y,
        width: width,
        height: height
    };
}

/**
 * Check Node Overlap
 * 
 * checkNodeOverlap(node1Bounds: object, node2Bounds: object) -> boolean
 * 
 * Determines if two nodes overlap based on their bounding boxes.
 * 
 * Input:
 * - node1Bounds: object - Bounding box of first node {x, y, width, height}
 * - node2Bounds: object - Bounding box of second node {x, y, width, height}
 * 
 * Returns:
 * - boolean - true if nodes overlap, false otherwise
 * 
 * Process:
 * 1. Calculates the distance between node centers
 * 2. Compares distance to minimum required distance
 * 3. Returns true if nodes are too close to each other
 */
function checkNodeOverlap(node1Bounds, node2Bounds) {
    const center1 = {
        x: node1Bounds.x,
        y: node1Bounds.y
    };
    
    const center2 = {
        x: node2Bounds.x,
        y: node2Bounds.y
    };
    
    const distance = Math.sqrt(
        Math.pow(center1.x - center2.x, 2) + 
        Math.pow(center1.y - center2.y, 2)
    );
    
    return distance < NODE_CONFIG.MIN_DISTANCE;
}

/**
 * Check Position Overlap with Existing Nodes
 * 
 * checkPositionOverlap(proposedPosition: object, excludeNodeId: string) -> boolean
 * 
 * Checks if a proposed position would overlap with any existing nodes.
 * 
 * Input:
 * - proposedPosition: object - {x, y} coordinates to check
 * - excludeNodeId: string - ID of node to exclude from overlap check (for moving nodes)
 * 
 * Returns:
 * - boolean - true if position overlaps with any existing node, false otherwise
 * 
 * Process:
 * 1. Creates a virtual node bounds for the proposed position
 * 2. Checks against all existing nodes except the excluded one
 * 3. Returns true if any overlap is detected
 */
function checkPositionOverlap(proposedPosition, excludeNodeId = null) {
    const proposedBounds = {
        x: proposedPosition.x,
        y: proposedPosition.y,
        width: NODE_CONFIG.DEFAULT_WIDTH,
        height: NODE_CONFIG.DEFAULT_HEIGHT
    };
    
    const existingNodes = cy.nodes();
    
    for (let i = 0; i < existingNodes.length; i++) {
        const existingNode = existingNodes[i];
        
        // Skip the node we're moving (if specified)
        if (excludeNodeId && existingNode.id() === excludeNodeId) {
            continue;
        }
        
        const existingBounds = calculateNodeBounds(existingNode);
        
        if (checkNodeOverlap(proposedBounds, existingBounds)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Find Underlying Node
 * 
 * findUnderlyingNode(proposedPosition: object, excludeNodeId: string) -> CytoscapeNode | null
 * 
 * Finds the node that would be overlapped by a proposed position.
 * 
 * Input:
 * - proposedPosition: object - {x, y} coordinates to check
 * - excludeNodeId: string - ID of node to exclude from overlap check
 * 
 * Returns:
 * - CytoscapeNode | null - The node that would be overlapped, or null if no overlap
 * 
 * Process:
 * 1. Creates a virtual node bounds for the proposed position
 * 2. Checks against all existing nodes except the excluded one
 * 3. Returns the first node that would be overlapped
 * 4. Returns null if no overlap would occur
 */
function findUnderlyingNode(proposedPosition, excludeNodeId = null) {
    const proposedBounds = {
        x: proposedPosition.x,
        y: proposedPosition.y,
        width: NODE_CONFIG.DEFAULT_WIDTH,
        height: NODE_CONFIG.DEFAULT_HEIGHT
    };
    
    const existingNodes = cy.nodes();
    
    for (let i = 0; i < existingNodes.length; i++) {
        const existingNode = existingNodes[i];
        
        // Skip the node we're moving (if specified)
        if (excludeNodeId && existingNode.id() === excludeNodeId) {
            continue;
        }
        
        const existingBounds = calculateNodeBounds(existingNode);
        
        if (checkNodeOverlap(proposedBounds, existingBounds)) {
            return existingNode;
        }
    }
    
    return null;
}

/**
 * Move Underlying Node to Safe Position
 * 
 * moveUnderlyingNode(underlyingNode: CytoscapeNode, draggedNodePosition: object) -> object
 * 
 * Moves an underlying node to a safe position that doesn't overlap with other nodes.
 * 
 * Input:
 * - underlyingNode: CytoscapeNode - The node to move to a safe position
 * - draggedNodePosition: object - {x, y} coordinates where the dragged node will be placed
 * 
 * Returns:
 * - object - {x, y} coordinates where the underlying node was moved
 * 
 * Process:
 * 1. Calculates a position away from the dragged node's intended position
 * 2. Uses spiral search to find a non-overlapping position
 * 3. Moves the underlying node to the safe position
 * 4. Returns the final position where the node was placed
 */
function moveUnderlyingNode(underlyingNode, draggedNodePosition) {
    // Start searching from a position away from the dragged node
    const startPosition = {
        x: draggedNodePosition.x + NODE_CONFIG.MIN_DISTANCE,
        y: draggedNodePosition.y + NODE_CONFIG.MIN_DISTANCE
    };
    
    // Find a safe position for the underlying node
    const safePosition = findNonOverlappingPosition(startPosition, underlyingNode.id());
    
    // Move the underlying node to the safe position
    underlyingNode.position(safePosition);
    
    console.log(`Moved underlying node "${underlyingNode.data("label")}" to (${safePosition.x}, ${safePosition.y})`);
    
    return safePosition;
}

/**
 * Resolve Overlap by Moving Underlying Node
 * 
 * resolveOverlapByMovingUnderlying(draggedNode: CytoscapeNode, proposedPosition: object) -> boolean
 * 
 * When a dragged node would overlap with an underlying node, moves the underlying node instead.
 * This allows the user to place the dragged node exactly where they want it.
 * 
 * Input:
 * - draggedNode: CytoscapeNode - The node being dragged by the user
 * - proposedPosition: object - {x, y} coordinates where the user wants to place the dragged node
 * 
 * Returns:
 * - boolean - true if overlap was resolved by moving underlying node, false if no overlap occurred
 * 
 * Process:
 * 1. Checks if the proposed position would overlap with any existing node
 * 2. If overlap detected, finds the underlying node that would be overlapped
 * 3. Moves the underlying node to a safe position
 * 4. Returns true to indicate the overlap was resolved
 * 5. Returns false if no overlap occurred (no action needed)
 */
function resolveOverlapByMovingUnderlying(draggedNode, proposedPosition) {
    // Find if there's a node that would be overlapped
    const underlyingNode = findUnderlyingNode(proposedPosition, draggedNode.id());
    
    if (underlyingNode) {
        // Move the underlying node to a safe position
        moveUnderlyingNode(underlyingNode, proposedPosition);
        return true; // Overlap was resolved
    }
    
    return false; // No overlap occurred
}

/**
 * Find Non-Overlapping Position
 * 
 * findNonOverlappingPosition(proposedPosition: object, excludeNodeId: string) -> object
 * 
 * Finds a position near the proposed position that doesn't overlap with existing nodes.
 * Uses a spiral search pattern to find the nearest non-overlapping position.
 * 
 * Input:
 * - proposedPosition: object - {x, y} coordinates to start search from
 * - excludeNodeId: string - ID of node to exclude from overlap check
 * 
 * Returns:
 * - object - {x, y} coordinates of a non-overlapping position
 * 
 * Process:
 * 1. Starts with the proposed position
 * 2. If overlap detected, searches in expanding spiral pattern
 * 3. Returns first non-overlapping position found
 * 4. Falls back to proposed position if no solution found after max attempts
 */
function findNonOverlappingPosition(proposedPosition, excludeNodeId = null) {
    // First check if the proposed position is already valid
    if (!checkPositionOverlap(proposedPosition, excludeNodeId)) {
        return proposedPosition;
    }
    
    // Spiral search pattern parameters
    const spiralStep = NODE_CONFIG.MIN_DISTANCE;
    let currentX = proposedPosition.x;
    let currentY = proposedPosition.y;
    let spiralRadius = spiralStep;
    let angle = 0;
    
    for (let attempt = 0; attempt < NODE_CONFIG.MAX_ATTEMPTS; attempt++) {
        // Calculate next position in spiral
        currentX = proposedPosition.x + Math.cos(angle) * spiralRadius;
        currentY = proposedPosition.y + Math.sin(angle) * spiralRadius;
        
        const testPosition = { x: currentX, y: currentY };
        
        if (!checkPositionOverlap(testPosition, excludeNodeId)) {
            return testPosition;
        }
        
        // Increase spiral radius and angle for next attempt
        angle += Math.PI / 4; // 45-degree increments
        if (attempt % 8 === 0) { // Increase radius every 8 attempts
            spiralRadius += spiralStep;
        }
    }
    
    // If no non-overlapping position found, return the original position
    // This prevents infinite loops and allows the user to manually adjust
    console.warn("Could not find non-overlapping position after", NODE_CONFIG.MAX_ATTEMPTS, "attempts");
    return proposedPosition;
}

/**
 * Resolve Node Overlap
 * 
 * resolveNodeOverlap(node: CytoscapeNode, proposedPosition: object) -> object
 * 
 * Moves a node to a non-overlapping position if the proposed position would cause overlap.
 * 
 * Input:
 * - node: CytoscapeNode - The node to potentially move
 * - proposedPosition: object - {x, y} coordinates where the node should be placed
 * 
 * Returns:
 * - object - {x, y} coordinates where the node was actually placed
 * 
 * Process:
 * 1. Checks if proposed position would cause overlap
 * 2. If overlap detected, finds nearest non-overlapping position
 * 3. Returns the final position (either original or adjusted)
 */
function resolveNodeOverlap(node, proposedPosition) {
    const nodeId = node ? node.id() : null;
    const safePosition = findNonOverlappingPosition(proposedPosition, nodeId);
    
    // If position was adjusted, log for debugging
    if (safePosition.x !== proposedPosition.x || safePosition.y !== proposedPosition.y) {
        console.log(`Node overlap resolved: moved from (${proposedPosition.x}, ${proposedPosition.y}) to (${safePosition.x}, ${safePosition.y})`);
    }
    
    return safePosition;
}

/**
 * Module Exports
 * 
 * Exports the key functions for use by other modules.
 * This allows the main application and transforms to access overlap prevention.
 */
export {
    calculateNodeBounds,
    checkNodeOverlap,
    checkPositionOverlap,
    findUnderlyingNode,
    moveUnderlyingNode,
    resolveOverlapByMovingUnderlying,
    findNonOverlappingPosition,
    resolveNodeOverlap
}; 