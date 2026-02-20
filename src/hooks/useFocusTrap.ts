import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([type="hidden"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.tabIndex !== -1 &&
      el.getAttribute("aria-hidden") !== "true",
  );
}

let scrollLockCount = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";
let previousHtmlOverflow = "";

function lockScroll() {
  if (typeof document === "undefined") return;

  if (scrollLockCount === 0) {
    const body = document.body;
    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    previousBodyOverflow = body.style.overflow;
    previousBodyPaddingRight = body.style.paddingRight;
    previousHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  scrollLockCount += 1;
}

function unlockScroll() {
  if (typeof document === "undefined" || scrollLockCount === 0) return;

  scrollLockCount -= 1;

  if (scrollLockCount === 0) {
    const body = document.body;
    const html = document.documentElement;

    body.style.overflow = previousBodyOverflow;
    body.style.paddingRight = previousBodyPaddingRight;
    html.style.overflow = previousHtmlOverflow;
  }
}

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previousActive = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const focusables = getFocusableElements(container);
      const target =
        container.querySelector<HTMLElement>("[data-autofocus]") ||
        focusables[0] ||
        container;
      target.focus({ preventScroll: true });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const focusOutside = current && !container.contains(current);

      if (event.shiftKey) {
        if (current === first || focusOutside) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (current === last || focusOutside) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    focusFirst();
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus?.();
    };
  }, [active]);

  return { containerRef };
}
