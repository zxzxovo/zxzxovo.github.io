export interface ToolDefinition {
    title: string;
    description: string;
    href: string;
    icon: string;
    badge: string;
}

export const tools = [
    {
        title: "Unicode Emoji",
        description: "搜索常用 Emoji，并复制字符、Unicode 码点或 JavaScript 转义序列。",
        href: "/tools/unicode-emoji",
        icon: "mdi:emoticon-happy-outline",
        badge: "文本",
    },
    {
        title: "社保缴费计算器",
        description: "使用你掌握的地区参数，自定义缴费基数与比例并进行本地估算。",
        href: "/tools/social-insurance",
        icon: "mdi:calculator-variant-outline",
        badge: "计算",
    },
    {
        title: "X 抽奖",
        description: "从本地文本或 CSV 候选名单中去重、筛选并可复现地随机抽取。",
        href: "/tools/x-lottery",
        icon: "mdi:dice-multiple-outline",
        badge: "随机",
    },
] satisfies ToolDefinition[];
