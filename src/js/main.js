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
 * 
 * Copyright (c) 2024 Investigating Project
 * Licensed under the MIT License
 * - Mode-based interaction system
 * - Integration with username search functionality
 * - Undo/redo functionality for all graph changes
 */

// Import shared logic
import { ur } from "./changeDataHandler.js";
import { cy } from "./cytoscapeConfig.js";
import { runSherlock } from "./transforms/sherlock.js";
import { runPortScan } from "./transforms/portScan.js";
import { runDomainToIp } from "./transforms/domainToIp.js";
import { runDomainToDns } from "./transforms/domainToDns.js";
import { runWhois } from "./transforms/whois.js";
import { runIpToNetblock } from "./transforms/ipToNetblock.js";
import { runIpToLocation } from "./transforms/ipToLocation.js";
import { uploadFiles, nextImage, prevImage } from './fileUploadHandler.js';
import { runWebsiteToDomain } from "./transforms/websiteToDomain.js";
import { runWebsiteScreenshot } from "./transforms/websiteScreenshot.js";
import { saveGraph, loadGraph, confirmLoad, autoLoadLastSave, loadSaveFiles, saveToCurrentFile, saveAsNewFile, newProject, setUpdateIdCounterFunction } from "./dataManagement.js";
import { resolveNodeOverlap, resolveOverlapByMovingUnderlying } from "./nodePositioning.js";
import { initNodePropertiesMenu, togglePropertiesMenu, openPropertiesMenu, closePropertiesMenu } from './nodePropertiesMenu.js';
import { setStatusMessage } from "./setStatusMessageHandler.js";
import { runDomainToEnd } from "./transforms/domainToEnd.js";
import { runDomainToSub } from "./transforms/domainToSub.js";
import { createNodeWithType } from "./utils/nodeTypeDetection.js";
import { TransformBase } from "./utils/transformBase.js";
import { multiTransformManager } from "./utils/multiTransformManager.js";

initNodePropertiesMenu(cy);

// START: Custom button logic will be moved to it's own file
/**
 * Custom Transform UI Integration
 * 
 * This section manages the frontend logic for uploading, removing,
 * and running user-provided Python transforms. It coordinates with
 * the backend API (customTransform.ts + api.ts) to keep UI state
 * synchronized with the server.
 * 
 * Features:
 * - Upload/remove Python transform via toolbar button
 * - Dynamically update button label ("Upload Transform" / "Remove Transform")
 * - Show/hide "Run Custom Transform" option in the right-click context menu
 * - Check backend on startup for existing transform
 * 
 * Security Note:
 * - Frontend only manages UI state
 * - Backend is responsible for safely executing Python
 */

// Track transform state
// - true if a custom transform is currently uploaded on the server
// - false otherwise
let hasCustomTransform = false;

/**
 * Handle Transform Action
 * 
 * handleTransformAction()
 * 
 * Called when the toolbar button ("Upload Transform"/"Remove Transform") is clicked.
 * 
 * Process:
 * 1. If no transform exists:
 *    - Prompt user to upload a `.py` file
 *    - Send file to backend via POST /upload-transform
 *    - Update UI state if successful
 * 
 * 2. If a transform already exists:
 *    - Send DELETE request to /remove-transform
 *    - Update UI state if successful
 * 
 * UI Feedback:
 * - Logs status to console
 * - Alerts user if upload/remove fails
 */
async function handleTransformAction(){
    if(!hasCustomTransform){
        // --- Upload Transform Flow ---
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".py"; // restrict to Python files

        // Triggered once user selects a file
        fileInput.onchange = async () => {
            const file = fileInput.files[0];
            if (!file) return;

            // Prepare file for upload (must match backend's multer setup)
            const formData = new FormData();
            formData.append("file", file);

            // Send file to backend
            const res = await fetch("/upload-transform", {
                method: "POST",
                body: formData
            });

            if(res.ok){
                console.log(file);
                console.log("Custom transform has been uploaded");
                hasCustomTransform = true;
                updateTransformButton(); // refresh UI
            }else{
                alert("Failed to upload transform.");
            }
        };

        fileInput.click(); // open file picker dialog
    }else{
        // --- Remove Transform Flow ---
        const res = await fetch("/remove-transform", { method: "DELETE" });
        if(res.ok){
            console.log("Custom transform has been removed");
            hasCustomTransform = false;
            updateTransformButton(); // refresh UI
        }else{
            alert("Failed to remove transform.");
        }
    }
}

