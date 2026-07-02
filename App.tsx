import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking
} from "react-native";
import {
  Check,
  ChevronLeft,
  Crown,
  MessageCircle,
  Users,
} from "lucide-react-native";
import type { Session } from "@supabase/supabase-js";
import { AvatarId, BrowseCategory, Challenge, ChallengeCollection, ChallengeTone, challenges, getBrowseCategories } from "./src/data/catalog";
import { fetchCatalogBars } from "./src/data/catalogRepository";
import { RemoteChatMessage, sendChatMessage } from "./src/data/chatRepository";
import { fetchCompletedBarIds, removeCompletedBar, selfCompleteBar } from "./src/data/completionRepository";
import { RemoteDmMessage, RemoteDmThread } from "./src/data/dmRepository";
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, fetchFriends, fetchFriendState, fetchIncomingFriendRequests, FriendRequest, FriendStatus, removeFriend, sendFriendRequest } from "./src/data/friendRepository";
import { fetchPinnedBarIds, pinBar, unpinBar } from "./src/data/interestRepository";
import { markNotificationRead, notifyFriendRequest, notifyPlanAttendees, notifyPlanCanceled, notifyPlanInvite, PlanNotification } from "./src/data/notificationRepository";
import { fetchLeaderboard, searchProfiles } from "./src/data/peopleRepository";
import { cancelPlan as cancelRemotePlan, createPlan as createRemotePlan, fetchPlans, joinPlan as joinRemotePlan, leavePlan as leaveRemotePlan, RemotePlan } from "./src/data/planRepository";
import { createProfile, fetchProfile, getRankFromXp, Profile, roleDbToLabel, updateProfileDetails, updateProfileXp } from "./src/data/profileRepository";
import { describeSupabaseError } from "./src/data/supabaseError";
import { supabase } from "./src/lib/supabase";
import { createChatActions } from "./src/app/chatActions";
import { confirmAction, showMessage } from "./src/app/dialogs";
import { avatarOptions, startingPlans } from "./src/app/demoData";
import { readStoredScreen, writeStoredScreen } from "./src/app/navigation";
import { buildCreatePlanSchedule, formatCreatedPlanTime, formatCreateTime, parseCreateTime, sameMinute } from "./src/app/planSchedule";
import { getPatchProgress, getRankProgress, getUsernameCooldown } from "./src/app/profileProgress";
import { createRemoteLoaders } from "./src/app/remoteLoaders";
import type { CreatePlanDay, Plan, Screen } from "./src/app/types";
import { AvatarIcon } from "./src/ui/AvatarIcon";
import { BottomTabs } from "./src/ui/BottomTabs";
import { OutlineButton, PatchButton } from "./src/ui/Buttons";
import { dataStatusLabel } from "./src/ui/statusLabels";
import { colors } from "./src/ui/theme";
import { CatalogScreen } from "./src/screens/CatalogScreen";
import { ChallengeDetailScreen } from "./src/screens/ChallengeDetailScreen";
import { ChatsInboxScreen } from "./src/screens/ChatsInboxScreen";
import { CompletedLogScreen } from "./src/screens/CompletedLogScreen";
import { CreatePlanScreen } from "./src/screens/CreatePlanScreen";
import { DirectMessageScreen } from "./src/screens/DirectMessageScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { GroupChatScreen } from "./src/screens/GroupChatScreen";
import { LeaderboardScreen } from "./src/screens/LeaderboardScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { PeopleScreen } from "./src/screens/PeopleScreen";
import { PlanDetailScreen } from "./src/screens/PlanDetailScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { PublicProfileScreen } from "./src/screens/PublicProfileScreen";

