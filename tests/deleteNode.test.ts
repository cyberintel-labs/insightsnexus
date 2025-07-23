import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server";

// Simulates deleting a node and verifying the update
describe("Node Deletion Test", () => {
    const filename = "test_node_delete";
    const nodeToDelete = { id: "n2", label: "Delete Me" };

    // Saves a graph with only two nodes
    it("should save a graph with two nodes", async () => {
        const graph = {
            elements:{
                nodes: [
                    {data: {id: "n1", label: "Keep Me"}},
                    {data: nodeToDelete }
                ],
                edges: []
            }
        };

        const res = await request(app)
            .post("/save")
            .send({ filename, graphData: graph });

        expect(res.status).toBe(200);
    });

    // Deletes only one node and re-saves the graph
    it("should simulate deletion of one node and save again", async () => {
        const loadRes = await request(app).get(`/load/${filename}.json`);
        const updatedGraph = loadRes.body;

        // Remove the node we want to delete
        updatedGraph.elements.nodes = updatedGraph.elements.nodes.filter(
            n => n.data.id !== nodeToDelete.id
        );

        const saveRes = await request(app)
            .post("/save")
            .send({filename, graphData: updatedGraph});

        expect(saveRes.status).toBe(200);
    });

    // Load and verify if the deleted node no longer exists
    it("should verify the node has been deleted", async () => {
        const res = await request(app).get(`/load/${filename}.json`);
        const nodes = res.body.elements.nodes;
        const deleted = nodes.find(n => n.data.id === nodeToDelete.id);

        expect(deleted).toBeUndefined();
        expect(nodes.length).toBe(1);
        expect(nodes[0].data.label).toBe("Keep Me");
    });
});
