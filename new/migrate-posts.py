#!/usr/bin/env python3
"""迁移旧博客文章到 Astro Content Collections 格式。

旧结构:
  src/posts/{slug}/
    index.md
    navigation.{jpg,png,svg}  (可选)
    cover.jpg                 (可选 -- hellooo-world 用这个)

新结构:
  src/content/posts/{slug}.md
  public/images/nav/{slug}.{jpg,png,svg}
"""

import argparse
import shutil
import re
from pathlib import Path


# 导航图可能的文件名（按优先级排序：先匹配到的优先级更高）
NAV_NAMES = [
    "navigation.jpg", "navigation.png", "navigation.svg",
    "nav.jpg", "nav.png", "nav.svg",
    "cover.jpg", "cover.png",
]


def find_nav(folder: Path) -> Path | None:
    """在文件夹中查找导航图，返回第一个匹配的路径。"""
    for name in NAV_NAMES:
        candidate = folder / name
        if candidate.is_file():
            return candidate
    return None


def migrate_posts(src_dir: Path, posts_dir: Path, nav_dir: Path) -> None:
    """
    遍历 src_dir 下的所有子文件夹，
    将 index.md 复制为 {slug}.md 到 posts_dir，
    将导航图复制为 {slug}.{ext} 到 nav_dir。
    """
    posts_dir.mkdir(parents=True, exist_ok=True)
    nav_dir.mkdir(parents=True, exist_ok=True)

    migrated = 0
    nav_migrated = 0
    skipped = 0

    for folder in sorted(src_dir.iterdir()):
        if not folder.is_dir():
            continue

        slug = folder.name
        index_md = folder / "index.md"

        if not index_md.is_file():
            print(f"  ⚠️  {slug}: 没有 index.md，跳过")
            skipped += 1
            continue

        # 复制 Markdown
        dest_md = posts_dir / f"{slug}.md"
        shutil.copy2(index_md, dest_md)
        migrated += 1

        # 复制导航图（如果有）
        nav_src = find_nav(folder)
        if nav_src:
            ext = nav_src.suffix  # .jpg / .png / .svg
            dest_nav = nav_dir / f"{slug}{ext}"
            shutil.copy2(nav_src, dest_nav)
            nav_migrated += 1

    print(f"\n✅ 文章迁移: {migrated} 篇")
    print(f"✅ 导航图迁移: {nav_migrated} 张")
    if skipped:
        print(f"⚠️  跳过: {skipped} 个文件夹（缺少 index.md）")


def main():
    parser = argparse.ArgumentParser(
        description="迁移旧博客文章到 Astro Content Collections",
    )
    parser.add_argument(
        "src",
        type=Path,
        help="旧博客的 posts 目录，例如 ../old-blog/src/posts",
    )
    parser.add_argument(
        "--posts-dir",
        type=Path,
        default=Path("src/content/posts"),
        help="目标 Markdown 目录 (默认: src/content/posts)",
    )
    parser.add_argument(
        "--nav-dir",
        type=Path,
        default=Path("public/images/nav"),
        help="目标导航图目录 (默认: public/images/nav)",
    )
    args = parser.parse_args()

    if not args.src.is_dir():
        print(f"❌ 源目录不存在: {args.src}")
        return 1

    print(f"📁 源目录:   {args.src.resolve()}")
    print(f"📁 Markdown: {args.posts_dir.resolve()}")
    print(f"📁 导航图:   {args.nav_dir.resolve()}")
    print()

    migrate_posts(args.src, args.posts_dir, args.nav_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())