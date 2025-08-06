/**
 * OSINT Investigation Graph Analysis - Main Frontend Module
 * 
 * This module contains the core frontend logic for the OSINT investigation graph analysis tool.
 * It handles user interactions, graph manipulation, and coordinates between different components.
 * 
 * Key Features:
 * - Interactive graph manipulation (add, edit, delete nodes and edges)
 * - Context menu system for node operations
 * - Keyboard shortcuts for common actions
 * - Mode-based interaction system
 * - Integration with Sherlock username search
 * - Undo/redo functionality for all graph changes
 */

// Import shared logic
import { ur } from "./changeDataHandler.js";
import { cy } from "./cytoscapeConfig.js";
import { runSherlock } from "./transforms/sherlock.js";
import { embedContentInNode } from './fileUploadHandler.js';
import { saveGraph, loadGraph, confirmLoad } from "./dataManagement.js";

/**
 * Global State Management
 * 
 * These variables maintain the current state of the application:
 * - idCounter: Unique identifier generator for new nodes
 * - currentMode: Current interaction mode (none, connect, etc.)
 * - selectedNodes: Array of currently selected nodes for multi-selection
 * - orderedSelection: Array of nodes selected in order for sequential operations
 * - rightClickedNode: Reference to the node that was right-clicked for context menu
 * - shiftDown: Tracks if Shift key is held for box selection mode
 */
let idCounter = 0;
let currentMode = "none";
let selectedNodes = [];
let orderedSelection = [];
let rightClickedNode = null;
let shiftDown = false;

/**
 * Mode Management Function
 * 
 * setMode(mode: string)
 * 
 * Changes the current interaction mode and updates the UI accordingly.
 * Clears any existing selections when switching modes.
 * 
 * Input:
 * - mode: string - The new mode to set (none, connect, etc.)
 * 
 * Process:
 * 1. Updates currentMode variable
 * 2. Unselects all currently selected nodes
 * 3. Clears selectedNodes array
 * 4. Updates status display to show current mode
 */
function setMode(mode){
    currentMode = mode;
    selectedNodes.forEach(n => n.unselect());
    selectedNodes = [];
    document.getElementById("status").innerText = `Mode: ${mode}`;
}

/**
 * Dropdown Menu Management
 * 
 * toggleDropdown(id: string)
 * 
 * Handles the show/hide logic for dropdown menus in the UI.
 * Ensures only one dropdown is open at a time and closes others.
 * 
 * Input:
 * - id: string - The ID of the dropdown element to toggle
 * 
 * Process:
 * 1. Closes all other dropdowns and sub-dropdowns
 * 2. Toggles the specified dropdown's visibility
 * 3. Special handling for load dropdown to refresh file list
 */
function toggleDropdown(id){
    document.querySelectorAll(".dropdown, .sub-dropdown").forEach(el => {
        if(el.id !== id && !el.contains(document.getElementById(id))){
            el.style.display = "none";
        }
    });

    const el = document.getElementById(id);
    if(el){
        el.style.display = el.style.display === "block" ? "none" : "block";
        if(id === "load-dropdown") loadGraph();
    }
}

/**
 * Context Menu Action Handler
 * 
 * handleContextAction(action: string)
 * 
 * Processes actions triggered from the right-click context menu.
 * Each action performs a specific operation on the right-clicked node.
 * 
 * Input:
 * - action: string - The action to perform (edit, delete, sherlock, connect)
 * 
 * Available Actions:
 * - edit: Prompts for new node label and updates the node
 * - delete: Removes the node from the graph
 * - sherlock: Initiates Sherlock username search for the node
 * - connect: Switches to connect mode for manual edge creation
 * 
 * Process:
 * 1. Validates that a node was right-clicked
 * 2. Performs the requested action
 * 3. Hides the context menu
 */
function handleContextAction(action){
    const node = rightClickedNode;
    if(!node) return;

    if(action === "edit"){
        console.log("Inside edit action")
        const newLabel = prompt("Enter new name:", node.data("label"));
        if(newLabel){
            ur.do("changeData", { 
                id: node.id(),
                name: "label",
                oldValue: node.data("label"),
                newValue: newLabel
            });
        }
    }else if(action === "delete"){
        console.log("Delete using menu")
        ur.do("remove", node);
    }else if(action === "sherlock"){
        console.log("Calling sherlock")
        runSherlock(node);
    }else if(action === "connect"){
        console.log("Currently connecting")
        setMode("connect");
    }else if(action === "upload"){
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*,text/plain";

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if(file) embedContentInNode(rightClickedNode, file);
        };

        fileInput.click();
    }

    document.getElementById("context-menu").style.display = "none";
}

