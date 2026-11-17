import {
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/*
 * Data model for Offline.
 * Rule of thumb: store only what the product needs (DPDP "data minimisation").
 * We never store eLitmus test scores - only a verified yes/no and graduation year.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<"user" | "admin">().notNull().default("user"),
  // active = visible in intros, snoozed = hidden by choice, suspended = hidden by moderation
  status: text("status").$type<"active" | "snoozed" | "suspended">().notNull().default("active"),
  onboardingStep: text("onboarding_step")
    .$type<"verify" | "consent" | "profile" | "values" | "done">()
    .notNull()
    .default("verify"),
  // sha256 of the eLitmus candidate id: lets us enforce "one person, one account" without storing the id
  elitmusHash: text("elitmus_hash").unique(),
  gradYear: integer("grad_year"),
  elitmusVerified: boolean("elitmus_verified").notNull().default(false),
  workEmail: text("work_email"),
  workEmailVerified: boolean("work_email_verified").notNull().default(false),
  workEmailCode: text("work_email_code"),
  consentVersion: text("consent_version"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  noShows: integer("no_shows").notNull().default(0), // reported no-shows lower visibility
  plus: boolean("plus").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false), // shared evaluator accounts (protected)
  isPersona: boolean("is_persona").notNull().default(false), // seeded profiles that auto-respond
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Answer = { a: number; w: number }; // a = option index, w = importance 0..2
export type Prompt = { q: string; a: string };

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthDate: date("birth_date").notNull(),
  gender: text("gender").$type<"man" | "woman" | "nonbinary">().notNull(),
  interestedIn: text("interested_in").array().notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  company: text("company"),
  jobTitle: text("job_title"),
  gradYear: integer("grad_year").notNull(),
  hideFromCompany: boolean("hide_from_company").notNull().default(true),
  intent: text("intent").$type<"long_term" | "marriage" | "open">().notNull(),
  about: text("about").notNull().default(""),
  prompts: jsonb("prompts").$type<Prompt[]>().notNull().default([]),
  dateStyles: text("date_styles").array().notNull().default([]),
  availability: text("availability").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  answers: jsonb("answers").$type<Record<string, Answer>>().notNull().default({}),
  photo: text("photo"), // small data URL, resized in the browser
  avatarSeed: integer("avatar_seed").notNull().default(0),
  ageMin: integer("age_min").notNull().default(21),
  ageMax: integer("age_max").notNull().default(32),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie token, so a DB leak can't be replayed
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const intros = pgTable(
  "intros",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    viewerId: uuid("viewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // IST calendar day, e.g. 2026-11-17
    score: integer("score").notNull(),
    reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
    action: text("action").$type<"pending" | "interested" | "passed">().notNull().default("pending"),
    actedAt: timestamp("acted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("intros_pair").on(t.viewerId, t.candidateId),
    index("intros_candidate_day").on(t.candidateId, t.day),
  ],
);

export const venues = pgTable("venues", {
  id: text("id").primaryKey(), // stable slug so demo resets keep references
  name: text("name").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  kind: text("kind").$type<"cafe" | "food" | "walk" | "activity">().notNull(),
  priceForTwo: integer("price_for_two").notNull(),
  perk: text("perk"),
  isPartner: boolean("is_partner").notNull().default(true),
  cpaInr: integer("cpa_inr").notNull().default(75), // what the venue pays us per confirmed date
  blurb: text("blurb").notNull(),
});

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userA: uuid("user_a")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userB: uuid("user_b")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<"active" | "planned" | "expired" | "closed">().notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    extendRequests: text("extend_requests").array().notNull().default([]),
    extended: boolean("extended").notNull().default(false),
    secondDateUnlocked: boolean("second_date_unlocked").notNull().default(false),
  },
  (t) => [uniqueIndex("matches_pair").on(t.userA, t.userB)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }), // null = system note
    body: text("body").notNull(),
    masked: boolean("masked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_match").on(t.matchId, t.createdAt)],
);

export const datePlans = pgTable("date_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  proposerId: uuid("proposer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id),
  slots: jsonb("slots").$type<string[]>().notNull(), // ISO timestamps offered by the proposer
  chosenSlot: timestamp("chosen_slot", { withTimezone: true }),
  status: text("status").$type<"proposed" | "confirmed" | "declined" | "cancelled">().notNull().default("proposed"),
  note: text("note"),
  shareToken: text("share_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => datePlans.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    met: text("met").$type<"yes" | "they_no_show" | "cancelled">().notNull(),
    again: boolean("again").notNull().default(false),
    feltSafe: boolean("felt_safe").notNull().default(true),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("feedback_once").on(t.planId, t.userId)],
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reportedId: uuid("reported_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details"),
  priority: text("priority").$type<"normal" | "urgent">().notNull().default("normal"),
  status: text("status").$type<"open" | "actioned" | "dismissed">().notNull().default("open"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  city: text("city").notNull(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  priceInr: integer("price_inr").notNull(),
  seatsPerSide: integer("seats_per_side").notNull(), // equal seats for men and women keeps rooms balanced
  description: text("description").notNull(),
});

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountInr: integer("amount_inr").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tickets_once").on(t.eventId, t.userId)],
);

export const grievances = pgTable("grievances", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").$type<"open" | "resolved">().notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  city: text("city").notNull(),
  gender: text("gender").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type DatePlan = typeof datePlans.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Message = typeof messages.$inferSelect;
