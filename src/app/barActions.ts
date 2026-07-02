import type { Dispatch, SetStateAction } from "react";
import type { Challenge } from "../data/catalog";
import { removeCompletedBar, selfCompleteBar } from "../data/completionRepository";
import { pinBar, unpinBar } from "../data/interestRepository";
import type { Profile } from "../data/profileRepository";
import { updateProfileXp } from "../data/profileRepository";
import { describeSupabaseError } from "../data/supabaseError";
import { confirmAction, showMessage } from "./dialogs";
import type { Screen } from "./types";

type SaveStatus = "idle" | "saving";

export function createBarActions({
  completedBarIds,
  completionStatus,
  pinnedBarIds,
  selectedChallenge,
  selectedChallengeCompleted,
  sessionUserId,
  setCompletedBarIds,
  setCompletionStatus,
  setPinnedBarIds,
  setInterestStatus,
  setProfile,
  setScreen,
  setXp,
  xp
}: {
  completedBarIds: string[];
  completionStatus: SaveStatus;
  pinnedBarIds: string[];
  selectedChallenge: Challenge;
  selectedChallengeCompleted: boolean;
  sessionUserId?: string;
  setCompletedBarIds: Dispatch<SetStateAction<string[]>>;
  setCompletionStatus: Dispatch<SetStateAction<SaveStatus>>;
  setPinnedBarIds: Dispatch<SetStateAction<string[]>>;
  setInterestStatus: Dispatch<SetStateAction<SaveStatus>>;
  setProfile: Dispatch<SetStateAction<Profile | null>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setXp: Dispatch<SetStateAction<number>>;
  xp: number;
}) {
  const go = setScreen;

  async function toggleInterest() {
    if (!sessionUserId) {
      go("login");
      return;
    }

    const barId = selectedChallenge.id;
    const pinned = pinnedBarIds.includes(barId);
    const nextPinnedIds = pinned ? pinnedBarIds.filter((id) => id !== barId) : [...pinnedBarIds, barId];
    setPinnedBarIds(nextPinnedIds);
    setInterestStatus("saving");

    try {
      if (pinned) {
        await unpinBar(sessionUserId, barId);
      } else {
        await pinBar(sessionUserId, barId);
      }
    } catch (error) {
      setPinnedBarIds(pinnedBarIds);
      const message = describeSupabaseError(error, "Could not update interest.");
      showMessage("Interest failed", message);
    } finally {
      setInterestStatus("idle");
    }
  }

  async function completeSelectedChallenge() {
    if (!sessionUserId) {
      go("login");
      return;
    }

    if (selectedChallengeCompleted) {
      undoSelectedChallengeCompletion();
      return;
    }

    if (completionStatus === "saving") return;

    const nextCompletedIds = [...completedBarIds, selectedChallenge.id];
    const nextXp = xp + selectedChallenge.xp;
    setCompletedBarIds(nextCompletedIds);
    setXp(nextXp);
    setCompletionStatus("saving");

    try {
      await selfCompleteBar(sessionUserId, selectedChallenge.id, selectedChallenge.xp);
      const updatedProfile = await updateProfileXp(sessionUserId, nextXp);
      setProfile(updatedProfile);
      setXp(updatedProfile.xp);
    } catch (error) {
      setCompletedBarIds(completedBarIds);
      setXp(xp);
      const message = describeSupabaseError(error, "Could not mark bar completed.");
      showMessage("Completion failed", message);
    } finally {
      setCompletionStatus("idle");
    }
  }

  async function runUndoSelectedChallengeCompletion() {
    if (!sessionUserId || completionStatus === "saving") return;

    const nextCompletedIds = completedBarIds.filter((id) => id !== selectedChallenge.id);
    const nextXp = Math.max(0, xp - selectedChallenge.xp);
    setCompletedBarIds(nextCompletedIds);
    setXp(nextXp);
    setCompletionStatus("saving");

    try {
      await removeCompletedBar(sessionUserId, selectedChallenge.id);
      const updatedProfile = await updateProfileXp(sessionUserId, nextXp);
      setProfile(updatedProfile);
      setXp(updatedProfile.xp);
    } catch (error) {
      setCompletedBarIds(completedBarIds);
      setXp(xp);
      const message = describeSupabaseError(error, "Could not undo completion.");
      showMessage("Undo failed", message);
    } finally {
      setCompletionStatus("idle");
    }
  }

  function undoSelectedChallengeCompletion() {
    if (!sessionUserId || completionStatus === "saving") return;

    confirmAction({
      title: "Undo completion?",
      message: "This will remove the bar from your completed list.",
      webMessage: `Undo completion for ${selectedChallenge.name}?`,
      cancelText: "Keep completed",
      confirmText: "Undo",
      destructive: true,
      onConfirm: runUndoSelectedChallengeCompletion
    });
  }

  return {
    completeSelectedChallenge,
    toggleInterest,
    undoSelectedChallengeCompletion
  };
}
