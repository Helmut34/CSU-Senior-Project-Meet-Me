import useScrollReveal from "../hooks/useScrollReveal";
import useScrollTo from "../hooks/useScrollTo";

export default function Features() {
  const sectionRef = useScrollReveal("/images/pic02.jpg");
  const scrollTo = useScrollTo();

  return (
    <section id="features" className="main special" ref={sectionRef}>
      <div className="container">
        <span className="image fit primary">
          <img src="/images/pic02.jpg" alt="" />
        </span>
        <div className="content">
          <header className="major">
            <h2>How It Works</h2>
          </header>
          <p>
            Four simple steps to a fair meetup spot that works for everyone in
            your group.
          </p>
          <ul className="icons-grid">
            <li>
              <span className="icon solid major fa-user-friends"></span>
              <h3>Add Friends</h3>
            </li>
            <li>
              <span className="icon solid major fa-map-marker-alt"></span>
              <h3>Share Location</h3>
            </li>
            <li>
              <span className="icon solid major fa-map"></span>
              <h3>Find Midpoint</h3>
            </li>
            <li>
              <span className="icon solid major fa-utensils"></span>
              <h3>Vote &amp; Meet</h3>
            </li>
          </ul>
        </div>
        <a
          href="#getstarted"
          className="goto-next"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("getstarted");
          }}
        >
          Next
        </a>
      </div>
    </section>
  );
}
