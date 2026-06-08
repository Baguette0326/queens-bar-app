import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Platform
} from "react-native";
import {
  Award,
  Bell,
  Bookmark,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  Crown,
  Filter,
  Gem,
  GraduationCap,
  Landmark,
  Map,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  Shield,
  Star,
  UserRound,
  Users,
  Wrench
} from "lucide-react-native";
import type { Session } from "@supabase/supabase-js";
import { AvatarId, BrowseCategory, Challenge, ChallengeTone, challenges, getBrowseCategories } from "./src/data/catalog";
import { fetchCatalogBars } from "./src/data/catalogRepository";
import { fetchChatMessages, RemoteChatMessage, sendChatMessage } from "./src/data/chatRepository";
import { fetchCompletedBarIds, removeCompletedBar, selfCompleteBar } from "./src/data/completionRepository";
import { fetchDmMessages, fetchDmThreads, getOrCreateDmThread, RemoteDmMessage, RemoteDmThread, sendDmMessage } from "./src/data/dmRepository";
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, fetchFriends, fetchFriendState, fetchIncomingFriendRequests, FriendRequest, FriendStatus, removeFriend, sendFriendRequest } from "./src/data/friendRepository";
import { fetchPinnedBarIds, pinBar, unpinBar } from "./src/data/interestRepository";
import { fetchNotifications, markNotificationRead, notifyDmRecipient, notifyFriendRequest, notifyPlanAttendees, notifyPlanInvite, PlanNotification } from "./src/data/notificationRepository";
import { fetchLeaderboard, searchProfiles } from "./src/data/peopleRepository";
import { cancelPlan as cancelRemotePlan, createPlan as createRemotePlan, fetchPlans, joinPlan as joinRemotePlan, leavePlan as leaveRemotePlan, RemotePlan } from "./src/data/planRepository";
import { createProfile, fetchProfile, getRankFromXp, Profile, roleDbToLabel, updateProfileDetails, updateProfileXp } from "./src/data/profileRepository";
import { describeSupabaseError } from "./src/data/supabaseError";
import { supabase } from "./src/lib/supabase";

type Screen = "login" | "onboarding" | "discover" | "catalog" | "challenge" | "create" | "plan" | "chats" | "chat" | "dmThread" | "profile" | "notifications" | "completed" | "people" | "publicProfile" | "leaderboard";
type CreatePlanDay = "Today" | "Tomorrow";

