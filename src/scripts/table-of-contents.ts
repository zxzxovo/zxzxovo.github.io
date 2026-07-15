let disposeTableOfContents: (() => void) | undefined;

function decodeFragment(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return hash.replace(/^#/, "");
  }
}

export function initTableOfContents() {
  disposeTableOfContents?.();

  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"),
  );
  if (links.length === 0) return;

  const headingIds = [...new Set(links.map((link) => decodeFragment(link.hash)))];
  const headings = headingIds
    .map((id) => document.getElementById(id))
    .filter((heading): heading is HTMLElement => Boolean(heading));
  if (headings.length === 0) return;

  let frame = 0;
  let settleTimer = 0;
  let pendingHeadingId: string | undefined;

  const setCurrent = (headingId: string) => {
    for (const link of links) {
      const active = decodeFragment(link.hash) === headingId;
      link.toggleAttribute("data-current", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  const updateFromScroll = () => {
    frame = 0;
    const scrollPadding = Number.parseFloat(
      getComputedStyle(document.documentElement).scrollPaddingTop,
    );
    const activationLine = (Number.isFinite(scrollPadding) ? scrollPadding : 88) + 8;
    let current = headings[0];

    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= activationLine) current = heading;
      else break;
    }

    setCurrent(current.id);
  };

  const scheduleUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateFromScroll);
  };

  const finishPendingNavigation = () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      pendingHeadingId = undefined;
      scheduleUpdate();
    }, 140);
  };

  const onScroll = () => {
    if (pendingHeadingId) {
      finishPendingNavigation();
      return;
    }
    scheduleUpdate();
  };

  const onHashChange = () => {
    const headingId = decodeFragment(window.location.hash);
    if (!headingIds.includes(headingId)) return;

    pendingHeadingId = headingId;
    setCurrent(headingId);
    finishPendingNavigation();
  };

  const onLinkClick = (event: Event) => {
    const link = event.currentTarget as HTMLAnchorElement;
    const headingId = decodeFragment(link.hash);
    pendingHeadingId = headingId;
    setCurrent(headingId);
    finishPendingNavigation();
  };

  for (const link of links) link.addEventListener("click", onLinkClick);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("hashchange", onHashChange);

  const initialHeadingId = decodeFragment(window.location.hash);
  if (headingIds.includes(initialHeadingId)) {
    pendingHeadingId = initialHeadingId;
    setCurrent(initialHeadingId);
    finishPendingNavigation();
  } else {
    updateFromScroll();
  }

  disposeTableOfContents = () => {
    for (const link of links) link.removeEventListener("click", onLinkClick);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("hashchange", onHashChange);
    window.clearTimeout(settleTimer);
    if (frame) cancelAnimationFrame(frame);
    disposeTableOfContents = undefined;
  };
}

document.addEventListener("astro:before-swap", () => disposeTableOfContents?.());
