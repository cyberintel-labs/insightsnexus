/**
 * FFuF Subdomain Discovery Integration
 * 
 * This module integrates with ffuf to fetch subdomains for a given domain node.
 * It saves the discovered subdomains to a text file and uploads it to the original node.
 */

import { uploadFiles } from "../fileUploadHandler.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * runDomainToSub(node: CytoscapeNode)
 * 
 * Fetches subdomains for the domain stored in the node's label.
 * Creates a text file with the subdomains and uploads it to the original node.
 */
export function runDomainToSub(node) {
    const domain = node.data("label");
    setStatusMessage(`FFuF: Fetching subdomains for "${domain}"...`);

    const transformBase = new TransformBase();

    // Start progress tracking
    transformBase.startTransformProgress('domain-to-subdomain');
    transformBase.updateTransformProgress(10, `FFuF: Fetching subdomains for "${domain}"...`);

    fetch("/domain-to-sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
    })
        .then(async res => {
            transformBase.updateTransformProgress(60, `FFuF: Processing results for "${domain}"...`);
            
            const text = await res.text();
            try{
                return JSON.parse(text);
            }catch{
                throw new Error(`Invalid JSON response from server:\n${text}`);
            }
        })
        .then(data => {
            transformBase.updateTransformProgress(80, `FFuF: Creating file for "${domain}"...`);
            
            if(!data.subdomains || !Array.isArray(data.subdomains)){
                setStatusMessage(`FFuF returned no subdomains for "${domain}"`);
                transformBase.completeTransformProgress(true, `FFuF: No subdomains found for "${domain}"`);
                return;
            }

            // Create text file content with subdomains
            const subdomainsContent = `FFuF Results for ${domain}\n` +
                `Discovered Subdomains:\n` +
                `====================\n\n` +
                data.subdomains.map(subdomain => `- ${subdomain}`).join('\n') +
                `\n\nTotal subdomains found: ${data.subdomains.length}`;

            // Create File object from the content
            const textFile = new File([subdomainsContent], `ffuf_subdomains_${domain.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.txt`, {
                type: 'text/plain',
                lastModified: Date.now()
            });

            transformBase.updateTransformProgress(95, `FFuF: Uploading file...`);

            // Upload the file to the node
            uploadFiles(node, [textFile]);
            setStatusMessage(`FFuF complete for "${domain}" - ${data.subdomains.length} subdomains saved`);
            transformBase.completeTransformProgress(true, `FFuF: Found ${data.subdomains.length} subdomains for "${domain}"`);
        })
        .catch(err => {
            console.error("FFuF error:", err);
            setStatusMessage(`FFuF failed for "${domain}"`);
            transformBase.completeTransformProgress(false, `FFuF: Failed for "${domain}"`);
        });
}