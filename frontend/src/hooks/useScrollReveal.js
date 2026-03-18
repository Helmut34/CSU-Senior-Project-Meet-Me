import { useEffect, useRef } from "react";

export default function useScrollReveal(bgImageSrc) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !bgImageSrc) return;

    // create the background div like the original template does
    const bgDiv = document.createElement("div");
    bgDiv.className = "main-bg";
    bgDiv.id = section.id + "-bg";
    bgDiv.style.backgroundImage =
      'url("/assets/css/images/overlay.png"), url("' + bgImageSrc + '")';
    document.body.appendChild(bgDiv);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bgDiv.classList.add("active");
          } else {
            bgDiv.classList.remove("active");
          }
        });
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0.15 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      bgDiv.remove();
    };
  }, [bgImageSrc]);

  return sectionRef;
}
