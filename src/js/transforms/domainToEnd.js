/**
 * Feroxbuster Domain endpoint Discovery Integration
 * 
 * This module integrates with Feroxbuster to fetch endpoints for a given domain node.
 * It saves the discovered endpoints to a text file and uploads it to the original node.
 */

import { uploadFiles } from "../fileUploadHandler.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * runDomainToEnd(node: CytoscapeNode)
 * 
 * Fetches endpoints for the domain stored in the node's label.
 * Creates a text file with the endpoints and uploads it to the original node.
 */
export function runDomainToEnd(node) {
    const domain = node.data("label");
    setStatusMessage(`Feroxbuster: Fetching endpoints for "${domain}"...`);

    fetch("/domain-to-end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
    })
        .then(async res => {
            const text = await res.text();
            try{
                return JSON.parse(text);
            }catch{
                throw new Error(`Invalid JSON response from server:\n${text}`);
            }
        })
        .then(data => {
            if(!data.endpoints || !Array.isArray(data.endpoints)) {
                setStatusMessage(`Feroxbuster returned no endpoints for "${domain}"`);
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

            // Upload the file to the node
            uploadFiles(node, [textFile]);
            setStatusMessage(`Feroxbuster complete for "${domain}" - ${data.endpoints.length} endpoints saved`);
        })
        .catch(err => {
            console.error("Feroxbuster error:", err);
            setStatusMessage(`Feroxbuster failed for "${domain}"`);
        });
}