/**
 * Update Transform Button
 * 
 * updateTransformButton()
 * 
 * Dynamically updates the toolbar button text depending on current state:
 * - "Upload Transform" when no transform exists
 * - "Remove Transform" when transform is active
 * 
 * Also triggers context menu rebuild to ensure correct options.
 */
function updateTransformButton() {
    const btn = document.getElementById("transform-toggle-btn");
    if(btn){
        btn.textContent = hasCustomTransform ? "Remove Transform" : "Upload Transform";
    }

    buildContextMenu();
}

/**
 * Check Transform Status (on startup)
 * 
 * checkTransformStatus()
 * 
 * Queries backend to determine if a custom transform exists when app loads.
 * - GET /has-transform
 * - Updates hasCustomTransform state
 * - Refreshes toolbar + context menu
 */
async function checkTransformStatus(){
    const res = await fetch("/has-transform");
    const data = await res.json();
    hasCustomTransform = data.exists;
    updateTransformButton();
}
checkTransformStatus();

/**
 * Build Context Menu
 * 
 * buildContextMenu()
 * 
 * Dynamically adds/removes "Run Custom Transform" option in right-click menu.
 * 
 * Process:
 * - Removes existing "Run Custom Transform" item if present
 * - If transform exists, creates new <li> with click handler
 * - Appends to context menu
 * 
 * Result:
 * - Context menu always reflects current transform state
 */
function buildContextMenu() {
    const menu = document.getElementById("context-menu");
    if (!menu) return;

    // Remove previous instance if it exists
    const existing = document.getElementById("run-custom-transform");
    if (existing) existing.remove();

    // Add "Run Custom Transform" to Transforms submenu only if a transform exists
    if(hasCustomTransform){
        const transformSubmenu = document.getElementById("transform-submenu");
        if (transformSubmenu) {
            const li = document.createElement("li");
            li.id = "run-custom-transform";
            li.textContent = "Run Custom Transform";
            li.onclick = () => handleContextAction("run-custom-transform");
            transformSubmenu.appendChild(li);
        }
    }
}
// END: Custom button logic will be moved to it's own file

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
 * Update ID Counter Function
 * 
 * updateIdCounter()
 * 
 * Updates the idCounter to be higher than any existing node ID in the graph.
 * This prevents duplicate ID errors when creating new nodes after loading a graph.
 * 
 * Process:
 * 1. Gets all existing node IDs from the graph
 * 2. Extracts numeric parts from IDs that start with 'n'
 * 3. Finds the highest numeric value
 * 4. Sets idCounter to one higher than the maximum found
 * 5. If no existing 'n' IDs found, resets counter to 0
 */
function updateIdCounter() {
    const existingIds = cy.nodes().map(node => node.id());
    const numericIds = existingIds
        .filter(id => id.startsWith('n'))
        .map(id => parseInt(id.substring(1)))
        .filter(num => !isNaN(num));
    
    if (numericIds.length > 0) {
        idCounter = Math.max(...numericIds) + 1;
    } else {
        idCounter = 0;
    }
}

// Register the updateIdCounter function with data management module
setUpdateIdCounterFunction(updateIdCounter);

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
    setStatusMessage(`Mode: ${mode}`);
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
        if(id === "save-dropdown") loadSaveFiles();
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
 * - sherlock: Initiates username search for the node
 * - connect: Switches to connect mode for manual edge creation
 * 
 * Process:
 * 1. Validates that a node was right-clicked
 * 2. Performs the requested action
 * 3. Hides the context menu
 */
/**
 * Run Custom Transform
 * 
 * runCustomTransform(node: CytoscapeNode)
 * 
 * Executes a custom transform on the specified node.
 * 
 * @param {CytoscapeNode} node - The node to transform
 */
