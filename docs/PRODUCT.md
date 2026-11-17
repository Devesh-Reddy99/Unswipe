# Offline — product thinking

> One line: **a dating app for verified early-career graduates that measures success by real first dates, not swipes.**

This document explains *why* the product is built the way it is. Every feature below exists because of a specific problem.

---

## 1. The problem (what we observed)

| Observation | Source | What it means for us |
|---|---|---|
| Only ~26% of users on Indian dating apps are women (≈3 men per woman). Men complain of no matches; women complain of being flooded. | Woo survey of 20,000 urban Indians (via Quartz) | Unlimited swiping makes the imbalance *worse*. We need to cap attention, not sell more of it. |
| 2 out of 3 users of dating/matrimony apps have **never had an in-person meeting**. | Juleo × YouGov India report, 2024 | Apps optimise for time-in-app. Nobody owns the step from "match" to "meet". |
| 78% of women on these apps have met fake profiles; 74% of users want their profile visible only to people they choose. | Juleo × YouGov 2024 | Trust and control matter more than reach. |
| 60% of Indians have received an invite to a fake dating app/site; ages 25–34 are the most targeted by scams. | McAfee India, Feb 2026 | Our exact audience (2020–23 graduates, now ~23–28) is the most targeted group. Verification is a must-have. |
| ~78% of dating-app users report burnout; Tinder itself is adding in-person events. | Forbes Health 2025 (via Global Dating Insights); industry reporting | The market is moving towards real-world meeting. |

## 2. Why eLitmus can win this (our unfair advantages)

1. **Verified identity at scale.** More than 1M graduates (2020–23) took a proctored test with ID checks. Every member of Offline is a real, identity-checked person. Fake profiles are the #1 complaint, and this removes them almost for free.
2. **A known audience.** They are early-career, mostly in IT, and recently moved to Bengaluru, Hyderabad, Pune, Chennai or NCR for work. New city, new job, small social circle.
3. **Distribution.** We can reach these users through eLitmus email and dashboard at near-zero cost, so we don't pay app-store ad prices.

**Things we deliberately do NOT use:** test scores, percentiles or any hiring data. That data was collected for hiring. Under India's DPDP Act it can't be reused for dating without a fresh, specific consent, and using it would be creepy anyway. Offline only receives a *yes/no "verified"* flag and the graduation year, and only after the user gives separate consent. Employers never see dating data.

## 3. The product: "Dates, not swipes"

North-star metric: **good first dates per week**. A good first date means both people turned up and at least one wants to meet again.

| Feature | The problem it solves |
|---|---|
| **eLitmus-verified only** (+ optional work-email badge) | Fake profiles and catfishing |
| **5 intros a day**, picked for you, no swiping | Swipe fatigue; makes each person feel considered |
| **Fair exposure**: each profile appears in at most 6 other people's daily intros, and people with many pending likes are shown less | The 3:1 imbalance. Women aren't flooded, and men aren't invisible because a top 10% takes all the attention |
| **Compatibility with reasons** ("You both picked: weekend treks") from 8 values questions + intent + date style | Shallow photo-only judging; gives an easy conversation opener |
| **Intent tags** (Long-term / Marriage in 1–3 yrs / See where it goes) | Mismatched expectations |
| **72-hour plan window.** After a match you have 72 hours to agree a date (one 48-hour extension if both want it) | Endless pen-pal chats and ghosting. Creates gentle urgency |
| **Date planner** with partner venues (cafés, walks, activities) in your area, plus slot picking | The awkward "so… where?" step. Also our main revenue engine |
| **Safety layer.** Phone numbers and links are hidden until a date is confirmed; a share-my-date link for a trusted friend; report/block everywhere | Women's safety, scams that move users off-platform early |
| **Private post-date check-in** (did you meet? would you meet again? did you feel safe?) | Gives us real quality data. Repeated no-shows reduce your visibility; "felt unsafe" goes straight to moderation |
| **Hide me from my company** (on by default) | Office awkwardness, a real fear for people whose colleagues are on the same platform |
| **Socials**: small, gender-balanced mixers at partner venues | Cold start in new cities, and people who prefer meeting in a group first |
| **Snooze, data download, account deletion** in two taps | DPDP rights; trust |

