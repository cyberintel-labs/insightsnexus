/**
 * Node Group Management Module
 * 
 * This module provides functionality for grouping multiple nodes together for batch operations.
 * It allows users to select multiple nodes by dragging, group them, and perform operations
 * on the entire group such as moving or deleting.
 * 
 * Key Features:
 * - Drag selection for grouping nodes
 * - Group manipulation (move, delete)
 * - Integration with undo/redo system
 * - Visual feedback for grouped nodes
 * - Click elsewhere to ungroup functionality
 */

import { cy } from './cytoscapeConfig.js';
import { ur } from './changeDataHandler.js';
import { setStatusMessage } from './setStatusMessageHandler.js';

/**
 * Group Manager State
 * 
 * These variables maintain the current state of the group management system:
 * - isGroupMode: Whether group mode is currently active
 * - groupedNodes: Array of currently grouped nodes
 * - isDragging: Whether the user is currently dragging to select nodes
 * - dragStartPos: Starting position of the drag selection
 * - dragEndPos: Ending position of the drag selection
 * - selectionBox: Visual element showing the selection area
 * - originalPanningState: Stores the original panning state before group mode
 * - groupDragStartPositions: Stores positions of all nodes when drag starts
 */
let isGroupMode = false;
let groupedNodes = [];
let isDragging = false;
let dragStartPos = null;
let dragEndPos = null;
let selectionBox = null;
let originalPanningState = true;
let groupDragStartPositions = new Map();

/**
 * Initialize Group Manager
 * 
 * Sets up event listeners and initializes the group management system.
 * This function should be called when the application starts.
 */
export function initGroupManager() {
    createSelectionBox();
    setupEventListeners();
    console.log('Group Manager initialized');
}

/**
 * Toggle Group Mode
 * 
 * toggleGroupMode()
 * 
 * Activates or deactivates group mode. When active, users can drag to select
 * multiple nodes for grouping operations.
 * 
 * Process:
 * 1. Toggles the isGroupMode state
 * 2. Updates UI feedback to show current mode
 * 3. Clears any existing grouped nodes when deactivating
 * 4. Updates cursor style to indicate group mode
 * 5. Updates button text to reflect current state
 */
export function toggleGroupMode() {
    isGroupMode = !isGroupMode;
    
    if (isGroupMode) {
        setStatusMessage('Group Mode: Drag to select nodes. Hold Space to pan. Click elsewhere to disable.');
        cy.container().style.cursor = 'crosshair';
        // Store original panning state and disable panning to allow drag selection
        originalPanningState = cy.userPanningEnabled();
        cy.userPanningEnabled(false);
        // Clear any existing grouped nodes when entering group mode
        clearGroupedNodes();
        // Update button text
        const button = document.getElementById('group-nodes-btn');
        if (button) button.textContent = 'Disable Group Mode';
    } else {
        setStatusMessage('Group Mode: Disabled');
        cy.container().style.cursor = 'default';
        // Restore original panning state
        cy.userPanningEnabled(originalPanningState);
        clearGroupedNodes();
        // Update button text
        const button = document.getElementById('group-nodes-btn');
        if (button) button.textContent = 'Group Nodes';
    }
    
    console.log(`Group mode ${isGroupMode ? 'enabled' : 'disabled'}`);
}

/**
 * Create Selection Box Element
 * 
 * createSelectionBox()
 * 
 * Creates a visual selection box that appears when the user drags to select nodes.
 * The box provides visual feedback showing the selection area.
 */
function createSelectionBox() {
    selectionBox = document.createElement('div');
    selectionBox.id = 'selection-box';
    selectionBox.style.cssText = `
        position: absolute;
        border: 2px dashed #667eea;
        background-color: rgba(102, 126, 234, 0.1);
        pointer-events: none;
        z-index: 1000;
        display: none;
    `;
    cy.container().appendChild(selectionBox);
}

/**
 * Setup Event Listeners
 * 
 * setupEventListeners()
 * 
 * Configures all the event listeners needed for group management functionality.
 * Handles mouse events for drag selection and keyboard events for group operations.
 */
