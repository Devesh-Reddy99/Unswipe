import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, inArray, like, ne, or, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { compatibility } from "./compat";
import { QUESTIONS, AREAS, CITIES } from "./constants";
import { istAt, istDay } from "./time";
import type { Prompt } from "@/db/schema";

/*
 * Demo data. Everything here is fictional: names, companies and people are invented, and
 * avatars are illustrations. Venue names are fictional too, so no real business is implied
 * to be a partner.
 */

// Small deterministic random generator, so every reset produces the same world.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VENUES: (typeof schema.venues.$inferInsert)[] = [
  // Bengaluru
  { id: "blr-brewhouse-indiranagar", name: "Kaapi Corner", city: "Bengaluru", area: "Indiranagar", kind: "cafe", priceForTwo: 600, perk: "15% off for Unswipe dates", blurb: "Quiet corner tables, good filter coffee.", cpaInr: 75 },
  { id: "blr-bookcafe-koramangala", name: "Chapter & Chai", city: "Bengaluru", area: "Koramangala", kind: "cafe", priceForTwo: 450, perk: "Free cookie for two", blurb: "A bookshop café. Easy to talk, easy to leave.", cpaInr: 60 },
  { id: "blr-lake-hsr", name: "Agara Lake Loop", city: "Bengaluru", area: "HSR Layout", kind: "walk", priceForTwo: 0, perk: null, blurb: "A 3 km evening walk around the lake. Busy and well lit.", isPartner: false, cpaInr: 0 },
  { id: "blr-pottery-jayanagar", name: "Clay Studio", city: "Bengaluru", area: "Jayanagar", kind: "activity", priceForTwo: 1400, perk: "₹200 off the couples class", blurb: "A 90-minute pottery class for two. Hands busy, conversation easy.", cpaInr: 150 },
  { id: "blr-dosa-whitefield", name: "Udupi Garden", city: "Bengaluru", area: "Whitefield", kind: "food", priceForTwo: 500, perk: "Free dessert", blurb: "Crispy dosas, fast service, zero pressure.", cpaInr: 60 },
  { id: "blr-boardgames-bellandur", name: "Dice & Dine", city: "Bengaluru", area: "Bellandur", kind: "activity", priceForTwo: 800, perk: "First hour of games free", blurb: "Board game café. Great for a playful first date.", cpaInr: 100 },
  { id: "blr-rooftop-marathahalli", name: "Skyline Social", city: "Bengaluru", area: "Marathahalli", kind: "food", priceForTwo: 1200, perk: "15% off", blurb: "Rooftop with music kept low enough to talk.", cpaInr: 100 },
  { id: "blr-cafe-ecity", name: "Bean There", city: "Bengaluru", area: "Electronic City", kind: "cafe", priceForTwo: 400, perk: "10% off", blurb: "Five minutes from the tech parks.", cpaInr: 50 },
  // Hyderabad
  { id: "hyd-cafe-gachibowli", name: "Irani Chai House", city: "Hyderabad", area: "Gachibowli", kind: "cafe", priceForTwo: 300, perk: "Free Osmania biscuits", blurb: "Classic chai and buns, modern seating.", cpaInr: 50 },
  { id: "hyd-park-madhapur", name: "Durgam Cheruvu Walk", city: "Hyderabad", area: "Madhapur", kind: "walk", priceForTwo: 0, perk: null, blurb: "Lakeside walk by the cable bridge.", isPartner: false, cpaInr: 0 },
  { id: "hyd-bowling-kondapur", name: "Strike Zone", city: "Hyderabad", area: "Kondapur", kind: "activity", priceForTwo: 900, perk: "Shoes on us", blurb: "Bowling and snacks.", cpaInr: 100 },
  { id: "hyd-biryani-banjara", name: "Nizam's Table", city: "Hyderabad", area: "Banjara Hills", kind: "food", priceForTwo: 1000, perk: "Free starter", blurb: "Biryani worth the trip.", cpaInr: 90 },
  // Pune
  { id: "pun-cafe-baner", name: "The Daily Grind", city: "Pune", area: "Baner", kind: "cafe", priceForTwo: 500, perk: "15% off", blurb: "Bright, calm, great sandwiches.", cpaInr: 60 },
  { id: "pun-trek-hinjewadi", name: "Hill Café Sunrise", city: "Pune", area: "Hinjewadi", kind: "walk", priceForTwo: 200, perk: null, blurb: "Short morning hike, then breakfast.", isPartner: false, cpaInr: 0 },
  { id: "pun-art-kp", name: "Paint & Sip", city: "Pune", area: "Koregaon Park", kind: "activity", priceForTwo: 1600, perk: "₹300 off for two", blurb: "Guided painting session.", cpaInr: 150 },
  { id: "pun-food-kharadi", name: "Misal Junction", city: "Pune", area: "Kharadi", kind: "food", priceForTwo: 350, perk: "Free chaas", blurb: "Spicy misal, fast and friendly.", cpaInr: 50 },
];

