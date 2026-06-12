export type Screen =
  | "login"
  | "onboarding"
  | "discover"
  | "catalog"
  | "challenge"
  | "create"
  | "plan"
  | "chats"
  | "chat"
  | "dmThread"
  | "profile"
  | "notifications"
  | "completed"
  | "people"
  | "publicProfile"
  | "leaderboard";

export type CreatePlanDay = "Today" | "Tomorrow";

export type Plan = {
  id: string;
  challengeId: string;
  place: string;
  detail: string;
  startsAt: string;
  startsAtIso?: string;
  status: "ongoing" | "upcoming";
  visibility?: "public" | "friends";
  attendees: string[];
  attendeeProfiles?: Array<{ id: string; username: string }>;
  cap?: number;
  note: string;
  startedBy: string;
  startedById?: string;
  currentUserJoined?: boolean;
};
