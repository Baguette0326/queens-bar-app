import type { CreatePlanDay } from "./types";

export function formatCreateTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatCreatedPlanTime(startsAt: Date) {
  const time = startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${startsAt.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
}

export function parseCreateTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hour = Number.parseInt(match[1], 10);
  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  return { hour, minute };
}

export function buildCreatePlanSchedule(day: CreatePlanDay, time: string, durationMinutes: number) {
  const parsed = parseCreateTime(time);
  if (!parsed) return null;

  const startsAt = new Date();
  if (day === "Tomorrow") startsAt.setDate(startsAt.getDate() + 1);
  startsAt.setHours(parsed.hour, parsed.minute, 0, 0);

  if (startsAt <= new Date()) return null;

  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + durationMinutes * 60 * 1000)
  };
}

export function sameMinute(startsAtIso: string, target: Date) {
  const existing = new Date(startsAtIso);
  if (Number.isNaN(existing.getTime())) return false;
  return Math.floor(existing.getTime() / 60000) === Math.floor(target.getTime() / 60000);
}
