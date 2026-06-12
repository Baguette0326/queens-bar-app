import React from "react";
import { BookOpen, CalendarDays, MapPin, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Plan } from "../app/types";
import type { Challenge } from "../data/catalog";
import type { Profile } from "../data/profileRepository";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type Props = {
  plan: Plan;
  challenge: Challenge;
  username: string;
  friends: Profile[];
  inviteableFriends: Profile[];
  invitingFriendId: string;
  currentUserStartedPlan: boolean;
  canCurrentUserCancelPlan: boolean;
  onOpenOrganizer: () => void;
  onInviteFriend: (friend: Profile) => void;
  onOpenChat: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onCancel: () => void;
  renderHero: (challenge: Challenge) => React.ReactNode;
  renderFriend: (friend: Profile, inviting: boolean, disabled: boolean, onInvite: () => void) => React.ReactNode;
  renderButton: (label: string, tone: "navy" | "red" | "green", onPress: () => void) => React.ReactNode;
  renderOutlineButton: (label: string, onPress: () => void) => React.ReactNode;
};

export function PlanDetailScreen(props: Props) {
  const joined = props.plan.currentUserJoined || props.plan.attendees.includes(props.username);

  return (
    <>
      {props.renderHero(props.challenge)}
      <InfoRow icon={<CalendarDays color={colors.ink} size={18} />} label="TIME" value={props.plan.startsAt} />
      <InfoRow icon={<MapPin color={colors.ink} size={18} />} label="LOCATION" value={`${props.plan.place}\n${props.plan.detail}`} />
      <InfoRow icon={<Users color={colors.ink} size={18} />} label="VISIBILITY" value={props.plan.visibility === "friends" ? "Friends only" : "Public"} />
      <InfoRow icon={<Users color={colors.ink} size={18} />} label="ATTENDEES" value={`${props.plan.attendees.length} / ${props.plan.cap ?? "∞"}`} />
      <Pressable onPress={props.onOpenOrganizer} disabled={!props.plan.startedById}>
        <InfoRow icon={<AvatarIcon avatar="gear" color={colors.ink} size={18} />} label="STARTED BY" value={props.plan.startedBy} />
      </Pressable>
      <InfoRow icon={<BookOpen color={colors.ink} size={18} />} label="NOTE" value={props.plan.note} />

      {joined && (
        <>
          <SectionHeader title="INVITE FRIENDS" action={props.inviteableFriends.length ? `${props.inviteableFriends.length}` : undefined} />
          {props.friends.length === 0 && <Text style={styles.emptyState}>Add friends to invite them to plans.</Text>}
          {props.friends.length > 0 && props.inviteableFriends.length === 0 && (
            <Text style={styles.emptyState}>All of your friends are already in this plan.</Text>
          )}
          {props.inviteableFriends.map((friend) => (
            <React.Fragment key={friend.id}>
              {props.renderFriend(friend, props.invitingFriendId === friend.id, !!props.invitingFriendId, () => props.onInviteFriend(friend))}
            </React.Fragment>
          ))}
        </>
      )}

      {props.renderButton(joined ? "OPEN GROUP CHAT" : "I'M IN!", "green", joined ? props.onOpenChat : props.onJoin)}
      {joined && !props.currentUserStartedPlan && props.renderOutlineButton("LEAVE GROUP", props.onLeave)}
      {props.canCurrentUserCancelPlan && props.renderOutlineButton("CANCEL PLAN", props.onCancel)}
      {props.currentUserStartedPlan && !props.canCurrentUserCancelPlan && (
        <Text style={styles.emptyState}>You can only cancel before anyone else joins.</Text>
      )}
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && <Text style={styles.sectionAction}>{action}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoIcon: { width: 28, paddingTop: 1 },
  infoLabel: { width: 78, color: colors.ink, fontSize: 11, fontWeight: "900" },
  infoValue: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
