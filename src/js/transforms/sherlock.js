import { ur, cy } from "../main.js";

export function runSherlock(node) {
    const username = node.data("label");
    document.getElementById("sherlock-status").innerText = `Sherlock: Searching "${username}"...`;

    fetch("/sherlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    })
        .then(res => res.json())
        .then(data => {
            const parentId = node.id();
            let added = false;

            data.services.forEach(service => {
                const newId = `${service}:${username}`;
                if (!cy.getElementById(newId).length) {
                    const newNode = {
                        group: "nodes",
                        data: {
                            id: newId,
                            label: `${service}: ${username}`
                        },
                        position: {
                            x: node.position("x") + Math.random() * 100 - 50,
                            y: node.position("y") + Math.random() * 100 - 50
                        }
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

            document.getElementById("sherlock-status").innerText = added
                ? `Sherlock complete for "${username}"`
                : `Sherlock complete (no new nodes)`;
        })
        .catch(err => {
            console.error("Sherlock error:", err);
            document.getElementById("sherlock-status").innerText = `Sherlock failed for "${username}"`;
        });
}