/**
 * Node Indicators Module
 * 
 * This module manages visual indicators on nodes to show whether they have
 * attachments (images/texts) or notes associated with them.
 * 
 * Features:
 * - Attachment icon (paperclip) for nodes with images or text files
 * - Notes icon (document) for nodes with notes
 * - Tooltips showing attachment count or note preview
 * - Automatic position updates on pan, zoom, and drag
 * - Efficient rendering with minimal performance impact
 * 
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)
 */

let cy = null;
let indicatorContainer = null;
const indicators = new Map(); // Map of nodeId -> {attachmentEl, notesEl}

/**
 * Initialize Node Indicators
 * 
 * Sets up the indicator system and creates the container for indicator elements.
 * Should be called after Cytoscape is initialized.
 * 
 * @param {Object} cytoscapeInstance - The Cytoscape instance
 */
export function initNodeIndicators(cytoscapeInstance) {
    cy = cytoscapeInstance;
    
    // Create container for indicators
    const cyContainer = cy.container();
    indicatorContainer = document.createElement('div');
    indicatorContainer.id = 'node-indicators-container';
    indicatorContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
    `;
    cyContainer.appendChild(indicatorContainer);
    
    // Initialize indicators for existing nodes
    updateAllIndicators();
    
    // Listen for node data changes
    cy.on('data', 'node', (evt) => {
        const node = evt.target;
        if (node.isNode()) {
            updateNodeIndicators(node);
        }
    });
    
    // Listen for custom filesUpdated event (triggered when files are added/removed)
    cy.on('filesUpdated', 'node', (evt) => {
        updateNodeIndicators(evt.target);
    });
    
    // Listen for node additions
    cy.on('add', 'node', (evt) => {
        updateNodeIndicators(evt.target);
    });
    
    // Listen for node removals
    cy.on('remove', 'node', (evt) => {
        removeNodeIndicators(evt.target.id());
    });
    
    // Listen for graph ready event (fires after cy.json() loads data)
    cy.on('ready', () => {
        // Small delay to ensure nodes are fully rendered
        setTimeout(() => {
            refreshAllIndicators();
        }, 100);
    });
    
    // Update positions on pan/zoom
    cy.on('pan', updateAllPositions);
    cy.on('zoom', updateAllPositions);
    
    // Update positions when nodes are dragged
    cy.on('drag', 'node', (evt) => {
        updateNodePosition(evt.target);
    });
    
    // Update positions after drag ends
    cy.on('dragfreeon', 'node', (evt) => {
        updateNodePosition(evt.target);
    });
    
    // Initial position update
    updateAllPositions();
    
    console.log('Node indicators initialized');
}

/**
 * Update All Indicators
 * 
 * Updates indicators for all nodes in the graph.
 */
function updateAllIndicators() {
    cy.nodes().forEach(node => {
        updateNodeIndicators(node);
    });
}

/**
 * Update Node Indicators
 * 
 * Creates or updates indicators for a specific node based on its data.
 * 
 * @param {Object} node - The Cytoscape node
 */
function updateNodeIndicators(node) {
    const nodeId = node.id();
    const images = node.data('images') || [];
    const texts = node.data('texts') || [];
    const notes = node.data('notes') || '';
    
    const hasAttachments = images.length > 0 || texts.length > 0;
    const hasNotes = notes && notes.trim() !== '';
    const attachmentCount = images.length + texts.length;
    
    // Get or create indicator elements
    let nodeIndicators = indicators.get(nodeId);
    if (!nodeIndicators) {
        nodeIndicators = {
            attachmentEl: null,
            notesEl: null
        };
        indicators.set(nodeId, nodeIndicators);
    }
    
    // Update attachment indicator
    if (hasAttachments) {
        if (!nodeIndicators.attachmentEl) {
            nodeIndicators.attachmentEl = createAttachmentIndicator(nodeId, attachmentCount);
            indicatorContainer.appendChild(nodeIndicators.attachmentEl);
        } else {
            updateAttachmentTooltip(nodeIndicators.attachmentEl, attachmentCount);
        }
    } else {
        if (nodeIndicators.attachmentEl) {
            nodeIndicators.attachmentEl.remove();
            nodeIndicators.attachmentEl = null;
        }
    }
    
    // Update notes indicator
    if (hasNotes) {
        if (!nodeIndicators.notesEl) {
            nodeIndicators.notesEl = createNotesIndicator(nodeId, notes);
            indicatorContainer.appendChild(nodeIndicators.notesEl);
        } else {
            updateNotesTooltip(nodeIndicators.notesEl, notes);
        }
    } else {
        if (nodeIndicators.notesEl) {
            nodeIndicators.notesEl.remove();
            nodeIndicators.notesEl = null;
        }
    }
    
    // Update positions
    updateNodePosition(node);
}

/**
 * Create Attachment Indicator
 * 
 * Creates a paperclip icon element for attachment indicator.
 * 
 * @param {string} nodeId - The node ID
 * @param {number} count - Number of attachments
 * @returns {HTMLElement} The indicator element
 */
function createAttachmentIndicator(nodeId, count) {
    const el = document.createElement('div');
    el.className = 'node-indicator node-indicator-attachment';
    el.dataset.nodeId = nodeId;
    el.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
    `;
    updateAttachmentTooltip(el, count);
    return el;
}

