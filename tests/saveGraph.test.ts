import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server"; // adjust if you export app separately

// Tests the save endpoint to verifyf if saving works
describe("Graph Saving", () => {
    it("should save a graph with valid data", async () => {
        const res = await request(app)
            .post("/save")
            .send({
                filename: "test-save", // This is a test file...
                graphData: {elements: []} // .. it's just an empty file
            });

        // Ensures that the server's response was successful
        expect(res.status).toBe(200);

        // Ensures that the success message is returned
        expect(res.body.message).toBe("Saved successfully");
    });
});