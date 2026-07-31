import { describe, expect, test } from "bun:test";
import {
    convertFormula,
    stripMathDelimiters,
} from "../src/lib/formula-converter";

describe("LaTeX 与 Typst 公式转换", () => {
    test("移除常见的公式定界符", () => {
        expect(stripMathDelimiters("$$ x^2 $$")).toBe("x^2");
        expect(stripMathDelimiters(String.raw`\[ \frac{x}{y} \]`)).toBe(String.raw`\frac{x}{y}`);
        expect(stripMathDelimiters("$sum_(i=1)^n i$")).toBe("sum_(i=1)^n i");
    });

    test("将 LaTeX 公式转换为 Typst 并保留 LaTeX 预览源", () => {
        const result = convertFormula(String.raw`\frac{x^2 + 1}{y}`, "latex");

        expect(result.output).toContain("frac");
        expect(result.output).toContain("x^2");
        expect(result.previewLatex).toBe(String.raw`\frac{x^2 + 1}{y}`);
    });

    test("将 Typst 公式转换为可供 KaTeX 预览的 LaTeX", () => {
        const result = convertFormula("frac(x^2 + 1, y)", "typst");

        expect(result.output).toContain(String.raw`\frac`);
        expect(result.previewLatex).toBe(result.output);
    });

    test("空输入不会生成占位源码", () => {
        expect(convertFormula("   ", "latex")).toEqual({
            source: "",
            output: "",
            previewLatex: "",
        });
    });
});
