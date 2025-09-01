/**
 * FFuF Subdomain Discovery Integration
 * 
 * This module integrates with ffuf to fetch subdomains for a given domain node.
 * It expands the investigation graph by adding new nodes representing discovered subdomains.
 */

import { ur, cy } from "../main.js";
import { resolveNodeOverlap } from "../nodePositioning.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * runDomainToSub(node: CytoscapeNode)
 * 
 * Fetches subdomains for the domain stored in the node's label.
 * Adds each subdomain as a new node and connects it to the original node.
 */
export function runDomainToSub(node) {
    const domain = node.data("label");
    setStatusMessage(`FFuF: Fetching subdomains for "${domain}"...`);

    fetch("/domain-to-sub", {
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
            if(!data.subdomains || !Array.isArray(data.subdomains)){
                setStatusMessage(`FFuF returned no subdomains for "${domain}"`);
                return;
            }

            const parentId = node.id();
            let added = false;

            data.subdomains.forEach(sub => {
                const newId = sub;

                if(!cy.getElementById(newId).length){
                    const proposedPosition = {
                        x: node.position("x") + Math.random() * 100 - 50,
                        y: node.position("y") + Math.random() * 100 - 50
                    };
                    const safePosition = resolveNodeOverlap(null, proposedPosition);

                    const newNode = {
                        group: "nodes",
                        data: {
                            id: newId,
                            label: sub
                        },
                        position: safePosition
                    };

                    const newEdge = {
                        group: "edges",
                        data: {
                            id: `e-${parentId}-${newId}`,
                            source: parentId,
                            target: newId
                        }
                    };

                    ur.do("add", newNode);
                    ur.do("add", newEdge);
                    added = true;
                }
            });

            if(added){
                setStatusMessage(`FFuF complete for "${domain}"`);
            }else{
                setStatusMessage(`No new subdomains found for "${domain}"`);
            }
        })
        .catch(err => {
            console.error("FFuF error:", err);
            setStatusMessage(`FFuF failed for "${domain}"`);
        });
}