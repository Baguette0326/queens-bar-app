import type { AvatarId } from "../data/catalog";
import type { Plan } from "./types";

export const avatarOptions: { id: AvatarId; label: string }[] = [
  { id: "crown", label: "Crown" },
  { id: "gear", label: "Gear" },
  { id: "cap", label: "Cap" },
  { id: "gem", label: "Gem" },
  { id: "hall", label: "Hall" },
  { id: "star", label: "Star" }
];

export const startingPlans: Plan[] = [
  {
    id: "plan-goodes",
    challengeId: "advance-to-goodes",
    place: "Goodes Hall",
    detail: "main lobby",
    startsAt: "Started 18m ago",
    status: "ongoing",
    attendees: ["WrenchKing", "BoltBoy", "NuttyProf", "Maya", "Sam", "Owen"],
    cap: 12,
    note: "Meet by the lobby. We will coordinate timing in chat.",
    startedBy: "WrenchKing"
  },
  {
    id: "plan-beerio",
    challengeId: "beerio-kart",
    place: "Residence Common Area",
    detail: "main lounge",
    startsAt: "Started 5m ago",
    status: "ongoing",
    attendees: ["BoltBoy", "NuttyProf", "Maya", "Sam", "Owen"],
    cap: 8,
    note: "Let's see whose plane flies the furthest. Paper provided.",
    startedBy: "WrenchKing"
  },
  {
    id: "plan-wizard",
    challengeId: "wizard",
    place: "Residence Common Area",
    detail: "main lounge",
    startsAt: "Tomorrow - 6:30 PM",
    status: "upcoming",
    attendees: ["Maya", "Sam", "Owen", "Lee", "Ari", "Noah"],
    cap: 10,
    note: "Meet at the entrance and keep an eye on chat.",
    startedBy: "Maya"
  }
];
