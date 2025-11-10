export default function Rules() {
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
        <h1 className="header">Rules</h1>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full max-w-4xl mx-auto">
            <ul className="list-disc list-inside text-black min-w-0 flex-1 mb-4 md:mb-0">
                <li>There are two players in the game.</li>
                <li>Each player can choose to cooperate or defect.</li>
                <li>If both players cooperate, they each get 3 points.</li>
                <li>If one player cooperates and the other defects, the defector gets 5 points and the cooperator gets 1 point.</li>
                <li>If both players defect, they each get 1 point.</li>
                <li>The player with the highest score wins.</li>
            </ul>
            <div className="w-full md:w-[400px] shrink-0 aspect-video">
                <p className="text-center text-black">This website is inspired by <a className="link" target="_blank" href="https://www.youtube.com/@veritasium">Veritasium</a> and his video on game theory. Check out his video below:</p>
                <iframe
                    src="https://www.youtube.com/embed/mScpHTIi-kM?si=4MkbsCt7JjY-rTdE"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                    className="rounded shadow w-full h-full min-h-[180px]"
                ></iframe>
            </div>
        </div>
      </div>
    )
}