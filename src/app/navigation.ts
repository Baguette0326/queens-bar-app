import { Platform } from "react-native";
import type { Screen } from "./types";

const LAST_SCREEN_STORAGE_KEY = "ritual:lastScreen";
const RESTORABLE_SCREENS = new Set<Screen>([
  "discover",
  "catalog",
  "chats",
  "profile",
  "notifications",
  "completed",
  "people",
  "leaderboard"
]);

export function readStoredScreen(): Screen | null {
  if (Platform.OS !== "web") return null;

  try {
    const stored = window.sessionStorage.getItem(LAST_SCREEN_STORAGE_KEY) as Screen | null;
    return stored && RESTORABLE_SCREENS.has(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredScreen(screen: Screen) {
  if (Platform.OS !== "web" || !RESTORABLE_SCREENS.has(screen)) return;

  try {
    window.sessionStorage.setItem(LAST_SCREEN_STORAGE_KEY, screen);
  } catch {
    // Navigation still works when browser storage is unavailable.
  }
}
