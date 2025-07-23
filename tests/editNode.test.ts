import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server";

// Simulates editing (by renaming) a node and verifying the update
describe("Node Editing Test", () => {
    const filename = "test_node_edit";
    const originalNode = {id: "n1", label: "Original Name"};
    const editedLabel = "Edited Name";

    // Saves a graph with the original node (unedited)
    it("should save a graph with the original node", async () => {
        const graph = {
            elements:{
                nodes: [{data: originalNode}],
                edges: []
            }
        };

        const res = await request(app)
            .post("/save")
            .send({filename, graphData: graph});

        expect(res.status).toBe(200);
    });

    // Renames the node and re-saves the graph
    it("should simulate editing the node and save it again", async () => {
        // Load, modify, and save
        const loadRes = await request(app).get(`/load/${filename}.json`);
        const updatedGraph = loadRes.body;

        // Change node
        updatedGraph.elements.nodes[0].data.label = editedLabel;

        const saveRes = await request(app)
            .post("/save")
            .send({filename, graphData: updatedGraph});

        expect(saveRes.status).toBe(200);
    });

    // Load and verify if the node was updated
    it("should verify the node label has been updated", async () => {
        const res = await request(app).get(`/load/${filename}.json`);
        const label = res.body.elements.nodes[0].data.label;
        expect(label).toBe(editedLabel);
    });
});
