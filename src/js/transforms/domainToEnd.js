/**
 * Feroxbuster Domain endpoint Discovery Integration
 * 
 * This module integrates with Feroxbuster to fetch endpoints for a given domain node.
 * It expands the investigation graph by adding new nodes representing discovered endpoints.
 */

import { ur, cy } from "../main.js";
import { resolveNodeOverlap } from "../nodePositioning.js";
import { setStatusMessage } from "../setStatusMessageHandler.js";

/**
 * runDomainToEnd(node: CytoscapeNode)
 * 
 * Fetches endpoints for the domain stored in the node's label.
 * Adds each endpoint as a new node and connects it to the original node.
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

            const parentId = node.id();
            let added = false;

            data.endpoints.forEach(endpoint => {
                const newId = endpoint;
                if(!cy.getElementById(newId).length){
                    const proposedPosition = {
                        x: node.position("x") + Math.random() * 100 - 50,
                        y: node.position("y") + Math.random() * 100 - 50
                    };
                    const safePosition = resolveNodeOverlap(null, proposedPosition);

                    const newNode = {
                        group: "nodes",
                        data: { id: newId, label: endpoint },
                        position: safePosition
                    };

                    const newEdge = {
                        group: "edges",
                        data: { id: `e-${parentId}-${newId}`, source: parentId, target: newId }
                    };

                    ur.do("add", newNode);
                    ur.do("add", newEdge);
                    added = true;
                }
            });

            setStatusMessage(`Feroxbuster complete for "${domain}"`);
        })
        .catch(err => {
            console.error("Feroxbuster error:", err);
            setStatusMessage(`Feroxbuster failed for "${domain}"`);
        });
}