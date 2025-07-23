import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

// Should locate if sherlock is available in the system path
describe("Sherlock Presence", () => {
    it("should detect sherlock in path", () => {
        let found = false;

        try{
            // "Where" is meant for windows and "Which" is meant for unix to locate sherlock
            const result = process.platform === "win32"
                ? execSync("where sherlock").toString()
                : execSync("which sherlock").toString();

            found = result.trim().length > 0;
        }catch{
            // If the check fails found will stay false, so we don't really need to handle any errors
        }

        // Asserts that the sherlock path was found
        expect(found).toBe(true);
    });
});