import { useNavigate } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";
import useScrollTo from "../hooks/useScrollTo";

export default function GetStarted() {
  const sectionRef = useScrollReveal("/images/pic03.jpg");
  const scrollTo = useScrollTo();
  const navigate = useNavigate();

  return (
    <section id="getstarted" className="main special" ref={sectionRef}>
      <div className="container">
        <span className="image fit primary">
          <img src="/images/pic03.jpg" alt="" />
        </span>
        <div className="content">
          <header className="major">
            <h2>Ready to Meet?</h2>
          </header>
          <p>
            Create an account, add your friends, and start planning your first
            meetup. Everyone shares their location, we calculate the fairest
            midpoint, search for venues nearby, and your group picks the winner.
            It's that simple.
          </p>
          <ul className="actions special">
            <li>
              <a
                href="#footer"
                className="button primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Get Started
              </a>
            </li>
          </ul>
        </div>
        <a
          href="#footer"
          className="goto-next"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("footer");
          }}
        >
          Next
        </a>
      </div>
    </section>
  );
}
