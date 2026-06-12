import React from "react";
import { Award } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { Challenge, ChallengeCollection } from "../data/catalog";
import type { FriendStatus } from "../data/friendRepository";
import type { Profile } from "../data/profileRepository";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type PatchProgress = ChallengeCollection & {
  total: number;
  completed: number;
  unlocked: boolean;
};

type Props = {
  profile: Profile;
  currentUserId?: string;
  roleLabel: string;
  rank: string;
  friendStatus: FriendStatus;
  friendActionSaving: boolean;
  incomingRequestId?: string;
  completedChallenges: Challenge[];
  patchProgress: PatchProgress[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onAddFriend: () => void;
  onCancelRequest: () => void;
  onUnfriend: () => void;
  onMessage: () => void;
  onOpenChallenge: (challengeId: string) => void;
  renderButton: (label: string, tone: "navy" | "red" | "green", onPress: () => void) => React.ReactNode;
  renderOutlineButton: (label: string, onPress: () => void) => React.ReactNode;
  renderCollection: (collection: PatchProgress) => React.ReactNode;
  renderCompletedBar: (challenge: Challenge, onPress: () => void) => React.ReactNode;
};

export function PublicProfileScreen(props: Props) {
  const isOwnProfile = props.currentUserId === props.profile.id;
  const unlockedCollections = props.patchProgress.filter((collection) => collection.unlocked).length;
  const profileMeta = [props.profile.year_label, props.profile.program].filter(Boolean).join(" ") || props.roleLabel;

  return (
    <>
      <View style={styles.profileTop}>
        <View style={styles.profileAvatar}><AvatarIcon avatar={props.profile.avatar} color={colors.gold} size={42} /></View>
        <View style={styles.profileNameBlock}>
          <Text style={styles.profileName}>{props.profile.username}</Text>
          <Text style={styles.profileMeta}>{profileMeta}</Text>
          <Tag text={props.roleLabel.toUpperCase()} />
        </View>
        <View style={styles.tierPatch}>
          <Text style={styles.tierSmall}>TIER</Text>
          <Text style={styles.tierTitle}>{props.rank}</Text>
          <Award color={colors.gold} size={28} />
        </View>
      </View>

      <View style={styles.profileStatGrid}>
        <Stat value={props.rank} label="Rank" />
        <Stat value={props.completedChallenges.length.toString()} label="Completed" />
        <Stat value={props.friendStatus === "friends" ? "Friend" : "Public"} label="Access" />
      </View>
      <FieldLabel text="BIO" />
      <Text style={styles.profileBio}>{props.profile.bio || "No bio yet."}</Text>

      {!isOwnProfile && (
        <View style={styles.profileActions}>
          {props.friendStatus === "incoming" && props.incomingRequestId && (
            <>
              {props.renderButton(props.friendActionSaving ? "SAVING..." : "ACCEPT FRIEND", "green", () => props.onAccept(props.incomingRequestId!))}
              {props.renderOutlineButton("DECLINE REQUEST", () => props.onDecline(props.incomingRequestId!))}
            </>
          )}
          {props.friendStatus === "none" && props.renderButton(props.friendActionSaving ? "SENDING..." : "ADD FRIEND", "green", props.onAddFriend)}
          {props.friendStatus === "outgoing" && props.renderOutlineButton(props.friendActionSaving ? "CANCELING..." : "CANCEL REQUEST", props.onCancelRequest)}
          {props.friendStatus === "friends" && props.renderOutlineButton(props.friendActionSaving ? "REMOVING..." : "UNFRIEND", props.onUnfriend)}
          {props.friendStatus === "friends"
            ? props.renderButton("MESSAGE", "navy", props.onMessage)
            : <Text style={styles.emptyState}>Add each other as friends to unlock DMs.</Text>}
        </View>
      )}

      <SectionHeader title="COMPLETED BARS" action={`${props.completedChallenges.length}`} />
      <SectionHeader title="PATCH COLLECTIONS" action={`${unlockedCollections}/${props.patchProgress.length}`} />
      {props.patchProgress.map((collection) => (
        <React.Fragment key={collection.id}>{props.renderCollection(collection)}</React.Fragment>
      ))}
      {props.completedChallenges.length === 0 && <Text style={styles.emptyState}>No completed bars shown yet.</Text>}
      {props.completedChallenges.map((challenge) => (
        <React.Fragment key={challenge.id}>
          {props.renderCompletedBar(challenge, () => props.onOpenChallenge(challenge.id))}
        </React.Fragment>
      ))}
    </>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function Tag({ text }: { text: string }) {
  return <View style={styles.tag}><Text style={styles.tagText}>{text}</Text></View>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.statBlock}><Text style={styles.statBlockValue}>{value}</Text><Text style={styles.statBlockLabel}>{label}</Text></View>;
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>;
}

const styles = StyleSheet.create({
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
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  tag: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  statBlock: { flex: 1, alignItems: "center", backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, paddingVertical: 12 },
  statBlockValue: { color: colors.ink, fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"] },
  statBlockLabel: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
