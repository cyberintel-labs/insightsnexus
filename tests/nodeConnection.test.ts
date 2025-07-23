import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server";

// Test to verify that node connections are correctly saved and loaded
describe("Graph Node Connection Test", () => {
    // A graph with two connected nodes
    const testGraph = {
        elements:{
            nodes:[
                {data: {id: "n1", label: "Node 1"}},
                {data: {id: "n2", label: "Node 2"}}
            ],
            edges:[
                {data: {id: "e-n1-n2", source: "n1", target: "n2"}}
            ]
        }
    };

    const filename = "test_connection_graph";

    // Save the graph with a coneection
    it("should save a graph with a node connection", async () => {
        const res = await request(app)
            .post("/save")
            .send({filename, graphData: testGraph});

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Saved successfully");
    });

    // Load the graph and verify that the edge exists and is correct
    it("should load the graph and verify the node connection", async () => {
        const res = await request(app).get(`/load/${filename}.json`);

        expect(res.status).toBe(200);
        const {elements} = res.body;

        const edge = elements.edges.find(e => e.data.id === "e-n1-n2");
        expect(edge).toBeDefined();
        expect(edge.data.source).toBe("n1");
        expect(edge.data.target).toBe("n2");
    });
});
