/**
 * FFuF Subdomain Discovery Integration
 * 
 * This module integrates with ffuf to fetch subdomains for a given domain node.
 * It creates new nodes for each discovered subdomain and saves the results to a text file.
 */

import { uploadFiles } from "../fileUploadHandler.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";
import { TransformBase } from "../utils/transformBase.js";

/**
 * runDomainToSub(node: CytoscapeNode)
 * 
 * Fetches subdomains for the domain stored in the node's label.
 * Creates new nodes for each discovered subdomain and uploads a summary file.
 */
export async function runDomainToSub(node) {
    const domain = node.data("label");
    setStatusMessage(`FFuF: Fetching subdomains for "${domain}"...`);

    const transformBase = new TransformBase();
    const parentId = node.id();

    try {
        // Start progress tracking
        transformBase.startTransformProgress('domain-to-subdomain');
        transformBase.updateTransformProgress(10, `FFuF: Fetching subdomains for "${domain}"...`);

        const response = await fetch("/domain-to-sub", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain })
        });
        
        transformBase.updateTransformProgress(60, `FFuF: Processing results for "${domain}"...`);
        
        const data = await response.json();
        
        if(!data.subdomains || !Array.isArray(data.subdomains)){
            setStatusMessage(`FFuF returned no subdomains for "${domain}"`);
            transformBase.completeTransformProgress(true, `FFuF: No subdomains found for "${domain}"`);
            return;
        }

        transformBase.updateTransformProgress(70, `FFuF: Creating nodes for ${data.subdomains.length} subdomains...`);

        let added = false;
        const totalSubdomains = data.subdomains.length;

        // Create nodes for each discovered subdomain
        for (let i = 0; i < data.subdomains.length; i++) {
            const subdomain = data.subdomains[i];
            const newId = transformBase.createNodeId("subdomain", subdomain);
            
            if(!transformBase.nodeExists(newId)){
                const position = transformBase.generatePositionNearNode(node);
                const createdNode = await transformBase.createNode(newId, subdomain, position, parentId);
                if(createdNode) added = true;
            }
            
            // Update progress based on subdomains processed
            const subdomainProgress = 70 + (i / totalSubdomains) * 20;
            transformBase.updateTransformProgress(subdomainProgress, `FFuF: Processing ${i + 1}/${totalSubdomains} subdomains...`);
        }

        transformBase.updateTransformProgress(95, `FFuF: Creating summary file...`);

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

        // Upload the file to the node
        uploadFiles(node, [textFile]);
        
        if (added) {
            setStatusMessage(`FFuF complete for "${domain}" - ${data.subdomains.length} subdomains found and nodes created`);
        } else {
            setStatusMessage(`FFuF complete for "${domain}" - ${data.subdomains.length} subdomains found (all were duplicates)`);
        }
        
        transformBase.completeTransformProgress(true, `FFuF: Found ${data.subdomains.length} subdomains for "${domain}"`);
        
    } catch (err) {
        console.error("FFuF error:", err);
        setStatusMessage(`FFuF failed for "${domain}"`);
        transformBase.completeTransformProgress(false, `FFuF: Failed for "${domain}"`);
    }
}