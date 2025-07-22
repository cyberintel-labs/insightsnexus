import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";

// Should locate and check for the test file's format
describe("File Format", () => {
    const filePath = path.join(__dirname, "../saves/graph/test-save.json");

    it("should be a valid JSON file", () => {
        const content = fs.readFileSync(filePath, "utf8");
        expect(() => JSON.parse(content)).not.toThrow();
    });
});