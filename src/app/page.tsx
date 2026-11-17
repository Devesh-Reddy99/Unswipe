import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Ticket } from "@/components/Ticket";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/Badges";
import { istAt, istWeekday } from "@/lib/time";

export const dynamic = "force-dynamic";

export default function Landing() {
  // The hero ticket always shows "this Thursday" so the example feels live.
  const daysToThu = (4 - istWeekday(0) + 7) % 7 || 7;
  const when = istAt(daysToThu, 19, 30);

  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/why" className="hidden px-3 py-2 font-bold text-dusk hover:text-ink sm:block">
            Why Offline
          </Link>
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-6 md:grid-cols-[1.15fr_1fr] md:pt-12">
          <div>
            <VerifiedBadge label="Every member verified by eLitmus" />
            <h1 className="mt-5 text-[2.75rem] font-extrabold leading-[1.02] sm:text-6xl">
              Five people a day.
              <br />
              One real date.
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-dusk">
              Offline is a dating app for 2020–2023 graduates. There is no swiping and no endless chat. You get a few
              well-matched intros each day, agree on a date within 72 hours, and meet at a café near you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-7 py-3 text-lg">
                Create your profile
              </Link>
              <Link href="/login?demo=1" className="btn-ghost px-7 py-3 text-lg">
                Try the demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-dusk">Free to use. Live in Bengaluru, Hyderabad and Pune.</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mist bg-white py-1.5 pl-1.5 pr-4">
              <Avatar seed={7} name="Aarav" size={34} />
              <Avatar seed={12} name="Diya" size={34} className="-ml-4 ring-2 ring-white" />
              <span className="text-sm font-bold">Matched 2 days ago</span>
            </div>
            <Ticket
              when={when}
              venue="Kaapi Corner"
              area="12th Main, Indiranagar"
              names="Aarav & Diya"
              perk="15% off for Offline dates"
              reason="You both love outdoor Sundays and want something long-term."
            />
          </div>
        </section>

        {/* Problem */}
        <section className="bg-ink py-16 text-paper">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Dating apps are built to keep you swiping. We're built to get you out the door.</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <Stat n="2 in 3" text="users of Indian dating and matrimony apps have never met a match in person." src="Juleo × YouGov, 2024" />
              <Stat n="3 : 1" text="men to women on Indian dating apps. Men are ignored and women are flooded. Both give up." src="Woo survey of 20,000 urban Indians" />
              <Stat n="78%" text="of women on these apps have come across fake profiles." src="Juleo × YouGov, 2024" />
            </div>
          </div>
        </section>

        {/* How it works: a true sequence, so it is numbered */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            <Step n={1} title="Get verified" text="Link your eLitmus account. We only receive a yes and your graduation year. Your test scores are never shared." />
            <Step n={2} title="Get 5 intros a day" text="Each intro is picked for you and comes with the reasons you might click. You choose: interested or pass." />
            <Step n={3} title="Plan within 72 hours" text="When it's mutual, pick a partner café and a few times. No date agreed in 72 hours? The match quietly closes." />
            <Step n={4} title="Meet, then check in" text="Share your plan with a friend. Afterwards, tell us privately how it went. That's how we learn who to introduce next." />
          </ol>
        </section>

        {/* Principles */}
        <section className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          <Principle title="Fair by design" text="Each profile appears in at most six people's intros a day, and nobody can pay to be shown more. Attention is shared out, not auctioned." />
          <Principle title="Safe by default" text="Phone numbers and links stay hidden until a date is confirmed. You can hide your profile from people at your own company, and report anyone in two taps." />
          <Principle title="Honest about money" text="Partner cafés pay us when a date is booked with them, and you get a discount there. We never sell likes, boosts or your data." />
        </section>

        {/* Waitlist */}
        <section className="mx-auto mt-20 max-w-6xl px-6">
          <div className="panel p-8">
            <h2 className="text-2xl font-bold">Not in Bengaluru, Hyderabad or Pune yet?</h2>
            <p className="mt-2 max-w-2xl text-dusk">
              We open one city at a time and let people in in balanced groups, so every new city starts with a healthy
              mix of men and women. Join the waitlist and we'll tell you when your city opens.
            </p>
            <div className="mt-6">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ n, text, src }: { n: string; text: string; src: string }) {
  return (
    <div className="border-l-2 border-marigold pl-5">
      <p className="display text-5xl font-extrabold text-marigold">{n}</p>
      <p className="mt-2 text-paper/90">{text}</p>
      <p className="mt-2 text-sm text-paper/50">{src}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="relative pl-12">
      <span className="display absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-ink font-bold text-paper">
        {n}
      </span>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-1.5 text-dusk">{text}</p>
    </li>
  );
}

function Principle({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-t-2 border-ink pt-5">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-dusk">{text}</p>
    </div>
  );
}
