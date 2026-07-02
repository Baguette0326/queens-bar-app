import type { Dispatch, SetStateAction } from "react";
import { fetchChatMessages, sendChatMessage, type RemoteChatMessage } from "../data/chatRepository";
import { fetchDmMessages, fetchDmThreads, getOrCreateDmThread, sendDmMessage, type RemoteDmMessage, type RemoteDmThread } from "../data/dmRepository";
import { notifyDmRecipient, notifyPlanAttendees } from "../data/notificationRepository";
import { describeSupabaseError } from "../data/supabaseError";
import { showMessage } from "./dialogs";
import type { Plan, Screen } from "./types";

type ChatStatus = "idle" | "loading" | "sending" | "error";
type DmStatus = "idle" | "loading" | "sending" | "error";

export function createChatActions({
  dmMessage,
  dmStatus,
  chatStatus,
  message,
  selectedChallengeName,
  selectedDmThreadId,
  selectedPlan,
  sessionUserId,
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
}: {
  dmMessage: string;
  dmStatus: DmStatus;
  chatStatus: ChatStatus;
  message: string;
  selectedChallengeName: string;
  selectedDmThreadId: string;
  selectedPlan?: Plan;
  sessionUserId?: string;
  setChatMembersOpen: Dispatch<SetStateAction<boolean>>;
  setChatStatus: Dispatch<SetStateAction<ChatStatus>>;
  setDmMessage: Dispatch<SetStateAction<string>>;
  setDmMessages: Dispatch<SetStateAction<RemoteDmMessage[]>>;
  setDmStatus: Dispatch<SetStateAction<DmStatus>>;
  setDmThreads: Dispatch<SetStateAction<RemoteDmThread[]>>;
  setMessage: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<RemoteChatMessage[]>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setSelectedDmThreadId: Dispatch<SetStateAction<string>>;
  username: string;
}) {
  const go = setScreen;

  async function refreshChat(planId = selectedPlan?.id) {
    if (!planId) return;

    const remoteMessages = await fetchChatMessages(planId);
    setMessages(remoteMessages);
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

  async function loadDmThreads() {
    if (!sessionUserId) return [];
    const threads = await fetchDmThreads(sessionUserId);
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
    if (!sessionUserId) {
      go("login");
      return;
    }

    try {
      const threadId = await getOrCreateDmThread(otherUserId);
      const threads = await loadDmThreads();
      if (!threads.some((thread) => thread.id === threadId)) {
        setDmThreads(await fetchDmThreads(sessionUserId));
      }
      await openDmThread(threadId);
    } catch (error) {
      const message = describeSupabaseError(error, "Could not start DM. Run supabase/add_dms.sql first.");
      showMessage("DM failed", message);
    }
  }

  async function refreshDm(threadId = selectedDmThreadId) {
    if (!threadId) return;
    const remoteMessages = await fetchDmMessages(threadId);
    setDmMessages(remoteMessages);
  }

  async function sendMessage() {
    if (!sessionUserId) {
      go("login");
      return;
    }
    if (!selectedPlan) return;

    const body = message.trim();
    if (!body || chatStatus === "sending") return;

    setMessage("");
    setChatStatus("sending");
    try {
      const sentMessage = await sendChatMessage(selectedPlan.id, sessionUserId, body);
      setMessages((current) => [...current, sentMessage]);
      notifyPlanAttendees(
        selectedPlan.id,
        sessionUserId,
        "group_message",
        `${username} messaged ${selectedChallengeName}`,
        body.length > 120 ? `${body.slice(0, 117)}...` : body
      ).catch((error) => console.warn("Failed to notify plan attendees.", error));
      setChatStatus("idle");
    } catch (error) {
      setMessage(body);
      setChatStatus("error");
      const errorMessage = describeSupabaseError(error, "Could not send message.");
      showMessage("Message failed", errorMessage);
    }
  }

  async function sendDirectMessage() {
    if (!sessionUserId || !selectedDmThreadId) {
      go("login");
      return;
    }

    const body = dmMessage.trim();
    if (!body || dmStatus === "sending") return;

    setDmStatus("sending");
    setDmMessage("");
    try {
      const sentMessage = await sendDmMessage(selectedDmThreadId, sessionUserId, body);
      setDmMessages((current) => [...current, sentMessage]);
      notifyDmRecipient(
        selectedDmThreadId,
        sessionUserId,
        `${username} sent you a DM`,
        body.length > 120 ? `${body.slice(0, 117)}...` : body
      ).catch((error) => console.warn("Failed to notify DM recipient.", error));
      loadDmThreads().catch((error) => console.warn("Failed to refresh DM inbox.", error));
      setDmStatus("idle");
    } catch (error) {
      setDmMessage(body);
      setDmStatus("error");
      const errorMessage = describeSupabaseError(error, "Could not send DM.");
      showMessage("DM failed", errorMessage);
    }
  }

  return {
    loadDmThreads,
    openChat,
    openDmThread,
    refreshChat,
    refreshDm,
    sendDirectMessage,
    sendMessage,
    startDm
  };
}
