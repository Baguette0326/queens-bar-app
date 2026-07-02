import React from "react";
import { Check, ChevronLeft, Crown, MessageCircle } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AvatarId, Challenge, ChallengeCollection, ChallengeTone } from "../data/catalog";
import { challenges } from "../data/catalog";
import type { RemoteDmThread } from "../data/dmRepository";
import type { FriendRequest } from "../data/friendRepository";
import { getRankFromXp, type Profile, roleDbToLabel } from "../data/profileRepository";
import type { Plan } from "../app/types";
import { AvatarIcon } from "./AvatarIcon";
import { colors } from "./theme";

export function AppScreen({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
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

export function DetailScreen({ back, title, children }: { back: () => void; title?: string; children: React.ReactNode }) {
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

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
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

export function PeopleRow({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.peopleRow, pressedScale(pressed)]}>
      <View style={styles.peopleAvatar}><AvatarIcon avatar={profile.avatar} color={colors.gold} size={24} /></View>
      <View style={styles.flex}>
        <Text style={styles.peopleName}>{profile.username}</Text>
        <Text style={styles.peopleMeta}>
          {[roleDbToLabel(profile.role), profile.year_label, profile.program].filter(Boolean).join(" - ")}
        </Text>
      </View>
      <View style={styles.peopleTier}>
        <Text style={styles.peopleTierText}>{getRankFromXp(profile.xp)}</Text>
      </View>
    </Pressable>
  );
}

export function FriendRequestRow({
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

export function FriendInviteRow({
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

export function LeaderboardRow({ profile, place, onPress }: { profile: Profile; place: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.leaderboardRow, pressedScale(pressed)]}>
      <Text style={styles.leaderboardPlace}>{place}</Text>
      <View style={styles.peopleAvatar}><AvatarIcon avatar={profile.avatar} color={colors.gold} size={24} /></View>
      <View style={styles.flex}>
        <Text style={styles.peopleName}>{profile.username}</Text>
        <Text style={styles.peopleMeta}>{getRankFromXp(profile.xp)} - {profile.xp.toLocaleString()} XP</Text>
      </View>
      <Text style={styles.peopleTierText}>{getRankFromXp(profile.xp)}</Text>
    </Pressable>
  );
}

export function DmThreadRow({ thread, onPress }: { thread: RemoteDmThread; onPress: () => void }) {
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

export function PlanPatch({ plan, onPress, catalog }: { plan: Plan; onPress: () => void; catalog: Challenge[] }) {
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
        <Text style={[styles.planPatchMeta, { color: tone.text }]}>{plan.attendees.length}/{plan.cap ?? "inf"}</Text>
      </View>
    </Pressable>
  );
}

export function ChallengeHero({ challenge, compact }: { challenge: Challenge; compact?: boolean }) {
  const tone = patchTone(challenge.tone);
  return (
    <View style={[styles.challengeHero, compact && styles.challengeHeroCompact, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <AvatarIcon avatar={challenge.icon} color={tone.text} size={compact ? 42 : 56} />
      <View style={styles.heroPatchBody}>
        <Text style={[styles.heroPatchTitle, { color: tone.text }]}>{challenge.name.toUpperCase()}</Text>
        <Text style={[styles.heroPatchMeta, { color: tone.text }]}>{challenge.difficulty} - {challenge.xp} XP</Text>
      </View>
    </View>
  );
}

export function ProgressSteps() {
  return <View style={styles.progressSteps}>{["1", "2", "3", "4", "5"].map((step, index) => <React.Fragment key={step}><View style={[styles.progressDot, index === 0 && styles.progressDotActive]}><Text style={[styles.progressDotText, index === 0 && styles.progressDotTextActive]}>{step}</Text></View>{index < 4 && <View style={styles.progressLine} />}</React.Fragment>)}</View>;
}

export function Tag({ text, active }: { text: string; active?: boolean }) {
  return <View style={[styles.tag, active && styles.tagActive]}><Text style={[styles.tagText, active && styles.tagTextActive]}>{text}</Text></View>;
}

export function StatBlock({ value, label }: { value: string; label: string }) {
  return <View style={styles.statBlock}><Text style={styles.statBlockValue}>{value}</Text><Text style={styles.statBlockLabel}>{label}</Text></View>;
}

export function CollectionRow({ icon, title, value, progress, total }: { icon: AvatarId; title: string; value: string; progress: number; total: number }) {
  return <View style={styles.collectionRow}><View style={styles.collectionIcon}><AvatarIcon avatar={icon} color={colors.green} size={20} /></View><View style={styles.flex}><Text style={styles.collectionTitle}>{title}</Text><View style={styles.stitchProgress}>{Array.from({ length: total }).map((_, index) => <View key={index} style={[styles.stitchUnit, index < progress && styles.stitchUnitDone]} />)}</View></View><Text style={styles.collectionValue}>{value}</Text></View>;
}

export function PatchCollectionRow({
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

export function CompletedBarRow({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.completedBarRow, pressedScale(pressed)]}>
      <View style={styles.completedBarIcon}><Check color={colors.cream} size={15} /></View>
      <View style={styles.flex}>
        <Text style={styles.completedBarTitle}>{challenge.name}</Text>
        <Text style={styles.completedBarMeta}>{challenge.difficulty} - {challenge.xp} XP</Text>
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
  flex: { flex: 1 },
  pressedScale: { transform: [{ scale: 0.96 }] },
  appHeader: { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paperLight },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 12, backgroundColor: colors.paperLight },
  headerLeft: { width: 112, alignItems: "flex-start", justifyContent: "center" },
  appHeaderTitleWrap: { position: "absolute", left: 72, right: 72, alignItems: "center" },
  appHeaderTitle: { textAlign: "center", color: colors.ink, fontSize: 22, fontWeight: "900" },
  headerRight: { width: 112, alignItems: "flex-end" },
  screenContent: { padding: 14, paddingBottom: 90 },
  tag: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  tagTextActive: { color: colors.navy },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionActionHit: { minWidth: 40, minHeight: 40, alignItems: "flex-end", justifyContent: "center" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
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
  challengeHero: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderStyle: "dashed", borderRadius: 9, padding: 16, marginBottom: 12 },
  challengeHeroCompact: { padding: 12 },
  heroPatchBody: { flex: 1, alignItems: "center" },
  heroPatchTitle: { fontSize: 25, fontWeight: "900", textAlign: "center" },
  heroPatchMeta: { marginTop: 4, fontSize: 12, fontWeight: "800" },
  statBlock: { flex: 1, alignItems: "center", backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7, paddingVertical: 12 },
  statBlockValue: { color: colors.ink, fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"] },
  statBlockLabel: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  progressSteps: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  progressDot: { width: 21, height: 21, borderWidth: 1, borderColor: colors.ink, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.paperLight },
  progressDotActive: { backgroundColor: colors.ink },
  progressDotText: { color: colors.ink, fontSize: 10, fontWeight: "900" },
  progressDotTextActive: { color: colors.cream },
  progressLine: { flex: 1, height: 1, backgroundColor: colors.line },
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
