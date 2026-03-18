import { useCallback } from "react";

export default function useScrollTo() {
  const scrollTo = useCallback((targetId) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return scrollTo;
}
