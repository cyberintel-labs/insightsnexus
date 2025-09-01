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
 * 5. Stores the filename in localStorage for auto-load functionality
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
        if(res.ok) {
            // Store the filename in localStorage for auto-load functionality
            localStorage.setItem('lastSavedFile', `${filename}.json`);
            setStatusMessage(`Saved to "${filename}.json"`);
        } else {
            setStatusMessage(`Failed to save "${filename}.json"`);
        }
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
 * 5. Selects the last saved file by default if available
 * 
 * Server Response:
 * - Success: Returns string[] of available filenames
 * - Error: Returns empty array []
 * 
 * UI Integration:
 * - Updates the file-picker dropdown element
 * - Called automatically when load dropdown is opened
 * - Pre-selects the most recently saved file
 */
export function loadGraph(){
    fetch("/saves")
        .then(res => res.json())
        .then(files => {
            const picker = document.getElementById("file-picker");
            picker.innerHTML = "";
            const lastSavedFile = localStorage.getItem('lastSavedFile');
            
            files.forEach(file => {
                const opt = document.createElement("option");
                opt.value = file;
                opt.text = file;
                // Select the last saved file by default
                if(file === lastSavedFile) {
                    opt.selected = true;
                }
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
 * 6. Stores the loaded filename in localStorage for future auto-load
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
            // Store the loaded filename in localStorage for future auto-load
            localStorage.setItem('lastSavedFile', file);
            setStatusMessage(`Loaded: ${file}`);
        });
}

/**
 * Auto Load Last Saved Graph
 * 
 * autoLoadLastSave()
 * 
 * Automatically loads the most recently saved graph file when the page loads.
 * Uses localStorage to remember the last saved file, or fetches the most recent
 * from the server if no localStorage entry exists.
 * 
 * Process:
 * 1. Checks localStorage for last saved filename
 * 2. If found, attempts to load that file
 * 3. If not found or load fails, fetches most recent save from server
 * 4. Loads the most recent save file automatically
 * 5. Updates status display with auto-load confirmation
 * 
 * Auto-load Behavior:
 * - Called automatically when page loads
 * - Silently loads the last saved graph state
 * - Provides user feedback via status message
 * - Gracefully handles cases where no saves exist
 */
export function autoLoadLastSave(){
    // First try to load from localStorage
    const lastSavedFile = localStorage.getItem('lastSavedFile');
    
    if(lastSavedFile) {
        // Try to load the file from localStorage
        fetch(`/load/${lastSavedFile}`)
            .then(res => {
                if(res.ok) {
                    return res.json();
                } else {
                    // If localStorage file doesn't exist, get most recent from server
                    throw new Error('File not found');
                }
            })
            .then(data => {
                cy.json(data);
                setStatusMessage(`Auto-loaded: ${lastSavedFile}`);
            })
            .catch(() => {
                // Fallback to server's most recent save
                loadMostRecentFromServer();
            });
    } else {
        // No localStorage entry, get most recent from server
        loadMostRecentFromServer();
    }
}

/**
 * Load Most Recent Save from Server
 * 
 * loadMostRecentFromServer()
 * 
 * Helper function to fetch and load the most recently saved graph from the server.
 * Used as a fallback when localStorage doesn't have a valid entry.
 * 
 * Process:
 * 1. Fetches the most recent save filename from /last-save endpoint
 * 2. Loads the graph data for that file
 * 3. Applies the data to the current graph
 * 4. Updates status display with load confirmation
 */
function loadMostRecentFromServer(){
    fetch("/last-save")
        .then(res => {
            if(res.ok) {
                return res.json();
            } else {
                throw new Error('No saved files found');
            }
        })
        .then(data => {
            const filename = data.filename;
            return fetch(`/load/${filename}`).then(res => res.json()).then(graphData => ({ filename, graphData }));
        })
        .then(data => {
            cy.json(data.graphData);
            // Store the loaded filename in localStorage for future auto-load
            localStorage.setItem('lastSavedFile', data.filename);
            setStatusMessage(`Auto-loaded: ${data.filename}`);
        })
        .catch(error => {
            // No saved files exist, start with empty graph
            console.log('No saved files found, starting with empty graph');
            setStatusMessage('Starting with empty graph');
        });
}