/**
 * Feroxbuster Domain endpoint Discovery Integration
 * 
 * This module integrates with Feroxbuster to fetch endpoints for a given domain node.
 * It saves the discovered endpoints to a text file and uploads it to the original node.
 */

import { uploadFiles } from "../fileUploadHandler.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * runDomainToEnd(node: CytoscapeNode)
 * 
 * Fetches endpoints for the domain stored in the node's label.
 * Creates a text file with the endpoints and uploads it to the original node.
 */
export function runDomainToEnd(node) {
    const domain = node.data("label");
    setStatusMessage(`Feroxbuster: Fetching endpoints for "${domain}"...`);

    const transformBase = new TransformBase();

    // Start progress tracking
    transformBase.startTransformProgress('domain-to-endpoint');
    transformBase.updateTransformProgress(10, `Feroxbuster: Fetching endpoints for "${domain}"...`);

    fetch("/domain-to-end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
    })
        .then(async res => {
            transformBase.updateTransformProgress(60, `Feroxbuster: Processing results for "${domain}"...`);
            
            const text = await res.text();
            try{
                return JSON.parse(text);
            }catch{
                throw new Error(`Invalid JSON response from server:\n${text}`);
            }
        })
        .then(data => {
            transformBase.updateTransformProgress(80, `Feroxbuster: Creating file for "${domain}"...`);
            
            if(!data.endpoints || !Array.isArray(data.endpoints)) {
                setStatusMessage(`Feroxbuster returned no endpoints for "${domain}"`);
                transformBase.completeTransformProgress(true, `Feroxbuster: No endpoints found for "${domain}"`);
                return;
            }

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
            setStatusMessage(`Feroxbuster complete for "${domain}" - ${data.endpoints.length} endpoints saved`);
            transformBase.completeTransformProgress(true, `Feroxbuster: Found ${data.endpoints.length} endpoints for "${domain}"`);
        })
        .catch(err => {
            console.error("Feroxbuster error:", err);
            setStatusMessage(`Feroxbuster failed for "${domain}"`);
            transformBase.completeTransformProgress(false, `Feroxbuster: Failed for "${domain}"`);
        });
}