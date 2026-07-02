import type { Dispatch, SetStateAction } from "react";
import { fetchCompletedBarIds } from "../data/completionRepository";
import { fetchFriends, fetchFriendState, fetchIncomingFriendRequests, type FriendRequest, type FriendStatus } from "../data/friendRepository";
import { fetchNotifications, type PlanNotification } from "../data/notificationRepository";
import { fetchLeaderboard, searchProfiles } from "../data/peopleRepository";
import { fetchPlans } from "../data/planRepository";
import { fetchProfile, type Profile } from "../data/profileRepository";
import type { Plan, Screen } from "./types";

type DataStatus = "local" | "loading" | "remote" | "error";
type LoadStatus = "idle" | "loading" | "error";

export function createRemoteLoaders({
  peopleQuery,
  sessionUserId,
  selectedPlanId,
  setFriendStatus,
  setFriends,
  setIncomingFriendRequests,
  setLeaderboard,
  setLeaderboardStatus,
  setNotifications,
  setNotificationsStatus,
  setPeopleResults,
  setPeopleStatus,
  setPlans,
  setPlansStatus,
  setPublicCompletedBarIds,
  setPublicProfileBackScreen,
  setScreen,
  setSelectedFriendRequestId,
  setSelectedPlanId,
  setSelectedPublicProfile
}: {
  peopleQuery: string;
  sessionUserId?: string;
  selectedPlanId: string;
  setFriendStatus: Dispatch<SetStateAction<FriendStatus>>;
  setFriends: Dispatch<SetStateAction<Profile[]>>;
  setIncomingFriendRequests: Dispatch<SetStateAction<FriendRequest[]>>;
  setLeaderboard: Dispatch<SetStateAction<Profile[]>>;
  setLeaderboardStatus: Dispatch<SetStateAction<LoadStatus>>;
  setNotifications: Dispatch<SetStateAction<PlanNotification[]>>;
  setNotificationsStatus: Dispatch<SetStateAction<LoadStatus>>;
  setPeopleResults: Dispatch<SetStateAction<Profile[]>>;
  setPeopleStatus: Dispatch<SetStateAction<LoadStatus>>;
  setPlans: Dispatch<SetStateAction<Plan[]>>;
  setPlansStatus: Dispatch<SetStateAction<DataStatus>>;
  setPublicCompletedBarIds: Dispatch<SetStateAction<string[]>>;
  setPublicProfileBackScreen: Dispatch<SetStateAction<Screen>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setSelectedFriendRequestId: Dispatch<SetStateAction<string | null>>;
  setSelectedPlanId: Dispatch<SetStateAction<string>>;
  setSelectedPublicProfile: Dispatch<SetStateAction<Profile | null>>;
}) {
  async function loadRemotePlans(userId?: string, preferredPlanId?: string) {
    setPlansStatus("loading");
    try {
      const remotePlans = await fetchPlans(userId);
      if (remotePlans.length > 0) {
        setPlans(remotePlans);
        setPlansStatus("remote");
        if (preferredPlanId && remotePlans.some((plan) => plan.id === preferredPlanId)) {
          setSelectedPlanId(preferredPlanId);
        } else if (!remotePlans.some((plan) => plan.id === selectedPlanId)) {
          setSelectedPlanId(remotePlans[0].id);
        }
      } else {
        setPlans([]);
        setSelectedPlanId("");
        setPlansStatus("remote");
      }
      return remotePlans;
    } catch (error) {
      console.warn("Failed to load Supabase plans. Using local fallback.", error);
      setPlansStatus("error");
      return null;
    }
  }

  async function loadNotifications(userId: string) {
    setNotificationsStatus("loading");
    try {
      const nextNotifications = await fetchNotifications(userId);
      setNotifications(nextNotifications);
      setNotificationsStatus("idle");
      return nextNotifications;
    } catch (error) {
      console.warn("Failed to load notifications.", error);
      setNotificationsStatus("error");
      return null;
    }
  }

  async function loadPeople(nextQuery = peopleQuery) {
    setPeopleStatus("loading");
    try {
      const results = await searchProfiles(nextQuery, sessionUserId);
      setPeopleResults(results);
      setPeopleStatus("idle");
      return results;
    } catch (error) {
      console.warn("Failed to search profiles.", error);
      setPeopleStatus("error");
      return [];
    }
  }

  async function loadFriendsData(userId = sessionUserId) {
    if (!userId) return;
    const [requests, nextFriends] = await Promise.all([
      fetchIncomingFriendRequests(userId),
      fetchFriends(userId)
    ]);
    setIncomingFriendRequests(requests);
    setFriends(nextFriends);
  }

  async function loadLeaderboard() {
    setLeaderboardStatus("loading");
    try {
      const results = await fetchLeaderboard();
      setLeaderboard(results);
      setLeaderboardStatus("idle");
      return results;
    } catch (error) {
      console.warn("Failed to load leaderboard.", error);
      setLeaderboardStatus("error");
      return [];
    }
  }

  async function openPublicProfile(nextProfile: Profile, backScreen: Screen = "people") {
    setSelectedPublicProfile(nextProfile);
    setPublicProfileBackScreen(backScreen);
    setPublicCompletedBarIds([]);
    setFriendStatus("none");
    setSelectedFriendRequestId(null);
    setScreen("publicProfile");
    try {
      const [ids, nextFriendState] = await Promise.all([
        fetchCompletedBarIds(nextProfile.id),
        sessionUserId && sessionUserId !== nextProfile.id
          ? fetchFriendState(sessionUserId, nextProfile.id)
          : Promise.resolve({ status: "none" as FriendStatus, requestId: null })
      ]);
      setPublicCompletedBarIds(ids);
      setFriendStatus(nextFriendState.status);
      setSelectedFriendRequestId(nextFriendState.requestId);
    } catch (error) {
      console.warn("Failed to load public completions.", error);
    }
  }

  async function openPublicProfileById(userId: string, backScreen: Screen = "chat") {
    const nextProfile = await fetchProfile(userId);
    if (nextProfile) openPublicProfile(nextProfile, backScreen);
  }

  return {
    loadFriendsData,
    loadLeaderboard,
    loadNotifications,
    loadPeople,
    loadRemotePlans,
    openPublicProfile,
    openPublicProfileById
  };
}
