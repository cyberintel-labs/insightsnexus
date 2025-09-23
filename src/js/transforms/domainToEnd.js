/**
 * Feroxbuster Domain endpoint Discovery Integration
 * 
 * This module integrates with Feroxbuster to fetch endpoints for a given domain node.
 * It creates new nodes for each discovered endpoint and saves the results to a text file.
 */

import { uploadFiles } from "../fileUploadHandler.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * runDomainToEnd(node: CytoscapeNode)
 * 
 * Fetches endpoints for the domain stored in the node's label.
 * Creates new nodes for each discovered endpoint and saves results to a text file.
 */
export async function runDomainToEnd(node) {
    const domain = node.data("label");
    setStatusMessage(`Feroxbuster: Fetching endpoints for "${domain}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        // Start progress tracking
        transformBase.startTransformProgress('domain-to-endpoint');
        transformBase.updateTransformProgress(10, `Feroxbuster: Fetching endpoints for "${domain}"...`);

        const response = await fetch("/domain-to-end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain })
        });
        
        transformBase.updateTransformProgress(60, `Feroxbuster: Processing results for "${domain}"...`);
        
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`Invalid JSON response from server:\n${text}`);
        }
        
        if(!data.endpoints || !Array.isArray(data.endpoints)) {
            setStatusMessage(`Feroxbuster returned no endpoints for "${domain}"`);
            transformBase.completeTransformProgress(true, `Feroxbuster: No endpoints found for "${domain}"`);
            return;
        }

        let added = false;
        let processedEndpoints = 0;
        const totalEndpoints = data.endpoints.length;

        /**
         * Process Each Discovered Endpoint
         * 
         * For each endpoint found by Feroxbuster:
         * 1. Creates a unique node ID using TransformBase.createNodeId()
         * 2. Checks if node already exists using TransformBase.nodeExists()
         * 3. Creates new node with endpoint information using TransformBase.createNode()
         * 4. Automatically creates edge connecting to original domain node
         * 5. Uses undo/redo system for all graph modifications via TransformBase
         */
        
        for (const endpoint of data.endpoints) {
            const newId = transformBase.createNodeId("endpoint", endpoint);
            if(!transformBase.nodeExists(newId)){
                const position = transformBase.generatePositionNearNode(node);
                const createdNode = await transformBase.createNode(newId, `Endpoint: ${endpoint}`, position, parentId);
                if(createdNode) added = true;
            }
            processedEndpoints++;
            transformBase.updateTransformProgress(60 + (processedEndpoints / totalEndpoints) * 20, `Feroxbuster: Creating nodes for endpoints...`);
        }

        transformBase.updateTransformProgress(85, `Feroxbuster: Creating file for "${domain}"...`);

        // Create text file content with endpoints
        const endpointsContent = `Feroxbuster Results for ${domain}\n` +
            `Discovered Endpoints:\n` +
            `==================\n\n` +
            data.endpoints.map(endpoint => `- ${endpoint}`).join('\n') +
            `\n\nTotal endpoints found: ${data.endpoints.length}`;

        // Create File object from the content
        const textFile = new File([endpointsContent], `feroxbuster_endpoints_${domain}_${Date.now()}.txt`, {
            type: 'text/plain',
            lastModified: Date.now()
        });

        transformBase.updateTransformProgress(95, `Feroxbuster: Uploading file...`);

        // Upload the file to the node
        uploadFiles(node, [textFile]);
        
        const message = added 
            ? `Feroxbuster complete for "${domain}" - ${data.endpoints.length} endpoints found, ${processedEndpoints} nodes created`
            : `Feroxbuster complete for "${domain}" - ${data.endpoints.length} endpoints found (all already existed)`;
            
        setStatusMessage(message);
        transformBase.completeTransformProgress(true, `Feroxbuster: Found ${data.endpoints.length} endpoints for "${domain}"`);
        
    } catch (err) {
        console.error("Feroxbuster error:", err);
        setStatusMessage(`Feroxbuster failed for "${domain}"`);
        transformBase.completeTransformProgress(false, `Feroxbuster: Failed for "${domain}"`);
    }
}