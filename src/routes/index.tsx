import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campfire — Gather around the fire tonight" },
      {
        name: "description",
        content:
          "Campfire is a social place to sit around a realistic nighttime campfire and talk with real people. Pull up a seat, warm your hands, stay a while.",
      },
      { property: "og:title", content: "Campfire — Gather around the fire tonight" },
      {
        property: "og:description",
        content: "A virtual place to sit around a campfire and talk with real people.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const demoFires = [
  {
    name: "The Long Talk",
    seated: 4,
    capacity: 8,
    image: "/images/hero-forest.jpg",
    note: "Topic: what nobody tells you about moving cities",
  },
  {
    name: "Quiet Hours",
    seated: 3,
    capacity: 6,
    image: "/images/clearing-2.jpg",
    note: "Low voices, long silences, occasional laughter",
  },
  {
    name: "First Light Stories",
    seated: 2,
    capacity: 8,
    image: "/images/clearing-3.jpg",
    note: "True stories only, told before sunrise",
  },
];

const steps = [
  {
    n: "01",
    title: "Find a fire",
    body: "Browse the fires burning right now, each with its own crowd, topic and tempo. Or light your own and set the mood.",
  },
  {
    n: "02",
    title: "Take an open seat",
    body: "Seats ring the fire just like they do in the woods. Claim one, and your profile appears beside the flame.",
  },
  {
    n: "03",
    title: "Talk till the embers fade",
    body: "Speak up with your talk control, write in the room's firelight chat, and stay as long as the night allows.",
  },
];

function LandingPage() {
  return (
    <div className="luminous-bg min-h-screen">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#ffe6c9] to-ember text-bark shadow-sm">
              <Flame className="size-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white drop-shadow-sm">
              Campfire
            </span>
          </span>
          <nav className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-full px-4 py-2 text-[13px] font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-bark shadow-sm transition-transform hover:scale-[1.02]"
            >
              Join the fire
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
        <img
          src="/images/hero-forest.jpg"
          alt="A campfire burning in a dark forest at night"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181f]/85 via-[#14181f]/30 to-[#14181f]/40" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-32">
          <div className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold tracking-wide text-white/90 backdrop-blur">
            <span className="softpulse inline-block size-1.5 rounded-full bg-ember" />
            340 people around the fire right now
          </div>
          <h1 className="rise font-display text-[clamp(3.4rem,9.5vw,7.5rem)] font-semibold leading-[0.95] tracking-tight text-white">
            Come sit by
            <br />
            <em className="font-light italic text-ember">the fire.</em>
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Campfire is a clearing in the night where real people pull up real seats
            around a real fire — and talk, slowly, the way conversations used to go.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-ember px-7 py-3.5 text-[15px] font-bold text-bark shadow-ember transition-transform hover:scale-[1.02]"
            >
              Enter the clearing
            </Link>
            <a
              href="#tonights-fires"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Tonight's fires
            </a>
          </div>
        </div>
      </section>

      {/* 01 — How it works */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="flex items-baseline gap-4 border-b border-bark/15 pb-6">
          <span className="font-display text-sm font-semibold text-bark2/70">01</span>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-bark md:text-4xl">
            How a night goes
          </h2>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <div key={step.n} className="border-t border-bark/15 pt-6">
              <div className="font-display text-6xl font-light text-ember">{step.n}</div>
              <h3 className="mt-4 font-display text-xl font-semibold text-bark">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-bark2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 02 — Tonight's fires */}
      <section id="tonights-fires" className="scroll-mt-16 py-4 pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-baseline gap-4 border-b border-bark/15 pb-6">
            <span className="font-display text-sm font-semibold text-bark2/70">02</span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-bark md:text-4xl">
              Tonight's fires
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {demoFires.map((fire) => (
              <article
                key={fire.name}
                className="group overflow-hidden rounded-3xl border border-white/70 bg-white/50 shadow-glass backdrop-blur-xl"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={fire.image}
                    alt={`The ${fire.name} campfire`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                    <span className="softpulse size-1.5 rounded-full bg-ember" />
                    {fire.seated} seated of {fire.capacity}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-bark">{fire.name}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-bark2">{fire.note}</p>
                  <Link
                    to="/auth"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-bark px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-bark2"
                  >
                    <Sparkles className="size-3.5" />
                    Take a seat
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <img
          src="/images/clearing-3.jpg"
          alt="A clearing with a fire in a night forest"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#14181f]/70" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight text-white">
            The fire is lit.
            <br />
            <em className="font-light italic text-ember">Your seat is open.</em>
          </h2>
          <Link
            to="/auth"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-ember px-8 py-4 text-[15px] font-bold text-bark shadow-ember transition-transform hover:scale-[1.02]"
          >
            <Flame className="size-4" />
            Join Campfire
          </Link>
        </div>
      </section>

      <footer className="border-t border-bark/10 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-[13px] text-bark2/80">
          <span className="font-display font-semibold text-bark">Campfire</span>
          <span>Talk slowly. Stay warm.</span>
        </div>
      </footer>
    </div>
  );
}
