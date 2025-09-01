/**
 * Graph Data Management Module
 * 
 * This module handles the persistence of investigation graph data to and from the server.
 * It provides save and load functionality to maintain investigation progress across sessions.
 * 
 * Key Features:
 * - Save current graph state to server
 * - Load saved graphs from server
 * - Populate dropdown with available saved files
 * - Error handling for network operations
 * - User feedback for save/load operations
 */

import { cy } from './cytoscapeConfig.js';
import { setStatusMessage } from './setStatusMessageHandler.js';

/**
 * Save Graph Function
 * 
 * saveGraph()
 * 
 * Saves the current graph state to the server for later retrieval.
 * Prompts the user for a filename and sends the complete graph data.
 * 
 * Process:
 * 1. Prompts user for filename using browser's prompt dialog
 * 2. Exports current graph data using Cytoscape's json() method
 * 3. Sends data to server via POST request to /save endpoint
 * 4. Updates status display with success/failure message
 * 
 * Graph Data Structure:
 * - nodes: Array of node objects with positions, data, and styling
 * - edges: Array of edge objects with source, target, and styling
 * - layout: Current graph layout and zoom information
 * 
 * Server Response:
 * - Success: Returns {message: "Saved successfully"}
 * - Error: Returns {error: "Error description"}
 */
export function saveGraph(){
    const filename = prompt("Enter a filename:");
    if(!filename) return;
    const graphData = cy.json();
    fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, graphData })
    }).then(res => {
        setStatusMessage(
            res.ok ? `Saved to "${filename}.json"` : `Failed to save "${filename}.json"`
        );
    });
}

/**
 * Load Graph Files List
 * 
 * loadGraph()
 * 
 * Retrieves the list of available saved graph files from the server
 * and populates the load dropdown menu with the file names.
 * 
 * Process:
 * 1. Sends GET request to /saves endpoint
 * 2. Receives array of available .json filenames
 * 3. Clears existing dropdown options
 * 4. Populates dropdown with retrieved filenames
 * 
 * Server Response:
 * - Success: Returns string[] of available filenames
 * - Error: Returns empty array []
 * 
 * UI Integration:
 * - Updates the file-picker dropdown element
 * - Called automatically when load dropdown is opened
 */
export function loadGraph(){
    fetch("/saves")
        .then(res => res.json())
        .then(files => {
            const picker = document.getElementById("file-picker");
            picker.innerHTML = "";
            files.forEach(file => {
                const opt = document.createElement("option");
                opt.value = file;
                opt.text = file;
                picker.appendChild(opt);
            });
        });
}

/**
 * Load Selected Graph
 * 
 * confirmLoad()
 * 
 * Loads the selected graph file from the dropdown and applies it to the current view.
 * Replaces the current graph with the loaded data.
 * 
 * Process:
 * 1. Gets the selected filename from the file-picker dropdown
 * 2. Sends GET request to /load/{filename} endpoint
 * 3. Receives complete graph data in Cytoscape format
 * 4. Applies the data to the current graph using cy.json()
 * 5. Updates status display with load confirmation
 * 
 * Input:
 * - Selected filename from dropdown (must be a valid saved file)
 * 
 * Graph Data Application:
 * - Replaces all current nodes and edges
 * - Restores node positions and styling
 * - Maintains graph layout and zoom level
 * - Preserves all investigation relationships
 * 
 * Server Response:
 * - Success: Returns complete graph data object
 * - Error: Returns {error: "Error description"}
 * 
 * UI Feedback:
 * - Updates status display with loaded filename
 * - Graph immediately reflects loaded data
 */
export function confirmLoad(){
    const file = document.getElementById("file-picker").value;
    if(!file) return;
    fetch(`/load/${file}`)
        .then(res => res.json())
        .then(data => {
            cy.json(data);
            setStatusMessage(`Loaded: ${file}`);
        });
}