async function runCustomTransform(node) {
    const transformBase = new TransformBase();
    const parentId = node.id();
    
    try {
        // Start progress tracking
        transformBase.startTransformProgress('Running Custom Transform');
        transformBase.updateTransformProgress(10, `Custom Transform: Processing "${node.data("label")}"...`);

        const res = await fetch("/run-transform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nodeLabel: node.data("label") })
        });

        if(!res.ok){
            transformBase.completeTransformProgress(false, `Custom Transform: Failed for "${node.data("label")}"`);
            throw new Error("Failed to run custom transform.");
        }

        transformBase.updateTransformProgress(60, `Custom Transform: Processing results...`);

        const data = await res.json();
        let added = false;
        
        if(Array.isArray(data.result)){
            const totalResults = data.result.length;
            for (let i = 0; i < data.result.length; i++) {
                const binary = data.result[i];
                const newId = "n" + idCounter++;
                ur.do("add", {
                    group: "nodes",
                    data: { id: newId, label: binary, type: "custom" },
                    position: {
                        x: node.position("x") + Math.random() * 100 - 50,
                        y: node.position("y") + Math.random() * 100 - 50
                    }
                });
                ur.do("add", {
                    group: "edges",
                    data: {
                        id: `e-${node.id()}-${newId}-${Date.now()}`,
                        source: node.id(),
                        target: newId
                    }
                });
                added = true;
                
                // Update progress based on results processed
                const resultProgress = 60 + (i / totalResults) * 30;
                transformBase.updateTransformProgress(resultProgress, `Custom Transform: Processing ${i + 1}/${totalResults} results...`);
            }
        }

        transformBase.updateTransformProgress(95, `Custom Transform: Finalizing results...`);

        if(added){
            transformBase.completeTransformProgress(true, `Custom Transform: Found ${data.result.length} results for "${node.data("label")}"`);
        } else {
            transformBase.completeTransformProgress(true, `Custom Transform: No results found for "${node.data("label")}"`);
        }
    } catch(err) {
        console.error("Error running custom transform:", err);
        transformBase.completeTransformProgress(false, `Custom Transform: Failed for "${node.data("label")}"`);
        throw err;
    }
}

/**
 * Execute Transform with Multi-Transform Manager
 * 
 * executeTransformWithManager(transformName: string, transformFunction: Function, node: CytoscapeNode)
 * 
 * Wrapper function that executes transforms through the multi-transform manager
 * for concurrent execution control and progress tracking.
 * 
 * @param {string} transformName - Name of the transform
 * @param {Function} transformFunction - The transform function to execute
 * @param {CytoscapeNode} node - The node to transform
 */
async function executeTransformWithManager(transformName, transformFunction, node) {
    try {
        await multiTransformManager.requestTransform(transformName, transformFunction, node);
    } catch (error) {
        console.error(`Transform ${transformName} failed:`, error);
        setStatusMessage(`Transform ${transformName} failed: ${error.message}`);
    }
}

