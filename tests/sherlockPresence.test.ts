import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

// Should locate if  sherlock exist
describe("Sherlock Presence", () => {
    it("should detect sherlock in path", () => {
        let found = false;

        try {
            const result = process.platform === "win32"
                ? execSync("where sherlock").toString()
                : execSync("which sherlock").toString();

            found = result.trim().length > 0;
        } catch { }

        expect(found).toBe(true);
    });
});