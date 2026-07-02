import type { Dispatch, SetStateAction } from "react";
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, fetchFriendState, removeFriend, sendFriendRequest, type FriendStatus } from "../data/friendRepository";
import { notifyFriendRequest, notifyPlanInvite } from "../data/notificationRepository";
import type { Profile } from "../data/profileRepository";
import { describeSupabaseError } from "../data/supabaseError";
import { confirmAction, showMessage } from "./dialogs";
import type { Plan } from "./types";

type SaveStatus = "idle" | "saving";

export function createFriendActions({
  friendActionStatus,
  invitingFriendId,
  loadFriendsData,
  selectedChallengeName,
  selectedFriendRequestId,
  selectedPlan,
  selectedPublicProfile,
  sessionUserId,
  setFriendActionStatus,
  setFriends,
  setFriendStatus,
  setInvitingFriendId,
  setSelectedFriendRequestId,
  username
}: {
  friendActionStatus: SaveStatus;
  invitingFriendId: string;
  loadFriendsData: (userId?: string) => Promise<void>;
  selectedChallengeName: string;
  selectedFriendRequestId: string | null;
  selectedPlan?: Plan;
  selectedPublicProfile: Profile | null;
  sessionUserId?: string;
  setFriendActionStatus: Dispatch<SetStateAction<SaveStatus>>;
  setFriends: Dispatch<SetStateAction<Profile[]>>;
  setFriendStatus: Dispatch<SetStateAction<FriendStatus>>;
  setInvitingFriendId: Dispatch<SetStateAction<string>>;
  setSelectedFriendRequestId: Dispatch<SetStateAction<string | null>>;
  username: string;
}) {
  async function requestFriendship() {
    if (!sessionUserId || !selectedPublicProfile || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      await sendFriendRequest(sessionUserId, selectedPublicProfile.id);
      notifyFriendRequest(
        sessionUserId,
        selectedPublicProfile.id,
        `${username} sent you a friend request`,
        "Open People to accept or decline."
      ).catch((error) => console.warn("Failed to notify friend request.", error));
      await loadFriendsData(sessionUserId);
      const nextState = await fetchFriendState(sessionUserId, selectedPublicProfile.id);
      setFriendStatus(nextState.status);
      setSelectedFriendRequestId(nextState.requestId);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not send friend request. Run supabase/add_friends.sql first.");
      showMessage("Friend request failed", message);
    } finally {
      setFriendActionStatus("idle");
    }
  }

  async function respondToFriendRequest(requestId: string, response: "accept" | "decline") {
    if (!sessionUserId || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      if (response === "accept") {
        await acceptFriendRequest(requestId, sessionUserId);
      } else {
        await declineFriendRequest(requestId, sessionUserId);
      }
      await loadFriendsData(sessionUserId);
      if (selectedPublicProfile) {
        const nextState = await fetchFriendState(sessionUserId, selectedPublicProfile.id);
        setFriendStatus(nextState.status);
        setSelectedFriendRequestId(nextState.requestId);
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not update friend request.");
      showMessage("Friend request failed", message);
    } finally {
      setFriendActionStatus("idle");
    }
  }

  async function runUnfriend() {
    if (!sessionUserId || !selectedPublicProfile || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      await removeFriend(sessionUserId, selectedPublicProfile.id);
      setFriendStatus("none");
      setSelectedFriendRequestId(null);
      setFriends((current) => current.filter((friend) => friend.id !== selectedPublicProfile.id));
      await loadFriendsData(sessionUserId);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not remove friend.");
      showMessage("Unfriend failed", message);
    } finally {
      setFriendActionStatus("idle");
    }
  }

  async function runCancelFriendRequest() {
    if (!sessionUserId || !selectedFriendRequestId || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      await cancelFriendRequest(selectedFriendRequestId, sessionUserId);
      setFriendStatus("none");
      setSelectedFriendRequestId(null);
      await loadFriendsData(sessionUserId);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not cancel friend request.");
      showMessage("Cancel request failed", message);
    } finally {
      setFriendActionStatus("idle");
    }
  }

  function confirmUnfriend() {
    if (!selectedPublicProfile) return;

    confirmAction({
      title: "Remove friend?",
      message: `Remove ${selectedPublicProfile.username} as a friend?`,
      cancelText: "Keep friend",
      confirmText: "Unfriend",
      destructive: true,
      onConfirm: runUnfriend
    });
  }

  async function inviteFriendToPlan(friend: Profile) {
    if (!sessionUserId || !selectedPlan || invitingFriendId) return;

    setInvitingFriendId(friend.id);
    try {
      await notifyPlanInvite(
        selectedPlan.id,
        sessionUserId,
        friend.id,
        `${username} invited you to ${selectedChallengeName}`,
        `${selectedPlan.place} - ${selectedPlan.startsAt}`
      );
      showMessage("Invite sent", `Invited ${friend.username}.`, `Invited ${friend.username}.`);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not send invite. Run supabase/add_chat_dm_notifications.sql.");
      showMessage("Invite failed", message);
    } finally {
      setInvitingFriendId("");
    }
  }

  return {
    confirmUnfriend,
    inviteFriendToPlan,
    requestFriendship,
    respondToFriendRequest,
    runCancelFriendRequest
  };
}
