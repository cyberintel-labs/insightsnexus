/**
 * Node Type Detection Utility
 * 
 * This utility provides automatic node type detection functionality
 * that can be used across the application for consistent type assignment.
 */

/**
 * Detect Node Type
 * 
 * detectNodeType(label: string): Promise<string>
 * 
 * Automatically detects the appropriate node type based on the label content.
 * Makes an API call to the backend for type detection.
 * 
 * Input:
 * - label: string - The node label to analyze
 * 
 * Returns:
 * - Promise<string> - The detected node type
 * 
 * Error Handling:
 * - Returns 'custom' as fallback if detection fails
 * - Logs errors for debugging
 */
export async function detectNodeType(label) {
    if (!label || typeof label !== 'string') {
        return 'custom';
    }

    try {
        const response = await fetch("/detect-node-type", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.nodeType || 'custom';
    } catch (error) {
        console.error("Error detecting node type:", error);
        return 'custom';
    }
}

/**
 * Create Node with Automatic Type Detection
 * 
 * createNodeWithType(nodeData: object): Promise<object>
 * 
 * Creates a node object with automatically detected type.
 * 
 * Input:
 * - nodeData: object - Node data object with id, label, and position
 * 
 * Returns:
 * - Promise<object> - Node object with detected type
 */
export async function createNodeWithType(nodeData) {
    const { id, label, position } = nodeData;
    
    const nodeType = await detectNodeType(label);
    
    return {
        group: "nodes",
        data: {
            id,
            label,
            type: nodeType
        },
        position
    };
}