type Plan = {
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

const colors = {
  paper: "#09111D",
  paperLight: "#14243A",
  ink: "#F5EBD6",
  muted: "#C4B99F",
  line: "#415979",
  navy: "#12365E",
  red: "#9F2428",
  green: "#166238",
  gold: "#E3A627",
  cream: "#FFF6DF"
};

const avatarOptions: { id: AvatarId; label: string }[] = [
  { id: "crown", label: "Crown" },
  { id: "gear", label: "Gear" },
  { id: "cap", label: "Cap" },
  { id: "gem", label: "Gem" },
  { id: "hall", label: "Hall" },
  { id: "star", label: "Star" }
];

const startingPlans: Plan[] = [
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
    startsAt: "Tomorrow Â· 6:30 PM",
    status: "upcoming",
    attendees: ["Maya", "Sam", "Owen", "Lee", "Ari", "Noah"],
    cap: 10,
    note: "Meet at the entrance and keep an eye on chat.",
    startedBy: "Maya"
  }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authStatus, setAuthStatus] = useState<"checking" | "ready" | "sending" | "saving">("checking");
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [catalog, setCatalog] = useState<Challenge[]>(challenges);
  const [catalogStatus, setCatalogStatus] = useState<"local" | "loading" | "remote" | "error">("loading");
  const [selectedChallengeId, setSelectedChallengeId] = useState("advance-to-goodes");
  const [selectedPlanId, setSelectedPlanId] = useState("plan-beerio");
  const [username, setUsername] = useState("GearShift");
  const [avatar, setAvatar] = useState<AvatarId>("gear");
  const [draftBio, setDraftBio] = useState("");
  const [role, setRole] = useState("Frosh");
  const [query, setQuery] = useState("");
  const [browseCategory, setBrowseCategory] = useState<BrowseCategory | "All">("All");
  const [difficulty, setDifficulty] = useState<Challenge["difficulty"] | "All">("All");
  const [completionFilter, setCompletionFilter] = useState<"All" | "Completed" | "Not completed">("All");
  const [challengePickerOpen, setChallengePickerOpen] = useState(false);
  const [planDay, setPlanDay] = useState<CreatePlanDay>("Today");
  const [planTime, setPlanTime] = useState(() => formatCreateTime(new Date(Date.now() + 60 * 60 * 1000)));
  const [planDurationMinutes, setPlanDurationMinutes] = useState(120);
  const [planVisibility, setPlanVisibility] = useState<"public" | "friends">("public");
  const [planPlace, setPlanPlace] = useState("Goodes Hall");
  const [planDetail, setPlanDetail] = useState("front steps");
  const [planCap, setPlanCap] = useState(12);
  const [planNote, setPlanNote] = useState("Bring your best voice.");
  const [publishingPlan, setPublishingPlan] = useState(false);
  const [pinnedBarIds, setPinnedBarIds] = useState<string[]>([]);
  const [interestStatus, setInterestStatus] = useState<"idle" | "saving">("idle");
  const [completedBarIds, setCompletedBarIds] = useState<string[]>([]);
  const [completionStatus, setCompletionStatus] = useState<"idle" | "saving">("idle");
  const [plans, setPlans] = useState<Plan[]>(startingPlans);
  const [plansStatus, setPlansStatus] = useState<"local" | "loading" | "remote" | "error">("local");
  const [xp, setXp] = useState(2350);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<RemoteChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<"idle" | "loading" | "sending" | "error">("idle");
  const [chatMembersOpen, setChatMembersOpen] = useState(false);
  const [dmThreads, setDmThreads] = useState<RemoteDmThread[]>([]);
  const [selectedDmThreadId, setSelectedDmThreadId] = useState("");
  const [dmMessages, setDmMessages] = useState<RemoteDmMessage[]>([]);
  const [dmMessage, setDmMessage] = useState("");
  const [dmStatus, setDmStatus] = useState<"idle" | "loading" | "sending" | "error">("idle");
  const [notifications, setNotifications] = useState<PlanNotification[]>([]);
  const [notificationsStatus, setNotificationsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleResults, setPeopleResults] = useState<Profile[]>([]);
  const [peopleStatus, setPeopleStatus] = useState<"idle" | "loading" | "error">("idle");
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [selectedFriendRequestId, setSelectedFriendRequestId] = useState<string | null>(null);
  const [friendActionStatus, setFriendActionStatus] = useState<"idle" | "saving">("idle");
  const [invitingFriendId, setInvitingFriendId] = useState("");
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<Profile | null>(null);
  const [publicProfileBackScreen, setPublicProfileBackScreen] = useState<Screen>("people");
  const [publicCompletedBarIds, setPublicCompletedBarIds] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<"idle" | "loading" | "error">("idle");
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving">("idle");

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
      const results = await searchProfiles(nextQuery, session?.user.id);
      setPeopleResults(results);
      setPeopleStatus("idle");
      return results;
    } catch (error) {
      console.warn("Failed to search profiles.", error);
      setPeopleStatus("error");
      return [];
    }
  }

  async function loadFriendsData(userId = session?.user.id) {
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
        session && session.user.id !== nextProfile.id ? fetchFriendState(session.user.id, nextProfile.id) : Promise.resolve({ status: "none" as FriendStatus, requestId: null })
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

  async function requestFriendship() {
    if (!session || !selectedPublicProfile || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      await sendFriendRequest(session.user.id, selectedPublicProfile.id);
      notifyFriendRequest(
        session.user.id,
        selectedPublicProfile.id,
        `${username} sent you a friend request`,
        "Open People to accept or decline."
      ).catch((error) => console.warn("Failed to notify friend request.", error));
      await loadFriendsData(session.user.id);
      const nextState = await fetchFriendState(session.user.id, selectedPublicProfile.id);
      setFriendStatus(nextState.status);
      setSelectedFriendRequestId(nextState.requestId);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not send friend request. Run supabase/add_friends.sql first.");
      if (Platform.OS === "web") {
        window.alert(`Friend request failed: ${message}`);
      } else {
        Alert.alert("Friend request failed", message);
      }
    } finally {
      setFriendActionStatus("idle");
    }
  }

  async function respondToFriendRequest(requestId: string, response: "accept" | "decline") {
    if (!session || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      if (response === "accept") {
        await acceptFriendRequest(requestId, session.user.id);
      } else {
        await declineFriendRequest(requestId, session.user.id);
      }
      await loadFriendsData(session.user.id);
      if (selectedPublicProfile) {
        const nextState = await fetchFriendState(session.user.id, selectedPublicProfile.id);
        setFriendStatus(nextState.status);
        setSelectedFriendRequestId(nextState.requestId);
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not update friend request.");
      if (Platform.OS === "web") {
        window.alert(`Friend request failed: ${message}`);
      } else {
        Alert.alert("Friend request failed", message);
      }
    } finally {
      setFriendActionStatus("idle");
    }
  }

  async function runUnfriend() {
    if (!session || !selectedPublicProfile || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      await removeFriend(session.user.id, selectedPublicProfile.id);
      setFriendStatus("none");
      setSelectedFriendRequestId(null);
      setFriends((current) => current.filter((friend) => friend.id !== selectedPublicProfile.id));
      await loadFriendsData(session.user.id);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not remove friend.");
      if (Platform.OS === "web") {
        window.alert(`Unfriend failed: ${message}`);
      } else {
        Alert.alert("Unfriend failed", message);
      }
    } finally {
      setFriendActionStatus("idle");
    }
  }

  async function runCancelFriendRequest() {
    if (!session || !selectedFriendRequestId || friendActionStatus === "saving") return;

    setFriendActionStatus("saving");
    try {
      await cancelFriendRequest(selectedFriendRequestId, session.user.id);
      setFriendStatus("none");
      setSelectedFriendRequestId(null);
      await loadFriendsData(session.user.id);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not cancel friend request.");
      if (Platform.OS === "web") {
        window.alert(`Cancel request failed: ${message}`);
      } else {
        Alert.alert("Cancel request failed", message);
      }
    } finally {
      setFriendActionStatus("idle");
    }
  }

  function confirmUnfriend() {
    if (!selectedPublicProfile) return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Remove ${selectedPublicProfile.username} as a friend?`);
      if (confirmed) runUnfriend();
      return;
    }

    Alert.alert(
      "Remove friend?",
      `Remove ${selectedPublicProfile.username} as a friend?`,
      [
        { text: "Keep friend", style: "cancel" },
        { text: "Unfriend", style: "destructive", onPress: runUnfriend }
      ]
    );
  }

  async function inviteFriendToPlan(friend: Profile) {
    if (!session || !selectedPlan || invitingFriendId) return;

    setInvitingFriendId(friend.id);
    try {
      await notifyPlanInvite(
        selectedPlan.id,
        session.user.id,
        friend.id,
        `${username} invited you to ${selectedChallenge.name}`,
        `${selectedPlan.place} - ${selectedPlan.startsAt}`
      );
      if (Platform.OS === "web") {
        window.alert(`Invited ${friend.username}.`);
      } else {
        Alert.alert("Invite sent", `Invited ${friend.username}.`);
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not send invite. Run supabase/add_chat_dm_notifications.sql.");
      if (Platform.OS === "web") {
        window.alert(`Invite failed: ${message}`);
      } else {
        Alert.alert("Invite failed", message);
      }
    } finally {
      setInvitingFriendId("");
    }
  }

  useEffect(() => {
    let alive = true;

    async function applySession(nextSession: Session | null) {
      if (!alive) return;
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        setAuthStatus("ready");
        setScreen("login");
        return;
      }

      try {
        const nextProfile = await fetchProfile(nextSession.user.id);
        if (!alive) return;
        setProfile(nextProfile);
        setAuthStatus("ready");

        if (nextProfile) {
          setUsername(nextProfile.username);
          setAvatar(nextProfile.avatar);
          setDraftBio(nextProfile.bio ?? "");
          setRole(roleDbToLabel(nextProfile.role));
          setXp(nextProfile.xp);
          setScreen("discover");
          loadRemotePlans(nextSession.user.id);
          loadNotifications(nextSession.user.id);
          loadFriendsData(nextSession.user.id);
          fetchCompletedBarIds(nextSession.user.id)
            .then((ids) => {
              if (alive) setCompletedBarIds(ids);
            })
            .catch((error) => {
              console.warn("Failed to load completed bars.", error);
            });
          fetchPinnedBarIds(nextSession.user.id)
            .then((ids) => {
              if (alive) setPinnedBarIds(ids);
            })
            .catch((error) => {
              console.warn("Failed to load pinned bars.", error);
            });
        } else {
          setScreen("onboarding");
        }
      } catch (error) {
        console.warn("Failed to load profile.", error);
        if (alive) {
          setAuthStatus("ready");
          setScreen("onboarding");
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (screen !== "people" || !session) return;

    const timeout = setTimeout(() => {
      loadPeople(peopleQuery);
      loadFriendsData().catch((error) => {
        console.warn("Failed to load friend data.", error);
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [peopleQuery, screen, session?.user.id]);

  useEffect(() => {
    if (screen === "chats" && session) {
      loadRemotePlans(session.user.id).catch((error) => {
        console.warn("Failed to load chat inbox.", error);
      });
      loadDmThreads().catch((error) => {
        console.warn("Failed to load DM inbox.", error);
      });
    }

    if (screen === "leaderboard") {
      loadLeaderboard();
    }
  }, [screen, session?.user.id]);

  useEffect(() => {
    if (screen !== "dmThread" || !session || !selectedDmThreadId) return;

    const interval = setInterval(() => {
      refreshDm(selectedDmThreadId).catch((error) => {
        console.warn("Failed to refresh DM.", error);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [screen, session?.user.id, selectedDmThreadId]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      loadNotifications(session.user.id).catch((error) => {
        console.warn("Failed to refresh notifications.", error);
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [session?.user.id]);

  useEffect(() => {
    let alive = true;

    fetchCatalogBars()
      .then((remoteCatalog) => {
        if (!alive) return;
        if (remoteCatalog.length > 0) {
          setCatalog(remoteCatalog);
          setCatalogStatus("remote");
          if (!remoteCatalog.some((challenge) => challenge.id === selectedChallengeId)) {
            setSelectedChallengeId(remoteCatalog[0].id);
          }
        } else {
          setCatalogStatus("local");
        }
      })
      .catch((error) => {
        console.warn("Failed to load Supabase catalog. Using local fallback.", error);
        if (alive) setCatalogStatus("error");
      });

    return () => {
      alive = false;
    };
  }, []);

  async function sendLoginLink() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthMessage("Enter your email first.");
      return;
    }

    setAuthStatus("sending");
    setAuthMessage("");

    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      console.warn("Magic link failed", error);
      const lowerMessage = error.message.toLowerCase();
      const authCode = "code" in error ? error.code : undefined;

      if (authCode === "over_email_send_rate_limit" || lowerMessage.includes("rate limit")) {
        setAuthMessage("Too many login emails were requested. Wait a bit, or set up custom SMTP in Supabase Auth.");
      } else if (authCode === "email_address_not_authorized") {
        setAuthMessage("Supabase's default email sender blocked this address. Use a project member email or set up custom SMTP.");
      } else if (lowerMessage.includes("error sending") || lowerMessage.includes("magic link")) {
        setAuthMessage("Supabase could not send the login email. Check Auth logs, then set up custom SMTP if the built-in sender is failing.");
      } else {
        setAuthMessage(error.message);
      }
      setAuthStatus("ready");
      return;
    }

    setAuthMessage("Check your email for the login link.");
    setAuthStatus("ready");
  }

  async function saveOnboardingProfile() {
    if (!session) {
      setScreen("login");
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      Alert.alert("Username required", "Pick a unique username before continuing.");
      return;
    }

    setAuthStatus("saving");
    try {
      const savedProfile = await createProfile({
        id: session.user.id,
        username: trimmedUsername,
        avatar,
        roleLabel: role
      });
      setProfile(savedProfile);
      setXp(savedProfile.xp);
      setScreen("discover");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save profile.";
      Alert.alert("Profile not saved", message);
    } finally {
      setAuthStatus("ready");
    }
  }

  async function saveProfileDetails() {
    if (!session || profileSaveStatus === "saving") return;

    setProfileSaveStatus("saving");
    try {
      const savedProfile = await updateProfileDetails({
        userId: session.user.id,
        avatar,
        bio: draftBio.slice(0, 160)
      });
      setProfile(savedProfile);
      setAvatar(savedProfile.avatar);
      if (savedProfile.bio !== null || !draftBio.trim()) {
        setDraftBio(savedProfile.bio ?? "");
      } else if (Platform.OS === "web") {
        window.alert("Avatar saved. Run supabase/add_profile_bio.sql to enable bio saving.");
      } else {
        Alert.alert("Avatar saved", "Run supabase/add_profile_bio.sql to enable bio saving.");
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not save profile.");
      if (Platform.OS === "web") {
        window.alert(`Profile failed: ${message}`);
      } else {
        Alert.alert("Profile failed", message);
      }
    } finally {
      setProfileSaveStatus("idle");
    }
  }

  const selectedChallenge = catalog.find((item) => item.id === selectedChallengeId) ?? catalog[0] ?? challenges[0];
  const selectedPlan = plans.find((item) => item.id === selectedPlanId) ?? plans[0];
  const selectedDmThread = dmThreads.find((thread) => thread.id === selectedDmThreadId);
  const selectedIncomingFriendRequest = selectedPublicProfile
    ? incomingFriendRequests.find((request) => request.requesterId === selectedPublicProfile.id)
    : undefined;
  const matchingLivePlans = plans.filter(
    (plan) => plan.challengeId === selectedChallenge.id && (plan.status === "ongoing" || plan.status === "upcoming")
  );
  const currentUserStartedPlan = !!session && selectedPlan?.startedById === session.user.id;
  const selectedChallengePinned = pinnedBarIds.includes(selectedChallenge.id);
  const selectedChallengeCompleted = completedBarIds.includes(selectedChallenge.id);
  const unreadNotificationCount = notifications.filter((notification) => !notification.readAt).length;
  const completedChallenges = catalog.filter((challenge) => completedBarIds.includes(challenge.id));
  const publicCompletedChallenges = catalog.filter((challenge) => publicCompletedBarIds.includes(challenge.id));
  const joinedPlans = plans.filter((plan) => plan.currentUserJoined || plan.attendees.includes(username));
  const tier = getRankFromXp(xp);
  const rankProgress = getRankProgress(xp);

  useEffect(() => {
    if (screen !== "chat" || !session || !selectedPlan?.id) return;

    const interval = setInterval(() => {
      refreshChat(selectedPlan.id).catch((error) => {
        console.warn("Failed to refresh chat.", error);
      });
      loadRemotePlans(session.user.id, selectedPlan.id).catch((error) => {
        console.warn("Failed to refresh chat attendees.", error);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [screen, session?.user.id, selectedPlan?.id]);

  useEffect(() => {
    if (planPlace !== "Other location" && !selectedChallenge.places.includes(planPlace)) {
      setPlanPlace(selectedChallenge.places[0] ?? "Other");
    }
  }, [planPlace, selectedChallenge]);

  const filteredChallenges = useMemo(() => {
    const term = query.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        item.category.toLowerCase().includes(term);
      const matchesCategory = browseCategory === "All" || getBrowseCategories(item).includes(browseCategory);
      const matchesDifficulty = difficulty === "All" || item.difficulty === difficulty;
      const completed = completedBarIds.includes(item.id);
      const matchesCompletion =
        completionFilter === "All" ||
        (completionFilter === "Completed" && completed) ||
        (completionFilter === "Not completed" && !completed);
      return matchesSearch && matchesCategory && matchesDifficulty && matchesCompletion;
    });
  }, [browseCategory, catalog, completedBarIds, completionFilter, difficulty, query]);
  const visibleChallenges = filteredChallenges.slice(0, 80);

  function go(screenName: Screen) {
    setScreen(screenName);
  }

  function openChallenge(id: string) {
    setChallengePickerOpen(false);
    setSelectedChallengeId(id);
    go("challenge");
  }

  function openPlan(id: string) {
    const plan = plans.find((item) => item.id === id);
    if (plan) setSelectedChallengeId(plan.challengeId);
    setSelectedPlanId(id);
    go("plan");
  }

  async function openNotifications() {
    if (session) await loadNotifications(session.user.id);
    go("notifications");
  }

  async function openNotification(notification: PlanNotification) {
    if (!session) return;

    setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item)
    );
    markNotificationRead(notification.id, session.user.id).catch((error) => {
      console.warn("Failed to mark notification read.", error);
    });

    if (notification.kind === "dm_message" && notification.dmThreadId) {
      await openDmThread(notification.dmThreadId);
      return;
    }

    if (notification.kind === "friend_request") {
      await loadFriendsData(session.user.id);
      go("people");
      return;
    }

    if (!notification.planId) {
      go("notifications");
      return;
    }

    const remotePlans = await loadRemotePlans(session.user.id, notification.planId);
    const targetPlan = remotePlans?.find((plan) => plan.id === notification.planId) ?? plans.find((plan) => plan.id === notification.planId);
    if (targetPlan) {
      setSelectedChallengeId(targetPlan.challengeId);
      setSelectedPlanId(targetPlan.id);
      if (notification.kind === "group_join" || notification.kind === "group_message") {
        await openChat(targetPlan.id);
      } else {
        go("plan");
      }
      return;
    }

    if (Platform.OS === "web") {
      window.alert("That plan is no longer active.");
    } else {
      Alert.alert("Plan unavailable", "That plan is no longer active.");
    }
  }

  async function openChat(planId = selectedPlan?.id) {
    if (!planId) return;

    setChatStatus("loading");
    setChatMembersOpen(false);
    try {
      await refreshChat(planId);
      setChatStatus("idle");
    } catch (error) {
      console.warn("Failed to load chat.", error);
      setMessages([]);
      setChatStatus("error");
    }
    go("chat");
  }

  async function refreshChat(planId = selectedPlan?.id) {
    if (!planId) return;

    const remoteMessages = await fetchChatMessages(planId);
    setMessages(remoteMessages);
  }

  async function loadDmThreads() {
    if (!session) return [];
    const threads = await fetchDmThreads(session.user.id);
    setDmThreads(threads);
    return threads;
  }

  async function openDmThread(threadId: string) {
    setSelectedDmThreadId(threadId);
    setDmStatus("loading");
    try {
      const remoteMessages = await fetchDmMessages(threadId);
      setDmMessages(remoteMessages);
      setDmStatus("idle");
      go("dmThread");
    } catch (error) {
      console.warn("Failed to load DM.", error);
      setDmMessages([]);
      setDmStatus("error");
      go("dmThread");
    }
  }

  async function startDm(otherUserId: string) {
    if (!session) {
      go("login");
      return;
    }

    try {
      const threadId = await getOrCreateDmThread(otherUserId);
      const threads = await loadDmThreads();
      if (!threads.some((thread) => thread.id === threadId)) {
        setDmThreads(await fetchDmThreads(session.user.id));
      }
      await openDmThread(threadId);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not start DM. Run supabase/add_dms.sql first.");
      if (Platform.OS === "web") {
        window.alert(`DM failed: ${message}`);
      } else {
        Alert.alert("DM failed", message);
      }
    }
  }

  async function refreshDm(threadId = selectedDmThreadId) {
    if (!threadId) return;
    const remoteMessages = await fetchDmMessages(threadId);
    setDmMessages(remoteMessages);
  }

  async function toggleInterest() {
    if (!session) {
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
        await unpinBar(session.user.id, barId);
      } else {
        await pinBar(session.user.id, barId);
      }
    } catch (error) {
      setPinnedBarIds(pinnedBarIds);
      const message = describeSupabaseError(error, "Could not update interest.");
      if (Platform.OS === "web") {
        window.alert(`Interest failed: ${message}`);
      } else {
        Alert.alert("Interest failed", message);
      }
    } finally {
      setInterestStatus("idle");
    }
  }

  async function completeSelectedChallenge() {
    if (!session) {
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
      await selfCompleteBar(session.user.id, selectedChallenge.id, selectedChallenge.xp);
      const updatedProfile = await updateProfileXp(session.user.id, nextXp);
      setProfile(updatedProfile);
      setXp(updatedProfile.xp);
    } catch (error) {
      setCompletedBarIds(completedBarIds);
      setXp(xp);
      const message = describeSupabaseError(error, "Could not mark bar completed.");
      if (Platform.OS === "web") {
        window.alert(`Completion failed: ${message}`);
      } else {
        Alert.alert("Completion failed", message);
      }
    } finally {
      setCompletionStatus("idle");
    }
  }

  async function runUndoSelectedChallengeCompletion() {
    if (!session || completionStatus === "saving") return;

    const nextCompletedIds = completedBarIds.filter((id) => id !== selectedChallenge.id);
    const nextXp = Math.max(0, xp - selectedChallenge.xp);
    setCompletedBarIds(nextCompletedIds);
    setXp(nextXp);
    setCompletionStatus("saving");

    try {
      await removeCompletedBar(session.user.id, selectedChallenge.id);
      const updatedProfile = await updateProfileXp(session.user.id, nextXp);
      setProfile(updatedProfile);
      setXp(updatedProfile.xp);
    } catch (error) {
      setCompletedBarIds(completedBarIds);
      setXp(xp);
      const message = describeSupabaseError(error, "Could not undo completion.");
      if (Platform.OS === "web") {
        window.alert(`Undo failed: ${message}`);
      } else {
        Alert.alert("Undo failed", message);
      }
    } finally {
      setCompletionStatus("idle");
    }
  }

  function undoSelectedChallengeCompletion() {
    if (!session || completionStatus === "saving") return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Undo completion for ${selectedChallenge.name}?`);
      if (confirmed) runUndoSelectedChallengeCompletion();
      return;
    }

    Alert.alert(
      "Undo completion?",
      "This will remove the bar from your completed list.",
      [
        { text: "Keep completed", style: "cancel" },
        { text: "Undo", style: "destructive", onPress: runUndoSelectedChallengeCompletion }
      ]
    );
  }

  async function runJoinPlan() {
    if (!session) {
      go("login");
      return;
    }

    try {
      await joinRemotePlan(selectedPlan.id, session.user.id);
      await sendChatMessage(selectedPlan.id, session.user.id, `${username} joined the plan.`);
      notifyPlanAttendees(
        selectedPlan.id,
        session.user.id,
        "group_join",
        `${username} joined ${selectedChallenge.name}`,
        `${username} is in for ${selectedPlan.place}.`
      ).catch((error) => console.warn("Failed to notify plan attendees.", error));
      const remotePlans = await loadRemotePlans(session.user.id);
      const joinedPlan = remotePlans?.find((plan) => plan.id === selectedPlan.id);
      if (joinedPlan) setSelectedPlanId(joinedPlan.id);
      await openChat(selectedPlan.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not join plan.";
      Alert.alert("Join failed", message);
    }
  }

  async function runLeavePlan() {
    if (!session || !selectedPlan) return;
    const leavingPlanId = selectedPlan.id;

    try {
      await sendChatMessage(leavingPlanId, session.user.id, `${username} left the plan.`);
      await leaveRemotePlan(leavingPlanId, session.user.id);
      setMessages([]);
      setChatMembersOpen(false);
      setPlans((current) => {
        const nextPlans = current.map((plan) => {
          if (plan.id !== leavingPlanId) return plan;
          return {
            ...plan,
            attendees: plan.attendees.filter((attendee) => attendee !== username),
            attendeeProfiles: plan.attendeeProfiles?.filter((attendee) => attendee.id !== session.user.id) ?? [],
            currentUserJoined: false
          };
        });
        return nextPlans;
      });
      const remotePlans = await loadRemotePlans(session.user.id);
      if (remotePlans?.some((plan) => plan.id === leavingPlanId)) {
        setSelectedPlanId(leavingPlanId);
      }
      go("chats");
    } catch (error) {
      const message = describeSupabaseError(error, "Could not leave plan. You may need to run supabase/add_leave_plan.sql.");
      if (Platform.OS === "web") {
        window.alert(`Leave failed: ${message}`);
      } else {
        Alert.alert("Leave failed", message);
      }
    }
  }

  function confirmLeavePlan() {
    if (!session || !selectedPlan) return;

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Leave this group chat? You can join the plan again later if it is still open.");
      if (confirmed) runLeavePlan();
      return;
    }

    Alert.alert(
      "Leave group?",
      "You will be removed from the attendee list and group chat.",
      [
        { text: "Stay", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: runLeavePlan }
      ]
    );
  }

  function confirmJoinPlan() {
    if (!session) {
      go("login");
      return;
    }

    const message = `${selectedChallenge.name}\n${selectedPlan.place} Â· ${selectedPlan.startsAt}\n\nJoin this plan so the organizer can see you are coming?`;

    if (Platform.OS === "web") {
      const confirmed = window.confirm(message);
      if (confirmed) runJoinPlan();
      return;
    }

    Alert.alert(
      "Join this plan?",
      message,
      [
        { text: "Not yet", style: "cancel" },
        { text: "Confirm join", onPress: runJoinPlan }
      ]
    );
  }

  async function createPlan() {
    if (!session) {
      go("login");
      return;
    }

    const schedule = buildCreatePlanSchedule(planDay, planTime, planDurationMinutes);
    if (!schedule) {
      Alert.alert("Check the time", "Enter a future time like 7:00 PM, 7 PM, or 19:00.");
      return;
    }

    const { startsAt, endsAt } = schedule;
    const locationName = planPlace || selectedChallenge.places[0] || "Other";
    const locationDetail = planDetail.trim();
    const note = planNote.trim();
    const duplicatePlan = plans.find(
      (plan) =>
        plan.challengeId === selectedChallenge.id &&
        plan.place === locationName &&
        plan.detail.trim().toLowerCase() === locationDetail.toLowerCase() &&
        plan.startsAtIso &&
        sameMinute(plan.startsAtIso, startsAt)
    );

    if (duplicatePlan) {
      if (Platform.OS === "web") {
        const openExisting = window.confirm(
          "There is already a plan for this bar at that exact time and place. Open that plan instead?"
        );
        if (openExisting) openPlan(duplicatePlan.id);
        return;
      }

      Alert.alert(
        "Plan already exists",
        "There is already a plan for this bar at that exact time and place. Open that plan instead, or choose a different time/place once those controls are editable.",
        [
          { text: "Keep editing", style: "cancel" },
          { text: "Open plan", onPress: () => openPlan(duplicatePlan.id) }
        ]
      );
      return;
    }

    try {
      setPublishingPlan(true);
      const planId = await createRemotePlan({
        catalogBarId: selectedChallenge.id,
        userId: session.user.id,
        locationName,
        locationDetail,
        startsAt,
        endsAt,
        cap: planCap > 0 ? planCap : null,
        note,
        visibility: planVisibility
      });
      const optimisticPlan: Plan = {
        id: planId,
        challengeId: selectedChallenge.id,
        place: locationName,
        detail: locationDetail,
        startsAt: formatCreatedPlanTime(startsAt),
        startsAtIso: startsAt.toISOString(),
        status: startsAt <= new Date() ? "ongoing" : "upcoming",
        visibility: planVisibility,
        attendees: [username],
        cap: planCap > 0 ? planCap : undefined,
        note,
        startedBy: username,
        startedById: session.user.id,
        currentUserJoined: true
      };
      setPlans((current) => [optimisticPlan, ...current.filter((plan) => plan.id !== planId)]);
      setSelectedPlanId(planId);
      go("discover");
      loadRemotePlans(session.user.id, planId).catch((error) => {
        console.warn("Failed to refresh plans after publish.", error);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create plan.";
      Alert.alert("Plan not created", message);
    } finally {
      setPublishingPlan(false);
    }
  }

  async function cancelPlan() {
    if (!session || !selectedPlan) return;

    async function runCancelPlan() {
      if (!session || !selectedPlan) return;
      const canceledPlanId = selectedPlan.id;

      try {
        await cancelRemotePlan(canceledPlanId, session.user.id);
        setPlans((current) => {
          const nextPlans = current.filter((plan) => plan.id !== canceledPlanId);
          setSelectedPlanId(nextPlans[0]?.id ?? "");
          return nextPlans;
        });
        go("discover");
        loadRemotePlans(session.user.id).catch((error) => {
          console.warn("Failed to refresh plans after cancel.", error);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not cancel plan.";
        if (Platform.OS === "web") {
          window.alert(`Cancel failed: ${message}`);
        } else {
          Alert.alert("Cancel failed", message);
        }
      }
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Cancel this plan? It will disappear from discovery and stop new people from joining.");
      if (confirmed) await runCancelPlan();
      return;
    }

    Alert.alert(
      "Cancel this plan?",
      "This removes it from discovery and stops new people from joining.",
      [
        { text: "Keep plan", style: "cancel" },
        {
          text: "Cancel plan",
          style: "destructive",
          onPress: runCancelPlan
        }
      ]
    );
  }

  async function sendMessage() {
    if (!session) {
      go("login");
      return;
    }

    const body = message.trim();
    if (!body || chatStatus === "sending") return;

    setMessage("");
    setChatStatus("sending");
    try {
      const sentMessage = await sendChatMessage(selectedPlan.id, session.user.id, body);
      setMessages((current) => [...current, sentMessage]);
      notifyPlanAttendees(
        selectedPlan.id,
        session.user.id,
        "group_message",
        `${username} messaged ${selectedChallenge.name}`,
        body.length > 120 ? `${body.slice(0, 117)}...` : body
      ).catch((error) => console.warn("Failed to notify plan attendees.", error));
      setChatStatus("idle");
    } catch (error) {
      setMessage(body);
      setChatStatus("error");
      const errorMessage = describeSupabaseError(error, "Could not send message.");
      if (Platform.OS === "web") {
        window.alert(`Message failed: ${errorMessage}`);
      } else {
        Alert.alert("Message failed", errorMessage);
      }
    }
  }

  async function sendDirectMessage() {
    if (!session || !selectedDmThreadId) {
      go("login");
      return;
    }

    const body = dmMessage.trim();
    if (!body || dmStatus === "sending") return;

    setDmStatus("sending");
    setDmMessage("");
    try {
      const sentMessage = await sendDmMessage(selectedDmThreadId, session.user.id, body);
      setDmMessages((current) => [...current, sentMessage]);
      notifyDmRecipient(
        selectedDmThreadId,
        session.user.id,
        `${username} sent you a DM`,
        body.length > 120 ? `${body.slice(0, 117)}...` : body
      ).catch((error) => console.warn("Failed to notify DM recipient.", error));
      loadDmThreads().catch((error) => console.warn("Failed to refresh DM inbox.", error));
      setDmStatus("idle");
    } catch (error) {
      setDmMessage(body);
      setDmStatus("error");
      const errorMessage = describeSupabaseError(error, "Could not send DM.");
      if (Platform.OS === "web") {
        window.alert(`DM failed: ${errorMessage}`);
      } else {
        Alert.alert("DM failed", errorMessage);
      }
    }
  }

  const showTabs = !["login", "onboarding", "challenge", "plan", "create", "notifications", "completed", "people", "publicProfile", "leaderboard"].includes(screen);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.phone}>
        {screen === "login" && (
          <View style={styles.loginScreen}>
            <BrandMark />
            <Text style={styles.welcomePill}>WELCOME TO</Text>
            <Text style={styles.heroTitle}>RITUAL</Text>
            <Text style={styles.heroSubtitle}>Find the group. Do the bar. Build the jacket.</Text>
            <FieldLabel text="EMAIL" />
            <View style={styles.inputShell}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
              />
            </View>
            <PatchButton
              label={authStatus === "sending" ? "SENDING..." : "SEND LOGIN LINK"}
              tone="navy"
              onPress={sendLoginLink}
            />
            {!!authMessage && <Text style={styles.authMessage}>{authMessage}</Text>}
            {authStatus === "checking" && <Text style={styles.authMessage}>Checking login...</Text>}
          </View>
        )}

        {screen === "onboarding" && (
          <ScrollView contentContainerStyle={styles.onboarding}>
            <BrandMark />
            <Text style={styles.welcomePill}>WELCOME TO</Text>
            <Text style={styles.heroTitle}>RITUAL</Text>
            <Text style={styles.heroSubtitle}>Let's build your jacket.</Text>
            <FieldLabel text="USERNAME" />
            <View style={styles.inputShell}>
              <TextInput value={username} onChangeText={setUsername} style={styles.input} autoCapitalize="none" />
              <Check color={colors.green} size={18} />
            </View>
            <FieldLabel text="ROLE" />
            <View style={styles.segmentRow}>
              {["Frosh", "Frec", "Upper Year", "Other"].map((item) => (
                <Pressable key={item} onPress={() => setRole(item)} style={[styles.segment, role === item && styles.segmentActive]}>
                  <Text style={[styles.segmentText, role === item && styles.segmentTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <FieldLabel text="PICK YOUR PATCH (AVATAR)" />
            <View style={styles.avatarGrid}>
              {avatarOptions.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityLabel={item.label}
                  onPress={() => setAvatar(item.id)}
                  style={[styles.avatarOption, avatar === item.id && styles.avatarOptionActive]}
                >
                  <AvatarIcon avatar={item.id} size={30} color={avatar === item.id ? colors.gold : colors.ink} />
                </Pressable>
              ))}
            </View>
            <View style={styles.guidelineRow}>
              <View style={styles.checkbox} />
              <Text style={styles.guidelineText}>I agree to the Ritual Guidelines</Text>
            </View>
            <PatchButton
              label={authStatus === "saving" ? "SAVING..." : "LET'S GO!"}
              tone="navy"
              onPress={saveOnboardingProfile}
            />
            <Text style={styles.handNote}>Build Good.{"\n"}Have Fun.</Text>
          </ScrollView>
        )}

        {screen === "discover" && (
          <AppScreen title="DISCOVER" right={<DiscoverHeaderActions count={unreadNotificationCount} onNotifications={openNotifications} onPeople={() => go("people")} onLeaderboard={() => go("leaderboard")} />}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search bars, locations, people..." />
            <FilterRow labels={["All", "Ongoing", "Upcoming", "Nearby", "Easy"]} />
            <SectionHeader title="ONGOING PLANS" action={plansStatusLabel(plansStatus)} />
            {plans.length === 0 && <Text style={styles.emptyState}>No plans yet. Create the first one from the Catalog.</Text>}
            {plans.filter((plan) => plan.status === "ongoing").map((plan) => (
              <PlanPatch key={plan.id} plan={plan} catalog={catalog} onPress={() => openPlan(plan.id)} />
            ))}
            <SectionHeader title="UPCOMING PLANS" action={plans.length ? "See all" : "Create one"} />
            {plans.filter((plan) => plan.status === "upcoming").map((plan) => (
              <PlanPatch key={plan.id} plan={plan} catalog={catalog} onPress={() => openPlan(plan.id)} />
            ))}
          </AppScreen>
        )}

        {screen === "notifications" && (
          <DetailScreen back={() => go("discover")} title="NOTIFICATIONS">
            {notificationsStatus === "loading" && <Text style={styles.emptyState}>Loading notifications...</Text>}
            {notificationsStatus !== "loading" && notifications.length === 0 && (
              <Text style={styles.emptyState}>No notifications yet. Pin bars to hear when someone hosts them.</Text>
            )}
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                challenge={catalog.find((item) => item.id === notification.catalogBarId)}
                onPress={() => openNotification(notification)}
              />
            ))}
          </DetailScreen>
        )}

        {screen === "people" && (
          <DetailScreen back={() => go("discover")} title="PEOPLE">
            {incomingFriendRequests.length > 0 && (
              <>
                <SectionHeader title="FRIEND REQUESTS" action={`${incomingFriendRequests.length}`} />
                {incomingFriendRequests.map((request) => request.requester && (
                  <FriendRequestRow
                    key={request.id}
                    request={request}
                    onProfile={() => request.requester && openPublicProfile(request.requester)}
                    onAccept={() => respondToFriendRequest(request.id, "accept")}
                    onDecline={() => respondToFriendRequest(request.id, "decline")}
                    disabled={friendActionStatus === "saving"}
                  />
                ))}
              </>
            )}
            {friends.length > 0 && (
              <>
                <SectionHeader title="FRIENDS" action={`${friends.length}`} />
                {friends.map((item) => (
                  <PeopleRow key={item.id} profile={item} onPress={() => openPublicProfile(item)} />
                ))}
              </>
            )}
            <SectionHeader title="FIND PEOPLE" action={peopleStatus === "loading" ? "Loading" : undefined} />
            <SearchBar value={peopleQuery} onChange={setPeopleQuery} placeholder="Search display names..." />
            {peopleStatus === "loading" && <Text style={styles.emptyState}>Searching profiles...</Text>}
            {peopleStatus === "error" && <Text style={styles.emptyState}>Could not load profiles. Check Supabase policies and try again.</Text>}
            {peopleStatus !== "loading" && peopleResults.length === 0 && (
              <Text style={styles.emptyState}>{peopleQuery.trim() ? "No matching profiles yet." : "No other profiles found yet."}</Text>
            )}
            {peopleResults.map((item) => (
              <PeopleRow key={item.id} profile={item} onPress={() => openPublicProfile(item)} />
            ))}
          </DetailScreen>
        )}

        {screen === "leaderboard" && (
          <DetailScreen back={() => go("discover")} title="LEADERBOARD">
            {leaderboardStatus === "loading" && <Text style={styles.emptyState}>Loading leaderboard...</Text>}
            {leaderboardStatus === "error" && <Text style={styles.emptyState}>Could not load the leaderboard yet.</Text>}
            {leaderboard.map((item, index) => (
              <LeaderboardRow key={item.id} profile={item} place={index + 1} onPress={() => openPublicProfile(item, "leaderboard")} />
            ))}
          </DetailScreen>
        )}

        {screen === "publicProfile" && selectedPublicProfile && (
          <DetailScreen back={() => go(publicProfileBackScreen)} title="PROFILE">
            <View style={styles.profileTop}>
              <View style={styles.profileAvatar}><AvatarIcon avatar={selectedPublicProfile.avatar} color={colors.gold} size={42} /></View>
              <View style={styles.profileNameBlock}>
                <Text style={styles.profileName}>{selectedPublicProfile.username}</Text>
                <Text style={styles.profileMeta}>
                  {[selectedPublicProfile.year_label, selectedPublicProfile.program].filter(Boolean).join(" ") || roleDbToLabel(selectedPublicProfile.role)}
                </Text>
                <Tag text={roleDbToLabel(selectedPublicProfile.role).toUpperCase()} />
              </View>
              <View style={styles.tierPatch}><Text style={styles.tierSmall}>TIER</Text><Text style={styles.tierTitle}>{getRankFromXp(selectedPublicProfile.xp)}</Text><Award color={colors.gold} size={28} /></View>
            </View>
            <FieldLabel text="BIO" />
            <Text style={styles.profileBio}>{selectedPublicProfile.bio || "No bio yet."}</Text>
            {session?.user.id !== selectedPublicProfile.id && (
              <>
                {friendStatus === "incoming" && selectedIncomingFriendRequest && (
                  <>
                    <PatchButton label={friendActionStatus === "saving" ? "SAVING..." : "ACCEPT FRIEND"} tone="green" onPress={() => respondToFriendRequest(selectedIncomingFriendRequest.id, "accept")} />
                    <OutlineButton label="DECLINE REQUEST" onPress={() => respondToFriendRequest(selectedIncomingFriendRequest.id, "decline")} />
                  </>
                )}
                {friendStatus === "none" && <PatchButton label={friendActionStatus === "saving" ? "SENDING..." : "ADD FRIEND"} tone="green" onPress={requestFriendship} />}
                {friendStatus === "outgoing" && <OutlineButton label={friendActionStatus === "saving" ? "CANCELING..." : "CANCEL REQUEST"} onPress={runCancelFriendRequest} />}
                {friendStatus === "friends" && <OutlineButton label={friendActionStatus === "saving" ? "REMOVING..." : "UNFRIEND"} onPress={confirmUnfriend} />}
                {friendStatus === "friends" ? (
                  <PatchButton label="MESSAGE" tone="navy" onPress={() => startDm(selectedPublicProfile.id)} />
                ) : (
                  <Text style={styles.emptyState}>Add each other as friends to unlock DMs.</Text>
                )}
              </>
            )}
            <SectionHeader title="COMPLETED BARS" action={`${publicCompletedChallenges.length}`} />
            {publicCompletedChallenges.length === 0 && <Text style={styles.emptyState}>No completed bars shown yet.</Text>}
            {publicCompletedChallenges.map((challenge) => (
              <CompletedBarRow key={challenge.id} challenge={challenge} onPress={() => openChallenge(challenge.id)} />
            ))}
          </DetailScreen>
        )}

        {screen === "catalog" && (
          <AppScreen title="CATALOG" right={<Text style={styles.xpBadge}>XP {xp.toLocaleString()}</Text>}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search challenges..." />
            <FieldLabel text="BROWSE BY TYPE" />
            <ChoiceFilterRow
              labels={[
                "All",
                "Social & Games",
                "Campus & Places",
                "Music & Movies",
                "Long-form",
                "Participation",
                "Unreviewed"
              ]}
              value={browseCategory}
              onChange={(value) => setBrowseCategory(value as BrowseCategory | "All")}
            />
            <FieldLabel text="DIFFICULTY" />
            <ChoiceFilterRow
              labels={["All", "Easy", "Medium", "Hard", "Legendary"]}
              value={difficulty}
              onChange={(value) => setDifficulty(value as Challenge["difficulty"] | "All")}
            />
            <FieldLabel text="COMPLETION" />
            <ChoiceFilterRow
              labels={["All", "Completed", "Not completed"]}
              value={completionFilter}
              onChange={(value) => setCompletionFilter(value as "All" | "Completed" | "Not completed")}
            />
            <Text style={styles.catalogCount}>
              Showing {visibleChallenges.length} of {filteredChallenges.length} bars Â· {catalogStatusLabel(catalogStatus)}
            </Text>
            {(browseCategory !== "All" || difficulty !== "All" || completionFilter !== "All" || query) && (
              <Pressable
                onPress={() => {
                  setBrowseCategory("All");
                  setDifficulty("All");
                  setCompletionFilter("All");
                  setQuery("");
                }}
                style={styles.clearFilters}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </Pressable>
            )}
            <View style={styles.catalogGrid}>
              {visibleChallenges.map((challenge) => (
                <ChallengePatch
                  key={challenge.id}
                  challenge={challenge}
                  pinned={pinnedBarIds.includes(challenge.id)}
                  completed={completedBarIds.includes(challenge.id)}
                  onPress={() => openChallenge(challenge.id)}
                />
              ))}
            </View>
          </AppScreen>
        )}

        {screen === "challenge" && (
          <DetailScreen back={() => go("catalog")}>
            <ChallengeHero challenge={selectedChallenge} />
            <View style={styles.metaRow}>
              {getBrowseCategories(selectedChallenge).filter((category) => category !== "Unreviewed").map((category) => <Tag key={category} text={category} active />)}
              {selectedChallenge.tags.filter((tag) => tag !== "Shenanigans").map((tag) => <Tag key={tag} text={tag} />)}
            </View>
            <FieldLabel text="ABOUT THIS BAR" />
            <Text style={styles.detailCopy}>{selectedChallenge.summary}</Text>
            <FieldLabel text={selectedChallenge.reviewed ? "TRADITIONAL REQUIREMENT" : "INSTRUCTIONS"} />
            <Text style={styles.detailCopy}>{selectedChallenge.instructions}</Text>
            <FieldLabel text="COMMON LOCATIONS" />
            <View style={styles.metaRow}>
              {selectedChallenge.places.map((place) => <Tag key={place} text={place} />)}
            </View>
            <View style={styles.statRow}>
              <StatBlock value={(selectedChallenge.interested + (selectedChallengePinned ? 1 : 0)).toLocaleString()} label="Interested" />
              <StatBlock value={`${selectedChallenge.upcoming}`} label="Upcoming Plans" />
            </View>
            <PatchButton
              label={interestStatus === "saving" ? "SAVING..." : selectedChallengePinned ? "PINNED - NOTIFY ME" : "PIN THIS BAR"}
              tone={selectedChallengePinned ? "green" : "navy"}
              onPress={interestStatus === "saving" ? () => undefined : toggleInterest}
            />
            <PatchButton
              label={completionStatus === "saving" ? "SAVING..." : selectedChallengeCompleted ? "UNDO COMPLETION" : `MARK COMPLETED (+${selectedChallenge.xp} XP)`}
              tone={selectedChallengeCompleted ? "green" : "red"}
              onPress={completeSelectedChallenge}
            />
            <OutlineButton label="MORE INFO" onPress={() => Linking.openURL(selectedChallenge.sourceUrl)} />
            <SectionHeader title="ONGOING PLANS" action="See all" />
            {plans.filter((plan) => plan.challengeId === selectedChallenge.id && plan.status === "ongoing").map((plan) => (
              <PlanPatch key={plan.id} plan={plan} catalog={catalog} onPress={() => openPlan(plan.id)} />
            ))}
            <PatchButton label="CREATE A PLAN" tone="red" onPress={() => go("create")} />
          </DetailScreen>
        )}

        {screen === "create" && (
          <DetailScreen back={() => go("challenge")} title="CREATE PLAN">
            <ProgressSteps />
            <FieldLabel text="CHOOSE A CHALLENGE" />
            <ChallengePicker
              catalog={catalog}
              selectedChallenge={selectedChallenge}
              open={challengePickerOpen}
              onToggle={() => setChallengePickerOpen((current) => !current)}
              onSelect={(challengeId) => {
                setSelectedChallengeId(challengeId);
                setChallengePickerOpen(false);
              }}
            />
            {matchingLivePlans.length > 0 && (
              <View style={styles.existingPlanNotice}>
                <Text style={styles.existingPlanTitle}>Already on the board</Text>
                <Text style={styles.existingPlanText}>
                  {matchingLivePlans.length === 1
                    ? "There is already a live or upcoming plan for this bar. You can still publish your own separate plan."
                    : `There are already ${matchingLivePlans.length} live or upcoming plans for this bar. You can still publish your own separate plan.`}
                </Text>
                {matchingLivePlans.slice(0, 2).map((plan) => (
                  <Pressable key={plan.id} onPress={() => openPlan(plan.id)} style={styles.existingPlanRow}>
                    <Text style={styles.existingPlanRowTitle}>{plan.place}</Text>
                    <Text style={styles.existingPlanRowMeta}>{plan.startsAt} Â· {plan.attendees.length}/{plan.cap ?? "âˆž"}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <FieldLabel text="WHEN & DURATION" />
            <ChoiceFilterRow labels={["Today", "Tomorrow"]} value={planDay} onChange={(value) => setPlanDay(value as CreatePlanDay)} />
            <View style={styles.formRow}>
              <View style={[styles.inputShell, styles.formInputShell]}>
                <TextInput
                  value={planTime}
                  onChangeText={setPlanTime}
                  style={styles.input}
                  placeholder="7:00 PM"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.durationSummary}>
                <Text style={styles.durationSummaryLabel}>DURATION</Text>
                <Text style={styles.durationSummaryValue}>{planDurationMinutes} min</Text>
              </View>
            </View>
            <FieldLabel text="DURATION" />
            <ChoiceFilterRow
              labels={["30 min", "60 min", "120 min", "180 min"]}
              value={`${planDurationMinutes} min`}
              onChange={(value) => setPlanDurationMinutes(Number.parseInt(value, 10))}
            />
            <FieldLabel text="WHERE" />
            <View style={styles.metaRow}>
              {[...selectedChallenge.places, "Other location"].map((place) => (
                <Pressable key={place} onPress={() => setPlanPlace(place)}>
                  <Tag text={place} active={planPlace === place} />
                </Pressable>
              ))}
            </View>
            <View style={styles.inputShell}>
              <TextInput
                value={planDetail}
                onChangeText={setPlanDetail}
                style={styles.input}
                placeholder="Specific spot, room, lobby, entrance..."
                placeholderTextColor={colors.muted}
              />
            </View>
            <FieldLabel text="WHO CAN SEE IT" />
            <ChoiceFilterRow
              labels={["Public", "Friends"]}
              value={planVisibility === "public" ? "Public" : "Friends"}
              onChange={(value) => setPlanVisibility(value === "Friends" ? "friends" : "public")}
            />
            <FieldLabel text="CAP (OPTIONAL)" />
            <View style={styles.stepper}>
              <Pressable onPress={() => setPlanCap((current) => Math.max(1, current - 1))}>
                <Text style={styles.stepperText}>-</Text>
              </Pressable>
              <Text style={styles.stepperText}>{planCap}</Text>
              <Pressable onPress={() => setPlanCap((current) => Math.min(99, current + 1))}>
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
            <FieldLabel text="NOTE (OPTIONAL)" />
            <View style={styles.noteBox}>
              <TextInput
                value={planNote}
                onChangeText={(text) => setPlanNote(text.slice(0, 100))}
                style={styles.noteInput}
                multiline
                placeholder="Add anything people should know..."
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.counter}>{planNote.length}/100</Text>
            </View>
            <PatchButton label={publishingPlan ? "PUBLISHING..." : "PUBLISH PLAN!"} tone="red" onPress={publishingPlan ? () => undefined : createPlan} />
          </DetailScreen>
        )}

        {screen === "plan" && (
          <DetailScreen back={() => go("discover")}>
            <ChallengeHero challenge={selectedChallenge} compact />
            <PlanInfoRow icon={<CalendarDays color={colors.ink} size={18} />} label="TIME" value={selectedPlan.startsAt} />
            <PlanInfoRow icon={<MapPin color={colors.ink} size={18} />} label="LOCATION" value={`${selectedPlan.place}\n${selectedPlan.detail}`} />
            <PlanInfoRow icon={<Users color={colors.ink} size={18} />} label="VISIBILITY" value={selectedPlan.visibility === "friends" ? "Friends only" : "Public"} />
            <PlanInfoRow icon={<Users color={colors.ink} size={18} />} label="ATTENDEES" value={`${selectedPlan.attendees.length} / ${selectedPlan.cap ?? "âˆž"}`} />
            <Pressable
              onPress={() => selectedPlan.startedById && openPublicProfileById(selectedPlan.startedById, "plan")}
              disabled={!selectedPlan.startedById}
            >
              <PlanInfoRow icon={<AvatarIcon avatar="gear" color={colors.ink} size={18} />} label="STARTED BY" value={selectedPlan.startedBy} />
            </Pressable>
            <PlanInfoRow icon={<BookOpen color={colors.ink} size={18} />} label="NOTE" value={selectedPlan.note} />
            {(selectedPlan.currentUserJoined || selectedPlan.attendees.includes(username)) && (
              <>
                <SectionHeader title="INVITE FRIENDS" action={friends.length ? `${friends.length}` : undefined} />
                {friends.length === 0 && <Text style={styles.emptyState}>Add friends to invite them to plans.</Text>}
                {friends.map((friend) => (
                  <FriendInviteRow
                    key={friend.id}
                    friend={friend}
                    disabled={!!invitingFriendId}
                    inviting={invitingFriendId === friend.id}
                    onInvite={() => inviteFriendToPlan(friend)}
                  />
                ))}
              </>
            )}
            <PatchButton
              label={selectedPlan.currentUserJoined || selectedPlan.attendees.includes(username) ? "OPEN GROUP CHAT" : "I'M IN!"}
              tone="green"
              onPress={selectedPlan.currentUserJoined || selectedPlan.attendees.includes(username) ? () => openChat(selectedPlan.id) : confirmJoinPlan}
            />
            {(selectedPlan.currentUserJoined || selectedPlan.attendees.includes(username)) && !currentUserStartedPlan && <OutlineButton label="LEAVE GROUP" onPress={confirmLeavePlan} />}
            {currentUserStartedPlan && <OutlineButton label="CANCEL PLAN" onPress={cancelPlan} />}
          </DetailScreen>
        )}

        {screen === "chats" && (
          <AppScreen title="CHATS" right={<Text style={styles.xpBadge}>{joinedPlans.length + dmThreads.length}</Text>}>
            <SectionHeader title="YOUR GROUP CHATS" action={plansStatusLabel(plansStatus)} />
            {joinedPlans.length === 0 && <Text style={styles.emptyState}>Join a plan to start seeing its group chat here.</Text>}
            {joinedPlans.map((plan) => (
              <PlanPatch key={plan.id} plan={plan} catalog={catalog} onPress={() => openChat(plan.id)} />
            ))}
            <SectionHeader title="DIRECT MESSAGES" action={dmThreads.length ? `${dmThreads.length}` : undefined} />
            {dmThreads.length === 0 && <Text style={styles.emptyState}>Open someone's profile and tap MESSAGE to start a DM.</Text>}
            {dmThreads.map((thread) => (
              <DmThreadRow key={thread.id} thread={thread} onPress={() => openDmThread(thread.id)} />
            ))}
          </AppScreen>
        )}

        {screen === "chat" && (
          <View style={styles.chatScreen}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderTop}>
                <Pressable accessibilityLabel="Back to chats" onPress={() => go("chats")} style={({ pressed }) => [styles.chatMembersButton, pressedScale(pressed)]}>
                  <ChevronLeft color={colors.ink} size={23} />
                </Pressable>
                <View style={styles.chatHeaderTitleBlock}>
                  <Text style={styles.chatTitle}>{selectedChallenge.name.toUpperCase()}</Text>
                  <Text style={styles.chatStatus}>â— Plan Chat Â· {selectedPlan.attendees.length} Going</Text>
                </View>
                <Pressable
                  accessibilityLabel="Show chat members"
                  onPress={() => setChatMembersOpen((current) => !current)}
                  style={({ pressed }) => [styles.chatMembersButton, pressedScale(pressed)]}
                >
                  <Users color={colors.ink} size={19} />
                </Pressable>
              </View>
              <Pressable
                accessibilityLabel="Leave group chat"
                onPress={confirmLeavePlan}
                style={({ pressed }) => [styles.chatLeaveButton, pressedScale(pressed)]}
              >
                <Text style={styles.chatLeaveButtonText}>LEAVE GROUP</Text>
              </Pressable>
            </View>
            {chatMembersOpen && (
              <View style={styles.chatMembersOverlay}>
                <Pressable style={styles.chatMembersBackdrop} onPress={() => setChatMembersOpen(false)} />
                <View style={styles.chatMembersDrawer}>
                  <View style={styles.chatMembersDrawerHeader}>
                    <Text style={styles.chatMembersTitle}>WHO'S IN</Text>
                    <Pressable onPress={() => setChatMembersOpen(false)} style={({ pressed }) => [styles.chatMembersClose, pressedScale(pressed)]}>
                      <Text style={styles.chatMembersCloseText}>X</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.chatMembersCount}>{selectedPlan.attendees.length} going</Text>
                  {(selectedPlan.attendeeProfiles?.length ? selectedPlan.attendeeProfiles : selectedPlan.attendees.map((attendee) => ({ id: attendee, username: attendee }))).map((attendee) => (
                    <Pressable
                      key={attendee.id}
                      onPress={() => {
                        if (selectedPlan.attendeeProfiles?.length) {
                          setChatMembersOpen(false);
                          openPublicProfileById(attendee.id, "chat");
                        }
                      }}
                      style={({ pressed }) => [styles.chatMemberRow, pressedScale(pressed)]}
                    >
                      <View style={styles.chatMemberAvatar}><AvatarIcon avatar="star" color={colors.ink} size={15} /></View>
                      <Text style={styles.chatMemberRowText}>{attendee.username}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            <ScrollView contentContainerStyle={styles.chatList}>
              {chatStatus === "loading" && <Text style={styles.emptyState}>Loading chat...</Text>}
              {chatStatus !== "loading" && messages.length === 0 && (
                <Text style={styles.emptyState}>No messages yet. Start the plan chat.</Text>
              )}
              {messages.map((item) => (
                item.body.endsWith(" joined the plan.") ? (
                  <View key={item.id} style={styles.systemMessage}>
                    <Text style={styles.systemMessageText}>{item.body}</Text>
                  </View>
                ) : (
                  <View key={item.id} style={[styles.messageRow, item.senderId === session?.user.id && styles.messageRowMine]}>
                    <View style={styles.miniAvatar}><AvatarIcon avatar={item.senderId === session?.user.id ? avatar : "star"} color={colors.ink} size={16} /></View>
                    <View style={[styles.messageBubble, item.senderId === session?.user.id && styles.messageBubbleMine]}>
                      <Pressable onPress={() => openPublicProfileById(item.senderId, "chat")}>
                        <Text style={styles.messageFrom}>{item.from}</Text>
                      </Pressable>
                      <Text style={styles.messageText}>{item.body}</Text>
                    </View>
                  </View>
                )
              ))}
            </ScrollView>
            <View style={styles.composer}>
              <Plus color={colors.ink} size={20} />
              <TextInput value={message} onChangeText={setMessage} placeholder={`Message ${selectedChallenge.name}...`} style={styles.composerInput} />
              <Pressable onPress={sendMessage} style={[styles.sendButton, chatStatus === "sending" && styles.sendButtonDisabled]}><Send color={colors.ink} size={18} /></Pressable>
            </View>
          </View>
        )}

        {screen === "dmThread" && (
          <View style={styles.chatScreen}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderTop}>
                <Pressable accessibilityLabel="Back to chats" onPress={() => go("chats")} style={({ pressed }) => [styles.chatMembersButton, pressedScale(pressed)]}>
                  <ChevronLeft color={colors.ink} size={23} />
                </Pressable>
                <Pressable
                  onPress={() => selectedDmThread?.otherUserId && openPublicProfileById(selectedDmThread.otherUserId, "dmThread")}
                  style={styles.chatHeaderTitleBlock}
                >
                  <Text style={styles.chatTitle}>{selectedDmThread?.otherUsername.toUpperCase() ?? "DM"}</Text>
                  <Text style={styles.chatStatus}>Direct Message</Text>
                </Pressable>
                <View style={styles.chatMembersButton} />
              </View>
            </View>
            <ScrollView contentContainerStyle={styles.chatList}>
              {dmStatus === "loading" && <Text style={styles.emptyState}>Loading messages...</Text>}
              {dmStatus !== "loading" && dmMessages.length === 0 && (
                <Text style={styles.emptyState}>No messages yet. Say hi.</Text>
              )}
              {dmMessages.map((item) => (
                <View key={item.id} style={[styles.messageRow, item.senderId === session?.user.id && styles.messageRowMine]}>
                  <View style={styles.miniAvatar}><AvatarIcon avatar={item.senderId === session?.user.id ? avatar : selectedDmThread?.otherAvatar ?? "star"} color={colors.ink} size={16} /></View>
                  <View style={[styles.messageBubble, item.senderId === session?.user.id && styles.messageBubbleMine]}>
                    <Text style={styles.messageFrom}>{item.from}</Text>
                    <Text style={styles.messageText}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.composer}>
              <Plus color={colors.ink} size={20} />
              <TextInput value={dmMessage} onChangeText={setDmMessage} placeholder={`Message ${selectedDmThread?.otherUsername ?? "user"}...`} style={styles.composerInput} />
              <Pressable onPress={sendDirectMessage} style={[styles.sendButton, dmStatus === "sending" && styles.sendButtonDisabled]}><Send color={colors.ink} size={18} /></Pressable>
            </View>
          </View>
        )}

        {screen === "profile" && (
          <AppScreen title="" right={<Shield color={colors.ink} size={20} />}>
            <View style={styles.profileTop}>
              <View style={styles.profileAvatar}><AvatarIcon avatar={avatar} color={colors.gold} size={42} /></View>
              <View style={styles.profileNameBlock}>
                <Text style={styles.profileName}>{username}</Text>
                <Text style={styles.profileMeta}>{profile ? roleDbToLabel(profile.role) : role}</Text>
                <Tag text={(profile ? roleDbToLabel(profile.role) : role).toUpperCase()} />
              </View>
              <View style={styles.tierPatch}><Text style={styles.tierSmall}>TIER</Text><Text style={styles.tierTitle}>{tier}</Text><Award color={colors.gold} size={28} /></View>
            </View>
            <FieldLabel text="PROFILE PATCH" />
            <View style={styles.avatarGrid}>
              {avatarOptions.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityLabel={item.label}
                  onPress={() => setAvatar(item.id)}
                  style={[styles.avatarOption, avatar === item.id && styles.avatarOptionActive]}
                >
                  <AvatarIcon avatar={item.id} size={30} color={avatar === item.id ? colors.gold : colors.ink} />
                </Pressable>
              ))}
            </View>
            <FieldLabel text="BIO" />
            <View style={styles.bioBox}>
              <TextInput
                value={draftBio}
                onChangeText={(text) => setDraftBio(text.slice(0, 160))}
                style={styles.bioInput}
                multiline
                placeholder="Add a short bio..."
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.counter}>{draftBio.length}/160</Text>
            </View>
            <OutlineButton label={profileSaveStatus === "saving" ? "SAVING..." : "SAVE PROFILE"} onPress={saveProfileDetails} />
            <Text style={styles.progressText}>{xp.toLocaleString()} / {rankProgress.target.toLocaleString()} XP</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${rankProgress.progress}%` }]} /></View>
            <Text style={styles.progressHint}>
              {rankProgress.remaining > 0 ? `${rankProgress.remaining.toLocaleString()} XP to ${rankProgress.next}` : "Max rank reached"}
            </Text>
            <SectionHeader title="COSMETIC BADGES" action="See all" />
            <View style={styles.badgeRow}>
              <Badge icon="star" label="FIRST PLAN" tone="red" />
              <Badge icon="crown" label="NIGHT OWL" tone="navy" />
              <Badge icon="star" label="EARLY BIRD" tone="green" />
              <Badge icon="cap" label="SOCIAL" tone="gold" />
            </View>
            <SectionHeader title="COMPLETED BARS" action="See all" onAction={() => go("completed")} />
            <CollectionRow icon="gem" title="HONOR LOG" value={`${completedBarIds.length} / ${catalog.length}`} progress={Math.min(completedBarIds.length, 10)} total={10} />
            <OutlineButton label="OPEN COMPLETED LOG" onPress={() => go("completed")} />
            {completedChallenges.length === 0 && <Text style={styles.emptyState}>No completed bars yet. Open a bar and mark it completed when you earn it.</Text>}
            {completedChallenges.slice(0, 8).map((challenge) => (
              <CompletedBarRow key={challenge.id} challenge={challenge} onPress={() => openChallenge(challenge.id)} />
            ))}
            <OutlineButton label="SIGN OUT" onPress={() => supabase.auth.signOut()} />
          </AppScreen>
        )}

        {screen === "completed" && (
          <DetailScreen back={() => go("profile")} title="COMPLETED">
            <CollectionRow icon="gem" title="HONOR LOG" value={`${completedBarIds.length} / ${catalog.length}`} progress={Math.min(completedBarIds.length, 10)} total={10} />
            {completedChallenges.length === 0 && <Text style={styles.emptyState}>No completed bars yet. Completed bars will show up here.</Text>}
            {completedChallenges.map((challenge) => (
              <CompletedBarRow key={challenge.id} challenge={challenge} onPress={() => openChallenge(challenge.id)} />
            ))}
          </DetailScreen>
        )}

        {showTabs && <BottomTabs active={screen} onChange={go} />}
      </View>
    </SafeAreaView>
  );
}

function AppScreen({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}><Crown color={colors.gold} size={23} fill={colors.gold} /></View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}>
          <Text style={styles.appHeaderTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight}>{right}</View>
      </View>
      <ScrollView contentContainerStyle={styles.screenContent}>{children}</ScrollView>
    </View>
  );
}

function catalogStatusLabel(status: "local" | "loading" | "remote" | "error") {
  if (status === "remote") return "Supabase";
  if (status === "loading") return "Loading";
  if (status === "error") return "Local fallback";
  return "Local";
}

function plansStatusLabel(status: "local" | "loading" | "remote" | "error") {
  if (status === "remote") return "Supabase";
  if (status === "loading") return "Loading";
  if (status === "error") return "Local fallback";
  return "Local";
}

function getRankProgress(xp: number) {
  const ranks = [
    { name: "Froshling", min: 0 },
    { name: "Patch Collector", min: 1000 },
    { name: "Lore Bearer", min: 3000 },
    { name: "Campus Legend", min: 6000 }
  ];
  const currentIndex = Math.max(0, ranks.findIndex((rank, index) => xp >= rank.min && (!ranks[index + 1] || xp < ranks[index + 1].min)));
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

function formatCreateTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatCreatedPlanTime(startsAt: Date) {
  const time = startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${startsAt.toLocaleDateString([], { month: "short", day: "numeric" })} Â· ${time}`;
}

function parseCreateTime(value: string) {
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

function buildCreatePlanSchedule(day: CreatePlanDay, time: string, durationMinutes: number) {
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

function sameMinute(startsAtIso: string, target: Date) {
  const existing = new Date(startsAtIso);
  if (Number.isNaN(existing.getTime())) return false;
  return Math.floor(existing.getTime() / 60000) === Math.floor(target.getTime() / 60000);
}

function DetailScreen({ back, title, children }: { back: () => void; title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.flex}>
      <View style={styles.detailHeader}>
        <Pressable accessibilityLabel="Back" onPress={back}><ChevronLeft color={colors.ink} size={24} /></Pressable>
        <Text style={styles.appHeaderTitle}>{title ?? ""}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView contentContainerStyle={styles.screenContent}>{children}</ScrollView>
    </View>
  );
}

function BottomTabs({ active, onChange }: { active: Screen; onChange: (screen: Screen) => void }) {
  const tabs: { screen: Screen; label: string; icon: React.ReactNode }[] = [
    { screen: "discover", label: "Discover", icon: <Map color={active === "discover" ? colors.ink : colors.muted} size={20} /> },
    { screen: "catalog", label: "Catalog", icon: <BookOpen color={active === "catalog" ? colors.ink : colors.muted} size={20} /> },
    { screen: "create", label: "", icon: <Plus color={colors.cream} size={26} /> },
    { screen: "chats", label: "Chat", icon: <MessageCircle color={active === "chat" || active === "chats" || active === "dmThread" ? colors.ink : colors.muted} size={20} /> },
    { screen: "profile", label: "Profile", icon: <UserRound color={active === "profile" ? colors.ink : colors.muted} size={20} /> }
  ];
  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => (
        <Pressable key={tab.screen} onPress={() => onChange(tab.screen)} style={tab.screen === "create" ? styles.createTab : styles.tab}>
          {tab.icon}
          {!!tab.label && <Text style={[styles.tabText, (active === tab.screen || (tab.screen === "chats" && (active === "chat" || active === "dmThread"))) && styles.tabTextActive]}>{tab.label}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function BrandMark() {
  return (
    <View style={styles.brandMark}>
      <Crown color={colors.gold} size={20} fill={colors.gold} />
      <Text style={styles.brandMarkText}>R</Text>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (text: string) => void; placeholder: string }) {
  return (
    <View style={styles.searchBar}>
      <Search color={colors.ink} size={18} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} />
      <Filter color={colors.ink} size={18} />
    </View>
  );
}

function FilterRow({ labels }: { labels: string[] }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{labels.map((label, index) => <Tag key={label} text={label} active={index === 0} />)}</ScrollView>;
}

function ChoiceFilterRow({ labels, value, onChange }: { labels: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {labels.map((label) => (
        <Pressable key={label} onPress={() => onChange(label)}>
          <Tag text={label} active={label === value} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function pressedScale(pressed: boolean) {
  return pressed ? styles.pressedScale : null;
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} disabled={!onAction} style={({ pressed }) => [styles.sectionActionHit, pressedScale(pressed)]}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function NotificationBell({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.notificationBell, pressedScale(pressed)]}>
      <Bell color={colors.ink} size={21} />
      {count > 0 && (
        <View style={styles.notificationCount}>
          <Text style={styles.notificationCountText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function NotificationRow({
  notification,
  challenge,
  onPress
}: {
  notification: PlanNotification;
  challenge?: Challenge;
  onPress: () => void;
}) {
  const unread = !notification.readAt;
  const isDm = notification.kind === "dm_message";
  const isFriendRequest = notification.kind === "friend_request";
  const isPlanInvite = notification.kind === "plan_invite";
  const time = notification.plan?.startsAt
    ? new Date(notification.plan.startsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : new Date(notification.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const meta = isDm ? "Direct message" : isFriendRequest ? "Friend request" : isPlanInvite ? "Plan invite" : notification.plan?.locationName ?? challenge?.name ?? "Group chat";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.notificationRow, unread && styles.notificationRowUnread, pressedScale(pressed)]}>
      <View style={styles.notificationIcon}>
        <AvatarIcon avatar={isDm || isFriendRequest ? "crown" : challenge?.icon ?? "star"} color={unread ? colors.gold : colors.ink} size={22} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationBody}>{notification.body}</Text>
        <Text style={styles.notificationMeta}>{meta} - {time}</Text>
      </View>
      {unread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function DiscoverHeaderActions({
  count,
  onNotifications,
  onPeople,
  onLeaderboard
}: {
  count: number;
  onNotifications: () => void;
  onPeople: () => void;
  onLeaderboard: () => void;
}) {
  return (
    <View style={styles.headerActions}>
      <Pressable accessibilityLabel="Find people" onPress={onPeople} style={({ pressed }) => [styles.headerIconButton, pressedScale(pressed)]}>
        <Users color={colors.ink} size={20} />
      </Pressable>
      <Pressable accessibilityLabel="Leaderboard" onPress={onLeaderboard} style={({ pressed }) => [styles.headerIconButton, pressedScale(pressed)]}>
        <Award color={colors.ink} size={20} />
      </Pressable>
      <NotificationBell count={count} onPress={onNotifications} />
    </View>
  );
}

function PeopleRow({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.peopleRow, pressedScale(pressed)]}>
      <View style={styles.peopleAvatar}><AvatarIcon avatar={profile.avatar} color={colors.gold} size={24} /></View>
      <View style={styles.flex}>
        <Text style={styles.peopleName}>{profile.username}</Text>
        <Text style={styles.peopleMeta}>
          {[roleDbToLabel(profile.role), profile.year_label, profile.program].filter(Boolean).join(" Â· ")}
        </Text>
      </View>
      <View style={styles.peopleTier}>
        <Text style={styles.peopleTierText}>{getRankFromXp(profile.xp)}</Text>
      </View>
    </Pressable>
  );
}

function FriendRequestRow({
  request,
  onProfile,
  onAccept,
  onDecline,
  disabled
}: {
  request: FriendRequest;
  onProfile: () => void;
  onAccept: () => void;
  onDecline: () => void;
  disabled: boolean;
}) {
  if (!request.requester) return null;

  return (
    <View style={styles.friendRequestRow}>
      <Pressable onPress={onProfile} style={({ pressed }) => [styles.friendRequestProfile, pressedScale(pressed)]}>
        <View style={styles.peopleAvatar}><AvatarIcon avatar={request.requester.avatar} color={colors.gold} size={24} /></View>
        <View style={styles.flex}>
          <Text style={styles.peopleName}>{request.requester.username}</Text>
          <Text style={styles.peopleMeta}>Wants to add you</Text>
        </View>
      </Pressable>
      <View style={styles.friendRequestActions}>
        <Pressable disabled={disabled} onPress={onDecline} style={({ pressed }) => [styles.smallOutlineButton, pressedScale(pressed)]}>
          <Text style={styles.smallOutlineButtonText}>NO</Text>
        </Pressable>
        <Pressable disabled={disabled} onPress={onAccept} style={({ pressed }) => [styles.smallSolidButton, pressedScale(pressed)]}>
          <Text style={styles.smallSolidButtonText}>ADD</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FriendInviteRow({
  friend,
  inviting,
  disabled,
  onInvite
}: {
  friend: Profile;
  inviting: boolean;
  disabled: boolean;
  onInvite: () => void;
}) {
  return (
    <View style={styles.friendInviteRow}>
      <View style={styles.peopleAvatar}><AvatarIcon avatar={friend.avatar} color={colors.gold} size={24} /></View>
      <View style={styles.flex}>
        <Text style={styles.peopleName}>{friend.username}</Text>
        <Text style={styles.peopleMeta}>{getRankFromXp(friend.xp)}</Text>
      </View>
      <Pressable disabled={disabled} onPress={onInvite} style={({ pressed }) => [styles.smallSolidButton, disabled && styles.disabledButton, pressedScale(pressed)]}>
        <Text style={styles.smallSolidButtonText}>{inviting ? "SENDING" : "INVITE"}</Text>
      </Pressable>
    </View>
  );
}

function LeaderboardRow({ profile, place, onPress }: { profile: Profile; place: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.leaderboardRow, pressedScale(pressed)]}>
      <Text style={styles.leaderboardPlace}>{place}</Text>
      <View style={styles.peopleAvatar}><AvatarIcon avatar={profile.avatar} color={colors.gold} size={24} /></View>
      <View style={styles.flex}>
        <Text style={styles.peopleName}>{profile.username}</Text>
        <Text style={styles.peopleMeta}>{getRankFromXp(profile.xp)} Â· {profile.xp.toLocaleString()} XP</Text>
      </View>
      <Text style={styles.peopleTierText}>{getRankFromXp(profile.xp)}</Text>
    </Pressable>
  );
}

function DmThreadRow({ thread, onPress }: { thread: RemoteDmThread; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.peopleRow, pressedScale(pressed)]}>
      <View style={styles.peopleAvatar}><AvatarIcon avatar={thread.otherAvatar} color={colors.gold} size={24} /></View>
      <View style={styles.flex}>
        <Text style={styles.peopleName}>{thread.otherUsername}</Text>
        <Text numberOfLines={1} style={styles.peopleMeta}>{thread.lastMessage}</Text>
      </View>
      <MessageCircle color={colors.gold} size={18} />
    </Pressable>
  );
}

function ChallengePatch({ challenge, pinned, completed, onPress }: { challenge: Challenge; pinned?: boolean; completed?: boolean; onPress: () => void }) {
  const tone = patchTone(challenge.tone);
  const displayLabels = getChallengeCardLabels(challenge);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.challengePatch, { backgroundColor: tone.bg, borderColor: tone.border }, pressedScale(pressed)]}>
      {pinned && (
        <View style={styles.pinnedBadge}>
          <Bookmark color={colors.cream} size={13} fill={colors.cream} />
        </View>
      )}
      {completed && (
        <View style={styles.completedBadge}>
          <Check color={colors.cream} size={14} />
        </View>
      )}
      <View style={styles.challengePatchIcon}><AvatarIcon avatar={challenge.icon} color={tone.text} size={34} /></View>
      <Text
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[styles.challengePatchTitle, { color: tone.text }]}
      >
        {challenge.name.toUpperCase()}
      </Text>
      <Text numberOfLines={3} style={[styles.challengePatchSummary, { color: tone.text }]}>{challenge.summary}</Text>
      <View style={styles.challengePatchCategoryList}>
        {displayLabels.map((label) => (
          <View key={label} style={[styles.challengePatchCategoryPill, { borderColor: tone.text }]}>
            <Text numberOfLines={1} style={[styles.challengePatchCategory, { color: tone.text }]}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.challengePatchFooter}><Text style={[styles.challengePatchMeta, { color: tone.text }]}>{challenge.difficulty}</Text><Text style={[styles.challengePatchMeta, { color: tone.text }]}>{challenge.xp} XP</Text></View>
      {(challenge.interested > 0 || challenge.upcoming > 0) && (
        <View style={styles.challengePatchStats}><Text style={{ color: tone.text }}>â™Ÿ {challenge.interested}</Text><Text style={{ color: tone.text }}>â–£ {challenge.upcoming}</Text></View>
      )}
    </Pressable>
  );
}

function getChallengeCardLabels(challenge: Challenge) {
  const hiddenLabels = new Set(["Shenanigans", "Review required", challenge.difficulty]);
  const categoryLabels = getBrowseCategories(challenge).filter((label) => label !== "Unreviewed");
  return [
    challenge.difficulty,
    ...(categoryLabels.length > 0 ? categoryLabels : ["Participation"]),
    ...challenge.tags
  ].filter((label, index, labels) => !hiddenLabels.has(label) && labels.indexOf(label) === index);
}

function PlanPatch({ plan, onPress, catalog }: { plan: Plan; onPress: () => void; catalog: Challenge[] }) {
  const challenge = catalog.find((item) => item.id === plan.challengeId) ?? challenges[0];
  const tone = patchTone(challenge.tone);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.planPatch, { backgroundColor: tone.bg, borderColor: tone.border }, pressedScale(pressed)]}>
      <View style={styles.planIcon}><AvatarIcon avatar={challenge.icon} color={tone.text} size={28} /></View>
      <View style={styles.planPatchBody}>
        <Text style={[styles.planPatchTitle, { color: tone.text }]}>{challenge.name.toUpperCase()}</Text>
        <Text style={[styles.planPatchMeta, { color: tone.text }]}>{plan.place}</Text>
        <Text style={[styles.planPatchMeta, { color: tone.text }]}>{plan.startsAt}</Text>
      </View>
      <View style={styles.planPatchSide}>
        {plan.status === "ongoing" && <Text style={styles.livePill}>LIVE</Text>}
        <Text style={[styles.planPatchMeta, { color: tone.text }]}>{plan.attendees.length}/{plan.cap ?? "âˆž"}</Text>
      </View>
    </Pressable>
  );
}

function ChallengeHero({ challenge, compact }: { challenge: Challenge; compact?: boolean }) {
  const tone = patchTone(challenge.tone);
  return (
    <View style={[styles.challengeHero, compact && styles.challengeHeroCompact, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <AvatarIcon avatar={challenge.icon} color={tone.text} size={compact ? 42 : 56} />
      <View style={styles.heroPatchBody}>
        <Text style={[styles.heroPatchTitle, { color: tone.text }]}>{challenge.name.toUpperCase()}</Text>
        <Text style={[styles.heroPatchMeta, { color: tone.text }]}>{challenge.difficulty} Â· {challenge.xp} XP</Text>
      </View>
    </View>
  );
}

function SelectedChallenge({ challenge }: { challenge: Challenge }) {
  return <View style={styles.selectedChallenge}><AvatarIcon avatar={challenge.icon} color={colors.gold} size={26} /><View style={styles.flex}><Text style={styles.selectedChallengeTitle}>{challenge.name.toUpperCase()}</Text><Text style={styles.selectedChallengeMeta}>{challenge.difficulty} Â· {challenge.xp} XP</Text></View><Check color={colors.cream} size={16} style={styles.selectedCheck} /></View>;
}

function ChallengePicker({
  catalog,
  selectedChallenge,
  open,
  onToggle,
  onSelect
}: {
  catalog: Challenge[];
  selectedChallenge: Challenge;
  open: boolean;
  onToggle: () => void;
  onSelect: (challengeId: string) => void;
}) {
  return (
    <View style={styles.challengePicker}>
      <Pressable onPress={onToggle} style={styles.challengePickerButton}>
        <AvatarIcon avatar={selectedChallenge.icon} color={colors.gold} size={26} />
        <View style={styles.flex}>
          <Text style={styles.selectedChallengeTitle}>{selectedChallenge.name.toUpperCase()}</Text>
          <Text style={styles.selectedChallengeMeta}>{selectedChallenge.difficulty} Â· {selectedChallenge.xp} XP</Text>
        </View>
        <ChevronDown color={colors.ink} size={20} />
      </Pressable>
      {open && (
        <ScrollView nestedScrollEnabled style={styles.challengePickerMenu}>
          {catalog.map((challenge) => {
            const selected = challenge.id === selectedChallenge.id;
            return (
              <Pressable
                key={challenge.id}
                onPress={() => onSelect(challenge.id)}
                style={[styles.challengePickerOption, selected && styles.challengePickerOptionActive]}
              >
                <AvatarIcon avatar={challenge.icon} color={selected ? colors.cream : colors.ink} size={20} />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={[styles.challengePickerOptionTitle, selected && styles.challengePickerOptionTitleActive]}>
                    {challenge.name}
                  </Text>
                  <Text style={[styles.challengePickerOptionMeta, selected && styles.challengePickerOptionMetaActive]}>
                    {challenge.difficulty} Â· {challenge.xp} XP
                  </Text>
                </View>
                {selected && <Check color={colors.cream} size={16} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function ProgressSteps() {
  return <View style={styles.progressSteps}>{["1", "2", "3", "4", "5"].map((step, index) => <React.Fragment key={step}><View style={[styles.progressDot, index === 0 && styles.progressDotActive]}><Text style={[styles.progressDotText, index === 0 && styles.progressDotTextActive]}>{step}</Text></View>{index < 4 && <View style={styles.progressLine} />}</React.Fragment>)}</View>;
}

function PlanInfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <View style={styles.infoRow}><View style={styles.infoIcon}>{icon}</View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function Tag({ text, active }: { text: string; active?: boolean }) {
  return <View style={[styles.tag, active && styles.tagActive]}><Text style={[styles.tagText, active && styles.tagTextActive]}>{text}</Text></View>;
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return <View style={styles.statBlock}><Text style={styles.statBlockValue}>{value}</Text><Text style={styles.statBlockLabel}>{label}</Text></View>;
}

function PatchButton({ label, tone, onPress }: { label: string; tone: "navy" | "red" | "green"; onPress: () => void }) {
  const backgroundColor = tone === "navy" ? colors.navy : tone === "red" ? colors.red : colors.green;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.patchButton, { backgroundColor }, pressedScale(pressed)]}><Text style={styles.patchButtonText}>{label}</Text></Pressable>;
}

function OutlineButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.outlineButton, pressedScale(pressed)]}><Text style={styles.outlineButtonText}>{label}</Text></Pressable>;
}

function Badge({ icon, label, tone }: { icon: AvatarId; label: string; tone: "red" | "navy" | "green" | "gold" }) {
  const bg = tone === "red" ? colors.red : tone === "navy" ? colors.navy : tone === "green" ? colors.green : colors.gold;
  return <View style={[styles.badge, { backgroundColor: bg }]}><AvatarIcon avatar={icon} color={colors.cream} size={22} /><Text style={styles.badgeText}>{label}</Text></View>;
}

function CollectionRow({ icon, title, value, progress, total }: { icon: AvatarId; title: string; value: string; progress: number; total: number }) {
  return <View style={styles.collectionRow}><View style={styles.collectionIcon}><AvatarIcon avatar={icon} color={colors.green} size={20} /></View><View style={styles.flex}><Text style={styles.collectionTitle}>{title}</Text><View style={styles.stitchProgress}>{Array.from({ length: total }).map((_, index) => <View key={index} style={[styles.stitchUnit, index < progress && styles.stitchUnitDone]} />)}</View></View><Text style={styles.collectionValue}>{value}</Text></View>;
}

function CompletedBarRow({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.completedBarRow, pressedScale(pressed)]}>
      <View style={styles.completedBarIcon}><Check color={colors.cream} size={15} /></View>
      <View style={styles.flex}>
        <Text style={styles.completedBarTitle}>{challenge.name}</Text>
        <Text style={styles.completedBarMeta}>{challenge.difficulty} Â· {challenge.xp} XP</Text>
      </View>
      <Text style={styles.collectionValue}>Open</Text>
    </Pressable>
  );
}

function AvatarIcon({ avatar, color, size }: { avatar: AvatarId; color: string; size: number }) {
  if (avatar === "crown") return <Crown color={color} size={size} />;
  if (avatar === "gear") return <Wrench color={color} size={size} />;
  if (avatar === "cap") return <GraduationCap color={color} size={size} />;
  if (avatar === "gem") return <Gem color={color} size={size} />;
  if (avatar === "hall") return <Landmark color={color} size={size} />;
  return <Star color={color} size={size} />;
}

function patchTone(tone: ChallengeTone) {
  if (tone === "red") return { bg: colors.red, border: "#741415", text: colors.cream };
  if (tone === "green") return { bg: colors.green, border: "#0C3A1D", text: colors.cream };
  if (tone === "paper") return { bg: "#243754", border: colors.line, text: colors.ink };
  return { bg: colors.navy, border: "#315E8E", text: colors.cream };
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#07111F" },
  phone: { flex: 1, backgroundColor: colors.paper, alignSelf: "center", width: "100%", maxWidth: 520, borderColor: colors.line, borderLeftWidth: 1, borderRightWidth: 1 },
  flex: { flex: 1 },
  pressedScale: { transform: [{ scale: 0.96 }] },
  loginScreen: { flex: 1, justifyContent: "center", padding: 24 },
  onboarding: { padding: 24, paddingBottom: 44, minHeight: "100%" },
  brandMark: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.navy, marginBottom: 8 },
  brandMarkText: { color: colors.cream, fontWeight: "900", fontSize: 17 },
  welcomePill: { alignSelf: "center", color: colors.muted, fontSize: 11, fontWeight: "800", borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  heroTitle: { textAlign: "center", color: colors.ink, fontSize: 30, fontWeight: "900", marginTop: 4 },
  heroSubtitle: { textAlign: "center", color: colors.ink, fontSize: 14, marginBottom: 20 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  inputShell: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, paddingHorizontal: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
  segmentRow: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight },
  segmentActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  segmentText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  segmentTextActive: { color: colors.cream },
  formRow: { flexDirection: "row", gap: 8 },
  formInputShell: { flex: 1 },
  durationSummary: { minWidth: 104, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, paddingHorizontal: 10, paddingVertical: 8, justifyContent: "center" },
  durationSummaryLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  durationSummaryValue: { color: colors.ink, fontSize: 13, fontWeight: "900", marginTop: 2, fontVariant: ["tabular-nums"] },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarOption: { width: 58, height: 58, alignItems: "center", justifyContent: "center", backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7 },
  avatarOptionActive: { backgroundColor: colors.navy, borderColor: colors.gold, borderWidth: 2 },
  guidelineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 4 },
  checkbox: { width: 14, height: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: colors.paperLight },
  guidelineText: { color: colors.muted, fontSize: 11 },
  handNote: { alignSelf: "flex-end", color: colors.ink, fontSize: 13, fontStyle: "italic", textAlign: "right", marginTop: 12 },
  authMessage: { color: colors.ink, fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 12, textAlign: "center" },
  appHeader: { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paperLight },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 12, backgroundColor: colors.paperLight },
  headerLeft: { width: 112, alignItems: "flex-start", justifyContent: "center" },
  appHeaderTitleWrap: { position: "absolute", left: 72, right: 72, alignItems: "center" },
  appHeaderTitle: { textAlign: "center", color: colors.ink, fontSize: 22, fontWeight: "900" },
  headerRight: { width: 112, alignItems: "flex-end" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  xpBadge: { color: colors.ink, fontSize: 12, fontWeight: "900", borderWidth: 1, borderColor: colors.ink, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, fontVariant: ["tabular-nums"] },
  screenContent: { padding: 14, paddingBottom: 90 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 10 },
  filterRow: { gap: 6, paddingBottom: 4 },
  tag: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  tagTextActive: { color: colors.navy },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionActionHit: { minWidth: 40, minHeight: 40, alignItems: "flex-end", justifyContent: "center" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  notificationBell: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notificationCount: { position: "absolute", top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.red, borderWidth: 1, borderColor: colors.paperLight, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  notificationCountText: { color: colors.cream, fontSize: 9, fontWeight: "900" },
  notificationRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paperLight, padding: 11, marginBottom: 9 },
  notificationRowUnread: { borderColor: colors.gold, backgroundColor: "#182B45" },
  notificationIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  notificationTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  notificationBody: { color: colors.ink, fontSize: 12, lineHeight: 17, marginTop: 3 },
  notificationMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, marginTop: 5 },
  peopleRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paperLight, padding: 11, marginBottom: 9 },
  peopleAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.gold, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  peopleName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  peopleMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },
  peopleTier: { borderWidth: 1, borderColor: colors.ink, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4 },
  peopleTierText: { color: colors.ink, fontSize: 10, fontWeight: "900" },
  friendRequestRow: { borderWidth: 1, borderColor: colors.gold, borderRadius: 8, backgroundColor: colors.paperLight, padding: 10, marginBottom: 9 },
  friendRequestProfile: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  friendRequestActions: { flexDirection: "row", gap: 8, marginTop: 9 },
  smallOutlineButton: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: colors.line, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  smallOutlineButtonText: { color: colors.ink, fontSize: 11, fontWeight: "900" },
  smallSolidButton: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: colors.gold, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: colors.green },
  smallSolidButtonText: { color: colors.cream, fontSize: 11, fontWeight: "900" },
  friendInviteRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paperLight, padding: 10, marginBottom: 8 },
  disabledButton: { opacity: 0.6 },
  leaderboardRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paperLight, padding: 11, marginBottom: 9 },
  leaderboardPlace: { width: 26, color: colors.ink, fontSize: 15, fontWeight: "900", textAlign: "center", fontVariant: ["tabular-nums"] },
  planPatch: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderRadius: 8, padding: 10, marginBottom: 9, borderStyle: "dashed" },
  planIcon: { width: 46, height: 46, borderWidth: 1, borderColor: colors.gold, borderRadius: 6, alignItems: "center", justifyContent: "center", marginRight: 10 },
  planPatchBody: { flex: 1 },
  planPatchTitle: { fontSize: 17, fontWeight: "900" },
  planPatchMeta: { fontSize: 11, marginTop: 2 },
  planPatchSide: { alignItems: "flex-end", gap: 8 },
  livePill: { backgroundColor: "#65A93D", color: colors.cream, fontSize: 9, fontWeight: "900", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  catalogGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  catalogCount: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 8 },
  clearFilters: { alignSelf: "flex-start", marginTop: 5, paddingVertical: 4 },
  clearFiltersText: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 },
  challengePatch: { position: "relative", width: "48.5%", minHeight: 238, borderWidth: 2, borderRadius: 8, padding: 11, borderStyle: "dashed", justifyContent: "space-between" },
  pinnedBadge: { position: "absolute", top: 7, right: 7, width: 23, height: 23, borderRadius: 12, backgroundColor: colors.green, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", zIndex: 2 },
  completedBadge: { position: "absolute", top: 7, left: 7, width: 23, height: 23, borderRadius: 12, backgroundColor: colors.navy, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", zIndex: 2 },
  challengePatchIcon: { alignItems: "center", justifyContent: "center", minHeight: 42 },
  challengePatchTitle: { minHeight: 42, fontSize: 17, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  challengePatchSummary: { minHeight: 48, fontSize: 10, lineHeight: 14, textAlign: "center", opacity: 0.88 },
  challengePatchCategoryList: { minHeight: 22, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  challengePatchCategoryPill: { maxWidth: "100%", borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, opacity: 0.82 },
  challengePatchCategory: { fontSize: 8, fontWeight: "800", textAlign: "center" },
  challengePatchFooter: { flexDirection: "row", justifyContent: "space-between" },
  challengePatchMeta: { fontSize: 11, fontWeight: "800" },
  challengePatchStats: { flexDirection: "row", justifyContent: "space-between", opacity: 0.85 },
  challengeHero: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderStyle: "dashed", borderRadius: 9, padding: 16, marginBottom: 12 },
  challengeHeroCompact: { padding: 12 },
  heroPatchBody: { flex: 1, alignItems: "center" },
  heroPatchTitle: { fontSize: 25, fontWeight: "900", textAlign: "center" },
  heroPatchMeta: { marginTop: 4, fontSize: 12, fontWeight: "800" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  detailCopy: { color: colors.ink, fontSize: 14, lineHeight: 20, marginVertical: 10 },
  statRow: { flexDirection: "row", gap: 8, marginVertical: 10 },
  statBlock: { flex: 1, alignItems: "center", backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, paddingVertical: 12 },
  statBlockValue: { color: colors.ink, fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"] },
  statBlockLabel: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  patchButton: { borderWidth: 2, borderColor: colors.gold, borderStyle: "dashed", borderRadius: 8, alignItems: "center", paddingVertical: 13, marginTop: 12 },
  patchButtonText: { color: colors.cream, fontSize: 16, fontWeight: "900" },
  outlineButton: { borderWidth: 1, borderColor: colors.line, borderRadius: 7, alignItems: "center", paddingVertical: 11, marginTop: 9, backgroundColor: colors.paperLight },
  outlineButtonText: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  progressSteps: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  progressDot: { width: 21, height: 21, borderWidth: 1, borderColor: colors.ink, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.paperLight },
  progressDotActive: { backgroundColor: colors.ink },
  progressDotText: { color: colors.ink, fontSize: 10, fontWeight: "900" },
  progressDotTextActive: { color: colors.cream },
  progressLine: { flex: 1, height: 1, backgroundColor: colors.line },
  selectedChallenge: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 10, backgroundColor: colors.paperLight },
  challengePicker: { marginBottom: 2 },
  challengePickerButton: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 10, backgroundColor: colors.paperLight },
  challengePickerMenu: { maxHeight: 260, borderWidth: 1, borderTopWidth: 0, borderColor: colors.line, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: colors.paperLight },
  challengePickerOption: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  challengePickerOptionActive: { backgroundColor: colors.navy },
  challengePickerOptionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  challengePickerOptionTitleActive: { color: colors.cream },
  challengePickerOptionMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  challengePickerOptionMetaActive: { color: colors.cream },
  existingPlanNotice: { borderWidth: 1, borderColor: colors.gold, borderRadius: 8, backgroundColor: colors.cream, padding: 11, marginTop: 10, marginBottom: 2 },
  existingPlanTitle: { color: colors.ink, fontSize: 13, fontWeight: "900", marginBottom: 4 },
  existingPlanText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  existingPlanRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, marginTop: 8 },
  existingPlanRowTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  existingPlanRowMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  selectedChallengeTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  selectedChallengeMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  selectedCheck: { backgroundColor: colors.navy, borderRadius: 12, padding: 3 },
  stepper: { alignSelf: "flex-end", flexDirection: "row", borderWidth: 1, borderColor: colors.line, borderRadius: 6, overflow: "hidden" },
  stepperText: { color: colors.ink, fontSize: 14, fontWeight: "800", paddingHorizontal: 14, paddingVertical: 7, borderRightWidth: 1, borderRightColor: colors.line },
  noteBox: { height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, padding: 9 },
  noteInput: { flex: 1, color: colors.ink, fontSize: 12, padding: 0, textAlignVertical: "top" },
  noteText: { color: colors.ink, fontSize: 12 },
  bioBox: { minHeight: 88, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, padding: 9 },
  bioInput: { minHeight: 54, color: colors.ink, fontSize: 13, lineHeight: 18, padding: 0, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", color: colors.muted, fontSize: 10, marginTop: 7 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoIcon: { width: 28, paddingTop: 1 },
  infoLabel: { width: 78, color: colors.ink, fontSize: 11, fontWeight: "900" },
  infoValue: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 },
  chatScreen: { flex: 1 },
  chatHeader: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paperLight },
  chatHeaderTop: { flexDirection: "row", alignItems: "center" },
  chatHeaderTitleBlock: { flex: 1, alignItems: "center" },
  chatTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  chatStatus: { color: colors.green, fontSize: 11, marginTop: 2 },
  chatMembersButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  chatLeaveButton: { alignSelf: "center", marginTop: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 999, backgroundColor: colors.paperLight, paddingHorizontal: 12, paddingVertical: 6 },
  chatLeaveButtonText: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  chatMembersOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, flexDirection: "row", justifyContent: "flex-end" },
  chatMembersBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.38)" },
  chatMembersDrawer: { width: 260, backgroundColor: "#0D1A2B", borderLeftWidth: 1, borderLeftColor: colors.gold, padding: 14 },
  chatMembersDrawerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chatMembersTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  chatMembersClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  chatMembersCloseText: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  chatMembersCount: { color: colors.ink, fontSize: 11, fontWeight: "800", marginTop: 2, marginBottom: 12 },
  chatMemberRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: "#4F6F96", borderRadius: 8, backgroundColor: "#172943", paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  chatMemberAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  chatMemberRowText: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  chatList: { padding: 14, paddingBottom: 82 },
  systemMessage: { alignSelf: "center", backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 11 },
  systemMessageText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  messageRow: { flexDirection: "row", gap: 7, marginBottom: 11, alignItems: "flex-start" },
  messageRowMine: { flexDirection: "row-reverse" },
  miniAvatar: { width: 27, height: 27, borderRadius: 14, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  messageBubble: { maxWidth: "78%", backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 8 },
  messageBubbleMine: { backgroundColor: "#1B3B56", borderColor: "#315B7A" },
  messageFrom: { color: colors.ink, fontSize: 11, fontWeight: "900", marginBottom: 3 },
  messageText: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  composer: { position: "absolute", left: 0, right: 0, bottom: 58, flexDirection: "row", alignItems: "center", gap: 8, padding: 9, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paperLight },
  composerInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, color: colors.ink },
  sendButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  sendButtonDisabled: { opacity: 0.55 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.gold, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  profileNameBlock: { flex: 1, gap: 3 },
  profileName: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  profileMeta: { color: colors.ink, fontSize: 12 },
  profileBio: { color: colors.ink, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 10, marginTop: 12 },
  tierPatch: { width: 82, height: 92, backgroundColor: colors.navy, borderWidth: 2, borderColor: colors.gold, borderStyle: "dashed", borderRadius: 7, alignItems: "center", justifyContent: "center" },
  tierSmall: { color: colors.cream, fontSize: 10, fontWeight: "800" },
  tierTitle: { color: colors.cream, fontSize: 14, fontWeight: "900", marginVertical: 3 },
  progressText: { color: colors.ink, fontSize: 12, fontWeight: "900", marginTop: 14, fontVariant: ["tabular-nums"] },
  progressTrack: { height: 8, backgroundColor: "#26384F", borderRadius: 4, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.navy },
  progressHint: { color: colors.ink, fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: { flex: 1, minHeight: 66, borderRadius: 8, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", padding: 5 },
  badgeText: { color: colors.cream, fontSize: 8, fontWeight: "900", textAlign: "center", marginTop: 4 },
  collectionRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 9, marginBottom: 7 },
  collectionIcon: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  collectionTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  collectionValue: { color: colors.ink, fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] },
  completedBarRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.gold, borderRadius: 7, padding: 9, marginBottom: 7 },
  completedBarIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  completedBarTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  completedBarMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  stitchProgress: { flexDirection: "row", gap: 2, marginTop: 5, flexWrap: "wrap" },
  stitchUnit: { width: 8, height: 4, borderRadius: 2, borderWidth: 1, borderColor: colors.line },
  stitchUnitDone: { backgroundColor: colors.green, borderColor: colors.green },
  bottomTabs: { position: "absolute", left: 0, right: 0, bottom: 0, height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: colors.paperLight, borderTopWidth: 1, borderTopColor: colors.line },
  tab: { width: 58, alignItems: "center", gap: 2 },
  tabText: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  tabTextActive: { color: colors.ink },
  createTab: { width: 48, height: 48, marginTop: -18, borderRadius: 24, backgroundColor: colors.gold, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" }
});