## 4. How it makes money (when users don't want to pay)

**Rule:** we never sell visibility, likes or "boosts". Pay-to-win breaks fairness, and fairness is the product.

1. **Venue partners (main stream).** Cafés and activity venues pay a fee per *confirmed* date booked at their venue (₹75 in this model). They get weekday footfall from a high-intent, salaried audience. In return, our users get a perk (e.g. 15% off). Users pay nothing extra and actually save money.
2. **Socials tickets.** ₹299–₹449 per seat for small mixers. People already pay for events, and the venue covers the space in exchange for food and drink spending.
3. **Offline Plus (₹199/month, optional).** Convenience only: Travel mode (get intros in a city before you move there), longer plan windows, a full compatibility breakdown, priority booking for socials. Nothing that affects who sees whom.
4. **Later: experiences marketplace.** Pottery-for-two, workshops and treks, at a 15–20% commission.

The illustrative numbers below are **hypotheses**, not data.

One city with 15,000 active members:
- ~2,000 confirmed dates/month × ₹75 = **₹1.5 lakh**
- 8 socials/month × 40 seats × ~₹200 net = **₹64k**
- 3% on Plus × ₹199 = **₹90k**

Total: ~₹3 lakh/month per city before experiences. Costs are low because acquisition comes through eLitmus's own channels.

## 5. Go-to-market and scaling

- **Phase 0 (Weeks 0–6): Bengaluru only**, where the density of IT freshers is highest.
  - Opt-in campaign to eLitmus 2020–23 users in Bengaluru, through email and a dashboard banner.
  - **Gender-balanced admission:** a waitlist that admits people in cohorts so the ratio stays under 1.5:1. Members get two invites to bring friends.
  - Sign ~30 partner venues across 4–5 IT localities (Koramangala, Indiranagar, HSR, Whitefield, Electronic City).
  - Run 2 socials a week to create density.
- **Phase 1 (Months 2–6):** Hyderabad, Pune, Chennai, NCR, using the same playbook. Venue sales repeats city by city.
  - Referral loop: "bring a friend to a social".
  - Opt-in success stories.
- **Phase 2:** open to non-eLitmus graduates through other verification (e.g. DigiLocker document check plus selfie liveness). Add the experiences marketplace and a self-serve venue portal.
- **What we watch:**
  - North-star: good first dates per week.
  - Funnel: intro → mutual interest → plan confirmed → met → wants to meet again.
  - Guardrails: women's 30-day retention, gender ratio per city, report rate, no-show rate.

## 6. Legal and trust

- **18+ only**, confirmed by date of birth (eLitmus users are graduates, so they are already adults).
- **DPDP Act 2023 + DPDP Rules 2025** (Rules notified 13 Nov 2025, with phased enforcement):
  - Standalone, plain-language consent notice, separate from eLitmus's hiring consent.
  - Purpose limitation: no test scores.
  - Withdrawing consent is as easy as giving it (delete account).
  - Self-serve data download and correction.
  - Grievances answered well within the 90-day limit.
- **IT (Intermediary) Rules 2021:**
  - Named Grievance Officer.
  - Acknowledge complaints within 24 hours and resolve within 15 days.
  - Remove intimate or impersonation content within 24 hours of a complaint.
  - In-app report and block.
- **Brand firewall:** "Offline, from the eLitmus family" is a separate product with separate data. Dating data is never shared with employers or used in hiring. This is stated in the Terms.
- **Payments** go through a licensed payment gateway (e.g. Razorpay). We never hold user money in a wallet, so there is no RBI wallet licence issue.
- **Photos and personas in this demo** are illustrated avatars, not real people.

## 7. What we chose NOT to build (and why)

- **Swipe deck:** it is the cause of the problem.
- **Paid boosts / "see who liked you" paywall:** pay-to-win breaks fair exposure.
- **AI chat-reply suggestions:** they make conversations less genuine, and scammers already use AI.
- **Public profile browsing:** 74% of users want control over who sees them.
- **A native app on day one:** a PWA (installable web app) is faster to ship and test. Go native once the core loop is proven.
