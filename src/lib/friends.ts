import { parse } from "smol-toml";
import { z } from "zod";

const httpUrlSchema = z
    .string()
    .trim()
    .min(1, "不能为空")
    .refine((value) => {
        try {
            const protocol = new URL(value).protocol;
            return protocol === "http:" || protocol === "https:";
        } catch {
            return false;
        }
    }, "必须是完整的 HTTP(S) 地址");

const httpsUrlSchema = z
    .string()
    .trim()
    .min(1, "不能为空")
    .refine((value) => {
        try {
            return new URL(value).protocol === "https:";
        } catch {
            return false;
        }
    }, "必须是完整的 HTTPS 地址");

const friendLinkSchema = z
    .object({
        title: z.string().trim().min(1, "不能为空").max(80, "不能超过 80 个字符"),
        content: z
            .string()
            .trim()
            .min(1, "不能为空")
            .max(240, "不能超过 240 个字符"),
        url: httpUrlSchema,
        avatar: httpsUrlSchema.optional(),
    })
    .strict();

const friendDocumentSchema = z
    .object({
        friends: z.array(friendLinkSchema).default([]),
    })
    .strict()
    .superRefine(({ friends }, context) => {
        const titles = new Map<string, number>();
        const urls = new Map<string, number>();

        friends.forEach((friend, index) => {
            const titleKey = friend.title.normalize("NFKC").toLocaleLowerCase("zh-CN");
            const urlKey = new URL(friend.url).href;
            const previousTitle = titles.get(titleKey);
            const previousUrl = urls.get(urlKey);

            if (previousTitle !== undefined) {
                context.addIssue({
                    code: "custom",
                    path: ["friends", index, "title"],
                    message: `与 friends.${previousTitle}.title 重复`,
                });
            } else {
                titles.set(titleKey, index);
            }

            if (previousUrl !== undefined) {
                context.addIssue({
                    code: "custom",
                    path: ["friends", index, "url"],
                    message: `与 friends.${previousUrl}.url 重复`,
                });
            } else {
                urls.set(urlKey, index);
            }
        });
    });

export type FriendLink = z.infer<typeof friendLinkSchema>;

function formatIssue(path: PropertyKey[], message: string) {
    const location = path.length > 0 ? path.join(".") : "document";
    return `${location}: ${message}`;
}

export function parseFriendsDocument(source: string): FriendLink[] {
    let document: unknown;

    try {
        document = parse(source);
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`友链 TOML 无法解析：${detail}`);
    }

    const result = friendDocumentSchema.safeParse(document);

    if (!result.success) {
        const details = result.error.issues
            .map(({ path, message }) => formatIssue(path, message))
            .join("；");
        throw new Error(`友链数据校验失败：${details}`);
    }

    return result.data.friends;
}