async function handleContextAction(action){
    const node = rightClickedNode;
    if (!node) return;

    if(action === "run-custom-transform"){
        console.log("Calling custom transform")
        executeTransformWithManager('Running Custom Transform', runCustomTransform, node);
    }else if(action === "edit"){
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
        console.log("Calling username search")
        executeTransformWithManager('sherlock', runSherlock, node);
    }else if(action === "domain-to-ip"){
        console.log("Calling domain to IP")
        executeTransformWithManager('domain-to-ip', runDomainToIp, node);
    }else if(action === "domain-to-dns"){
        console.log("Calling domain to DNS")
        executeTransformWithManager('domain-to-dns', runDomainToDns, node);
    }else if(action === "domain-to-endpoint"){
        console.log("Calling domain to endpoint")
        executeTransformWithManager('domain-to-endpoint', runDomainToEnd, node);
    }else if(action === "website-to-domain"){
        console.log("Calling website to domain")
        executeTransformWithManager('website-to-domain', runWebsiteToDomain, node);
    }else if(action === "website-screenshot"){
        console.log("Calling website screenshot")
        executeTransformWithManager('website-screenshot', runWebsiteScreenshot, node);
    }else if(action === "whois"){
        console.log("Calling whois")
        executeTransformWithManager('whois', runWhois, node);
    }else if(action === "ip-to-netblock"){
        console.log("Calling IP to Netblock")
        executeTransformWithManager('ip-to-netblock', runIpToNetblock, node);
    }else if(action === "ip-to-location"){
        console.log("Calling IP to Location")
        executeTransformWithManager('ip-to-location', runIpToLocation, node);
    }else if(action === "port-scan"){
        console.log("Calling port scan")
        executeTransformWithManager('port-scan', runPortScan, node);
    }else if(action === "domain-to-subdomain"){
        console.log("Calling domain-to-subdomain")
        executeTransformWithManager('domain-to-subdomain', runDomainToSub, node);
    }else if(action === "connect"){
        console.log("Currently connecting")
        setMode("connect");
    }else if(action === "upload"){
        uploadFiles(node);
    }else if(action === "next-image" || action === "prev-image"){
        const images = node.data("images");
        if(images && images.length > 1){
            if(action === "next-image"){
                nextImage(node);
            }else{
                prevImage(node);
            }
        }
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
cy.on("tap", () => {
    document.getElementById("context-menu").style.display = "none";
    // Also close any open submenus
    const submenu = document.getElementById("transform-submenu");
    const trigger = document.querySelector(".submenu-trigger");
    if (submenu && submenu.classList.contains("show")) {
        submenu.classList.remove("show");
        trigger.classList.remove("active");
    }
});
document.addEventListener("click", (evt) => {
    // Don't close if clicking on the submenu trigger or submenu items
    if (evt.target.closest("#context-menu .submenu-trigger") || evt.target.closest("#context-menu .submenu")) {
        return;
    }
    document.getElementById("context-menu").style.display = "none";
    // Also close any open submenus
    const submenu = document.getElementById("transform-submenu");
    const trigger = document.querySelector(".submenu-trigger");
    if (submenu && submenu.classList.contains("show")) {
        submenu.classList.remove("show");
        trigger.classList.remove("active");
    }
});

/**
 * Node Creation Handler
 * 
 * Double-tap on empty space creates a new node.
 * Prompts user for node name and adds it to the graph with overlap prevention.
 * Automatically detects node type based on the label content.
 */
cy.on("dbltap", (evt) => {
    if(evt.target === cy){
        const name = prompt("Enter node name:");
        if(!name) return;
        const newId = "n" + idCounter++;
        
        // Apply overlap prevention to ensure new node doesn't overlap existing nodes
        const safePosition = resolveNodeOverlap(null, evt.position);
        
        // Create node with automatic type detection
        createNodeWithType({
            id: newId,
            label: name,
            position: safePosition
        }).then(nodeData => {
            ur.do("add", nodeData);
            // Automatically select the newly created node to show its properties
            const newNode = cy.getElementById(newId);
            if (newNode.length) {
                newNode.select();
            }
        }).catch(error => {
            console.error("Error creating node with type:", error);
            // Fallback to custom type if detection fails
            const fallbackNode = {
                group: "nodes",
                data: {id: newId, label: name, type: 'custom'},
                position: safePosition
            };
            ur.do("add", fallbackNode);
            // Automatically select the newly created node to show its properties
            const newNode = cy.getElementById(newId);
            if (newNode.length) {
                newNode.select();
            }
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

    if(!selected.length) return;
    const node = selected[0]; // Only act on the first selected node
    if(!node.data("images") || node.data("images").length < 2) return;

    if(evt.key === "ArrowRight"){
        console.log("Change Image (right key)")
        evt.preventDefault();
        nextImage(node);
    }else if(evt.key === "ArrowLeft"){
        console.log("Change Image (left key)")
        evt.preventDefault();
        prevImage(node);
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

/**
 * Mouse Wheel Zoom Handler
 * 
 * Syncs the zoom slider with mouse wheel zooming.
 * Updates the slider position and percentage label when user zooms with mouse wheel.
 */
cy.on("zoom", function(evt){
    const zoomLevel = cy.zoom();
    const zoomSlider = document.getElementById("zoom-control");
    const zoomLabel = document.getElementById("zoom-label");
    
    // Update slider value to match current zoom level
    zoomSlider.value = zoomLevel;
    
    // Update percentage label
    const percent = Math.round(zoomLevel * 100);
    zoomLabel.innerText = `${percent}%`;
});

/**
 * Direct Mouse Wheel Event Handler
 * 
 * Ensures mouse wheel events are properly handled for zooming.
 * This provides a fallback in case the Cytoscape zoom event doesn't fire.
 */
cy.container().addEventListener("wheel", function(evt) {
    // Prevent default browser behavior
    evt.preventDefault();
    
    // Get current zoom level
    const currentZoom = cy.zoom();
    
    // Calculate new zoom level based on wheel delta
    const zoomFactor = 0.1;
    const delta = evt.deltaY > 0 ? -zoomFactor : zoomFactor;
    const newZoom = Math.max(0.1, Math.min(2, currentZoom + delta));
    
    // Apply zoom
    cy.zoom({ level: newZoom, renderedPosition: { x: evt.clientX, y: evt.clientY } });
    
    // Update slider and label
    const zoomSlider = document.getElementById("zoom-control");
    const zoomLabel = document.getElementById("zoom-label");
    
    zoomSlider.value = newZoom;
    const percent = Math.round(newZoom * 100);
    zoomLabel.innerText = `${percent}%`;
}, { passive: false });








/**
 * Node Drag End Handler
 * 
 * Prevents node overlap when a user finishes dragging a node.
 * If the dragged node would overlap with another node, moves the underlying node instead
 * to allow the user to place the dragged node exactly where they want it.
 */
cy.on("dragfreeon", "node", (evt) => {
    const draggedNode = evt.target;
    const currentPosition = draggedNode.position();
    
    // Try to resolve overlap by moving the underlying node instead of the dragged node
    const overlapResolved = resolveOverlapByMovingUnderlying(draggedNode, currentPosition);
    
    if (overlapResolved) {
        // The underlying node was moved, so the dragged node can stay at the user's intended position
        console.log(`Overlap resolved by moving underlying node. Dragged node "${draggedNode.data("label")}" remains at (${currentPosition.x}, ${currentPosition.y})`);
    } else {
        // No overlap occurred, so no action was needed
        console.log(`No overlap detected. Node "${draggedNode.data("label")}" is at (${currentPosition.x}, ${currentPosition.y})`);
    }
});

/**
 * Transform Submenu Toggle
 * 
 * toggleTransformSubmenu()
 * 
 * Toggles the visibility of the transforms submenu in the context menu.
 * Handles the show/hide animation and updates the trigger button state.
 */
window.toggleTransformSubmenu = function() {
    const submenu = document.getElementById("transform-submenu");
    const trigger = document.querySelector(".submenu-trigger");
    
    if (submenu.classList.contains("show")) {
        submenu.classList.remove("show");
        trigger.classList.remove("active");
    } else {
        submenu.classList.add("show");
        trigger.classList.add("active");
    }
};

/**
 * Generic Submenu Toggle
 * 
 * toggleSubmenu(submenuId)
 * 
 * Toggles the visibility of any submenu in the context menu.
 * Handles the show/hide animation and updates the trigger button state.
 * Ensures only one submenu can be open at a time by closing others.
 * 
 * @param {string} submenuId - The ID of the submenu to toggle
 */
window.toggleSubmenu = function(submenuId) {
    const submenu = document.getElementById(submenuId);
    const trigger = event.target;
    
    // Get all submenus within the transform-submenu
    const allSubmenus = document.querySelectorAll('#transform-submenu .submenu');
    const allTriggers = document.querySelectorAll('#transform-submenu .submenu-trigger');
    
    if (submenu.classList.contains("show")) {
        // Close the clicked submenu
        submenu.classList.remove("show");
        trigger.classList.remove("active");
    } else {
        // Close all other submenus first
        allSubmenus.forEach(menu => {
            if (menu.id !== submenuId) {
                menu.classList.remove("show");
            }
        });
        
        // Remove active class from all other triggers
        allTriggers.forEach(trig => {
            if (trig !== trigger) {
                trig.classList.remove("active");
            }
        });
        
        // Open the clicked submenu
        submenu.classList.add("show");
        trigger.classList.add("active");
    }
};

/**
 * Dark Mode Toggle Functionality
 * 
 * toggleDarkMode()
 * 
 * Handles the switching between light and dark mode themes.
 * Toggles the 'dark-mode' class on the document body and updates
 * the toggle button icon accordingly.
 * 
 * Process:
 * 1. Toggles the 'dark-mode' class on document.body
 * 2. Updates the toggle button icon (moon/sun)
 * 3. Saves the preference to localStorage
 * 4. Updates Cytoscape graph styling if needed
 */
function toggleDarkMode() {
    const body = document.body;
    const toggleButton = document.getElementById('dark-mode-toggle');
    const icon = toggleButton.querySelector('.icon');
    
    // Toggle dark mode class
    body.classList.toggle('dark-mode');
    
    // Update icon based on current mode
    if (body.classList.contains('dark-mode')) {
        icon.textContent = '☀️'; // Sun icon for dark mode
    } else {
        icon.textContent = '🌙'; // Moon icon for light mode
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
    
    // Update Cytoscape styling if graph exists
    if (cy && cy.style) {
        // Force a style refresh to apply new theme colors
        cy.style().update();
    }
}

/**
 * Initialize Dark Mode on Page Load
 * 
 * Checks localStorage for saved dark mode preference and applies it.
 * This ensures the theme persists across page reloads.
 */
function initDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    const body = document.body;
    const toggleButton = document.getElementById('dark-mode-toggle');
    const icon = toggleButton.querySelector('.icon');
    
    if (savedDarkMode === 'true') {
        body.classList.add('dark-mode');
        icon.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        icon.textContent = '🌙';
    }
}

// Initialize dark mode when the page loads
document.addEventListener('DOMContentLoaded', initDarkMode);

/**
 * Reset View Function
 * 
 * Resets the zoom level to 100% and centers the view on the majority of nodes.
 * This provides a quick way to return to a standard view of the graph.
 * 
 * Process:
 * 1. Resets zoom level to 1.0 (100%)
 * 2. Calculates the center of all nodes
 * 3. Centers the view on that position
 * 4. Updates the zoom slider and label
 */
function resetToDefaultView() {
    // Reset zoom to 100%
    cy.zoom({ level: 1.0, renderedPosition: { x: cy.width()/2, y: cy.height()/2 } });
    
    // Get all nodes
    const nodes = cy.nodes();
    
    if (nodes.length > 0) {
        // Calculate the center of all nodes
        let centerX = 0;
        let centerY = 0;
        
        nodes.forEach(node => {
            const position = node.position();
            centerX += position.x;
            centerY += position.y;
        });
        
        centerX /= nodes.length;
        centerY /= nodes.length;
        
        // Center the view on the calculated center
        cy.center({ x: centerX, y: centerY });
    } else {
        // If no nodes, just center on the viewport
        cy.center();
    }
    
    // Update zoom slider and label
    const zoomSlider = document.getElementById("zoom-control");
    const zoomLabel = document.getElementById("zoom-label");
    
    zoomSlider.value = 1.0;
    zoomLabel.innerText = "100%";
}

/**
 * Module Exports
 * 
 * Exports key functions and objects for use by other modules.
 * Also makes some functions available globally for HTML event handlers.
 */
export { ur, cy };

/**
 * Initialize Global Functions
 * 
 * Makes all necessary functions available globally for HTML event handlers.
 * This ensures functions are available when the DOM is ready.
 */
function initializeGlobalFunctions() {
    window.ur = ur;
    window.cy = cy; // Make Cytoscape instance globally available
    window.setMode = setMode;
    window.saveGraph = saveGraph;
    window.loadGraph = loadGraph;
    window.confirmLoad = confirmLoad;
    window.loadSaveFiles = loadSaveFiles;
    window.saveToCurrentFile = saveToCurrentFile;
    window.saveAsNewFile = saveAsNewFile;
    window.newProject = newProject;
    window.toggleDropdown = toggleDropdown;
    window.handleContextAction = handleContextAction;
    window.togglePropertiesMenu = togglePropertiesMenu;
    window.openPropertiesMenu = openPropertiesMenu;
    window.closePropertiesMenu = closePropertiesMenu;
    window.toggleDarkMode = toggleDarkMode;
    window.resetToDefaultView = resetToDefaultView;
    window.handleTransformAction = handleTransformAction;
    
    // Make tutorialSystem globally available when it's initialized
    if (window.tutorialSystem) {
        console.log('Tutorial system available');
    }
    
    console.log('Global functions initialized successfully');
}

/**
 * Auto-load Last Saved Graph on Page Load
 * 
 * Automatically loads the most recently saved graph when the page loads.
 * This ensures users can continue their investigation from where they left off.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize global functions first
    initializeGlobalFunctions();
    // Small delay to ensure Cytoscape is fully initialized
    setTimeout(() => {
        autoLoadLastSave();
    }, 100);
});