const WOMEN = ["Meera", "Kavya", "Ishita", "Riya", "Ananya", "Sneha", "Pooja", "Nandini", "Aditi", "Sana", "Tanvi", "Lavanya", "Divya", "Harini", "Shreya", "Neha", "Fatima", "Priyanka", "Bhavana", "Keerthi", "Swathi", "Ritika", "Mansi", "Gauri", "Sakshi", "Anjali", "Tejal", "Zoya", "Mrunal", "Pallavi"];
const MEN = ["Rohan", "Karthik", "Vikram", "Arjun", "Siddharth", "Rahul", "Nikhil", "Aditya", "Varun", "Sameer", "Harsha", "Pranav", "Imran", "Manoj", "Akash", "Kiran", "Rajat", "Suresh", "Tarun", "Yash", "Abhishek", "Naveen", "Omkar", "Saurabh", "Gaurav", "Ritesh", "Faizan", "Chetan", "Deepak", "Vivek"];
const NONBINARY = ["Ari", "Sam"];
const JOBS = ["Software Engineer", "SDE 1", "QA Engineer", "Data Analyst", "Associate Consultant", "DevOps Engineer", "UX Designer", "Product Analyst", "Business Analyst", "Support Engineer", "ML Engineer", "Frontend Developer"];
const COMPANIES = ["Kestrel Systems", "Bluefin Labs", "Northwind Tech", "Ardent Software", "Mapleleaf Analytics", "Quanta Services", "Riverbend Infotech", "Saffron Cloud"];
const LANGS_BY_CITY: Record<string, string[]> = {
  Bengaluru: ["Kannada", "Telugu", "Tamil", "Hindi", "Malayalam"],
  Hyderabad: ["Telugu", "Hindi", "Tamil"],
  Pune: ["Marathi", "Hindi", "Gujarati"],
};
const PROMPT_ANSWERS: Record<string, string[]> = {
  "A perfect first date for me is…": ["Filter coffee, a long walk, and nobody checking their phone.", "Board games. You learn a lot about someone from how they lose.", "Street food crawl, my treat if you pick the spots.", "A bookshop, then arguing about the books over chai.", "Something with our hands: pottery, cooking, anything."],
  "I moved to this city for…": ["My first job. Stayed for the weather.", "A 3-month project that's now 3 years.", "Work, but the food is why I'm staying.", "Placement. Still learning which bus goes where."],
  "The way to win me over is…": ["Remember the small things I mention.", "Good playlists and better questions.", "Be on time. Seriously.", "Share your fries without asking."],
  "My most controversial food opinion…": ["Pineapple belongs on pizza and I'll defend it.", "Idli is better than dosa. Fight me.", "Maggi is a full meal.", "Biryani with potato is the correct biryani."],
  "This year I really want to…": ["Finish a half marathon.", "Learn to cook five dishes properly.", "Travel somewhere solo.", "Switch teams to something with ML."],
  "You'll know I like you when…": ["I send you a song with no explanation.", "I start planning the second date during the first.", "I ask you to meet my very loud friends.", "I share my secret food spot."],
};

