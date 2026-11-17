// Product rules live here so they are easy to find, explain and tune.

export const APP_NAME = "Offline";
export const TAGLINE = "Dates, not swipes.";

export const INTROS_PER_DAY = 5; // small, considered batch instead of an endless deck
export const EXPOSURE_CAP = 6; // max other people's batches one profile can appear in per day
export const EXPOSURE_CAP_LOW_RELIABILITY = 3; // after repeated no-shows
export const PLAN_WINDOW_HOURS = 72; // time to agree a date after matching
export const EXTENSION_HOURS = 48; // one extension if both people ask
export const FEEDBACK_AFTER_HOURS = 2; // ask "how did it go?" 2h after the date starts
export const CONSENT_VERSION = "2026-11-v1";
export const PLUS_PRICE_INR = 199;

export const CITIES = ["Bengaluru", "Hyderabad", "Pune"] as const;
export const WAITLIST_CITIES = ["Chennai", "Gurugram", "Noida", "Mumbai", "Kolkata", "Other"] as const;

export const AREAS: Record<string, string[]> = {
  Bengaluru: ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "Electronic City", "Bellandur", "Jayanagar", "Marathahalli"],
  Hyderabad: ["Gachibowli", "Madhapur", "Kondapur", "Banjara Hills", "Kukatpally"],
  Pune: ["Hinjewadi", "Kharadi", "Baner", "Koregaon Park", "Viman Nagar"],
};

export const INTENTS = {
  long_term: "Long-term relationship",
  marriage: "Marriage in 1–3 years",
  open: "Seeing where it goes",
} as const;

export const DATE_STYLES = {
  coffee: "Coffee & conversation",
  food: "Trying a new place to eat",
  walk: "A walk or a park",
  activity: "Doing something (games, pottery, bowling)",
} as const;

export const AVAILABILITY = {
  weekday_eve: "Weekday evenings",
  sat: "Saturdays",
  sun: "Sundays",
} as const;

export const LANGUAGES = ["English", "Hindi", "Kannada", "Telugu", "Tamil", "Malayalam", "Marathi", "Bengali", "Odia", "Gujarati"];

export const PROMPT_QUESTIONS = [
  "A perfect first date for me is…",
  "I moved to this city for…",
  "The way to win me over is…",
  "My most controversial food opinion…",
  "This year I really want to…",
  "You'll know I like you when…",
];

/*
 * Values questions. `kind: "scale"` options are ordered, so nearby answers count as partly similar.
 * `kind: "pick"` options are categories, so only the same answer counts.
 * Each person also says how much the question matters to them (0 = not much, 2 = a lot).
 */
export type Question = { id: string; text: string; options: string[]; kind: "scale" | "pick"; short: string[] };

export const QUESTIONS: Question[] = [
  {
    id: "sunday",
    text: "Your ideal Sunday looks like…",
    options: ["A trek or something outdoors", "A café and a good book", "Friends, food, noise", "Home, series, sleep"],
    short: ["outdoor Sundays", "slow café Sundays", "social Sundays", "cosy home Sundays"],
    kind: "pick",
  },
  {
    id: "money",
    text: "With money, you are more…",
    options: ["Save first, spend later", "A balance of both", "Enjoy it while I'm young"],
    short: ["saving first", "balancing saving and spending", "enjoying it now"],
    kind: "scale",
  },
  {
    id: "five_years",
    text: "In five years you see yourself…",
    options: ["Settled in this city", "Open to moving anywhere", "Back near my hometown"],
    short: ["settling in this city", "being open to moving", "heading back home eventually"],
    kind: "pick",
  },
  {
    id: "family",
    text: "In your relationship, family should be…",
    options: ["Closely involved", "Kept in the loop", "Our decision alone"],
    short: ["family being closely involved", "keeping family in the loop", "deciding as a couple"],
    kind: "scale",
  },
  {
    id: "kids",
    text: "Kids, someday?",
    options: ["Yes", "Maybe", "No"],
    short: ["wanting kids", "being unsure about kids", "not wanting kids"],
    kind: "scale",
  },
  {
    id: "food",
    text: "Your food habits",
    options: ["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegan"],
    short: ["vegetarian", "eggetarian", "non-vegetarian", "vegan"],
    kind: "pick",
  },
  {
    id: "drinks",
    text: "Drinking?",
    options: ["Never", "Socially", "Regularly"],
    short: ["not drinking", "drinking socially", "drinking regularly"],
    kind: "scale",
  },
  {
    id: "career",
    text: "Right now, your career is…",
    options: ["My top priority", "Important, but balanced", "Just one part of life"],
    short: ["career-first right now", "balancing career and life", "life-first"],
    kind: "scale",
  },
];

export const REPORT_REASONS = [
  "Fake profile or not the person in photos",
  "Asked for money or investments",
  "Rude, harassing or sexual messages",
  "Felt unsafe on the date",
  "Didn't turn up (no-show)",
  "Something else",
];
