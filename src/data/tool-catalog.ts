export interface ToolDefinition {
    title: string;
    description: string;
    href: string;
    icon: string;
    badge: string;
    keywords: string[];
}

export const tools = [
    {
        title: "Unicode Emoji",
        description: "搜索常用 Emoji，并复制字符、Unicode 码点或 JavaScript 转义序列。",
        href: "/tools/unicode-emoji",
        icon: "mdi:emoticon-happy-outline",
        badge: "文本",
        keywords: ["Emoji", "Unicode", "码点", "JavaScript", "转义", "复制", "字符"],
    },
    {
        title: "LaTeX / Typst 公式",
        description: "双向转换 LaTeX 与 Typst 数学公式，并在浏览器中即时预览和复制结果。",
        href: "/tools/latex-typst",
        icon: "mdi:function-variant",
        badge: "公式",
        keywords: [
            "LaTeX",
            "Typst",
            "公式",
            "数学",
            "转换",
            "预览",
            "TeX",
            "KaTeX",
        ],
    },
    {
        title: "X 抽奖",
        description: "从本地文本或 CSV 候选名单中去重、筛选并可复现地随机抽取。",
        href: "/tools/x-lottery",
        icon: "mdi:dice-multiple-outline",
        badge: "随机",
        keywords: ["X", "抽奖", "随机", "候选名单", "TXT", "CSV", "去重", "筛选", "排除", "随机种子"],
    },
] satisfies ToolDefinition[];
