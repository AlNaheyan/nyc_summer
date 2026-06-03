import type { Badge } from "@/lib/types";

/**
 * Static badge definitions (TECH_SPEC §6/§7). `rule_key` is a semantic slug
 * interpreted by the gamification engine (built in Phase 1/3) when it
 * re-evaluates a user after a completion. Defined here so they can be seeded
 * and referenced now; the evaluation logic lands with the engine.
 *
 * rule_key grammar (informal): "<metric>:<threshold>"
 *   completions  — total completions
 *   streak       — current/longest streak in days
 *   points       — lifetime points
 *   distinctTags — breadth: distinct activity tags completed
 *   boroughs     — distinct boroughs visited
 *   shares       — completions shared to the public feed
 */
export const BADGES: Badge[] = [
  {
    id: "first-quest",
    name: "Day One",
    description: "Complete your very first quest.",
    icon: "🌱",
    rule_key: "completions:1",
  },
  {
    id: "five-quests",
    name: "Getting Out There",
    description: "Complete five quests.",
    icon: "🚶",
    rule_key: "completions:5",
  },
  {
    id: "twenty-quests",
    name: "City Regular",
    description: "Complete twenty quests.",
    icon: "🏙️",
    rule_key: "completions:20",
  },
  {
    id: "streak-3",
    name: "Warming Up",
    description: "Keep a 3-day streak.",
    icon: "🔥",
    rule_key: "streak:3",
  },
  {
    id: "streak-7",
    name: "On a Roll",
    description: "Keep a 7-day streak.",
    icon: "⚡",
    rule_key: "streak:7",
  },
  {
    id: "streak-14",
    name: "Unstoppable",
    description: "Keep a 14-day streak.",
    icon: "🌟",
    rule_key: "streak:14",
  },
  {
    id: "points-500",
    name: "High Scorer",
    description: "Earn 500 points.",
    icon: "💯",
    rule_key: "points:500",
  },
  {
    id: "explorer-5",
    name: "Explorer",
    description: "Complete quests across five different categories.",
    icon: "🧭",
    rule_key: "distinctTags:5",
  },
  {
    id: "all-boroughs",
    name: "Five Borough Summer",
    description: "Complete a quest in every borough.",
    icon: "🗽",
    rule_key: "boroughs:5",
  },
  {
    id: "first-share",
    name: "Show and Tell",
    description: "Share your first photo to the feed.",
    icon: "📸",
    rule_key: "shares:1",
  },
  {
    id: "ten-shares",
    name: "Crowd Pleaser",
    description: "Share ten photos to the feed.",
    icon: "🤳",
    rule_key: "shares:10",
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Reach a 30-day streak — a whole summer of showing up.",
    icon: "🐦",
    rule_key: "streak:30",
  },
];
