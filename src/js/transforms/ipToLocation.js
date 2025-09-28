/**
 * IP to Location Geographic Analysis Integration
 * 
 * This module integrates with the IP geolocation API to determine the geographic location
 * of IP addresses. It expands the investigation graph by adding new nodes representing
 * discovered location information including country, city, region, and coordinates.
 * 
 * IP Geolocation API:
 * - Provides detailed geographic information for IP addresses
 * - Returns country, city, region, latitude, longitude, and more
 * - Helps investigators understand the physical location of network assets
 * 
 * Key Features:
 * - Automated IP geolocation via server API
 * - Dynamic graph expansion with new location nodes
 * - Visual connection between original IP node and discovered locations
 * - Status updates during lookup process
 * - Error handling for failed lookups
 */

import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * Execute IP to Location Geographic Analysis
 * 
 * runIpToLocation(node: CytoscapeNode)
 * 
 * Performs a geolocation lookup for the IP address stored in the node's label.
 * Creates new nodes for each piece of location information discovered.
 * 
 * Input:
 * - node: CytoscapeNode - The node containing the IP address to analyze
 * 
 * Process:
 * 1. Extracts IP address from node's label data
 * 2. Updates UI status to show lookup in progress
 * 3. Sends POST request to /ip-to-location endpoint with IP address
 * 4. Processes returned location information
 * 5. Creates new nodes for each discovered location detail
 * 6. Connects new nodes to the original IP node
 * 7. Updates status with lookup completion or error
 * 
 * Node Creation:
 * - Each location detail becomes a new node
 * - Node ID format: "{locationType}:{ipAddress}"
 * - Node label format: "{locationType}: {locationValue}"
 * - Positioned randomly near the original node (±50px)
 * 
 * Edge Creation:
 * - Creates directed edge from original node to each new node
 * - Edge ID format: "e-{parentId}-{newId}"
 * - Uses undo/redo system for all additions
 * 
 * Server Communication:
 * - POST request to /ip-to-location endpoint
 * - Request body: {ip: string}
 * - Response: {countryName, countryCode, cityName, regionName, latitude, longitude, zipCode, asn, asnOrganization, isProxy}
 * 
 * Error Handling:
 * - Network errors are caught and logged
 * - UI status is updated with error message
 * - Original node remains unchanged on failure
 * 
 * UI Feedback:
 * - Status updates during lookup process
 * - Completion message with number of new nodes added
 * - Error messages for failed lookups
 */
export async function runIpToLocation(node){
    const ipAddress = node.data("label");
    setStatusMessage(`IP to Location: Analyzing "${ipAddress}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        // Start progress tracking
        transformBase.startTransformProgress('ip-to-location');
        transformBase.updateTransformProgress(20, `IP to Location: Analyzing "${ipAddress}"...`);

        const response = await fetch("/ip-to-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip: ipAddress })
        });
        
        transformBase.updateTransformProgress(60, `IP to Location: Processing results for "${ipAddress}"...`);
        
        const data = await response.json();
        let added = false;
        let processedItems = 0;
        const totalItems = 6; // country, city, region, coordinates, asn, asnOrg

            /**
             * Process Each Discovered Location Detail
             * 
             * For each piece of location information found:
             * 1. Creates a unique node ID combining location type and IP address
             * 2. Checks if node already exists to avoid duplicates
             * 3. Creates new node with location information
             * 4. Creates edge connecting to original IP node
             * 5. Uses undo/redo system for all graph modifications
             */
            
            // Create country node
            if(data.countryName && data.countryName !== "Unknown"){
                const newId = transformBase.createNodeId("country", ipAddress);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `Country: ${data.countryName}`, position, parentId);
                    if(createdNode) added = true;
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(60 + (processedItems / totalItems) * 30, `IP to Location: Processing country...`);

            // Create city node
            if(data.cityName && data.cityName !== "Unknown"){
                const newId = transformBase.createNodeId("city", ipAddress);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `City: ${data.cityName}`, position, parentId);
                    if(createdNode) added = true;
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(60 + (processedItems / totalItems) * 30, `IP to Location: Processing city...`);

            // Create region/state node
            if(data.regionName && data.regionName !== "Unknown"){
                const newId = transformBase.createNodeId("region", ipAddress);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `Region: ${data.regionName}`, position, parentId);
                    if(createdNode) added = true;
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(60 + (processedItems / totalItems) * 30, `IP to Location: Processing region...`);

            // Create coordinates node
            if(data.latitude && data.longitude && data.latitude !== "Unknown" && data.longitude !== "Unknown"){
                const newId = transformBase.createNodeId("coordinates", ipAddress);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `${data.latitude}, ${data.longitude}`, position, parentId);
                    if(createdNode) added = true;
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(60 + (processedItems / totalItems) * 30, `IP to Location: Processing coordinates...`);

            // Create ASN node
            if(data.asn && data.asn !== "Unknown"){
                const newId = transformBase.createNodeId("asn", ipAddress);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `ASN: ${data.asn}`, position, parentId);
                    if(createdNode) added = true;
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(60 + (processedItems / totalItems) * 30, `IP to Location: Processing ASN...`);

            // Create ASN Organization node
            if(data.asnOrganization && data.asnOrganization !== "Unknown"){
                const newId = transformBase.createNodeId("asnOrg", ipAddress);
                if(!transformBase.nodeExists(newId)){
                    const position = transformBase.generatePositionNearNode(node);
                    const createdNode = await transformBase.createNode(newId, `ASN Org: ${data.asnOrganization}`, position, parentId);
                    if(createdNode) added = true;
                }
            }
            processedItems++;
            transformBase.updateTransformProgress(95, `IP to Location: Finalizing results...`);

            /**
             * Update UI Status
             * 
             * Provides feedback on the lookup results:
             * - Shows completion message with number of new nodes added
             * - Indicates if no new nodes were found (duplicates filtered out)
             */
            if(added){
                setStatusMessage(`IP to Location complete for "${ipAddress}"`);
                transformBase.completeTransformProgress(true, `IP to Location: Found data for "${ipAddress}"`);
            }else{
                setStatusMessage(`No new location data found for "${ipAddress}"`);
                transformBase.completeTransformProgress(true, `IP to Location: No new data found for "${ipAddress}"`);
            }
        } catch (err) {
            /**
             * Error Handling
             * 
             * Catches and handles any errors during the lookup process:
             * - Logs error details to console for debugging
             * - Updates UI status with error message
             * - Preserves original node state
             */
            console.error("IP to Location error:", err);
            setStatusMessage(`IP to Location failed for "${ipAddress}"`);
            transformBase.completeTransformProgress(false, `IP to Location: Failed for "${ipAddress}"`);
        }
}
