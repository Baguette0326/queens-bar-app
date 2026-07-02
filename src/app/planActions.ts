import type { Dispatch, SetStateAction } from "react";
import type { Challenge } from "../data/catalog";
import { sendChatMessage } from "../data/chatRepository";
import { notifyPlanAttendees, notifyPlanCanceled } from "../data/notificationRepository";
import {
  cancelPlan as cancelRemotePlan,
  createPlan as createRemotePlan,
  joinPlan as joinRemotePlan,
  leavePlan as leaveRemotePlan
} from "../data/planRepository";
import { describeSupabaseError } from "../data/supabaseError";
import { supabase } from "../lib/supabase";
import { confirmAction, showMessage } from "./dialogs";
import { buildCreatePlanSchedule, formatCreatedPlanTime, formatCreateTime, parseCreateTime, sameMinute } from "./planSchedule";
import type { CreatePlanDay, Plan, Screen } from "./types";

export function createPlanActions({
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
  sessionUserId,
  setChatMembersOpen,
  setMessages,
  setPlanCreateMessage,
  setPlanTime,
  setPlans,
  setPublishingPlan,
  setScreen,
  setSelectedPlanId,
  username
}: {
  canCurrentUserCancelPlan: boolean;
  loadRemotePlans: (userId?: string, preferredPlanId?: string) => Promise<Plan[] | null>;
  openChat: (planId?: string) => Promise<void>;
  openPlan: (id: string) => void;
  planCap: number;
  planDay: CreatePlanDay;
  planDetail: string;
  planDurationMinutes: number;
  planNote: string;
  planPlace: string;
  planTime: string;
  planVisibility: "public" | "friends";
  plans: Plan[];
  selectedChallenge: Challenge;
  selectedPlan?: Plan;
  sessionUserId?: string;
  setChatMembersOpen: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<any[]>>;
  setPlanCreateMessage: Dispatch<SetStateAction<string>>;
  setPlanTime: Dispatch<SetStateAction<string>>;
  setPlans: Dispatch<SetStateAction<Plan[]>>;
  setPublishingPlan: Dispatch<SetStateAction<boolean>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setSelectedPlanId: Dispatch<SetStateAction<string>>;
  username: string;
}) {
  const go = setScreen;

  async function runJoinPlan() {
    if (!sessionUserId || !selectedPlan) {
      go("login");
      return;
    }

    try {
      await joinRemotePlan(selectedPlan.id, sessionUserId);
      await sendChatMessage(selectedPlan.id, sessionUserId, `${username} joined the plan.`);
      notifyPlanAttendees(
        selectedPlan.id,
        sessionUserId,
        "group_join",
        `${username} joined ${selectedChallenge.name}`,
        `${username} is in for ${selectedPlan.place}.`
      ).catch((error) => console.warn("Failed to notify plan attendees.", error));
      const remotePlans = await loadRemotePlans(sessionUserId);
      const joinedPlan = remotePlans?.find((plan) => plan.id === selectedPlan.id);
      if (joinedPlan) setSelectedPlanId(joinedPlan.id);
      await openChat(selectedPlan.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not join plan.";
      showMessage("Join failed", message);
    }
  }

  async function runLeavePlan() {
    if (!sessionUserId || !selectedPlan) return;
    const leavingPlanId = selectedPlan.id;

    try {
      await sendChatMessage(leavingPlanId, sessionUserId, `${username} left the plan.`);
      const planEnded = await leaveRemotePlan(leavingPlanId, sessionUserId);
      setMessages([]);
      setChatMembersOpen(false);
      go("chats");
      setPlans((current) => {
        const nextPlans = current.flatMap((plan) => {
          if (plan.id !== leavingPlanId) return plan;
          const updatedPlan = {
            ...plan,
            attendees: plan.attendees.filter((attendee) => attendee !== username),
            attendeeProfiles: plan.attendeeProfiles?.filter((attendee) => attendee.id !== sessionUserId) ?? [],
            currentUserJoined: false
          };

          if (planEnded || updatedPlan.attendeeProfiles.length === 0 || updatedPlan.attendees.length === 0) return [];
          return [updatedPlan];
        });
        return nextPlans;
      });
      const remotePlans = await loadRemotePlans(sessionUserId);
      if (remotePlans?.some((plan) => plan.id === leavingPlanId)) {
        setSelectedPlanId(leavingPlanId);
      }
    } catch (error) {
      const message = describeSupabaseError(error, "Could not leave plan. You may need to run supabase/add_leave_plan.sql.");
      showMessage("Leave failed", message);
    }
  }

  function confirmLeavePlan() {
    if (!sessionUserId || !selectedPlan) return;

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
    if (!sessionUserId) {
      go("login");
      return;
    }
    if (!selectedPlan) return;

    const message = `${selectedChallenge.name}\n${selectedPlan.place} - ${selectedPlan.startsAt}\n\nJoin this plan so the organizer can see you are coming?`;

    confirmAction({
      title: "Join this plan?",
      message,
      cancelText: "Not yet",
      confirmText: "Confirm join",
      onConfirm: runJoinPlan
    });
  }

  async function createPlan() {
    if (!sessionUserId) {
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
    if (!sessionUserId || !selectedPlan) return;

    if (!canCurrentUserCancelPlan) {
      const message = "You can only cancel a plan before anyone else joins. Ask attendees to leave first, or keep the plan active.";
      showMessage("Plan has attendees", message, message);
      return;
    }

    async function runCancelPlan() {
      if (!sessionUserId || !selectedPlan) return;
      const canceledPlanId = selectedPlan.id;

      try {
        await cancelRemotePlan(canceledPlanId, sessionUserId);
        notifyPlanCanceled(
          canceledPlanId,
          sessionUserId,
          `${selectedChallenge.name} was canceled`,
          `${selectedPlan.place} - ${selectedPlan.startsAt}`
        ).catch((error) => console.warn("Failed to notify attendees about canceled plan.", error));
        setPlans((current) => {
          const nextPlans = current.filter((plan) => plan.id !== canceledPlanId);
          setSelectedPlanId(nextPlans[0]?.id ?? "");
          return nextPlans;
        });
        go("discover");
        loadRemotePlans(sessionUserId).catch((error) => {
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

  return {
    cancelPlan,
    confirmJoinPlan,
    confirmLeavePlan,
    createPlan
  };
}