function pick<T>(r: () => number, arr: T[]) {
  return arr[Math.floor(r() * arr.length)];
}
function some<T>(r: () => number, arr: T[], min: number, max: number) {
  const n = min + Math.floor(r() * (max - min + 1));
  return [...arr].sort(() => r() - 0.5).slice(0, n);
}
function birth(r: () => number, minAge = 22, maxAge = 28) {
  const now = new Date();
  const age = minAge + Math.floor(r() * (maxAge - minAge + 1));
  const d = new Date(Date.UTC(now.getUTCFullYear() - age, Math.floor(r() * 12), 1 + Math.floor(r() * 27)));
  if (d > new Date(Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate()))) d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
function answers(r: () => number) {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, { a: Math.floor(r() * q.options.length), w: Math.floor(r() * 3) }]));
}
function prompts(r: () => number): Prompt[] {
  const qs = some(r, Object.keys(PROMPT_ANSWERS), 2, 2);
  return qs.map((q) => ({ q, a: pick(r, PROMPT_ANSWERS[q]) }));
}
const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 36e5);
const token = () => randomBytes(12).toString("base64url");
// Seeded history always counts as an earlier day, so it never blocks today's fresh batch of intros
const dayOf = (d: Date) => (istDay(d) < istDay() ? istDay(d) : istDay(new Date(Date.now() - 864e5)));

