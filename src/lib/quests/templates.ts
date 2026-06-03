import type { QuestTemplate } from "@/lib/types";
import type { CanonicalTag } from "./tags";

/**
 * Hand-authored quest templates (TECH_SPEC §6). Each maps to real activities
 * via `match_tags` (canonical tags only). `weight` biases the daily spin;
 * `adult_friendly: false` marks kid-only quests excluded from adult spins.
 *
 * Typed against CanonicalTag so a typo fails the build, and validated for
 * uniqueness / non-empty tags in templates.test.ts.
 */
type Template = Omit<QuestTemplate, "match_tags"> & { match_tags: CanonicalTag[] };

export const QUEST_TEMPLATES: Template[] = [
  {
    id: "free-outdoor-movie",
    title: "Catch a free outdoor movie",
    description: "Find a park screening and watch a film under the stars.",
    icon: "🎬",
    match_tags: ["movie", "outdoors"],
    adult_friendly: true,
    weight: 3,
  },
  {
    id: "live-music-in-the-park",
    title: "Hear live music outside",
    description: "Track down a free outdoor concert and stay for a song.",
    icon: "🎶",
    match_tags: ["music", "outdoors"],
    adult_friendly: true,
    weight: 3,
  },
  {
    id: "see-a-free-performance",
    title: "See a free performance",
    description: "Theater, dance, or comedy — catch a show for $0.",
    icon: "🎭",
    match_tags: ["performance", "free"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "shakespeare-outdoors",
    title: "Watch Shakespeare in a park",
    description: "Take in an outdoor classic-theater performance.",
    icon: "🎟️",
    match_tags: ["theater", "outdoors"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "museum-day",
    title: "Wander a museum",
    description: "Cool off indoors and see something you haven't before.",
    icon: "🏛️",
    match_tags: ["museum"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "make-some-art",
    title: "Make or see art",
    description: "Hit a gallery or a hands-on art workshop.",
    icon: "🎨",
    match_tags: ["art"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "hit-the-beach",
    title: "Get to the beach",
    description: "Sand, surf, boardwalk — claim a NYC shoreline.",
    icon: "🏖️",
    match_tags: ["beach"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "take-a-dip",
    title: "Take a dip",
    description: "Find a free public pool and cool off.",
    icon: "🏊",
    match_tags: ["swimming"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "outdoor-yoga",
    title: "Do yoga outdoors",
    description: "Stretch it out at a free park yoga session.",
    icon: "🧘",
    match_tags: ["yoga", "outdoors"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "go-for-a-run",
    title: "Join a group run",
    description: "Lace up for a free community run or a 5K.",
    icon: "🏃",
    match_tags: ["running"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "ride-a-bike",
    title: "Take a bike ride",
    description: "Find a greenway or a group ride and roll.",
    icon: "🚲",
    match_tags: ["cycling"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "play-a-sport",
    title: "Play a pickup sport",
    description: "Get in a game — basketball, soccer, anything.",
    icon: "⚽",
    match_tags: ["sports"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "explore-a-garden",
    title: "Explore a garden",
    description: "Find a botanical or community garden and slow down.",
    icon: "🌷",
    match_tags: ["garden"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "hike-a-trail",
    title: "Hike an urban trail",
    description: "Yes, NYC has trails. Go find one and walk it.",
    icon: "🥾",
    match_tags: ["hiking"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "get-on-the-water",
    title: "Get out on the water",
    description: "Free kayaking and boating exist — go paddle.",
    icon: "🛶",
    match_tags: ["water-activity"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "waterfront-walk",
    title: "Walk the waterfront",
    description: "Find a pier or esplanade and take in the skyline.",
    icon: "🌅",
    match_tags: ["waterfront", "outdoors"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "browse-a-market",
    title: "Browse a street market",
    description: "Farmers, flea, or night market — go graze.",
    icon: "🧺",
    match_tags: ["market"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "find-a-festival",
    title: "Find a street festival",
    description: "Chase down a fair or festival and join the crowd.",
    icon: "🎉",
    match_tags: ["festival"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "taste-something-new",
    title: "Taste something new",
    description: "Hit a food event and try a dish you've never had.",
    icon: "🍢",
    match_tags: ["food"],
    adult_friendly: true,
    weight: 2,
  },
  {
    id: "learn-something",
    title: "Take a free class",
    description: "Sit in on a workshop and pick up a new skill.",
    icon: "🛠️",
    match_tags: ["workshop"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "tech-it-out",
    title: "Try a tech or STEM session",
    description: "Coding, making, science — get a little nerdy.",
    icon: "💻",
    match_tags: ["tech", "science"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "library-adventure",
    title: "Visit a library event",
    description: "Your local branch has more than books this summer.",
    icon: "📚",
    match_tags: ["library"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "take-a-tour",
    title: "Take a walking tour",
    description: "See your city through a guide's eyes for an hour.",
    icon: "🧭",
    match_tags: ["tour"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "history-hunt",
    title: "Dig into some history",
    description: "Visit a historic site and learn its story.",
    icon: "🏰",
    match_tags: ["history"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "give-back",
    title: "Volunteer for an hour",
    description: "Find a community project and pitch in.",
    icon: "🤝",
    match_tags: ["volunteer"],
    adult_friendly: true,
    weight: 1,
  },
  {
    id: "storytime-for-kids",
    title: "Bring the kids to story time",
    description: "A library reading session made for little ones.",
    icon: "🧸",
    match_tags: ["reading", "library"],
    adult_friendly: false,
    weight: 1,
  },
];

const TEMPLATE_BY_ID = new Map(QUEST_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): Template | undefined {
  return TEMPLATE_BY_ID.get(id);
}

/** Templates eligible for a given audience (adults skip kid-only quests). */
export function eligibleTemplates(isAdult: boolean): Template[] {
  return isAdult
    ? QUEST_TEMPLATES.filter((t) => t.adult_friendly)
    : QUEST_TEMPLATES;
}
