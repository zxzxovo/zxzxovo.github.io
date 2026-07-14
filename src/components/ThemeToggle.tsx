import MoonIcon from "@iconify-solid/mdi/moon-waning-crescent";
import WhiteBalanceSunnyIcon from "@iconify-solid/mdi/white-balance-sunny";
import { createSignal, onCleanup, onMount } from "solid-js";

export default function ThemeToggle() {
  const [dark, setDark] = createSignal(false);

  const syncThemeColor = (next: boolean) => {
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", next ? "#09090b" : "#fafafa");
  };

  const sync = () => {
    const next = document.documentElement.classList.contains("dark");
    setDark(next);
    syncThemeColor(next);
  };

  onMount(() => {
    sync();
    document.addEventListener("astro:after-swap", sync);
    onCleanup(() => document.removeEventListener("astro:after-swap", sync));
  });

  const toggle = () => {
    const next = !dark();
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    syncThemeColor(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      class="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      aria-label={dark() ? "切换为浅色主题" : "切换为深色主题"}
      title={dark() ? "切换为浅色主题" : "切换为深色主题"}
    >
      {dark() ? (
        <WhiteBalanceSunnyIcon height="1.25rem" aria-hidden="true" />
      ) : (
        <MoonIcon height="1.25rem" aria-hidden="true" />
      )}
    </button>
  );
}
