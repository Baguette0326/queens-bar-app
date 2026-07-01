import React, { useMemo, useState } from "react";
import {
  Award,
  Bell,
  CalendarClock,
  Clock3,
  Crown,
  MapPin,
  Search,
  Users,
  UsersRound
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Challenge, ChallengeTone } from "../data/catalog";
import type { Plan } from "../app/types";
import { AvatarIcon } from "../ui/AvatarIcon";
import { dataStatusLabel, type DataStatus } from "../ui/statusLabels";
import { colors, interaction, radii, spacing, typeScale } from "../ui/theme";

type DiscoverFilter = "All" | "Live" | "Upcoming";

type Props = {
  query: string;
  plans: Plan[];
  catalog: Challenge[];
  plansStatus: DataStatus;
  unreadNotificationCount: number;
  onQueryChange: (value: string) => void;
  onOpenPlan: (planId: string) => void;
  onNotifications: () => void;
  onPeople: () => void;
  onLeaderboard: () => void;
};

export function DiscoverScreen({
  query,
  plans,
  catalog,
  plansStatus,
  unreadNotificationCount,
  onQueryChange,
  onOpenPlan,
  onNotifications,
  onPeople,
  onLeaderboard
}: Props) {
  const [filter, setFilter] = useState<DiscoverFilter>("All");
  const term = query.trim().toLowerCase();

  const matchingPlans = useMemo(() => {
    return plans.filter((plan) => {
      const challenge = catalog.find((item) => item.id === plan.challengeId);
      const matchesTerm =
        !term ||
        challenge?.name.toLowerCase().includes(term) ||
        plan.place.toLowerCase().includes(term) ||
        plan.detail.toLowerCase().includes(term) ||
        plan.startedBy.toLowerCase().includes(term);
      const matchesFilter =
        filter === "All" ||
        (filter === "Live" && plan.status === "ongoing") ||
        (filter === "Upcoming" && plan.status === "upcoming");
      return matchesTerm && matchesFilter;
    });
  }, [catalog, filter, plans, term]);

  const ongoingPlans = matchingPlans.filter((plan) => plan.status === "ongoing");
  const upcomingPlans = matchingPlans.filter((plan) => plan.status === "upcoming");
  const hasResults = matchingPlans.length > 0;

  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.brandButton}>
          <Crown color={colors.gold} size={22} fill={colors.gold} />
        </View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}>
          <Text style={styles.appHeaderTitle}>DISCOVER</Text>
        </View>
        <View style={styles.headerActions}>
          <HeaderButton label="Find people" onPress={onPeople}><Users color={colors.ink} size={19} /></HeaderButton>
          <HeaderButton label="Leaderboard" onPress={onLeaderboard}><Award color={colors.ink} size={19} /></HeaderButton>
          <HeaderButton label="Notifications" onPress={onNotifications}>
            <Bell color={colors.ink} size={20} />
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationCount}>
                <Text style={styles.notificationCountText}>{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</Text>
              </View>
            )}
          </HeaderButton>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.searchBar}>
          <Search color={colors.muted} size={19} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Bars, places, or people"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {(["All", "Live", "Upcoming"] as DiscoverFilter[]).map((label) => (
            <Pressable
              key={label}
              onPress={() => setFilter(label)}
              style={({ pressed }) => [
                styles.filterButton,
                filter === label && styles.filterButtonActive,
                pressed && styles.pressed
              ]}
            >
              <Text style={[styles.filterText, filter === label && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {!hasResults && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><CalendarClock color={colors.gold} size={22} /></View>
            <View style={styles.flex}>
              <Text style={styles.emptyTitle}>{plans.length ? "No matching plans" : "Nothing planned yet"}</Text>
              <Text style={styles.emptyCopy}>
                {plans.length ? "Try a different search or filter." : "Open the Catalog and create the first plan."}
              </Text>
            </View>
          </View>
        )}

        {(filter === "All" || filter === "Live") && ongoingPlans.length > 0 && (
          <>
            <SectionHeader title="HAPPENING NOW" count={ongoingPlans.length} meta={dataStatusLabel(plansStatus)} />
            {ongoingPlans.map((plan) => (
              <DiscoverPlanCard key={plan.id} plan={plan} catalog={catalog} onPress={() => onOpenPlan(plan.id)} />
            ))}
          </>
        )}

        {(filter === "All" || filter === "Upcoming") && upcomingPlans.length > 0 && (
          <>
            <SectionHeader title="COMING UP" count={upcomingPlans.length} />
            {upcomingPlans.map((plan) => (
              <DiscoverPlanCard key={plan.id} plan={plan} catalog={catalog} onPress={() => onOpenPlan(plan.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function HeaderButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

function SectionHeader({ title, count, meta }: { title: string; count: number; meta?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View>
      </View>
      {!!meta && <Text style={styles.sectionMeta}>{meta}</Text>}
    </View>
  );
}

function DiscoverPlanCard({ plan, catalog, onPress }: { plan: Plan; catalog: Challenge[]; onPress: () => void }) {
  const challenge = catalog.find((item) => item.id === plan.challengeId);
  const accent = toneAccent(challenge?.tone);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.planCard, pressed && styles.pressed]}
    >
      <View style={[styles.planAccent, { backgroundColor: accent }]} />
      <View style={[styles.planIcon, { borderColor: accent }]}>
        <AvatarIcon avatar={challenge?.icon ?? "star"} color={accent} size={24} />
      </View>
      <View style={styles.planBody}>
        <View style={styles.planTitleRow}>
          <Text numberOfLines={1} style={styles.planTitle}>{challenge?.name.toUpperCase() ?? "UNKNOWN BAR"}</Text>
          {plan.status === "ongoing" && <View style={styles.livePill}><Text style={styles.liveText}>LIVE</Text></View>}
        </View>
        <View style={styles.planMetaRow}>
          <MapPin color={colors.muted} size={14} />
          <Text numberOfLines={1} style={styles.planMeta}>{plan.place}</Text>
        </View>
        <View style={styles.planFooter}>
          <View style={styles.planMetaRow}>
            <Clock3 color={colors.muted} size={14} />
            <Text style={styles.planMeta}>{plan.startsAt}</Text>
          </View>
          <View style={styles.attendeeCount}>
            <UsersRound color={colors.ink} size={14} />
            <Text style={styles.attendeeText}>{plan.attendees.length}/{plan.cap ?? "∞"}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function toneAccent(tone?: ChallengeTone) {
  if (tone === "red") return "#E35B60";
  if (tone === "green") return "#5DC98A";
  if (tone === "paper") return "#A8BED8";
  return colors.gold;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appHeader: {
    position: "relative",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#263B57",
    backgroundColor: colors.paperLight
  },
  brandButton: {
    width: interaction.minHitSize,
    height: interaction.minHitSize,
    alignItems: "center",
    justifyContent: "center"
  },
  appHeaderTitleWrap: { position: "absolute", left: 132, right: 132, alignItems: "center" },
  appHeaderTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  headerIconButton: {
    width: interaction.minHitSize,
    height: interaction.minHitSize,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  notificationCount: {
    position: "absolute",
    top: 1,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.paperLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  notificationCountText: { color: colors.cream, fontSize: 8, fontWeight: "900", fontVariant: ["tabular-nums"] },
  screenContent: { padding: spacing.lg, paddingBottom: 96 },
  searchBar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#101E31",
    borderWidth: 1,
    borderColor: "#304967",
    borderRadius: radii.md,
    paddingHorizontal: spacing.md
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: typeScale.body, paddingVertical: spacing.md },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
  filterButton: {
    minHeight: interaction.minHitSize,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#304967",
    borderRadius: radii.pill,
    backgroundColor: "#101E31",
    paddingHorizontal: spacing.md
  },
  filterButtonActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterText: { color: colors.muted, fontSize: typeScale.label, fontWeight: "800" },
  filterTextActive: { color: colors.paper, fontWeight: "900" },
  sectionHeader: {
    minHeight: 44,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  countPill: {
    minWidth: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B304A"
  },
  countText: { color: colors.ink, fontSize: typeScale.caption, fontWeight: "900", fontVariant: ["tabular-nums"] },
  sectionMeta: { color: "#7DB7F0", fontSize: typeScale.label, fontWeight: "800" },
  planCard: {
    position: "relative",
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "#29415F",
    borderRadius: radii.md,
    backgroundColor: "#101E31",
    padding: spacing.md,
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden"
  },
  planAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: "#162A43",
    alignItems: "center",
    justifyContent: "center"
  },
  planBody: { flex: 1, minWidth: 0 },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  planTitle: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "900" },
  livePill: { borderRadius: radii.pill, backgroundColor: "#2A7B4B", paddingHorizontal: 7, paddingVertical: 3 },
  liveText: { color: "#F3FFF7", fontSize: 8, fontWeight: "900" },
  planMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, minWidth: 0, marginTop: 5 },
  planMeta: { flexShrink: 1, color: colors.muted, fontSize: typeScale.label, fontWeight: "700" },
  planFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  attendeeCount: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    backgroundColor: "#1B304A",
    paddingHorizontal: spacing.sm
  },
  attendeeText: { color: colors.ink, fontSize: typeScale.label, fontWeight: "900", fontVariant: ["tabular-nums"] },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "#29415F",
    borderRadius: radii.md,
    backgroundColor: "#101E31",
    padding: spacing.lg,
    marginTop: spacing.lg
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B304A"
  },
  emptyTitle: { color: colors.ink, fontSize: typeScale.body, fontWeight: "900" },
  emptyCopy: { color: colors.muted, fontSize: typeScale.label, lineHeight: 16, marginTop: 3 },
  pressed: { transform: [{ scale: interaction.pressedScale }] }
});
