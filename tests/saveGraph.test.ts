import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server"; // adjust if you export app separately

// Should test the saving functionality
describe("Graph Saving", () => {
    it("should save a graph with valid data", async () => {
        const res = await request(app)
            .post("/save")
            .send({
                filename: "test-save",
                graphData: { elements: [] }
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Saved successfully");
    });
});