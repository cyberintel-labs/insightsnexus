/**
 * Inline Node Editor Utility
 * 
 * This utility provides inline editing functionality for node labels directly on the graph.
 * It creates an input field overlay positioned at the node's location, allowing users
 * to edit node names without using popup dialogs.
 * 
 * Key Features:
 * - Creates input field overlay positioned at node location
 * - Handles keyboard events (Enter to commit, Escape to cancel)
 * - Updates node label and triggers type detection after editing
 * - Automatically focuses input field for immediate typing
 * - Handles edge cases (empty names, node deletion on cancel)
 * - Prevents multiple editors from being open simultaneously
 * - Proper cleanup of event listeners and timeouts
 */

import { cy } from "../cytoscapeConfig.js";
import { detectNodeType } from "./nodeTypeDetection.js";
import { ur } from "../changeDataHandler.js";

// Track active editor to prevent multiple editors
let activeEditor = null;

/**
 * Create Inline Editor for Node
 * 
 * createInlineEditor(node: CytoscapeNode, onComplete?: function, isNewNode?: boolean): void
 * 
 * Creates an input field overlay positioned at the node's screen coordinates,
 * allowing the user to edit the node label inline.
 * 
 * Input:
 * - node: CytoscapeNode - The node to edit
 * - onComplete: function (optional) - Callback function called after editing completes
 *   Receives (node, newLabel, wasCancelled) as parameters
 * - isNewNode: boolean (optional) - Indicates if this is a newly created node that should
 *   be deleted if editing is cancelled
 * 
 * Process:
 * 1. Gets node's screen position from Cytoscape
 * 2. Creates input field element positioned at node location
 * 3. Sets initial value to current node label
 * 4. Focuses input and selects all text
 * 5. Handles Enter key to commit changes
 * 6. Handles Escape key to cancel editing
 * 7. Handles blur event to commit changes
 * 8. Updates node label and triggers type detection
 * 9. Removes input field after editing completes
 */
