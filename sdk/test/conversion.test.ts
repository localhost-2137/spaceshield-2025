import {describe, it, expect} from "vitest";
import {add} from "../src";

describe("add function", () => {
    it("should return the sum of two numbers", () => {
        const result = add(2, 3);
        expect(result).toBe(5);
    });
});