export default function App() {
  const hasRoutedFromAuthRef = useRef(false);
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
  const [draftUsername, setDraftUsername] = useState("GearShift");
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
  const [planCreateMessage, setPlanCreateMessage] = useState("");
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

  const {
    loadFriendsData,
    loadLeaderboard,
    loadNotifications,
    loadPeople,
    loadRemotePlans,
    openPublicProfile,
    openPublicProfileById
  } = createRemoteLoaders({
    peopleQuery,
    sessionUserId: session?.user.id,
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
  });

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
      showMessage("Friend request failed", message);
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
      showMessage("Friend request failed", message);
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
      showMessage("Unfriend failed", message);
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
      showMessage("Invite sent", `Invited ${friend.username}.`, `Invited ${friend.username}.`);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not send invite. Run supabase/add_chat_dm_notifications.sql.");
      showMessage("Invite failed", message);
    } finally {
      setInvitingFriendId("");
    }
  }

  useEffect(() => {
    let alive = true;

    async function applySession(nextSession: Session | null, options: { routeAfterLoad?: boolean } = {}) {
      if (!alive) return;
      setSession(nextSession);

      if (!nextSession) {
        hasRoutedFromAuthRef.current = false;
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
          setDraftUsername(nextProfile.username);
          setAvatar(nextProfile.avatar);
          setDraftBio(nextProfile.bio ?? "");
          setRole(roleDbToLabel(nextProfile.role));
          setXp(nextProfile.xp);
          if (options.routeAfterLoad && !hasRoutedFromAuthRef.current) {
            hasRoutedFromAuthRef.current = true;
            setScreen(readStoredScreen() ?? "discover");
          }
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
          if (options.routeAfterLoad && !hasRoutedFromAuthRef.current) {
            hasRoutedFromAuthRef.current = true;
            setScreen("onboarding");
          }
        }
      } catch (error) {
        console.warn("Failed to load profile.", error);
        if (alive) {
          setAuthStatus("ready");
          if (options.routeAfterLoad && !hasRoutedFromAuthRef.current) {
            hasRoutedFromAuthRef.current = true;
            setScreen("onboarding");
          }
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session, { routeAfterLoad: true }));
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) =>
      applySession(nextSession, { routeAfterLoad: event === "SIGNED_IN" || event === "INITIAL_SESSION" })
    );

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    writeStoredScreen(screen);
  }, [screen]);

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
      showMessage("Username required", "Pick a unique username before continuing.");
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
      setUsername(savedProfile.username);
      setDraftUsername(savedProfile.username);
      setXp(savedProfile.xp);
      setScreen("discover");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save profile.";
      showMessage("Profile not saved", message);
    } finally {
      setAuthStatus("ready");
    }
  }

  async function saveProfileDetails() {
    if (!session || profileSaveStatus === "saving") return;

    const trimmedUsername = draftUsername.trim();
    const usernameCooldown = getUsernameCooldown(profile);
    const usernameChanged = Boolean(profile && trimmedUsername !== profile.username);

    if (trimmedUsername.length < 3) {
      showMessage("Profile not saved", "Display name must be at least 3 characters.");
      return;
    }

    if (usernameChanged && !usernameCooldown.canChange) {
      showMessage("Profile not saved", `You can change your display name again in ${usernameCooldown.daysLeft} day${usernameCooldown.daysLeft === 1 ? "" : "s"}.`);
      return;
    }

    setProfileSaveStatus("saving");
    try {
      const savedProfile = await updateProfileDetails({
        userId: session.user.id,
        username: trimmedUsername,
        updateUsername: usernameChanged,
        avatar,
        bio: draftBio.slice(0, 160)
      });
      setProfile(savedProfile);
      setUsername(savedProfile.username);
      setDraftUsername(savedProfile.username);
      setAvatar(savedProfile.avatar);
      if (savedProfile.bio !== null || !draftBio.trim()) {
        setDraftBio(savedProfile.bio ?? "");
      } else {
        showMessage("Avatar saved", "Run supabase/add_profile_bio.sql to enable bio saving.", "Avatar saved. Run supabase/add_profile_bio.sql to enable bio saving.");
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not save profile.");
      showMessage("Profile failed", message);
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
  const selectedPlanHasOtherAttendees = Boolean(
    selectedPlan &&
      session &&
      (
        selectedPlan.attendeeProfiles?.some((attendee) => attendee.id !== session.user.id) ||
        (!selectedPlan.attendeeProfiles?.length && selectedPlan.attendees.some((attendee) => attendee !== username))
      )
  );
  const canCurrentUserCancelPlan = currentUserStartedPlan && !selectedPlanHasOtherAttendees;
  const selectedChallengePinned = pinnedBarIds.includes(selectedChallenge.id);
  const selectedChallengeCompleted = completedBarIds.includes(selectedChallenge.id);
  const unreadNotificationCount = notifications.filter((notification) => !notification.readAt).length;
  const completedChallenges = catalog.filter((challenge) => completedBarIds.includes(challenge.id));
  const publicCompletedChallenges = catalog.filter((challenge) => publicCompletedBarIds.includes(challenge.id));
  const patchProgress = getPatchProgress(completedBarIds);
  const publicPatchProgress = getPatchProgress(publicCompletedBarIds);
  const joinedPlans = plans.filter((plan) => plan.currentUserJoined || plan.attendees.includes(username));
  const selectedPlanAttendeeIds = new Set(selectedPlan?.attendeeProfiles?.map((attendee) => attendee.id) ?? []);
  const selectedPlanAttendeeNames = new Set(selectedPlan?.attendees ?? []);
  const inviteableFriends = friends.filter(
    (friend) => !selectedPlanAttendeeIds.has(friend.id) && !selectedPlanAttendeeNames.has(friend.username)
  );
  const tier = getRankFromXp(xp);
  const rankProgress = getRankProgress(xp);
  const usernameCooldown = getUsernameCooldown(profile);
  const usernameChanged = profile ? draftUsername.trim() !== profile.username : false;

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
    if (screenName === "create") {
      setPlanDay("Today");
      setPlanTime(formatCreateTime(new Date(Date.now() + 60 * 60 * 1000)));
      setPlanCreateMessage("");
    }
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

  const {
    loadDmThreads,
    openChat,
    openDmThread,
    refreshChat,
    refreshDm,
    sendDirectMessage,
    sendMessage,
    startDm
  } = createChatActions({
    chatStatus,
    dmMessage,
    dmStatus,
    message,
    selectedChallengeName: selectedChallenge.name,
    selectedDmThreadId,
    selectedPlan,
    sessionUserId: session?.user.id,
    setChatMembersOpen,
    setChatStatus,
    setDmMessage,
    setDmMessages,
    setDmStatus,
    setDmThreads,
    setMessage,
    setMessages,
    setScreen,
    setSelectedDmThreadId,
    username
  });

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

    if (notification.kind === "plan_canceled") {
      go("notifications");
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

    showMessage("Plan unavailable", "That plan is no longer active.", "That plan is no longer active.");
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
      showMessage("Interest failed", message);
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
      showMessage("Completion failed", message);
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
      showMessage("Undo failed", message);
    } finally {
      setCompletionStatus("idle");
    }
  }

  function undoSelectedChallengeCompletion() {
    if (!session || completionStatus === "saving") return;

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
      showMessage("Join failed", message);
    }
  }

  async function runLeavePlan() {
    if (!session || !selectedPlan) return;
    const leavingPlanId = selectedPlan.id;

    try {
      await sendChatMessage(leavingPlanId, session.user.id, `${username} left the plan.`);
      const planEnded = await leaveRemotePlan(leavingPlanId, session.user.id);
      setMessages([]);
      setChatMembersOpen(false);
      go("chats");
      setPlans((current) => {
        const nextPlans = current.flatMap((plan) => {
          if (plan.id !== leavingPlanId) return plan;
          const updatedPlan = {
            ...plan,
            attendees: plan.attendees.filter((attendee) => attendee !== username),
            attendeeProfiles: plan.attendeeProfiles?.filter((attendee) => attendee.id !== session.user.id) ?? [],
            currentUserJoined: false
          };

          if (planEnded || updatedPlan.attendeeProfiles.length === 0 || updatedPlan.attendees.length === 0) return [];
          return [updatedPlan];
        });
        return nextPlans;
      });
      const remotePlans = await loadRemotePlans(session.user.id);
      if (remotePlans?.some((plan) => plan.id === leavingPlanId)) {
        setSelectedPlanId(leavingPlanId);
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not leave plan. You may need to run supabase/add_leave_plan.sql.");
      showMessage("Leave failed", message);
    }
  }

  function confirmLeavePlan() {
    if (!session || !selectedPlan) return;

    confirmAction({
      title: "Leave group?",
      message: "You will be removed from the attendee list and group chat.",
      webMessage: "Leave this group chat? You can join the plan again later if it is still open.",
      cancelText: "Stay",
      confirmText: "Leave",
      destructive: true,
      onConfirm: runLeavePlan
    });
  }

  function confirmJoinPlan() {
    if (!session) {
      go("login");
      return;
    }

    const message = `${selectedChallenge.name}\n${selectedPlan.place} Â· ${selectedPlan.startsAt}\n\nJoin this plan so the organizer can see you are coming?`;

    confirmAction({
      title: "Join this plan?",
      message,
      cancelText: "Not yet",
      confirmText: "Confirm join",
      onConfirm: runJoinPlan
    });
  }

  async function createPlan() {
    if (!session) {
      go("login");
      return;
    }

    let schedule = buildCreatePlanSchedule(planDay, planTime, planDurationMinutes);
    if (!schedule) {
      const parsedTime = parseCreateTime(planTime);
      if (parsedTime && planDay === "Today") {
        const refreshedStart = new Date(Date.now() + 60 * 60 * 1000);
        schedule = {
          startsAt: refreshedStart,
          endsAt: new Date(refreshedStart.getTime() + planDurationMinutes * 60 * 1000)
        };
        setPlanTime(formatCreateTime(refreshedStart));
        setPlanCreateMessage("That time had passed, so the plan time was moved one hour ahead.");
      } else {
        const message = "Enter a future time like 7:00 PM, 7 PM, or 19:00.";
        setPlanCreateMessage(message);
        showMessage("Check the time", message);
        return;
      }
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
      confirmAction({
        title: "Plan already exists",
        message: "There is already a plan for this bar at that exact time and place. Open that plan instead, or choose a different time/place once those controls are editable.",
        webMessage: "There is already a plan for this bar at that exact time and place. Open that plan instead?",
        cancelText: "Keep editing",
        confirmText: "Open plan",
        onConfirm: () => openPlan(duplicatePlan.id)
      });
      return;
    }

    try {
      setPlanCreateMessage("");
      setPublishingPlan(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error(authError?.message ?? "You need to sign in again before creating a plan.");
      }

      const planId = await createRemotePlan({
        catalogBarId: selectedChallenge.id,
        userId: authData.user.id,
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
        startedById: authData.user.id,
        currentUserJoined: true
      };
      setPlans((current) => [optimisticPlan, ...current.filter((plan) => plan.id !== planId)]);
      setSelectedPlanId(planId);
      go("discover");
      loadRemotePlans(authData.user.id, planId).catch((error) => {
        console.warn("Failed to refresh plans after publish.", error);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create plan.";
      setPlanCreateMessage(message);
      showMessage("Plan not created", message);
    } finally {
      setPublishingPlan(false);
    }
  }

  async function cancelPlan() {
    if (!session || !selectedPlan) return;

    if (!canCurrentUserCancelPlan) {
      const message = "You can only cancel a plan before anyone else joins. Ask attendees to leave first, or keep the plan active.";
      showMessage("Plan has attendees", message, message);
      return;
    }

    async function runCancelPlan() {
      if (!session || !selectedPlan) return;
      const canceledPlanId = selectedPlan.id;

      try {
        await cancelRemotePlan(canceledPlanId, session.user.id);
        notifyPlanCanceled(
          canceledPlanId,
          session.user.id,
          `${selectedChallenge.name} was canceled`,
          `${selectedPlan.place} - ${selectedPlan.startsAt}`
        ).catch((error) => console.warn("Failed to notify attendees about canceled plan.", error));
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
        showMessage("Cancel failed", message);
      }
    }

    confirmAction({
      title: "Cancel this plan?",
      message: "This removes it from discovery and stops new people from joining.",
      webMessage: "Cancel this plan? It will disappear from discovery and stop new people from joining.",
      cancelText: "Keep plan",
      confirmText: "Cancel plan",
      destructive: true,
      onConfirm: runCancelPlan
    });
  }

  const showTabs = !["login", "onboarding", "challenge", "plan", "create", "notifications", "completed", "people", "publicProfile", "leaderboard"].includes(screen);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.phone}>
        {screen === "login" && (
          <LoginScreen
            email={email}
            authStatus={authStatus}
            authMessage={authMessage}
            onEmailChange={setEmail}
            onSendLink={sendLoginLink}
            renderButton={(label, tone, onPress) => <PatchButton label={label} tone={tone} onPress={onPress} />}
          />
        )}

        {screen === "onboarding" && (
          <OnboardingScreen
            username={username}
            role={role}
            avatar={avatar}
            avatarOptions={avatarOptions}
            authStatus={authStatus}
            onUsernameChange={setUsername}
            onRoleChange={setRole}
            onAvatarChange={setAvatar}
            onSave={saveOnboardingProfile}
            renderButton={(label, tone, onPress) => <PatchButton label={label} tone={tone} onPress={onPress} />}
          />
        )}

        {screen === "discover" && (
          <DiscoverScreen
            query={query}
            plans={plans}
            catalog={catalog}
            plansStatus={plansStatus}
            unreadNotificationCount={unreadNotificationCount}
            onQueryChange={setQuery}
            onOpenPlan={openPlan}
            onNotifications={openNotifications}
            onPeople={() => go("people")}
            onLeaderboard={() => go("leaderboard")}
          />
        )}

        {screen === "notifications" && (
          <DetailScreen back={() => go("discover")} title="NOTIFICATIONS">
            <NotificationsScreen
              notifications={notifications}
              status={notificationsStatus}
              catalog={catalog}
              onOpen={openNotification}
            />
          </DetailScreen>
        )}

        {screen === "people" && (
          <DetailScreen back={() => go("discover")} title="PEOPLE">
            <PeopleScreen
              incomingRequests={incomingFriendRequests}
              friends={friends}
              query={peopleQuery}
              results={peopleResults}
              status={peopleStatus}
              friendActionSaving={friendActionStatus === "saving"}
              onQueryChange={setPeopleQuery}
              onOpenProfile={openPublicProfile}
              onAcceptRequest={(requestId) => respondToFriendRequest(requestId, "accept")}
              onDeclineRequest={(requestId) => respondToFriendRequest(requestId, "decline")}
              renderPerson={(person, onPress) => <PeopleRow profile={person} onPress={onPress} />}
              renderRequest={(request, onProfile, onAccept, onDecline, disabled) => (
                <FriendRequestRow request={request} onProfile={onProfile} onAccept={onAccept} onDecline={onDecline} disabled={disabled} />
              )}
            />
          </DetailScreen>
        )}

        {screen === "leaderboard" && (
          <DetailScreen back={() => go("discover")} title="LEADERBOARD">
            <LeaderboardScreen
              profiles={leaderboard}
              status={leaderboardStatus}
              onOpenProfile={(person) => openPublicProfile(person, "leaderboard")}
              renderRow={(person, place, onPress) => <LeaderboardRow profile={person} place={place} onPress={onPress} />}
            />
          </DetailScreen>
        )}

        {screen === "publicProfile" && selectedPublicProfile && (
          <DetailScreen back={() => go(publicProfileBackScreen)} title="PROFILE">
            <PublicProfileScreen
              profile={selectedPublicProfile}
              currentUserId={session?.user.id}
              roleLabel={roleDbToLabel(selectedPublicProfile.role)}
              rank={getRankFromXp(selectedPublicProfile.xp)}
              friendStatus={friendStatus}
              friendActionSaving={friendActionStatus === "saving"}
              incomingRequestId={selectedIncomingFriendRequest?.id}
              completedChallenges={publicCompletedChallenges}
              patchProgress={publicPatchProgress}
              onAccept={(requestId) => respondToFriendRequest(requestId, "accept")}
              onDecline={(requestId) => respondToFriendRequest(requestId, "decline")}
              onAddFriend={requestFriendship}
              onCancelRequest={runCancelFriendRequest}
              onUnfriend={confirmUnfriend}
              onMessage={() => startDm(selectedPublicProfile.id)}
              onOpenChallenge={openChallenge}
              renderButton={(label, tone, onPress) => <PatchButton label={label} tone={tone} onPress={onPress} />}
              renderOutlineButton={(label, onPress) => <OutlineButton label={label} onPress={onPress} />}
              renderCollection={(collection) => <PatchCollectionRow collection={collection} />}
              renderCompletedBar={(challenge, onPress) => <CompletedBarRow challenge={challenge} onPress={onPress} />}
            />
          </DetailScreen>
        )}

        {screen === "catalog" && (
          <CatalogScreen
            xp={xp}
            query={query}
            browseCategory={browseCategory}
            difficulty={difficulty}
            completionFilter={completionFilter}
            catalogStatus={catalogStatus}
            visibleChallenges={visibleChallenges}
            filteredCount={filteredChallenges.length}
            pinnedBarIds={pinnedBarIds}
            completedBarIds={completedBarIds}
            onQueryChange={setQuery}
            onBrowseCategoryChange={setBrowseCategory}
            onDifficultyChange={setDifficulty}
            onCompletionFilterChange={setCompletionFilter}
            onOpenChallenge={openChallenge}
          />
        )}

        {screen === "challenge" && (
          <DetailScreen back={() => go("catalog")}>
            <ChallengeDetailScreen
              challenge={selectedChallenge}
              catalog={catalog}
              plans={plans}
              pinned={selectedChallengePinned}
              completed={selectedChallengeCompleted}
              interestSaving={interestStatus === "saving"}
              completionSaving={completionStatus === "saving"}
              onToggleInterest={toggleInterest}
              onToggleCompletion={completeSelectedChallenge}
              onMoreInfo={() => Linking.openURL(selectedChallenge.sourceUrl)}
              onOpenPlan={openPlan}
              onCreatePlan={() => go("create")}
              renderHero={(challenge) => <ChallengeHero challenge={challenge} />}
              renderTag={(text, active) => <Tag text={text} active={active} />}
              renderStat={(value, label) => <StatBlock value={value} label={label} />}
              renderButton={(label, tone, onPress) => <PatchButton label={label} tone={tone} onPress={onPress} />}
              renderOutlineButton={(label, onPress) => <OutlineButton label={label} onPress={onPress} />}
              renderSectionHeader={(title, action) => <SectionHeader title={title} action={action} />}
              renderPlan={(plan, planCatalog, onPress) => <PlanPatch plan={plan} catalog={planCatalog} onPress={onPress} />}
            />
          </DetailScreen>
        )}

        {screen === "create" && (
          <DetailScreen back={() => go("challenge")} title="CREATE PLAN">
            <CreatePlanScreen
              catalog={catalog}
              selectedChallenge={selectedChallenge}
              pickerOpen={challengePickerOpen}
              matchingPlans={matchingLivePlans}
              day={planDay}
              time={planTime}
              durationMinutes={planDurationMinutes}
              place={planPlace}
              detail={planDetail}
              visibility={planVisibility}
              cap={planCap}
              note={planNote}
              createMessage={planCreateMessage}
              publishing={publishingPlan}
              onTogglePicker={() => setChallengePickerOpen((current) => !current)}
              onSelectChallenge={(challengeId) => {
                setSelectedChallengeId(challengeId);
                setChallengePickerOpen(false);
              }}
              onOpenPlan={openPlan}
              onDayChange={setPlanDay}
              onTimeChange={setPlanTime}
              onDurationChange={setPlanDurationMinutes}
              onPlaceChange={setPlanPlace}
              onDetailChange={setPlanDetail}
              onVisibilityChange={setPlanVisibility}
              onCapChange={setPlanCap}
              onNoteChange={setPlanNote}
              onPublish={createPlan}
              renderProgress={() => <ProgressSteps />}
              renderButton={(label, tone, onPress) => <PatchButton label={label} tone={tone} onPress={onPress} />}
            />
          </DetailScreen>
        )}

        {screen === "plan" && selectedPlan && (
          <DetailScreen back={() => go("discover")}>
            <PlanDetailScreen
              plan={selectedPlan}
              challenge={selectedChallenge}
              username={username}
              friends={friends}
              inviteableFriends={inviteableFriends}
              invitingFriendId={invitingFriendId}
              currentUserStartedPlan={currentUserStartedPlan}
              canCurrentUserCancelPlan={canCurrentUserCancelPlan}
              onOpenOrganizer={() => selectedPlan.startedById && openPublicProfileById(selectedPlan.startedById, "plan")}
              onInviteFriend={inviteFriendToPlan}
              onOpenChat={() => openChat(selectedPlan.id)}
              onJoin={confirmJoinPlan}
              onLeave={confirmLeavePlan}
              onCancel={cancelPlan}
              renderHero={(challenge) => <ChallengeHero challenge={challenge} compact />}
              renderFriend={(friend, inviting, disabled, onInvite) => (
                <FriendInviteRow friend={friend} inviting={inviting} disabled={disabled} onInvite={onInvite} />
              )}
              renderButton={(label, tone, onPress) => <PatchButton label={label} tone={tone} onPress={onPress} />}
              renderOutlineButton={(label, onPress) => <OutlineButton label={label} onPress={onPress} />}
            />
          </DetailScreen>
        )}

        {screen === "chats" && (
          <ChatsInboxScreen
            joinedPlans={joinedPlans}
            dmThreads={dmThreads}
            catalog={catalog}
            plansStatus={plansStatus}
            onOpenChat={openChat}
            onOpenDm={openDmThread}
            renderPlan={(plan, planCatalog, onPress) => <PlanPatch plan={plan} catalog={planCatalog} onPress={onPress} />}
            renderDmThread={(thread, onPress) => <DmThreadRow thread={thread} onPress={onPress} />}
          />
        )}

        {screen === "chat" && selectedPlan && (
          <GroupChatScreen
            plan={selectedPlan}
            challenge={selectedChallenge}
            messages={messages}
            message={message}
            status={chatStatus}
            membersOpen={chatMembersOpen}
            currentUserId={session?.user.id}
            currentUserAvatar={avatar}
            onBack={() => go("chats")}
            onLeave={confirmLeavePlan}
            onToggleMembers={() => setChatMembersOpen((current) => !current)}
            onCloseMembers={() => setChatMembersOpen(false)}
            onOpenProfile={(userId) => openPublicProfileById(userId, "chat")}
            onMessageChange={setMessage}
            onSend={sendMessage}
          />
        )}

        {screen === "chat" && !selectedPlan && (
          <AppScreen title="CHATS">
            <Text style={styles.emptyState}>This plan is no longer active.</Text>
            <OutlineButton label="BACK TO CHATS" onPress={() => go("chats")} />
          </AppScreen>
        )}

        {screen === "dmThread" && (
          <DirectMessageScreen
            thread={selectedDmThread}
            messages={dmMessages}
            message={dmMessage}
            status={dmStatus}
            currentUserId={session?.user.id}
            currentUserAvatar={avatar}
            onBack={() => go("chats")}
            onOpenProfile={() => selectedDmThread?.otherUserId && openPublicProfileById(selectedDmThread.otherUserId, "dmThread")}
            onMessageChange={setDmMessage}
            onSend={sendDirectMessage}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen
            username={username}
            roleLabel={profile ? roleDbToLabel(profile.role) : role}
            avatar={avatar}
            avatarOptions={avatarOptions}
            tier={tier}
            draftUsername={draftUsername}
            draftBio={draftBio}
            usernameCooldown={usernameCooldown}
            usernameChanged={usernameChanged}
            profileSaving={profileSaveStatus === "saving"}
            xp={xp}
            rankProgress={rankProgress}
            patchProgress={patchProgress}
            completedBarIds={completedBarIds}
            catalogCount={catalog.length}
            completedChallenges={completedChallenges}
            onAvatarChange={setAvatar}
            onUsernameChange={setDraftUsername}
            onBioChange={setDraftBio}
            onSave={saveProfileDetails}
            onOpenCompleted={() => go("completed")}
            onOpenChallenge={openChallenge}
            onSignOut={() => supabase.auth.signOut()}
            renderCollection={(collection) => <PatchCollectionRow collection={collection} />}
            renderHonorLog={(completed, total) => (
              <CollectionRow icon="gem" title="HONOR LOG" value={`${completed} / ${total}`} progress={Math.min(completed, 10)} total={10} />
            )}
            renderCompletedBar={(challenge, onPress) => <CompletedBarRow challenge={challenge} onPress={onPress} />}
            renderOutlineButton={(label, onPress) => <OutlineButton label={label} onPress={onPress} />}
          />
        )}

        {screen === "completed" && (
          <DetailScreen back={() => go("profile")} title="COMPLETED">
            <CompletedLogScreen
              completedBarIds={completedBarIds}
              catalogCount={catalog.length}
              completedChallenges={completedChallenges}
              onOpenChallenge={openChallenge}
              renderHonorLog={(completed, total) => (
                <CollectionRow icon="gem" title="HONOR LOG" value={`${completed} / ${total}`} progress={Math.min(completed, 10)} total={10} />
              )}
              renderCompletedBar={(challenge, onPress) => <CompletedBarRow challenge={challenge} onPress={onPress} />}
            />
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

function ProgressSteps() {
  return <View style={styles.progressSteps}>{["1", "2", "3", "4", "5"].map((step, index) => <React.Fragment key={step}><View style={[styles.progressDot, index === 0 && styles.progressDotActive]}><Text style={[styles.progressDotText, index === 0 && styles.progressDotTextActive]}>{step}</Text></View>{index < 4 && <View style={styles.progressLine} />}</React.Fragment>)}</View>;
}

function Tag({ text, active }: { text: string; active?: boolean }) {
  return <View style={[styles.tag, active && styles.tagActive]}><Text style={[styles.tagText, active && styles.tagTextActive]}>{text}</Text></View>;
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return <View style={styles.statBlock}><Text style={styles.statBlockValue}>{value}</Text><Text style={styles.statBlockLabel}>{label}</Text></View>;
}

function CollectionRow({ icon, title, value, progress, total }: { icon: AvatarId; title: string; value: string; progress: number; total: number }) {
  return <View style={styles.collectionRow}><View style={styles.collectionIcon}><AvatarIcon avatar={icon} color={colors.green} size={20} /></View><View style={styles.flex}><Text style={styles.collectionTitle}>{title}</Text><View style={styles.stitchProgress}>{Array.from({ length: total }).map((_, index) => <View key={index} style={[styles.stitchUnit, index < progress && styles.stitchUnitDone]} />)}</View></View><Text style={styles.collectionValue}>{value}</Text></View>;
}

function PatchCollectionRow({
  collection
}: {
  collection: ChallengeCollection & { total: number; completed: number; unlocked: boolean };
}) {
  const progress = collection.total > 0 ? Math.round((collection.completed / collection.total) * 100) : 0;

  return (
    <View style={[styles.patchCollectionRow, collection.unlocked && styles.patchCollectionRowUnlocked]}>
      <View style={[styles.patchCollectionIcon, collection.unlocked && styles.patchCollectionIconUnlocked]}>
        <AvatarIcon avatar={collection.unlocked ? "crown" : "star"} color={collection.unlocked ? colors.navy : colors.gold} size={22} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.collectionTitle}>{collection.badge || collection.name}</Text>
        <Text style={styles.patchCollectionName}>{collection.name}</Text>
        <Text style={styles.patchCollectionTagline}>{collection.tagline}</Text>
        <View style={styles.collectionProgressTrack}>
          <View style={[styles.collectionProgressFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <View style={styles.patchCollectionStat}>
        <Text style={styles.collectionValue}>{collection.completed}/{collection.total}</Text>
        <Text style={styles.patchCollectionBonus}>+{collection.bonusXp} XP</Text>
      </View>
    </View>
  );
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
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 },
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
  formNotice: { color: colors.ink, fontSize: 12, lineHeight: 17, backgroundColor: "#182B45", borderWidth: 1, borderColor: colors.gold, borderRadius: 8, padding: 10, marginTop: 10 },
  selectedChallengeTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  selectedChallengeMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  selectedCheck: { backgroundColor: colors.navy, borderRadius: 12, padding: 3 },
  stepper: { alignSelf: "flex-end", flexDirection: "row", borderWidth: 1, borderColor: colors.line, borderRadius: 6, overflow: "hidden" },
  stepperText: { color: colors.ink, fontSize: 14, fontWeight: "800", paddingHorizontal: 14, paddingVertical: 7, borderRightWidth: 1, borderRightColor: colors.line },
  noteBox: { height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, padding: 9 },
  noteInput: { flex: 1, color: colors.ink, fontSize: 12, padding: 0, textAlignVertical: "top" },
  noteText: { color: colors.ink, fontSize: 12 },
  singleLineInput: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, color: colors.ink, fontSize: 14, fontWeight: "800", paddingHorizontal: 11 },
  inputDisabled: { opacity: 0.62 },
  inputHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 2 },
  bioBox: { minHeight: 88, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, padding: 9 },
  bioInput: { minHeight: 54, color: colors.ink, fontSize: 13, lineHeight: 18, padding: 0, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", color: colors.muted, fontSize: 10, marginTop: 7 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.gold, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  profileNameBlock: { flex: 1, gap: 3 },
  profileName: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  profileMeta: { color: colors.ink, fontSize: 12 },
  profileBio: { color: colors.ink, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 10, marginTop: 12 },
  profileStatGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  profileActions: { gap: 8, marginTop: 12 },
  tierPatch: { width: 82, height: 92, backgroundColor: colors.navy, borderWidth: 2, borderColor: colors.gold, borderStyle: "dashed", borderRadius: 7, alignItems: "center", justifyContent: "center" },
  tierSmall: { color: colors.cream, fontSize: 10, fontWeight: "800" },
  tierTitle: { color: colors.cream, fontSize: 14, fontWeight: "900", marginVertical: 3 },
  progressText: { color: colors.ink, fontSize: 12, fontWeight: "900", marginTop: 14, fontVariant: ["tabular-nums"] },
  progressTrack: { height: 8, backgroundColor: "#26384F", borderRadius: 4, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.navy },
  progressHint: { color: colors.ink, fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: 8 },
  collectionRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 9, marginBottom: 7 },
  collectionIcon: { width: 30, height: 30, borderRadius: 6, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  collectionTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  collectionValue: { color: colors.ink, fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] },
  patchCollectionRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 10, marginBottom: 8 },
  patchCollectionRowUnlocked: { borderColor: colors.gold, backgroundColor: "#172943" },
  patchCollectionIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  patchCollectionIconUnlocked: { backgroundColor: colors.gold },
  patchCollectionName: { color: colors.ink, fontSize: 11, fontWeight: "800", marginTop: 2 },
  patchCollectionTagline: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  patchCollectionStat: { alignItems: "flex-end", gap: 4, minWidth: 54 },
  patchCollectionBonus: { color: colors.gold, fontSize: 10, fontWeight: "900" },
  collectionProgressTrack: { height: 5, backgroundColor: "#26384F", borderRadius: 3, marginTop: 7, overflow: "hidden" },
  collectionProgressFill: { height: "100%", backgroundColor: colors.green },
  completedBarRow: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.gold, borderRadius: 7, padding: 9, marginBottom: 7 },
  completedBarIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  completedBarTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  completedBarMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  stitchProgress: { flexDirection: "row", gap: 2, marginTop: 5, flexWrap: "wrap" },
  stitchUnit: { width: 8, height: 4, borderRadius: 2, borderWidth: 1, borderColor: colors.line },
  stitchUnitDone: { backgroundColor: colors.green, borderColor: colors.green }
});