/**
 * Sequential Node Connection
 * 
 * connectSelectedInOrder()
 * 
 * Connects nodes in the order they were selected, creating a chain of edges.
 * Useful for creating sequential relationships in investigations.
 * 
 * Process:
 * 1. Checks if at least 2 nodes are selected
 * 2. Creates edges between consecutive nodes in the selection order
 * 3. Avoids creating duplicate edges
 * 4. Clears selection after completion
 */
function connectSelectedInOrder(){
    if(orderedSelection.length < 2) return;

    for(let i = 0; i < orderedSelection.length - 1; i++){
        const source = orderedSelection[i].id();
        const target = orderedSelection[i + 1].id();

        if(cy.edges(`[source="${source}"][target="${target}"]`).length === 0){
            ur.do("add", {
                group: "edges",
                data: {
                    id: `e-${source}-${target}-${Date.now()}`,
                    source,
                    target
                }
            });
        }
    }

    // Optionally reset
    cy.nodes().unselect();
    orderedSelection = [];
}

/**
 * Global Event Handlers
 * 
 * These event handlers respond to user interactions with the graph and UI.
 * They provide the core interactivity for the OSINT investigation tool.
 */

// Hide context menu on click (TODO: allow the user to click anywhere to close menu (you have to click the button again))
cy.on("tap", () => document.getElementById("context-menu").style.display = "none");
document.addEventListener("click", () => document.getElementById("context-menu").style.display = "none");

/**
 * Node Creation Handler
 * 
 * Double-tap on empty space creates a new node.
 * Prompts user for node name and adds it to the graph.
 */
cy.on("dbltap", (evt) => {
    if(evt.target === cy){
        const name = prompt("Enter node name:");
        if(!name) return;
        const newId = "n" + idCounter++;
        ur.do("add", {
            group: "nodes",
            data: {id: newId, label: name},
            position: evt.position
        });
    }
});

/**
 * Node Selection Handler for Connect Mode
 * 
 * In connect mode, clicking nodes creates edges between them.
 * Automatically switches back to normal mode after creating an edge.
 */
cy.on("tap", "node", function(evt){
    const node = evt.target;
    if(currentMode === "connect"){
        selectedNodes.push(node);
        if(selectedNodes.length === 2){
            const [source, target] = selectedNodes.map(n => n.id());
            if(!cy.edges(`[source="${source}"][target="${target}"]`).length){
                ur.do("add", {
                    group: "edges",
                    data: {
                        id: `e-${source}-${target}-${Date.now()}`,
                        source, target
                    }
                });
            }else{
                alert("Edge already exists.");
            }
            selectedNodes = [];
            setMode("none");
        }
    }
});

/**
 * Context Menu Handler
 * 
 * Right-click on a node shows the context menu with available actions.
 * Positions the menu at the cursor location.
 */
cy.on("cxttap", "node", function(evt){
    rightClickedNode = evt.target;
    const menu = document.getElementById("context-menu");
    menu.style.left = evt.originalEvent.pageX + "px";
    menu.style.top = evt.originalEvent.pageY + "px";
    menu.style.display = "block";
});

/**
 * Edge Deletion Handler
 * 
 * Right-click on an edge prompts for confirmation before deletion.
 * Shows the source and target node names in the confirmation dialog.
 */
cy.on("cxttap", "edge", function(evt){
    console.log("Delete connection?")
    const edge = evt.target;
    // console.log()
    if(confirm(`Delete connection from ${edge.source().data("label")} to ${edge.target().data("label")}?`)){
        ur.do("remove", edge);
    }
    console.log("Connection Deleted")
});

/**
 * Node Selection Tracking
 * 
 * Tracks nodes as they are selected for ordered operations.
 * Maintains the order of selection for sequential operations.
 */
cy.on("select", "node", function(evt){
    const node = evt.target;
    if(!orderedSelection.includes(node)){
        console.log(`Selected node: ${node}`);
        orderedSelection.push(node);
    }
});

/**
 * Node Deselection Tracking
 * 
 * Removes nodes from the ordered selection when they are deselected.
 * Maintains the integrity of the selection order.
 */