function setupEventListeners() {
    // Mouse down - start drag selection
    cy.on('mousedown', (evt) => {
        if (!isGroupMode || evt.target !== cy) return;
        
        // Don't interfere with existing Shift key box selection
        if (evt.originalEvent.shiftKey) return;
        
        isDragging = true;
        const containerRect = cy.container().getBoundingClientRect();
        const clientX = evt.originalEvent.clientX;
        const clientY = evt.originalEvent.clientY;
        
        dragStartPos = { 
            x: clientX - containerRect.left, 
            y: clientY - containerRect.top 
        };
        dragEndPos = { x: dragStartPos.x, y: dragStartPos.y };
        
        updateSelectionBox();
        selectionBox.style.display = 'block';
        
        evt.originalEvent.preventDefault();
        evt.originalEvent.stopPropagation();
    });
    
    // Mouse move - update drag selection
    cy.on('mousemove', (evt) => {
        if (!isGroupMode || !isDragging) return;
        
        const containerRect = cy.container().getBoundingClientRect();
        const clientX = evt.originalEvent.clientX;
        const clientY = evt.originalEvent.clientY;
        
        dragEndPos = { 
            x: clientX - containerRect.left, 
            y: clientY - containerRect.top 
        };
        
        updateSelectionBox();
        updateNodeSelection();
        
        evt.originalEvent.preventDefault();
        evt.originalEvent.stopPropagation();
    });
    
    // Mouse up - finish drag selection
    cy.on('mouseup', (evt) => {
        if (!isGroupMode || !isDragging) return;
        
        isDragging = false;
        selectionBox.style.display = 'none';
        
        // Group the selected nodes
        groupSelectedNodes();
        
        evt.originalEvent.preventDefault();
        evt.originalEvent.stopPropagation();
    });
    
    // Click elsewhere to ungroup and disable group mode
    cy.on('tap', (evt) => {
        if (!isGroupMode || evt.target !== cy) return;
        
        // If we have grouped nodes, ungroup them
        if (groupedNodes.length > 0) {
            clearGroupedNodes();
        }
        
        // Disable group mode when clicking elsewhere
        toggleGroupMode();
    });
    
    // Keyboard events for group operations
    document.addEventListener('keydown', (evt) => {
        if (!isGroupMode) return;
        
        // Delete grouped nodes
        if ((evt.key === 'Delete' || evt.key === 'Backspace') && groupedNodes.length > 0) {
            evt.preventDefault();
            deleteGroupedNodes();
        }
        
        // Cancel group operation with Escape
        if (evt.key === 'Escape') {
            evt.preventDefault();
            // Clear any pending operations
            groupDragStartPositions.clear();
        }
        
        // Allow temporary panning with Space key
        if (evt.key === ' ' && !evt.repeat) {
            evt.preventDefault();
            cy.userPanningEnabled(true);
            cy.container().style.cursor = 'grab';
        }
    });
    
    // Keyboard release events
    document.addEventListener('keyup', (evt) => {
        if (!isGroupMode) return;
        
        // Disable temporary panning when Space is released
        if (evt.key === ' ') {
            evt.preventDefault();
            cy.userPanningEnabled(false);
            cy.container().style.cursor = 'crosshair';
        }
    });
    
    // Handle drag start for grouped nodes
    cy.on('dragstart', 'node', (evt) => {
        if (!isGroupMode || groupedNodes.length === 0) return;
        
        const draggedNode = evt.target;
        // Check if the dragged node is in the group by ID
        const isGroupedNode = groupedNodes.some(node => node.id() === draggedNode.id());
        if (isGroupedNode) {
            // Store initial positions of all grouped nodes
            groupDragStartPositions.clear();
            groupedNodes.forEach(node => {
                const pos = node.position();
                groupDragStartPositions.set(node.id(), { x: pos.x, y: pos.y });
            });
            console.log(`Started dragging grouped nodes, stored ${groupDragStartPositions.size} positions`);
        }
    });
    
    // Handle node drag for grouped nodes
    cy.on('drag', 'node', (evt) => {
        if (!isGroupMode || groupedNodes.length === 0) return;
        
        const draggedNode = evt.target;
        // Check if the dragged node is in the group by ID
        const isGroupedNode = groupedNodes.some(node => node.id() === draggedNode.id());
        if (isGroupedNode) {
            // Move all grouped nodes together
            moveGroupedNodes(draggedNode);
        }
    });
    
    // Handle drag end for grouped nodes
    cy.on('dragfreeon', 'node', (evt) => {
        if (!isGroupMode || groupedNodes.length === 0) return;
        
        const draggedNode = evt.target;
        // Check if the dragged node is in the group by ID
        const isGroupedNode = groupedNodes.some(node => node.id() === draggedNode.id());
        if (isGroupedNode && groupDragStartPositions.size > 0) {
            // Record the group movement using batch operations
            recordGroupMovement();
            
            // Clear the stored positions
            groupDragStartPositions.clear();
        }
    });
}

