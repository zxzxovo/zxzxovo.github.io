import { describe, expect, test } from "bun:test";
import { parseFriendsDocument } from "../src/lib/friends";

describe("友链 TOML", () => {
    test("允许空列表和可选头像", () => {
        expect(parseFriendsDocument("# 暂无友链\n")).toEqual([]);

        const friends = parseFriendsDocument(`
[[friends]]
title = "示例站点"
content = "一段简介"
url = "https://example.com"
avatar = "https://example.com/avatar.png"
`);

        expect(friends).toEqual([
            {
                title: "示例站点",
                content: "一段简介",
                url: "https://example.com",
                avatar: "https://example.com/avatar.png",
            },
        ]);
    });

    test("拒绝非 HTTP(S) 地址和未知字段", () => {
        expect(() =>
            parseFriendsDocument(`
[[friends]]
title = "示例站点"
content = "一段简介"
url = "javascript:alert(1)"
`),
        ).toThrow("必须是完整的 HTTP(S) 地址");

        expect(() =>
            parseFriendsDocument(`
[[friends]]
title = "示例站点"
content = "一段简介"
url = "https://example.com"
note = "不支持的字段"
`),
        ).toThrow("Unrecognized key");

        expect(() =>
            parseFriendsDocument(`
[[friends]]
title = "示例站点"
content = "一段简介"
url = "http://example.com"
avatar = "http://example.com/avatar.png"
`),
        ).toThrow("必须是完整的 HTTPS 地址");
    });

    test("拒绝重复标题和重复地址", () => {
        expect(() =>
            parseFriendsDocument(`
[[friends]]
title = "示例站点"
content = "第一条"
url = "https://example.com"

[[friends]]
title = "示例站点"
content = "第二条"
url = "https://another.example.com"
`),
        ).toThrow("title 重复");

        expect(() =>
            parseFriendsDocument(`
[[friends]]
title = "站点一"
content = "第一条"
url = "https://example.com"

[[friends]]
title = "站点二"
content = "第二条"
url = "https://example.com/"
`),
        ).toThrow("url 重复");
    });
});