cy.on("unselect", "node", function(evt){
    const node = evt.target;
    console.log(`Unselected node: ${node}`);
    orderedSelection = orderedSelection.filter(n => n.id() !== node.id());
});

/**
 * Global Click Handler for Dropdown Management
 * 
 * Automatically closes dropdown menus when clicking outside of them.
 * Provides a modern application feel with intuitive menu behavior.
 */
document.addEventListener("click", function(evt){
    const isDropdown = evt.target.closest(".dropdown, .menu, .sub-dropdown");

    if(!isDropdown){
        document.querySelectorAll(".dropdown, .sub-dropdown").forEach(el => el.style.display = "none");
    }
});

/**
 * Keyboard Shortcut Handler
 * 
 * Provides keyboard shortcuts for common operations:
 * - Delete: Remove selected nodes/edges
 * - Ctrl+Z: Undo last action
 * - Ctrl+Y: Redo last undone action
 * - Shift: Enable box selection mode
 * - C: Connect selected nodes in order
 * 
 * Process:
 * 1. Checks for specific key combinations
 * 2. Prevents default browser behavior where needed
 * 3. Executes the corresponding action
 * 4. Updates UI state for mode changes
 */
document.addEventListener("keydown", function(evt){
    // if(evt.key === "Escape"){
    //     cy.nodes().unselect();
    //     document.getElementById("context-menu").style.display = "none";
    // }

    const selected = cy.$(":selected");

    if(evt.key === "Delete" && selected.length){
        ur.do("remove", selected);
    }
    if((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "z"){
        evt.preventDefault();
        ur.undo();
    }
    if((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "y"){
        evt.preventDefault();
        ur.redo();
    }

    if(evt.key === "Shift" && !shiftDown){
        shiftDown = true;
        cy.boxSelectionEnabled(true);
        cy.userPanningEnabled(false);
        cy.container().style.cursor = "crosshair";
    }

    if(evt.key.toLowerCase() === "c" && orderedSelection.length >= 2){
        connectSelectedInOrder();
    }
});

/**
 * Keyboard Release Handler
 * 
 * Resets box selection mode when Shift key is released.
 * Restores normal panning and cursor behavior.
 */
document.addEventListener("keyup", (evt) => {
    if(evt.key === "Shift"){
        shiftDown = false;
        cy.boxSelectionEnabled(false);
        cy.userPanningEnabled(true);
        cy.container().style.cursor = "default";
    }
});

/**
 * Zoom Control Handler
 * 
 * Handles zoom slider input to control graph zoom level.
 * Updates zoom percentage display in real-time.
 */
document.getElementById("zoom-control").addEventListener("input", function(){
    const zoomLevel = parseFloat(this.value);
    cy.zoom({ level: zoomLevel, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } })

    const percent = Math.round(zoomLevel * 100);
    document.getElementById("zoom-label").innerText = `${percent}%`;
});


// Panel toggle (Plan to add other features into this slider menu)
document.getElementById("toggle-panel").addEventListener("click", () => {
    document.getElementById("side-panel").classList.toggle("open");
});

/*
* Node Selector Handler
*
* It will change the selected nodes into the selected type.
* Uses the "changeData" type from changeDataHandler to handle the edits
*/
// Apply selected node type
document.querySelectorAll(".node-type-btn").forEach(item => {
    item.addEventListener("click", () => {
        const selectedType = item.getAttribute("data-type");
        const selected = cy.$(":selected");

        if (!selected.length) {
            alert("Please select a node to change its type.");
            return;
        }

        selected.forEach(node => {
            ur.do("changeData", {
                id: node.id(),
                name: "type",
                oldValue: node.data("type"),
                newValue: selectedType
            });
        });
    });
});

/*
* Expand/Collaspe Side Menu Sections
*
* This will toggle the visibility of section elements on the left side menu
*/
window.toggleSection = function(id){
    const section = document.getElementById(id);
    if (section) {
        section.style.display = section.style.display === "block" ? "none" : "block";
    }
};

/**
 * Module Exports
 * 
 * Exports key functions and objects for use by other modules.
 * Also makes some functions available globally for HTML event handlers.
 */
export { ur, cy };
window.ur = ur;
window.setMode = setMode;
window.saveGraph = saveGraph;
window.loadGraph = loadGraph;
window.confirmLoad = confirmLoad;
window.toggleDropdown = toggleDropdown;
window.handleContextAction = handleContextAction;