export function createInlineEditor(node, onComplete = null, isNewNode = false) {
    // Input validation
    if (!node || !node.length) {
        console.error("createInlineEditor: Invalid node provided");
        return;
    }
    
    // Prevent multiple editors from being open simultaneously
    if (activeEditor) {
        // Close existing editor first
        if (activeEditor.input && activeEditor.input.parentNode) {
            activeEditor.cleanup();
        }
    }
    
    const container = cy.container();
    if (!container) {
        console.error("createInlineEditor: Cytoscape container not found");
        return;
    }
    
    // Get node's rendered position in screen coordinates
    let nodePosition;
    try {
        nodePosition = node.renderedPosition();
    } catch (error) {
        console.error("createInlineEditor: Error getting node position:", error);
        return;
    }
    
    const containerRect = container.getBoundingClientRect();
    
    // Calculate absolute position relative to viewport
    const x = containerRect.left + nodePosition.x;
    const y = containerRect.top + nodePosition.y;
    
    // Store original label for cancellation check
    const originalLabel = node.data("label") || "";
    
    // Create input element
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalLabel;
    input.setAttribute("role", "textbox");
    input.style.position = "fixed";
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    input.style.transform = "translate(-50%, -50%)";
    input.style.zIndex = "10000";
    input.style.padding = "4px 8px";
    input.style.border = "2px solid #667eea";
    input.style.borderRadius = "4px";
    input.style.fontSize = "12px";
    input.style.fontWeight = "600";
    input.style.backgroundColor = "#ffffff";
    input.style.color = "#2c3e50";
    input.style.outline = "none";
    input.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
    input.style.minWidth = "100px";
    input.style.textAlign = "center";
    
    // Add to document
    document.body.appendChild(input);
    
    // Focus and select all text
    input.focus();
    input.select();
    
    let isCommitted = false;
    let wasCancelled = false;
    let blurTimeout = null;
    
    // Store event handlers for cleanup
    const eventHandlers = {
        keydown: null,
        blur: null,
        click: null,
        dblclick: null
    };
    
    /**
     * Cleanup function to remove event listeners and clear timeouts
     */
    const cleanup = () => {
        // Clear blur timeout if it exists
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        
        // Remove event listeners
        if (input && eventHandlers.keydown) {
            input.removeEventListener("keydown", eventHandlers.keydown);
        }
        if (input && eventHandlers.blur) {
            input.removeEventListener("blur", eventHandlers.blur);
        }
        if (input && eventHandlers.click) {
            input.removeEventListener("click", eventHandlers.click);
        }
        if (input && eventHandlers.dblclick) {
            input.removeEventListener("dblclick", eventHandlers.dblclick);
        }
        
        // Remove input from DOM
        if (input && input.parentNode) {
            input.parentNode.removeChild(input);
        }
        
        // Clear active editor reference
        if (activeEditor === editorInstance) {
            activeEditor = null;
        }
    };
    
    /**
     * Commit the edit
     */
    const commitEdit = async () => {
        if (isCommitted) return;
        isCommitted = true;
        
        // Clear any pending blur timeout
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        
        const newLabel = input.value.trim();
        
        // Cleanup input element
        cleanup();
        
        // Check if node still exists
        const nodeStillExists = cy.getElementById(node.id()).length > 0;
        if (!nodeStillExists) {
            console.warn("createInlineEditor: Node was removed during editing");
            if (onComplete) {
                onComplete(null, null, true, isNewNode);
            }
            return;
        }
        
        // If label is empty, cancel the edit
        if (!newLabel) {
            wasCancelled = true;
            if (onComplete) {
                onComplete(node, null, true, isNewNode);
            }
            return;
        }
        
        const oldLabel = node.data("label");
        
        // Update node label using undo/redo system
        try {
            ur.do("changeData", {
                id: node.id(),
                name: "label",
                oldValue: oldLabel,
                newValue: newLabel
            });
            
            // Detect and update node type based on new label
            try {
                const nodeType = await detectNodeType(newLabel);
                const oldType = node.data("type");
                if (nodeType !== oldType) {
                    ur.do("changeData", {
                        id: node.id(),
                        name: "type",
                        oldValue: oldType,
                        newValue: nodeType
                    });
                }
            } catch (error) {
                console.error("Error detecting node type after inline edit:", error);
            }
            
            if (onComplete) {
                onComplete(node, newLabel, false, false);
            }
        } catch (error) {
            console.error("Error committing inline edit:", error);
            if (onComplete) {
                onComplete(node, null, true, isNewNode);
            }
        }
    };
    
    /**
     * Cancel the edit
     */
    const cancelEdit = () => {
        if (isCommitted) return;
        isCommitted = true;
        wasCancelled = true;
        
        // Clear any pending blur timeout
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        
        // Cleanup input element
        cleanup();
        
        // If this was a new node and user cancelled, mark it for deletion
        if (onComplete) {
            onComplete(node, null, true, isNewNode);
        }
    };
    
    // Create editor instance for tracking
    const editorInstance = {
        input,
        cleanup,
        node
    };
    activeEditor = editorInstance;
    
    // Handle Enter key to commit
    eventHandlers.keydown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            commitEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancelEdit();
        }
    };
    input.addEventListener("keydown", eventHandlers.keydown);
    
    // Handle blur to commit (user clicked away or tabbed out)
    eventHandlers.blur = () => {
        // Use setTimeout to allow other events (like Enter key) to process first
        blurTimeout = setTimeout(() => {
            if (!isCommitted && input.parentNode) {
                commitEdit();
            }
        }, 100);
    };
    input.addEventListener("blur", eventHandlers.blur);
    
    // Prevent clicks on input from propagating to graph
    eventHandlers.click = (e) => {
        e.stopPropagation();
    };
    input.addEventListener("click", eventHandlers.click);
    
    // Prevent double-click from creating new nodes while editing
    eventHandlers.dblclick = (e) => {
        e.stopPropagation();
    };
    input.addEventListener("dblclick", eventHandlers.dblclick);
}

