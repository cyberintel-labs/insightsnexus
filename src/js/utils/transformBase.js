/**
 * Transform Base Utility Class
 * 
 * This utility provides centralized node creation functionality with automatic type detection
 * that all transforms can use to ensure consistent behavior and reduce code duplication.
 * 
 * Features:
 * - Automatic node type detection
 * - Consistent node creation pattern
 * - Edge creation with proper linking
 * - Overlap prevention
 * - Undo/redo system integration
 */

import { cy } from "../cytoscapeConfig.js";
import { ur } from "../changeDataHandler.js";
import { resolveNodeOverlap } from "../nodePositioning.js";
import { detectNodeType } from "./nodeTypeDetection.js";

export class TransformBase {
    /**
     * Create Node with Automatic Type Detection
     * 
     * createNode(id: string, label: string, position: object, parentId?: string): Promise<object>
     * 
     * Creates a node with automatic type detection and optionally creates an edge to a parent node.
     * 
     * Input:
     * - id: string - Unique identifier for the node
     * - label: string - Display label for the node
     * - position: object - Position coordinates {x, y}
     * - parentId?: string - Optional parent node ID for edge creation
     * 
     * Returns:
     * - Promise<object> - Created node data object
     * 
     * Process:
     * 1. Detects appropriate node type based on label content
     * 2. Applies overlap prevention to position
     * 3. Creates node with detected type
     * 4. Optionally creates edge to parent node
     * 5. Uses undo/redo system for all operations
     */
    async createNode(id, label, position, parentId = null) {
        // Check if node already exists
        if (cy.getElementById(id).length) {
            return null; // Node already exists
        }

        // Apply overlap prevention
        const safePosition = resolveNodeOverlap(null, position);
        
        // Detect node type automatically
        const nodeType = await detectNodeType(label);
        
        // Create node data
        const nodeData = {
            group: "nodes",
            data: {
                id: id,
                label: label,
                type: nodeType
            },
            position: safePosition
        };
        
        // Add node to graph using undo/redo system
        ur.do("add", nodeData);
        
        // Create edge to parent if specified
        if (parentId) {
            const edgeData = {
                group: "edges",
                data: {
                    id: `e-${parentId}-${id}`,
                    source: parentId,
                    target: id
                }
            };
            ur.do("add", edgeData);
        }
        
        return nodeData;
    }

    /**
     * Create Multiple Nodes
     * 
     * createNodes(nodes: Array<{id: string, label: string, position: object}>, parentId?: string): Promise<Array<object>>
     * 
     * Creates multiple nodes with automatic type detection.
     * 
     * Input:
     * - nodes: Array - Array of node objects with id, label, and position
     * - parentId?: string - Optional parent node ID for edge creation
     * 
     * Returns:
     * - Promise<Array<object>> - Array of created node data objects
     */
    async createNodes(nodes, parentId = null) {
        const createdNodes = [];
        
        for (const nodeInfo of nodes) {
            const createdNode = await this.createNode(
                nodeInfo.id,
                nodeInfo.label,
                nodeInfo.position,
                parentId
            );
            
            if (createdNode) {
                createdNodes.push(createdNode);
            }
        }
        
        return createdNodes;
    }

    /**
     * Generate Random Position Near Node
     * 
     * generatePositionNearNode(node: CytoscapeNode, offset?: number): object
     * 
     * Generates a random position near an existing node for new node placement.
     * 
     * Input:
     * - node: CytoscapeNode - Reference node to position near
     * - offset?: number - Maximum offset distance (default: 50)
     * 
     * Returns:
     * - object - Position coordinates {x, y}
     */
    generatePositionNearNode(node, offset = 50) {
        return {
            x: node.position("x") + Math.random() * (offset * 2) - offset,
            y: node.position("y") + Math.random() * (offset * 2) - offset
        };
    }

    /**
     * Check if Node Exists
     * 
     * nodeExists(id: string): boolean
     * 
     * Checks if a node with the given ID already exists in the graph.
     * 
     * Input:
     * - id: string - Node ID to check
     * 
     * Returns:
     * - boolean - True if node exists, false otherwise
     */
    nodeExists(id) {
        return cy.getElementById(id).length > 0;
    }

    /**
     * Create Node ID
     * 
     * createNodeId(prefix: string, value: string): string
     * 
     * Creates a standardized node ID with prefix and value.
     * 
     * Input:
     * - prefix: string - ID prefix (e.g., "country", "port")
     * - value: string - Value to include in ID
     * 
     * Returns:
     * - string - Formatted node ID
     */
    createNodeId(prefix, value) {
        return `${prefix}:${value}`;
    }
}