export async function resetDemoData() {
  // 1. Remove everything that belongs to the demo world (cascades to matches, messages, plans...)
  // (the admin account is kept, so an admin pressing "reset" stays signed in)
  // Keeps only the current admin, so an admin pressing "reset" stays signed in. Older demo accounts are removed.
  await db.delete(schema.users).where(or(and(eq(schema.users.isDemo, true), ne(schema.users.email, "admin@unswipe.test")), eq(schema.users.isPersona, true)));
  await db.delete(schema.events);
  // Seeded example rows all use an "@seed." email, so they can be told apart from real ones
  await db.delete(schema.grievances).where(like(schema.grievances.email, "%@seed.%"));
  await db.delete(schema.waitlist).where(like(schema.waitlist.email, "%@seed.%"));

  // 2. Venues are upserted (stable ids), so plans made by real accounts keep working
  for (const v of VENUES) {
    await db.insert(schema.venues).values(v).onConflictDoUpdate({ target: schema.venues.id, set: v });
  }

  const r = rng(20261117);
  const lockedHash = await bcrypt.hash(randomBytes(24).toString("hex"), 8); // personas can never sign in
  const demoHash = await bcrypt.hash("unswipe123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);

  // 3. Personas: spread across the three live cities
  type P = typeof schema.profiles.$inferInsert & { email: string };
  const personas: P[] = [];
  const plan: [string, number, number][] = [["Bengaluru", 20, 20], ["Hyderabad", 6, 6], ["Pune", 4, 4]];
  let wi = 0;
  let mi = 0;
  for (const [city, nw, nm] of plan) {
    for (let i = 0; i < nw + nm; i++) {
      const woman = i < nw;
      const name = woman ? WOMEN[wi++ % WOMEN.length] : MEN[mi++ % MEN.length];
      personas.push({
        email: `${name.toLowerCase()}.${city.slice(0, 3).toLowerCase()}${i}@persona.unswipe.test`,
        userId: "",
        name,
        birthDate: birth(r),
        gender: woman ? "woman" : "man",
        interestedIn: [woman ? "man" : "woman"],
        city,
        area: pick(r, AREAS[city]),
        company: pick(r, COMPANIES),
        jobTitle: pick(r, JOBS),
        gradYear: 2020 + Math.floor(r() * 4),
        hideFromCompany: r() > 0.3,
        intent: pick(r, ["long_term", "long_term", "marriage", "open"] as const),
        about: "",
        prompts: prompts(r),
        dateStyles: some(r, ["coffee", "food", "walk", "activity"], 1, 3),
        availability: some(r, ["weekday_eve", "sat", "sun"], 1, 3),
        languages: ["English", ...some(r, LANGS_BY_CITY[city], 1, 2)],
        answers: answers(r),
        avatarSeed: Math.floor(r() * 1000),
        ageMin: 21,
        ageMax: 32,
      });
    }
  }
  // Two non-binary members in Bengaluru, open to everyone
  for (const name of NONBINARY) {
    personas.push({
      email: `${name.toLowerCase()}@persona.unswipe.test`, userId: "", name, birthDate: birth(r), gender: "nonbinary",
      interestedIn: ["woman", "man", "nonbinary"], city: "Bengaluru", area: pick(r, AREAS.Bengaluru), company: pick(r, COMPANIES),
      jobTitle: pick(r, JOBS), gradYear: 2021, hideFromCompany: true, intent: "long_term", about: "", prompts: prompts(r),
      dateStyles: ["coffee", "activity"], availability: ["sat", "sun"], languages: ["English", "Hindi"], answers: answers(r),
      avatarSeed: Math.floor(r() * 1000), ageMin: 21, ageMax: 32,
    });
  }

  const insertedUsers = await db
    .insert(schema.users)
    .values(
      personas.map((p) => ({
        email: p.email,
        passwordHash: lockedHash,
        onboardingStep: "done" as const,
        elitmusVerified: true,
        gradYear: p.gradYear,
        workEmailVerified: r() > 0.5,
        consentVersion: "2026-11-v1",
        consentAt: hoursAgo(24 * 20),
        isPersona: true,
        createdAt: hoursAgo(24 * (5 + Math.floor(r() * 40))),
      })),
    )
    .returning();
  personas.forEach((p, i) => (p.userId = insertedUsers[i].id));
  await db.insert(schema.profiles).values(personas.map(({ email: _e, ...p }) => p));

  // 4. Shared demo accounts
  await db
    .insert(schema.users)
    .values({ email: "admin@unswipe.test", passwordHash: adminHash, role: "admin", onboardingStep: "done", isDemo: true })
    .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash: adminHash, role: "admin", status: "active" } });
  const [aaravU, diyaU] = await db
    .insert(schema.users)
    .values([
      { email: "aarav@unswipe.test", passwordHash: demoHash, onboardingStep: "done", elitmusVerified: true, gradYear: 2022, workEmail: "aarav@kestrel.example", workEmailVerified: true, consentVersion: "2026-11-v1", consentAt: hoursAgo(24 * 9), isDemo: true, createdAt: hoursAgo(24 * 9) },
      { email: "diya@unswipe.test", passwordHash: demoHash, onboardingStep: "done", elitmusVerified: true, gradYear: 2023, consentVersion: "2026-11-v1", consentAt: hoursAgo(24 * 7), isDemo: true, createdAt: hoursAgo(24 * 7) },
    ])
    .returning();

  const aarav = {
    userId: aaravU.id, name: "Aarav", birthDate: birth(rng(1), 25, 25), gender: "man" as const, interestedIn: ["woman"], city: "Bengaluru", area: "Indiranagar",
    company: "Kestrel Systems", jobTitle: "SDE 1", gradYear: 2022, hideFromCompany: true, intent: "long_term" as const,
    about: "Moved from Vizag for work. Weekend trekker, weekday overthinker.",
    prompts: [{ q: "A perfect first date for me is…", a: "Filter coffee, then a walk where we both forget to check our phones." }, { q: "My most controversial food opinion…", a: "Pesarattu beats masala dosa. I will not be taking questions." }],
    dateStyles: ["coffee", "walk", "activity"], availability: ["weekday_eve", "sat"], languages: ["English", "Hindi", "Telugu"],
    answers: { sunday: { a: 0, w: 2 }, money: { a: 1, w: 1 }, five_years: { a: 0, w: 1 }, family: { a: 1, w: 2 }, kids: { a: 0, w: 2 }, food: { a: 2, w: 0 }, drinks: { a: 1, w: 1 }, career: { a: 1, w: 1 } },
    avatarSeed: 7, ageMin: 21, ageMax: 28,
  };
  const diya = {
    userId: diyaU.id, name: "Diya", birthDate: birth(rng(2), 24, 24), gender: "woman" as const, interestedIn: ["man"], city: "Bengaluru", area: "Koramangala",
    company: "Bluefin Labs", jobTitle: "Data Analyst", gradYear: 2023, hideFromCompany: true, intent: "long_term" as const,
    about: "Spreadsheets by day, sourdough experiments by night.",
    prompts: [{ q: "The way to win me over is…", a: "Recommend me a book and actually want to talk about it." }, { q: "This year I really want to…", a: "Run my first 10K without walking." }],
    dateStyles: ["coffee", "food", "walk"], availability: ["weekday_eve", "sat", "sun"], languages: ["English", "Hindi", "Kannada"],
    answers: { sunday: { a: 0, w: 1 }, money: { a: 0, w: 1 }, five_years: { a: 0, w: 1 }, family: { a: 1, w: 1 }, kids: { a: 0, w: 2 }, food: { a: 0, w: 1 }, drinks: { a: 1, w: 0 }, career: { a: 1, w: 2 } },
    avatarSeed: 12, ageMin: 23, ageMax: 30,
  };
  await db.insert(schema.profiles).values([aarav, diya]);

  const byName = (name: string, city = "Bengaluru") => personas.find((p) => p.name === name && p.city === city)!;
  const profileOf = (id: string) => [aarav, diya, ...personas].find((p) => p.userId === id)!;

  // Helpers to build history
  const introPair = async (a: string, b: string, when: Date, actionA: "interested" | "passed" = "interested", actionB: "interested" | "passed" | "pending" = "interested") => {
    const pa = profileOf(a);
    const pb = profileOf(b);
    const c = compatibility(pa as never, pb as never);
    await db.insert(schema.intros).values([
      { viewerId: a, candidateId: b, day: dayOf(when), score: c.score, reasons: c.reasons, action: actionA, actedAt: when },
      { viewerId: b, candidateId: a, day: dayOf(when), score: c.score, reasons: c.reasons, action: actionB, actedAt: actionB === "pending" ? null : when },
    ]).onConflictDoNothing();
    return c;
  };
  const match = async (a: string, b: string, created: Date, status: "active" | "planned" | "expired" | "closed", expires: Date, extra: Partial<typeof schema.matches.$inferInsert> = {}) => {
    const [userA, userB] = [a, b].sort();
    const [m] = await db.insert(schema.matches).values({ userA, userB, createdAt: created, status, expiresAt: expires, ...extra }).returning();
    await db.insert(schema.messages).values({ matchId: m.id, senderId: null, body: "You matched! You have 72 hours to agree on a first date. Say hi, then use \"Plan a date\" below.", createdAt: created });
    return m;
  };
  const say = (matchId: string, senderId: string | null, body: string, at: Date) => db.insert(schema.messages).values({ matchId, senderId, body, createdAt: at });

  const A = aaravU.id;
  const D = diyaU.id;
  const meera = byName("Meera").userId;
  const kavya = byName("Kavya").userId;
  const ishita = byName("Ishita").userId;
  const riya = byName("Riya").userId;
  const rohan = byName("Rohan").userId;
  const karthik = byName("Karthik").userId;
  const vikram = byName("Vikram").userId;

  // Aarav <-> Diya: confirmed date in two days (both demo accounts, so both sides can be seen)
  await introPair(A, D, hoursAgo(40));
  const mAD = await match(A, D, hoursAgo(40), "planned", hoursFromNow(32));
  await say(mAD.id, D, "Hi Aarav! A fellow 'outdoor Sundays' person. Which trek was your last one?", hoursAgo(39));
  await say(mAD.id, A, "Skandagiri, the night trek! Got rained on, zero regrets. You?", hoursAgo(38));
  await say(mAD.id, D, "Haha, Savandurga. Okay, coffee first and trek stories second? I suggested Thursday.", hoursAgo(37));
  await say(mAD.id, null, "Diya suggested a date at Kaapi Corner, Indiranagar.", hoursAgo(37));
  await db.insert(schema.datePlans).values({ matchId: mAD.id, proposerId: D, venueId: "blr-brewhouse-indiranagar", slots: [istAt(2, 19, 30).toISOString(), istAt(4, 11, 0).toISOString()], chosenSlot: istAt(2, 19, 30), status: "confirmed", note: "I'll be the one with the yellow tote bag", shareToken: token(), createdAt: hoursAgo(37), respondedAt: hoursAgo(36) });
  await say(mAD.id, null, "Date confirmed! You can now share numbers in chat if you want to. Tip: send the plan to a friend.", hoursAgo(36));
  await say(mAD.id, A, "See you Thursday 🙂", hoursAgo(35));

  // Aarav <-> Meera: matched 20h ago, chatting, no plan yet (Aarav can try the planner)
  await introPair(A, meera, hoursAgo(20));
  const mAM = await match(A, meera, hoursAgo(20), "active", hoursFromNow(52));
  await say(mAM.id, meera, "Hey Aarav! Pesarattu over masala dosa is a bold opener. Respect.", hoursAgo(19));
  await say(mAM.id, A, "Someone had to say it. Where do you stand?", hoursAgo(18));
  await say(mAM.id, meera, "Team dosa, but I'm open to being convinced over coffee 😄", hoursAgo(17));

  // Aarav <-> Kavya: Kavya suggested a date, Aarav needs to pick a time
  await introPair(A, kavya, hoursAgo(30));
  const mAK = await match(A, kavya, hoursAgo(30), "active", hoursFromNow(42));
  await say(mAK.id, kavya, "Hi! Board games person here. Fair warning: I'm very competitive at Codenames.", hoursAgo(29));
  await say(mAK.id, A, "Good, I need someone to finally beat me.", hoursAgo(28));
  await db.insert(schema.datePlans).values({ matchId: mAK.id, proposerId: kavya, venueId: "blr-boardgames-bellandur", slots: [istAt(3, 19, 30).toISOString(), istAt(5, 17, 0).toISOString(), istAt(6, 17, 0).toISOString()], status: "proposed", shareToken: token(), createdAt: hoursAgo(3) });
  await say(mAK.id, null, "Kavya suggested a date at Dice & Dine, Bellandur.", hoursAgo(3));

  // Aarav <-> Ishita: date was yesterday, waiting for Aarav's private check-in
  await introPair(A, ishita, hoursAgo(80));
  const mAI = await match(A, ishita, hoursAgo(80), "planned", hoursAgo(8));
  await say(mAI.id, ishita, "Chapter & Chai tomorrow works for me!", hoursAgo(60));
  await db.insert(schema.datePlans).values({ matchId: mAI.id, proposerId: A, venueId: "blr-bookcafe-koramangala", slots: [istAt(-1, 19, 30).toISOString()], chosenSlot: istAt(-1, 19, 30), status: "confirmed", shareToken: token(), createdAt: hoursAgo(62), respondedAt: hoursAgo(60) });
  await say(mAI.id, null, "Date confirmed! You can now share numbers in chat if you want to. Tip: send the plan to a friend.", hoursAgo(60));

  // Aarav <-> Riya: expired without a plan
  await introPair(A, riya, hoursAgo(24 * 6));
  const mAR = await match(A, riya, hoursAgo(24 * 6), "expired", hoursAgo(24 * 3));
  await say(mAR.id, riya, "Hi!", hoursAgo(24 * 6 - 1));
  await say(mAR.id, null, "This match expired because no date was agreed in time. No hard feelings, new intros arrive daily.", hoursAgo(24 * 3));

  // Diya <-> Rohan: chatting
  await introPair(D, rohan, hoursAgo(10));
  const mDR = await match(D, rohan, hoursAgo(10), "active", hoursFromNow(62));
  await say(mDR.id, rohan, "Hi Diya! What's the sourdough starter's name? Every starter needs a name.", hoursAgo(9));
  // Diya <-> Karthik: Karthik suggested a date
  await introPair(D, karthik, hoursAgo(26));
  const mDK = await match(D, karthik, hoursAgo(26), "active", hoursFromNow(46));
  await say(mDK.id, karthik, "Lake walk this weekend? It's free and the sunset is lovely.", hoursAgo(5));
  await db.insert(schema.datePlans).values({ matchId: mDK.id, proposerId: karthik, venueId: "blr-lake-hsr", slots: [istAt(4, 17, 0).toISOString(), istAt(5, 10, 30).toISOString()], status: "proposed", shareToken: token(), createdAt: hoursAgo(5) });
  await say(mDK.id, null, "Karthik suggested a date at Agara Lake Loop, HSR Layout.", hoursAgo(5));
  // Diya <-> Vikram: past date waiting for check-in
  await introPair(D, vikram, hoursAgo(90));
  const mDV = await match(D, vikram, hoursAgo(90), "planned", hoursAgo(10));
  await db.insert(schema.datePlans).values({ matchId: mDV.id, proposerId: vikram, venueId: "blr-dosa-whitefield", slots: [istAt(-1, 11, 0).toISOString()], chosenSlot: istAt(-1, 11, 0), status: "confirmed", shareToken: token(), createdAt: hoursAgo(70), respondedAt: hoursAgo(68) });
  await say(mDV.id, null, "Date confirmed! You can now share numbers in chat if you want to. Tip: send the plan to a friend.", hoursAgo(68));

  // A couple of personas already like Aarav and Diya (they'll surface in daily intros)
  const reserved = new Set([meera, kavya, ishita, riya, rohan, karthik, vikram]);

  // 5. Background activity between personas over the last 3 weeks, so the admin dashboard has real shape
  for (const city of CITIES) {
    const women = personas.filter((p) => p.city === city && p.gender === "woman" && !reserved.has(p.userId!));
    const men = personas.filter((p) => p.city === city && p.gender === "man" && !reserved.has(p.userId!));
    const cityVenues = VENUES.filter((v) => v.city === city);
    for (const w of women) {
      const partners = some(r, men, 1, 3);
      for (const m of partners) {
        const when = hoursAgo(24 * (2 + Math.floor(r() * 19)));
        const roll = r();
        if (roll < 0.35) {
          await introPair(w.userId!, m.userId!, when, "passed", r() > 0.5 ? "interested" : "passed");
          continue;
        }
        await introPair(w.userId!, m.userId!, when);
        const outcome = r();
        if (outcome < 0.2) {
          await match(w.userId!, m.userId!, when, "expired", new Date(when.getTime() + 72 * 36e5));
          continue;
        }
        const mm = await match(w.userId!, m.userId!, when, "planned", new Date(when.getTime() + 72 * 36e5));
        const venue = pick(r, cityVenues);
        const slot = new Date(when.getTime() + (30 + Math.floor(r() * 40)) * 36e5);
        const [p] = await db.insert(schema.datePlans).values({ matchId: mm.id, proposerId: r() > 0.5 ? w.userId! : m.userId!, venueId: venue.id!, slots: [slot.toISOString()], chosenSlot: slot, status: "confirmed", shareToken: token(), createdAt: when, respondedAt: when }).returning();
        if (slot > new Date()) continue;
        const met = r() > 0.12;
        const againW = met && r() > 0.45;
        const againM = met && r() > 0.4;
        const fbAt = new Date(slot.getTime() + 4 * 36e5);
        await db.insert(schema.feedback).values([
          { planId: p.id, userId: w.userId!, met: met ? "yes" : "they_no_show", again: againW, feltSafe: true, createdAt: fbAt },
          { planId: p.id, userId: m.userId!, met: met ? "yes" : "cancelled", again: againM, feltSafe: true, createdAt: fbAt },
        ]);
        if (againW && againM) await db.update(schema.matches).set({ secondDateUnlocked: true, status: "active", expiresAt: hoursFromNow(24 * 5) }).where(eq(schema.matches.id, mm.id));
      }
    }
  }

  // 6. Socials (equal seats per side), with some seats already taken
  const evs = await db
    .insert(schema.events)
    .values([
      { title: "Board game night for 16", city: "Bengaluru", venueId: "blr-boardgames-bellandur", startsAt: istAt(3, 19, 0), priceInr: 349, seatsPerSide: 8, description: "Teams are mixed every round, so you'll talk to everyone. A host keeps things moving." },
      { title: "Sunday pottery social", city: "Bengaluru", venueId: "blr-pottery-jayanagar", startsAt: istAt(5, 11, 0), priceInr: 449, seatsPerSide: 6, description: "Make a mug, make a friend. Clay, aprons and chai included." },
      { title: "Book swap and coffee", city: "Bengaluru", venueId: "blr-bookcafe-koramangala", startsAt: istAt(8, 17, 30), priceInr: 299, seatsPerSide: 10, description: "Bring a book you loved and leave with someone else's favourite." },
      { title: "Bowling league, first night", city: "Hyderabad", venueId: "hyd-bowling-kondapur", startsAt: istAt(4, 19, 0), priceInr: 399, seatsPerSide: 8, description: "Mixed teams of four. No skill needed." },
      { title: "Paint & sip evening", city: "Pune", venueId: "pun-art-kp", startsAt: istAt(6, 18, 0), priceInr: 449, seatsPerSide: 6, description: "A guided canvas, music and mocktails." },
    ])
    .returning();
  for (const ev of evs) {
    const cityPeople = personas.filter((p) => p.city === ev.city);
    const goers = some(r, cityPeople, 2, 5);
    const counts: Record<string, number> = {};
    for (const g of goers) {
      counts[g.gender] = (counts[g.gender] ?? 0) + 1;
      if (counts[g.gender] > ev.seatsPerSide - 2) continue;
      await db.insert(schema.tickets).values({ eventId: ev.id, userId: g.userId!, amountInr: ev.priceInr, createdAt: hoursAgo(24 * r() * 3) }).onConflictDoNothing();
    }
  }

  // 7. Moderation queue, grievance and waitlist examples
  const sameer = byName("Sameer").userId;
  const sneha = byName("Sneha").userId;
  const nikhil = byName("Nikhil").userId;
  const pooja = byName("Pooja").userId;
  await db.insert(schema.reports).values([
    { reporterId: sneha, reportedId: sameer, reason: "Asked for money or investments", details: "Kept talking about a crypto 'opportunity' and asked me to download an app.", priority: "urgent", createdAt: hoursAgo(5) },
    { reporterId: pooja, reportedId: nikhil, reason: "Didn't turn up (no-show)", details: "Waited 40 minutes, no message.", priority: "normal", createdAt: hoursAgo(20) },
  ]);
  await db.insert(schema.grievances).values({ email: "user1@seed.unswipe.test", subject: "Please remove my old photo", body: "I deleted a photo but want confirmation it is gone from your servers too.", createdAt: hoursAgo(14) });
  const wl: [string, string, number][] = [["Chennai", "woman", 34], ["Chennai", "man", 61], ["Gurugram", "woman", 22], ["Gurugram", "man", 48], ["Mumbai", "woman", 18], ["Mumbai", "man", 27]];
  const rows = wl.flatMap(([city, gender, n]) => Array.from({ length: n }, (_, i) => ({ email: `${city.toLowerCase()}.${gender}.${i}@seed.unswipe.test`, city, gender, createdAt: hoursAgo(r() * 24 * 20) })));
  await db.insert(schema.waitlist).values(rows).onConflictDoNothing();

  return { personas: personas.length, demo: 3 };
}

/** Used by the migration script: only seed an empty database. */
export async function seedIfEmpty() {
  const rows = await db.select({ id: schema.users.id }).from(schema.users).where(inArray(schema.users.email, ["admin@unswipe.test"])).limit(1);
  if (rows.length) return false;
  await resetDemoData();
  return true;
}
