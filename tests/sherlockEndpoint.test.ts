import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server"; // same note: export app

// Should wait for a return from sherlock
describe("Sherlock API", () => {
    it("should return found services for a known username", async () => {
        const res = await request(app)
            .post("/sherlock")
            .send({ username: "topsnek" });

        expect(res.status).toBe(200);
        expect(res.body.services).toBeInstanceOf(Array);
    }, 120000);
});