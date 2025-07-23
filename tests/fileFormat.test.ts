import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

// Test whether the test graph file is a valid json file
describe("File Format", () => {
    const filePath = path.join(__dirname, "../saves/graph/test-save.json");

    it("should be a valid JSON file", () => {
        const content = fs.readFileSync(filePath, "utf8");

        // Parsing the file should not throw an error if it's a valid json file
        expect(() => JSON.parse(content)).not.toThrow();
    });
});