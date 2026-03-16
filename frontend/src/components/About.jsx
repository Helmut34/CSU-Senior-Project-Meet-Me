import useScrollReveal from '../hooks/useScrollReveal'
import useScrollTo from '../hooks/useScrollTo'

export default function About() {
	const sectionRef = useScrollReveal('/images/pic01.jpg')
	const scrollTo = useScrollTo()

	return (
		<section id="about" className="main special" ref={sectionRef}>
			<div className="container">
				<span className="image fit primary">
					<img src="/images/pic01.jpg" alt="" />
				</span>
				<div className="content">
					<header className="major">
						<h2>What is Meet Me?</h2>
					</header>
					<p>
						Planning meetups with friends scattered across town shouldn't be a headache.
						Meet Me in the Middle calculates the geographic middle of everyone's locations,
						finds great venues nearby, and lets your group vote on the perfect spot.
						No more one person always driving across town.
					</p>
				</div>
				<a
					href="#features"
					className="goto-next scrolly"
					onClick={(e) => {
						e.preventDefault()
						scrollTo('features')
					}}
				>
					Next
				</a>
			</div>
		</section>
	)
}
