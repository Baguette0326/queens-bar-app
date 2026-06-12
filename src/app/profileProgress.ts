import { challengeCollections } from "../data/catalog";
import type { Profile } from "../data/profileRepository";

const USERNAME_COOLDOWN_DAYS = 30;

export function getUsernameCooldown(profile: Profile | null) {
  if (!profile?.username_changed_at) return { canChange: true, daysLeft: 0 };

  const lastChanged = new Date(profile.username_changed_at).getTime();
  if (Number.isNaN(lastChanged)) return { canChange: true, daysLeft: 0 };

  const nextChangeAt = lastChanged + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((nextChangeAt - Date.now()) / (24 * 60 * 60 * 1000));
  return { canChange: daysLeft <= 0, daysLeft: Math.max(daysLeft, 0) };
}

export function getPatchProgress(completedIds: string[]) {
  const completed = new Set(completedIds);
  return challengeCollections.map((collection) => {
    const total = collection.barIds.length || collection.barCount;
    const completedCount = collection.barIds.filter((id) => completed.has(id)).length;
    return {
      ...collection,
      total,
      completed: completedCount,
      unlocked: total > 0 && completedCount >= total
    };
  });
}

export function getRankProgress(xp: number) {
  const ranks = [
    { name: "Froshling", min: 0 },
    { name: "Patch Collector", min: 1000 },
    { name: "Lore Bearer", min: 3000 },
    { name: "Campus Legend", min: 6000 }
  ];
  const currentIndex = Math.max(
    0,
    ranks.findIndex((rank, index) => xp >= rank.min && (!ranks[index + 1] || xp < ranks[index + 1].min))
  );
  const current = ranks[currentIndex];
  const next = ranks[currentIndex + 1];

  if (!next) {
    return { current: current.name, next: "Max rank", progress: 100, remaining: 0, target: current.min };
  }

  return {
    current: current.name,
    next: next.name,
    progress: Math.min(100, ((xp - current.min) / (next.min - current.min)) * 100),
    remaining: Math.max(0, next.min - xp),
    target: next.min
  };
}
