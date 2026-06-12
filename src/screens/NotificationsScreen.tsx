import React from "react";
import { AvatarIcon } from "../ui/AvatarIcon";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Challenge } from "../data/catalog";
import type { PlanNotification } from "../data/notificationRepository";
import { colors } from "../ui/theme";

type Props = {
  notifications: PlanNotification[];
  status: "idle" | "loading" | "error";
  catalog: Challenge[];
  onOpen: (notification: PlanNotification) => void;
};

export function NotificationsScreen(props: Props) {
  return (
    <>
      {props.status === "loading" && <Text style={styles.emptyState}>Loading notifications...</Text>}
      {props.status !== "loading" && props.notifications.length === 0 && (
        <Text style={styles.emptyState}>No notifications yet. Pin bars to hear when someone hosts them.</Text>
      )}
      {props.notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          challenge={props.catalog.find((item) => item.id === notification.catalogBarId)}
          onPress={() => props.onOpen(notification)}
        />
      ))}
    </>
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
  const isPlanCanceled = notification.kind === "plan_canceled";
  const time = notification.plan?.startsAt
    ? new Date(notification.plan.startsAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : new Date(notification.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const meta = isDm
    ? "Direct message"
    : isFriendRequest
      ? "Friend request"
      : isPlanInvite
        ? "Plan invite"
        : isPlanCanceled
          ? "Canceled plan"
          : notification.plan?.locationName ?? challenge?.name ?? "Group chat";

  return (
    <Pressable onPress={onPress} style={[styles.notificationRow, unread && styles.notificationRowUnread]}>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 },
  notificationRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paperLight, padding: 11, marginBottom: 9 },
  notificationRowUnread: { borderColor: colors.gold, backgroundColor: "#182B45" },
  notificationIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  notificationTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  notificationBody: { color: colors.ink, fontSize: 12, lineHeight: 17, marginTop: 3 },
  notificationMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red, marginTop: 5 }
});
