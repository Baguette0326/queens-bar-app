import React from "react";
import { Award, Crown, Shield } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { AvatarId, Challenge, ChallengeCollection } from "../data/catalog";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type PatchProgress = ChallengeCollection & {
  total: number;
  completed: number;
  unlocked: boolean;
};

type RankProgress = {
  current: string;
  next: string;
  progress: number;
  remaining: number;
  target: number;
};

type UsernameCooldown = {
  canChange: boolean;
  daysLeft: number;
};

type Props = {
  username: string;
  roleLabel: string;
  avatar: AvatarId;
  avatarOptions: Array<{ id: AvatarId; label: string }>;
  tier: string;
  draftUsername: string;
  draftBio: string;
  usernameCooldown: UsernameCooldown;
  usernameChanged: boolean;
  profileSaving: boolean;
  xp: number;
  rankProgress: RankProgress;
  patchProgress: PatchProgress[];
  completedBarIds: string[];
  catalogCount: number;
  completedChallenges: Challenge[];
  onAvatarChange: (avatar: AvatarId) => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSave: () => void;
  onOpenCompleted: () => void;
  onOpenChallenge: (challengeId: string) => void;
  onSignOut: () => void;
  renderCollection: (collection: PatchProgress) => React.ReactNode;
  renderHonorLog: (completed: number, total: number) => React.ReactNode;
  renderCompletedBar: (challenge: Challenge, onPress: () => void) => React.ReactNode;
  renderOutlineButton: (label: string, onPress: () => void) => React.ReactNode;
};

