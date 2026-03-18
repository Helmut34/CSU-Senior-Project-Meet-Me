import { useEffect, useRef } from "react";
import useScrollTo from "../hooks/useScrollTo";

export default function Header() {
  const scrollTo = useScrollTo();
  const headerRef = useRef(null);
  const titleRef = useRef(null);

  // fade out the title as user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (!headerRef.current || !titleRef.current) return;

      const headerHeight = headerRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / headerHeight, 1);

      let opacity;
      if (progress > 0.5) {
        opacity = 1 - progress;
      } else {
        opacity = progress;
      }
      // if we havent scrolled yet keep it fully visible
      if (scrollY < 10) opacity = 1;

      titleRef.current.style.opacity = Math.max(0, Math.min(1, opacity * 2));
    };

    // center the title vertically on desktop
    const positionTitle = () => {
      if (!titleRef.current) return;
      if (window.innerWidth > 980) {
        const titleHeight = titleRef.current.offsetHeight;
        titleRef.current.style.position = "fixed";
        titleRef.current.style.top = "50%";
        titleRef.current.style.left = "0";
        titleRef.current.style.width = "100%";
        titleRef.current.style.marginTop = -(titleHeight / 2) + "px";
      } else {
        titleRef.current.style.position = "";
        titleRef.current.style.top = "";
        titleRef.current.style.left = "";
        titleRef.current.style.width = "";
        titleRef.current.style.marginTop = "";
      }
    };

    positionTitle();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", positionTitle);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", positionTitle);
    };
  }, []);

  return (
    <section id="header" ref={headerRef}>
      <header className="major" ref={titleRef}>
        <h1>Meet Me in the Middle</h1>
        <p>Find the perfect spot to meet your friends, halfway for everyone</p>
      </header>
      <div className="container">
        <ul className="actions special">
          <li>
            <a
              href="#about"
              className="button primary"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("about");
              }}
            >
              Learn More
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
