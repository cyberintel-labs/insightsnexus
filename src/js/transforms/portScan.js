/**
 * Port Scanning Integration
 * 
 * This module integrates with the nmap tool to scan for open ports on target systems.
 * It expands the investigation graph by adding new nodes representing discovered open ports.
 * 
 * Nmap Tool:
 * - Scans the top 1,000 ports on target systems
 * - Identifies open ports and associated services
 * - Helps investigators discover network vulnerabilities and services
 * 
 * Key Features:
 * - Automated port scanning via server API
 * - Dynamic graph expansion with new nodes
 * - Visual connection between original node and found ports
 * - Status updates during scan process
 * - Error handling for failed scans
 */

import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * Execute Port Scan
 * 
 * runPortScan(node: CytoscapeNode)
 * 
 * Performs a port scan for the target stored in the node's label.
 * Creates new nodes for each open port discovered during the scan.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the target to scan
 * 
 * Process:
 * 1. Extracts target from node's label data
 * 2. Updates UI status to show scan in progress
 * 3. Sends POST request to /port-scan endpoint with target
 * 4. Processes returned list of open ports
 * 5. Creates new nodes for each open port
 * 6. Connects new nodes to the original target node
 * 7. Updates status with scan completion or error
 * 
 * Node Creation:
 * - Each open port becomes a new node
 * - Node ID format: "{target}:{port}"
 * - Node label format: "Port {port} ({service}) on {target}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original node to each new node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
 * 
 * Server Communication:
 * - POST request to /port-scan endpoint
 * - Request body: {target: string}
 * - Response: {ports: Array<{port: number, service: string}>} - Array of port objects
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during scan process
 * - Completion message with number of new nodes added
 * - Error messages for failed scans
 * - Status message when no open ports are found
 */
export async function runPortScan(node){
    const target = node.data("label");
    setStatusMessage(`Port Scan: Scanning "${target}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        // Start progress tracking
        transformBase.startTransformProgress('port-scan');
        transformBase.updateTransformProgress(10, `Port Scan: Scanning "${target}"...`);

        const response = await fetch("/port-scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target })
        });
        
        transformBase.updateTransformProgress(60, `Port Scan: Processing results for "${target}"...`);
        
        const data = await response.json();
        let added = false;

        /**
         * Process Each Found Open Port
         * 
         * For each open port discovered during the scan:
         * 1. Creates a unique node ID combining target and port
         * 2. Checks if node already exists to avoid duplicates
         * 3. Creates new node with port and service information
         * 4. Creates edge connecting to original target node
         * 5. Uses undo/redo system for all graph modifications
         */
        const totalPorts = data.ports.length;
        for (let i = 0; i < data.ports.length; i++) {
            const portInfo = data.ports[i];
            const newId = transformBase.createNodeId("port", `${target}:${portInfo.port}`);
            if(!transformBase.nodeExists(newId)){
                const position = transformBase.generatePositionNearNode(node);
                const createdNode = await transformBase.createNode(newId, `Port ${portInfo.port} (${portInfo.service}) on ${target}`, position, parentId);
                if(createdNode) added = true;
            }
            
            // Update progress based on ports processed
            const portProgress = 60 + (i / totalPorts) * 30;
            transformBase.updateTransformProgress(portProgress, `Port Scan: Processing ${i + 1}/${totalPorts} ports...`);
        }

        transformBase.updateTransformProgress(95, `Port Scan: Finalizing results...`);

        /**
         * Update UI Status
         * 
         * Provides feedback on the scan results:
         * - Shows completion message with number of new nodes added
         * - Indicates if no new nodes were found (duplicates filtered out)
         * - Shows specific message when no open ports are discovered
         */
        if(added){
            setStatusMessage(`Port scan complete for "${target}" - ${data.ports.length} open ports found`);
            transformBase.completeTransformProgress(true, `Port Scan: Found ${data.ports.length} open ports on "${target}"`);
        }else if(data.ports.length === 0){
            setStatusMessage(`Port scan complete for "${target}" - No open ports found`);
            transformBase.completeTransformProgress(true, `Port Scan: No open ports found on "${target}"`);
        }else{
            setStatusMessage(`No new additions found for "${target}"`);
            transformBase.completeTransformProgress(true, `Port Scan: No new ports found for "${target}"`);
        }
    } catch (err) {
        /**
         * Error Handling
         * 
         * Catches and handles any errors during the scan process:
         * - Logs error details to console for debugging
         * - Updates UI status with error message
         * - Preserves original node state
         */
        console.error("Port scan error:", err);
        setStatusMessage(`Port scan failed for "${target}"`);
        transformBase.completeTransformProgress(false, `Port Scan: Failed for "${target}"`);
    }
}
