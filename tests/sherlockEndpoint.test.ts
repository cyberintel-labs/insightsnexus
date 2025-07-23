import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server"; // same note: export app

// Tests the sherlock endpoint
describe("Sherlock API", () => {
    it("should return found services for a known username", async () => {
        const res = await request(app)
            .post("/sherlock")
            .send({username: "topsnek"});

        // Ensures that the server's response was successful
        expect(res.status).toBe(200);

        // Ensures that the response has an array of services
        expect(res.body.services).toBeInstanceOf(Array);
    }, 120000); // 2 minutes runtime just in case sherlock takes too long (Will better improve this test later)
});