/**
 * Update Selection Box
 * 
 * updateSelectionBox()
 * 
 * Updates the visual selection box based on the current drag positions.
 * Calculates the proper position and size of the selection rectangle.
 */
function updateSelectionBox() {
    if (!dragStartPos || !dragEndPos) return;
    
    const startX = Math.min(dragStartPos.x, dragEndPos.x);
    const startY = Math.min(dragStartPos.y, dragEndPos.y);
    const width = Math.abs(dragEndPos.x - dragStartPos.x);
    const height = Math.abs(dragEndPos.y - dragStartPos.y);
    
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

/**
 * Update Node Selection
 * 
 * updateNodeSelection()
 * 
 * Updates which nodes are considered selected based on the current drag area.
 * Nodes that intersect with the selection box are highlighted.
 */
function updateNodeSelection() {
    if (!dragStartPos || !dragEndPos) return;
    
    // Clear previous selection
    cy.nodes().removeClass('group-selected');
    
    // Get nodes within the selection area
    const selectedNodes = getNodesInSelectionArea();
    
    // Highlight selected nodes
    selectedNodes.forEach(node => {
        node.addClass('group-selected');
    });
}

/**
 * Get Nodes in Selection Area
 * 
 * getNodesInSelectionArea()
 * 
 * Returns an array of nodes that are within the current drag selection area.
 * Uses Cytoscape's bounding box calculations to determine intersections.
 * 
 * @returns {Array} Array of nodes within the selection area
 */
function getNodesInSelectionArea() {
    if (!dragStartPos || !dragEndPos) return [];
    
    const startX = Math.min(dragStartPos.x, dragEndPos.x);
    const startY = Math.min(dragStartPos.y, dragEndPos.y);
    const endX = Math.max(dragStartPos.x, dragEndPos.x);
    const endY = Math.max(dragStartPos.y, dragEndPos.y);
    
    return cy.nodes().filter(node => {
        const nodePos = node.renderedPosition();
        const nodeWidth = node.renderedWidth();
        const nodeHeight = node.renderedHeight();
        
        // Check if node bounding box intersects with selection area
        const nodeLeft = nodePos.x - nodeWidth / 2;
        const nodeRight = nodePos.x + nodeWidth / 2;
        const nodeTop = nodePos.y - nodeHeight / 2;
        const nodeBottom = nodePos.y + nodeHeight / 2;
        
        return !(nodeRight < startX || nodeLeft > endX || nodeBottom < startY || nodeTop > endY);
    });
}

/**
 * Group Selected Nodes
 * 
 * groupSelectedNodes()
 * 
 * Groups the currently selected nodes and provides visual feedback.
 * Updates the groupedNodes array and applies group styling.
 */
function groupSelectedNodes() {
    const selectedNodes = getNodesInSelectionArea();
    
    if (selectedNodes.length === 0) {
        setStatusMessage('No nodes selected for grouping');
        return;
    }
    
    // Clear previous group
    clearGroupedNodes();
    
    // Set new group
    groupedNodes = selectedNodes;
    
    // Store initial positions for group movement calculations
    groupedNodes.forEach(node => {
        const pos = node.position();
        node.data('groupInitialPosition', { x: pos.x, y: pos.y });
        node.addClass('grouped');
        node.removeClass('group-selected');
    });
    
    setStatusMessage(`Grouped ${groupedNodes.length} nodes. Click elsewhere to ungroup, Delete to remove, or drag to move all.`);
    console.log(`Grouped ${groupedNodes.length} nodes`);
}

/**
 * Clear Grouped Nodes
 * 
 * clearGroupedNodes()
 * 
 * Removes the grouping from all currently grouped nodes and clears the group state.
 * Removes group styling and resets the groupedNodes array.
 */
function clearGroupedNodes() {
    if (groupedNodes.length === 0) return;
    
    // Remove group styling and stored data
    groupedNodes.forEach(node => {
        node.removeClass('grouped');
        node.removeClass('group-selected');
        node.removeData('groupInitialPosition');
    });
    
    // Clear stored drag positions
    groupDragStartPositions.clear();
    
    groupedNodes = [];
    setStatusMessage('Nodes ungrouped');
    console.log('Nodes ungrouped');
}

/**
 * Move Grouped Nodes
 * 
 * moveGroupedNodes(draggedNode)
 * 
 * Moves all grouped nodes together when one of them is dragged.
 * Maintains the relative positions of all nodes in the group.
 * 
 * @param {Object} draggedNode - The node that was dragged to trigger the group move
 */
function moveGroupedNodes(draggedNode) {
    if (groupedNodes.length <= 1) return;
    
    const draggedPos = draggedNode.position();
    const draggedInitialPos = draggedNode.data('groupInitialPosition');
    
    if (!draggedInitialPos) return;
    
    // Calculate the offset from the dragged node's initial position
    const offsetX = draggedPos.x - draggedInitialPos.x;
    const offsetY = draggedPos.y - draggedInitialPos.y;
    
    // Move all other nodes by the same offset from their initial positions
    groupedNodes.forEach(node => {
        if (node.id() !== draggedNode.id()) {
            const nodeInitialPos = node.data('groupInitialPosition');
            if (nodeInitialPos) {
                const newPos = {
                    x: nodeInitialPos.x + offsetX,
                    y: nodeInitialPos.y + offsetY
                };
                node.position(newPos);
            }
        }
    });
}

/**
 * Record Group Movement
 * 
 * recordGroupMovement()
 * 
 * Records the group movement for undo/redo using Cytoscape's built-in batch operations.
 * This approach works with the existing undo/redo system by using individual position
 * changes that are automatically tracked by Cytoscape.
 */
function recordGroupMovement() {
    if (groupedNodes.length === 0 || groupDragStartPositions.size === 0) return;
    
    // Check if any nodes actually moved
    let hasMovement = false;
    groupedNodes.forEach(node => {
        const startPos = groupDragStartPositions.get(node.id());
        const endPos = node.position();
        if (startPos && (startPos.x !== endPos.x || startPos.y !== endPos.y)) {
            hasMovement = true;
        }
    });
    
    if (!hasMovement) return;
    
    // Use Cytoscape's built-in batch operation to record all position changes
    // This will be treated as a single undo/redo operation
    ur.do('batch', () => {
        groupedNodes.forEach(node => {
            const startPos = groupDragStartPositions.get(node.id());
            const endPos = node.position();
            if (startPos && (startPos.x !== endPos.x || startPos.y !== endPos.y)) {
                // Temporarily move back to start position, then to end position
                // This creates the proper undo/redo tracking
                node.position(startPos);
                node.position(endPos);
            }
        });
    });
    
    console.log(`Recorded group movement for ${groupedNodes.length} nodes using batch operation`);
}

/**
 * Delete Grouped Nodes
 * 
 * deleteGroupedNodes()
 * 
 * Deletes all nodes in the current group using the undo/redo system.
 * This ensures the deletion can be undone and maintains data integrity.
 */
function deleteGroupedNodes() {
    if (groupedNodes.length === 0) return;
    
    // Use the undo/redo system to delete all grouped nodes
    ur.do('remove', groupedNodes);
    
    setStatusMessage(`Deleted ${groupedNodes.length} grouped nodes`);
    console.log(`Deleted ${groupedNodes.length} grouped nodes`);
    
    // Clear the group after deletion
    groupedNodes = [];
}

/**
 * Get Grouped Nodes
 * 
 * getGroupedNodes()
 * 
 * Returns the currently grouped nodes array.
 * Useful for other modules that need to know about the current group state.
 * 
 * @returns {Array} Array of currently grouped nodes
 */
export function getGroupedNodes() {
    return [...groupedNodes];
}

/**
 * Is Group Mode Active
 * 
 * isGroupModeActive()
 * 
 * Returns whether group mode is currently active.
 * Useful for other modules to check the current state.
 * 
 * @returns {boolean} True if group mode is active, false otherwise
 */
export function isGroupModeActive() {
    return isGroupMode;
}

/**
 * Get Group Count
 * 
 * getGroupCount()
 * 
 * Returns the number of nodes currently in the group.
 * Useful for UI feedback and status messages.
 * 
 * @returns {number} Number of nodes in the current group
 */
export function getGroupCount() {
    return groupedNodes.length;
}
