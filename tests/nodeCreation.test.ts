import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server";

// Test to verify basic node creation 
describe("Node Creation Test", () => {
    const filename = "test_node_creation";
    const testGraph = {
        elements:{
            nodes:[
                {data: {id: "n1", label: "Test Node"}}
            ],
            edges: []
        }
    };

    // Save the graph
    it("should save a graph with a single node", async () => {
        const res = await request(app)
            .post("/save")
            .send({filename, graphData: testGraph});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Saved successfully");
    });

    // Loads and verifies if the node is correctly stored
    it("should load the saved graph and verify the node exists", async () => {
        const res = await request(app).get(`/load/${filename}.json`);

        expect(res.status).toBe(200);
        const {elements} = res.body;

        const node = elements.nodes.find(n => n.data.id === "n1");
        expect(node).toBeDefined();
        expect(node.data.label).toBe("Test Node");
    });
});
