import { createSignal, onMount } from "solid-js";
import SunMoonStarsIcon from "@iconify-solid/mdi/sun-moon-stars";

export default function ThemeToggle() {
  const [dark, setDark] = createSignal(false);

  onMount(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  });

  const toggle = () => {
    const next = !dark();
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button onClick={toggle} aria-label="切换主题">
      <SunMoonStarsIcon height="1.5rem" />
    </button>
  );
}
