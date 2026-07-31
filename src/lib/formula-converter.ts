import { tex2typst, typst2tex } from "tex2typst";

export type FormulaMode = "latex" | "typst";

export interface FormulaConversion {
    source: string;
    output: string;
    previewLatex: string;
}

export function stripMathDelimiters(value: string) {
    const source = value.trim();
    const wrappers = [
        ["$$", "$$"],
        ["\\[", "\\]"],
        ["\\(", "\\)"],
        ["$", "$"],
    ] as const;

    for (const [start, end] of wrappers) {
        if (source.startsWith(start) && source.endsWith(end)) {
            return source.slice(start.length, -end.length).trim();
        }
    }

    return source;
}

export function convertFormula(value: string, mode: FormulaMode): FormulaConversion {
    const source = stripMathDelimiters(value);
    if (!source) return { source: "", output: "", previewLatex: "" };

    if (mode === "latex") {
        return {
            source,
            output: tex2typst(source, { fracToSlash: false }),
            previewLatex: source,
        };
    }

    const output = typst2tex(source, { blockMathMode: true });
    return { source, output, previewLatex: output };
}
