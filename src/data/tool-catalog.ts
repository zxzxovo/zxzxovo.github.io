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
        title: "社保缴费计算器",
        description: "使用你掌握的地区参数，自定义缴费基数与比例并进行本地估算。",
        href: "/tools/social-insurance",
        icon: "mdi:calculator-variant-outline",
        badge: "计算",
        keywords: [
            "社保",
            "养老保险",
            "医疗保险",
            "失业保险",
            "工伤保险",
            "生育保险",
            "住房公积金",
            "缴费基数",
            "个人比例",
            "单位比例",
            "税前月薪",
            "地区",
            "参数来源",
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
