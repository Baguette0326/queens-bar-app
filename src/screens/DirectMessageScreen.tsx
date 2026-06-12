import React from "react";
import { ChevronLeft, Plus, Send } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { AvatarId } from "../data/catalog";
import type { RemoteDmMessage, RemoteDmThread } from "../data/dmRepository";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type Props = {
  thread?: RemoteDmThread;
  messages: RemoteDmMessage[];
  message: string;
  status: "idle" | "loading" | "sending" | "error";
  currentUserId?: string;
  currentUserAvatar: AvatarId;
  onBack: () => void;
  onOpenProfile: () => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
};

export function DirectMessageScreen(props: Props) {
  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderTop}>
          <Pressable accessibilityLabel="Back to chats" onPress={props.onBack} style={styles.chatHeaderButton}>
            <ChevronLeft color={colors.ink} size={23} />
          </Pressable>
          <Pressable onPress={props.onOpenProfile} disabled={!props.thread?.otherUserId} style={styles.chatHeaderTitleBlock}>
            <Text style={styles.chatTitle}>{props.thread?.otherUsername.toUpperCase() ?? "DM"}</Text>
            <Text style={styles.chatStatus}>Direct Message</Text>
          </Pressable>
          <View style={styles.chatHeaderButton} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.chatList}>
        {props.status === "loading" && <Text style={styles.emptyState}>Loading messages...</Text>}
        {props.status !== "loading" && props.messages.length === 0 && <Text style={styles.emptyState}>No messages yet. Say hi.</Text>}
        {props.messages.map((item) => {
          const mine = item.senderId === props.currentUserId;
          return (
            <View key={item.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
              <View style={styles.miniAvatar}>
                <AvatarIcon avatar={mine ? props.currentUserAvatar : props.thread?.otherAvatar ?? "star"} color={colors.ink} size={16} />
              </View>
              <View style={[styles.messageBubble, mine && styles.messageBubbleMine]}>
                <Text style={styles.messageFrom}>{item.from}</Text>
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
          placeholder={`Message ${props.thread?.otherUsername ?? "user"}...`}
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
  chatHeaderButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  chatTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  chatStatus: { color: colors.green, fontSize: 11, marginTop: 2 },
  chatList: { padding: 14, paddingBottom: 82 },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 },
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
