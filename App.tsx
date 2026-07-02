import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Linking
} from "react-native";
import { Users } from "lucide-react-native";
import type { Session } from "@supabase/supabase-js";
import { AvatarId, BrowseCategory, Challenge, challenges, getBrowseCategories } from "./src/data/catalog";
import { fetchCatalogBars } from "./src/data/catalogRepository";
import { RemoteChatMessage } from "./src/data/chatRepository";
import { fetchCompletedBarIds } from "./src/data/completionRepository";
import { RemoteDmMessage, RemoteDmThread } from "./src/data/dmRepository";
import { FriendRequest, FriendStatus } from "./src/data/friendRepository";
import { fetchPinnedBarIds } from "./src/data/interestRepository";
import { markNotificationRead, PlanNotification } from "./src/data/notificationRepository";
import { RemotePlan } from "./src/data/planRepository";
import { fetchProfile, getRankFromXp, Profile, roleDbToLabel } from "./src/data/profileRepository";
import { supabase } from "./src/lib/supabase";
import { createBarActions } from "./src/app/barActions";
import { createChatActions } from "./src/app/chatActions";
import { showMessage } from "./src/app/dialogs";
import { avatarOptions, startingPlans } from "./src/app/demoData";
import { createFriendActions } from "./src/app/friendActions";
import { readStoredScreen, writeStoredScreen } from "./src/app/navigation";
import { createPlanActions } from "./src/app/planActions";
import { formatCreateTime } from "./src/app/planSchedule";
import { createProfileActions } from "./src/app/profileActions";
import { getPatchProgress, getRankProgress, getUsernameCooldown } from "./src/app/profileProgress";
import { createRemoteLoaders } from "./src/app/remoteLoaders";
import type { CreatePlanDay, Plan, Screen } from "./src/app/types";
import {
  AppScreen,
  ChallengeHero,
  CollectionRow,
  CompletedBarRow,
  DetailScreen,
  DmThreadRow,
  FriendInviteRow,
  FriendRequestRow,
  LeaderboardRow,
  PatchCollectionRow,
  PeopleRow,
  PlanPatch,
  ProgressSteps,
  SectionHeader,
  StatBlock,
  Tag
} from "./src/ui/AppPresenters";
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

  const {
    saveOnboardingProfile,
    saveProfileDetails
  } = createProfileActions({
    avatar,
    draftBio,
    draftUsername,
    profile,
    profileSaveStatus,
    role,
    sessionUserId: session?.user.id,
    setAuthStatus,
    setAvatar,
    setDraftBio,
    setDraftUsername,
    setProfile,
    setProfileSaveStatus,
    setScreen,
    setUsername,
    setXp,
    username
  });

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

  const {
    completeSelectedChallenge,
    toggleInterest,
    undoSelectedChallengeCompletion
  } = createBarActions({
    completedBarIds,
    completionStatus,
    pinnedBarIds,
    selectedChallenge,
    selectedChallengeCompleted,
    sessionUserId: session?.user.id,
    setCompletedBarIds,
    setCompletionStatus,
    setInterestStatus,
    setPinnedBarIds,
    setProfile,
    setScreen,
    setXp,
    xp
  });

  const {
    confirmUnfriend,
    inviteFriendToPlan,
    requestFriendship,
    respondToFriendRequest,
    runCancelFriendRequest
  } = createFriendActions({
    friendActionStatus,
    invitingFriendId,
    loadFriendsData,
    selectedChallengeName: selectedChallenge.name,
    selectedFriendRequestId,
    selectedPlan,
    selectedPublicProfile,
    sessionUserId: session?.user.id,
    setFriendActionStatus,
    setFriends,
    setFriendStatus,
    setInvitingFriendId,
    setSelectedFriendRequestId,
    username
  });

  const {
    cancelPlan,
    confirmJoinPlan,
    confirmLeavePlan,
    createPlan
  } = createPlanActions({
    canCurrentUserCancelPlan,
    loadRemotePlans,
    openChat,
    openPlan,
    planCap,
    planDay,
    planDetail,
    planDurationMinutes,
    planNote,
    planPlace,
    planTime,
    planVisibility,
    plans,
    selectedChallenge,
    selectedPlan,
    sessionUserId: session?.user.id,
    setChatMembersOpen,
    setMessages,
    setPlanCreateMessage,
    setPlanTime,
    setPlans,
    setPublishingPlan,
    setScreen,
    setSelectedPlanId,
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#07111F" },
  phone: { flex: 1, backgroundColor: colors.paper, alignSelf: "center", width: "100%", maxWidth: 520, borderColor: colors.line, borderLeftWidth: 1, borderRightWidth: 1 },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
