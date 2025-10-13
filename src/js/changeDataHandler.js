/**
 * Graph Data Change Handler with Undo/Redo Support
 * 
 * This module provides the undo/redo functionality for the OSINT investigation graph.
 * It allows users to modify node data (like labels) and provides the ability to
 * undo and redo these changes, maintaining data integrity throughout the investigation.
 * 
 * Key Features:
 * - Undo/redo system for all graph modifications
 * - Data change tracking with before/after states
 * - Integration with Cytoscape's undo/redo extension
 * - Support for custom data modification actions
 */

import { cy } from "./cytoscapeConfig.js";

/**
 * Undo/Redo Manager
 * 
 * Initializes the Cytoscape undo/redo extension which provides:
 * - Undo functionality for all graph operations
 * - Redo functionality for undone operations
 * - Automatic tracking of node/edge additions and deletions
 * - Custom action support for data modifications
 */
const ur = cy.undoRedo();

/**
 * Custom Data Change Action
 * 
 * ur.action("changeData", doFunction, undoFunction)
 * 
 * Defines a custom action for changing node data (like labels) with undo/redo support.
 * This allows users to edit node information and revert changes if needed.
 * 
 * Parameters:
 * - "changeData": Action name for the undo/redo system
 * - doFunction: Function that applies the change
 * - undoFunction: Function that reverts the change
 * 
 * Input for both functions:
 * - arg: object containing:
 *   - id: string - The ID of the element to modify
 *   - name: string - The data property name to change
 *   - oldValue: any - The original value (for undo)
 *   - newValue: any - The new value (for do)
 * 
 * Process:
 * 1. doFunction: Finds the element and sets the new value
 * 2. undoFunction: Finds the element and restores the old value
 * 3. Both functions log their actions for debugging
 * 4. Element existence is checked before modification
 */
ur.action("changeData",
    // Do function - applies the data change
    function(arg){
        console.log("Apply edit action");
        const ele = cy.getElementById(arg.id);
        if(ele) ele.data(arg.name, arg.newValue);
    },
    // Undo function - reverts the data change
    function(arg){
        console.log("Apply undo action");
        const ele = cy.getElementById(arg.id);
        if(ele) ele.data(arg.name, arg.oldValue);
    }
);


/**
 * Module Export
 * 
 * Exports the undo/redo manager for use by other modules.
 * This allows the main application to access undo/redo functionality.
 */
export { ur };