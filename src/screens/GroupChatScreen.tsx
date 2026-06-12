import React from "react";
import { ChevronLeft, Plus, Send, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Plan } from "../app/types";
import type { AvatarId, Challenge } from "../data/catalog";
import type { RemoteChatMessage } from "../data/chatRepository";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type Props = {
  plan: Plan;
  challenge: Challenge;
  messages: RemoteChatMessage[];
  message: string;
  status: "idle" | "loading" | "sending" | "error";
  membersOpen: boolean;
  currentUserId?: string;
  currentUserAvatar: AvatarId;
  onBack: () => void;
  onLeave: () => void;
  onToggleMembers: () => void;
  onCloseMembers: () => void;
  onOpenProfile: (userId: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
};

export function GroupChatScreen(props: Props) {
  const members = props.plan.attendeeProfiles?.length
    ? props.plan.attendeeProfiles
    : props.plan.attendees.map((username) => ({ id: username, username }));

  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderTop}>
          <Pressable accessibilityLabel="Back to chats" onPress={props.onBack} style={styles.chatMembersButton}>
            <ChevronLeft color={colors.ink} size={23} />
          </Pressable>
          <View style={styles.chatHeaderTitleBlock}>
            <Text style={styles.chatTitle}>{props.challenge.name.toUpperCase()}</Text>
            <Text style={styles.chatStatus}>● Plan Chat · {props.plan.attendees.length} Going</Text>
          </View>
          <Pressable accessibilityLabel="Show chat members" onPress={props.onToggleMembers} style={styles.chatMembersButton}>
            <Users color={colors.ink} size={19} />
          </Pressable>
        </View>
        <Pressable accessibilityLabel="Leave group chat" onPress={props.onLeave} style={styles.chatLeaveButton}>
          <Text style={styles.chatLeaveButtonText}>LEAVE GROUP</Text>
        </Pressable>
      </View>

      {props.membersOpen && (
        <View style={styles.chatMembersOverlay}>
          <Pressable style={styles.chatMembersBackdrop} onPress={props.onCloseMembers} />
          <View style={styles.chatMembersDrawer}>
            <View style={styles.chatMembersDrawerHeader}>
              <Text style={styles.chatMembersTitle}>WHO'S IN</Text>
              <Pressable onPress={props.onCloseMembers} style={styles.chatMembersClose}>
                <Text style={styles.chatMembersCloseText}>X</Text>
              </Pressable>
            </View>
            <Text style={styles.chatMembersCount}>{props.plan.attendees.length} going</Text>
            {members.map((attendee) => (
              <Pressable
                key={attendee.id}
                onPress={() => {
                  if (props.plan.attendeeProfiles?.length) {
                    props.onCloseMembers();
                    props.onOpenProfile(attendee.id);
                  }
                }}
                style={styles.chatMemberRow}
              >
                <View style={styles.chatMemberAvatar}><AvatarIcon avatar="star" color={colors.ink} size={15} /></View>
                <Text style={styles.chatMemberRowText}>{attendee.username}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.chatList}>
        {props.status === "loading" && <Text style={styles.emptyState}>Loading chat...</Text>}
        {props.status !== "loading" && props.messages.length === 0 && (
          <Text style={styles.emptyState}>No messages yet. Start the plan chat.</Text>
        )}
        {props.messages.map((item) => {
          const mine = item.senderId === props.currentUserId;
          if (item.body.endsWith(" joined the plan.")) {
            return <View key={item.id} style={styles.systemMessage}><Text style={styles.systemMessageText}>{item.body}</Text></View>;
          }
          return (
            <View key={item.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
              <View style={styles.miniAvatar}>
                <AvatarIcon avatar={mine ? props.currentUserAvatar : "star"} color={colors.ink} size={16} />
              </View>
              <View style={[styles.messageBubble, mine && styles.messageBubbleMine]}>
                <Pressable onPress={() => props.onOpenProfile(item.senderId)}>
                  <Text style={styles.messageFrom}>{item.from}</Text>
                </Pressable>
                <Text style={styles.messageText}>{item.body}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composer}>
        <Plus color={colors.ink} size={20} />
        <TextInput
          value={props.message}
          onChangeText={props.onMessageChange}
          placeholder={`Message ${props.challenge.name}...`}
          placeholderTextColor={colors.muted}
          style={styles.composerInput}
        />
        <Pressable onPress={props.onSend} style={[styles.sendButton, props.status === "sending" && styles.sendButtonDisabled]}>
          <Send color={colors.ink} size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 },
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
  sendButtonDisabled: { opacity: 0.55 }
});