/**
 * Create Notes Indicator
 * 
 * Creates a document icon element for notes indicator.
 * 
 * @param {string} nodeId - The node ID
 * @param {string} notes - The notes content
 * @returns {HTMLElement} The indicator element
 */
function createNotesIndicator(nodeId, notes) {
    const el = document.createElement('div');
    el.className = 'node-indicator node-indicator-notes';
    el.dataset.nodeId = nodeId;
    el.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    `;
    updateNotesTooltip(el, notes);
    return el;
}

/**
 * Update Attachment Tooltip
 * 
 * Updates the tooltip text for attachment indicator.
 * 
 * @param {HTMLElement} el - The indicator element
 * @param {number} count - Number of attachments
 */
function updateAttachmentTooltip(el, count) {
    el.title = `${count} attachment${count !== 1 ? 's' : ''}`;
}

/**
 * Update Notes Tooltip
 * 
 * Updates the tooltip text for notes indicator with a preview.
 * 
 * @param {HTMLElement} el - The indicator element
 * @param {string} notes - The notes content
 */
function updateNotesTooltip(el, notes) {
    const preview = notes.length > 50 ? notes.substring(0, 50) + '...' : notes;
    el.title = `Has notes: ${preview}`;
}

/**
 * Update Node Position
 * 
 * Updates the position of indicators for a specific node.
 * 
 * @param {Object} node - The Cytoscape node
 */
function updateNodePosition(node) {
    if (!indicatorContainer) return;
    
    const nodeId = node.id();
    const nodeIndicators = indicators.get(nodeId);
    if (!nodeIndicators) return;
    
    // Get node position in rendered coordinates (screen coordinates)
    const renderedPos = node.renderedPosition();
    const nodeWidth = node.renderedWidth();
    const nodeHeight = node.renderedHeight();
    
    // Get cy container to convert screen coords to container-relative coords
    const cyContainer = cy.container();
    const containerRect = cyContainer.getBoundingClientRect();
    
    // Convert screen coordinates to container-relative coordinates
    // renderedPosition() gives screen coords, we need container coords
    const containerX = renderedPos.x - containerRect.left;
    const containerY = renderedPos.y - containerRect.top;
    
    // Calculate indicator positions (bottom-left corner of node)
    const baseX = containerX - (nodeWidth / 2) + 8; // Offset from left edge
    const baseY = containerY + (nodeHeight / 2) - 8; // Offset from bottom edge
    
    // Position attachment indicator (if exists) - leftmost
    if (nodeIndicators.attachmentEl) {
        nodeIndicators.attachmentEl.style.left = `${baseX}px`;
        nodeIndicators.attachmentEl.style.top = `${baseY}px`;
    }
    
    // Position notes indicator (if exists) - to the right of attachment if both exist
    if (nodeIndicators.notesEl) {
        const notesX = baseX + (nodeIndicators.attachmentEl ? 20 : 0); // Offset if attachment exists
        nodeIndicators.notesEl.style.left = `${notesX}px`;
        nodeIndicators.notesEl.style.top = `${baseY}px`;
    }
}

/**
 * Update All Positions
 * 
 * Updates positions of all indicators. Called on pan/zoom.
 */
function updateAllPositions() {
    if (!indicatorContainer) return;
    
    cy.nodes().forEach(node => {
        updateNodePosition(node);
    });
}

/**
 * Remove Node Indicators
 * 
 * Removes all indicators for a specific node.
 * 
 * @param {string} nodeId - The node ID
 */
function removeNodeIndicators(nodeId) {
    const nodeIndicators = indicators.get(nodeId);
    if (nodeIndicators) {
        if (nodeIndicators.attachmentEl) {
            nodeIndicators.attachmentEl.remove();
        }
        if (nodeIndicators.notesEl) {
            nodeIndicators.notesEl.remove();
        }
        indicators.delete(nodeId);
    }
}

/**
 * Refresh All Indicators
 * 
 * Forces a refresh of all indicators. Useful after graph load.
 */
export function refreshAllIndicators() {
    // Clear all existing indicators
    indicators.forEach((nodeIndicators) => {
        if (nodeIndicators.attachmentEl) {
            nodeIndicators.attachmentEl.remove();
        }
        if (nodeIndicators.notesEl) {
            nodeIndicators.notesEl.remove();
        }
    });
    indicators.clear();
    
    // Recreate indicators for all nodes
    updateAllIndicators();
    updateAllPositions();
}