export function ProfileScreen(props: Props) {
  const unlockedCollections = props.patchProgress.filter((collection) => collection.unlocked).length;

  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}><Crown color={colors.gold} size={23} fill={colors.gold} /></View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}><Text style={styles.appHeaderTitle} /></View>
        <View style={styles.headerRight}><Shield color={colors.ink} size={20} /></View>
      </View>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}><AvatarIcon avatar={props.avatar} color={colors.gold} size={42} /></View>
          <View style={styles.profileNameBlock}>
            <Text style={styles.profileName}>{props.username}</Text>
            <Text style={styles.profileMeta}>{props.roleLabel}</Text>
            <Tag text={props.roleLabel.toUpperCase()} />
          </View>
          <View style={styles.tierPatch}>
            <Text style={styles.tierSmall}>TIER</Text>
            <Text style={styles.tierTitle}>{props.tier}</Text>
            <Award color={colors.gold} size={28} />
          </View>
        </View>

        <FieldLabel text="DISPLAY NAME" />
        <TextInput
          value={props.draftUsername}
          onChangeText={(text) => props.onUsernameChange(text.slice(0, 24))}
          style={[styles.singleLineInput, !props.usernameCooldown.canChange && styles.inputDisabled]}
          editable={props.usernameCooldown.canChange}
          placeholder="Display name"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.inputHint}>
          {props.usernameCooldown.canChange
            ? props.usernameChanged
              ? "Saving will lock your display name for 30 days."
              : "You can change your display name once every 30 days."
            : `Display name locked for ${props.usernameCooldown.daysLeft} more day${props.usernameCooldown.daysLeft === 1 ? "" : "s"}.`}
        </Text>

        <FieldLabel text="PROFILE PATCH" />
        <View style={styles.avatarGrid}>
          {props.avatarOptions.map((item) => (
            <Pressable
              key={item.id}
              accessibilityLabel={item.label}
              onPress={() => props.onAvatarChange(item.id)}
              style={[styles.avatarOption, props.avatar === item.id && styles.avatarOptionActive]}
            >
              <AvatarIcon avatar={item.id} size={30} color={props.avatar === item.id ? colors.gold : colors.ink} />
            </Pressable>
          ))}
        </View>

        <FieldLabel text="BIO" />
        <View style={styles.bioBox}>
          <TextInput
            value={props.draftBio}
            onChangeText={(text) => props.onBioChange(text.slice(0, 160))}
            style={styles.bioInput}
            multiline
            placeholder="Add a short bio..."
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.counter}>{props.draftBio.length}/160</Text>
        </View>

        {props.renderOutlineButton(props.profileSaving ? "SAVING..." : "SAVE PROFILE", props.onSave)}
        <Text style={styles.progressText}>{props.xp.toLocaleString()} / {props.rankProgress.target.toLocaleString()} XP</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${props.rankProgress.progress}%` }]} /></View>
        <Text style={styles.progressHint}>
          {props.rankProgress.remaining > 0
            ? `${props.rankProgress.remaining.toLocaleString()} XP to ${props.rankProgress.next}`
            : "Max rank reached"}
        </Text>

        <SectionHeader title="PATCH COLLECTIONS" action={`${unlockedCollections}/${props.patchProgress.length}`} />
        {props.patchProgress.map((collection) => (
          <React.Fragment key={collection.id}>{props.renderCollection(collection)}</React.Fragment>
        ))}

        <SectionHeader title="COMPLETED BARS" action="See all" onAction={props.onOpenCompleted} />
        {props.renderHonorLog(props.completedBarIds.length, props.catalogCount)}
        {props.renderOutlineButton("OPEN COMPLETED LOG", props.onOpenCompleted)}
        {props.completedChallenges.length === 0 && (
          <Text style={styles.emptyState}>No completed bars yet. Open a bar and mark it completed when you earn it.</Text>
        )}
        {props.completedChallenges.slice(0, 8).map((challenge) => (
          <React.Fragment key={challenge.id}>
            {props.renderCompletedBar(challenge, () => props.onOpenChallenge(challenge.id))}
          </React.Fragment>
        ))}
        {props.renderOutlineButton("SIGN OUT", props.onSignOut)}
      </ScrollView>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function Tag({ text }: { text: string }) {
  return <View style={styles.tag}><Text style={styles.tagText}>{text}</Text></View>;
}

function SectionHeader({ title, action, onAction }: { title: string; action: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onAction} disabled={!onAction} style={styles.sectionActionHit}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appHeader: { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paperLight },
  headerLeft: { width: 112, alignItems: "flex-start", justifyContent: "center" },
  appHeaderTitleWrap: { position: "absolute", left: 72, right: 72, alignItems: "center" },
  appHeaderTitle: { textAlign: "center", color: colors.ink, fontSize: 22, fontWeight: "900" },
  headerRight: { width: 112, alignItems: "flex-end" },
  screenContent: { padding: 14, paddingBottom: 90 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.gold, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  profileNameBlock: { flex: 1, gap: 3 },
  profileName: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  profileMeta: { color: colors.ink, fontSize: 12 },
  tierPatch: { width: 82, height: 92, backgroundColor: colors.navy, borderWidth: 2, borderColor: colors.gold, borderStyle: "dashed", borderRadius: 7, alignItems: "center", justifyContent: "center" },
  tierSmall: { color: colors.cream, fontSize: 10, fontWeight: "800" },
  tierTitle: { color: colors.cream, fontSize: 14, fontWeight: "900", marginVertical: 3 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  tag: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  singleLineInput: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, color: colors.ink, fontSize: 14, fontWeight: "800", paddingHorizontal: 11 },
  inputDisabled: { opacity: 0.62 },
  inputHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 2 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  avatarOption: { width: 72, height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.paperLight },
  avatarOptionActive: { borderColor: colors.gold, borderWidth: 2, backgroundColor: colors.navy },
  bioBox: { minHeight: 88, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, padding: 9 },
  bioInput: { minHeight: 54, color: colors.ink, fontSize: 13, lineHeight: 18, padding: 0, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", color: colors.muted, fontSize: 10, marginTop: 7 },
  progressText: { color: colors.ink, fontSize: 12, fontWeight: "900", marginTop: 14, fontVariant: ["tabular-nums"] },
  progressTrack: { height: 8, backgroundColor: "#26384F", borderRadius: 4, marginTop: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.navy },
  progressHint: { color: colors.ink, fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionActionHit: { minWidth: 40, minHeight: 40, alignItems: "flex-end", justifyContent: "center" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
