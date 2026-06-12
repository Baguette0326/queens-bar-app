import React from "react";
import { Award, Bell, Crown, Filter, Search, Users } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Challenge } from "../data/catalog";
import type { Plan } from "../app/types";
import { dataStatusLabel, type DataStatus } from "../ui/statusLabels";
import { colors } from "../ui/theme";

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
  renderPlan: (plan: Plan, catalog: Challenge[], onPress: () => void) => React.ReactNode;
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
  onLeaderboard,
  renderPlan
}: Props) {
  const ongoingPlans = plans.filter((plan) => plan.status === "ongoing");
  const upcomingPlans = plans.filter((plan) => plan.status === "upcoming");

  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}><Crown color={colors.gold} size={23} fill={colors.gold} /></View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}><Text style={styles.appHeaderTitle}>DISCOVER</Text></View>
        <View style={styles.headerRight}>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Find people" onPress={onPeople} style={styles.headerIconButton}>
              <Users color={colors.ink} size={20} />
            </Pressable>
            <Pressable accessibilityLabel="Leaderboard" onPress={onLeaderboard} style={styles.headerIconButton}>
              <Award color={colors.ink} size={20} />
            </Pressable>
            <Pressable accessibilityLabel="Notifications" onPress={onNotifications} style={styles.notificationBell}>
              <Bell color={colors.ink} size={21} />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationCount}>
                  <Text style={styles.notificationCountText}>{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.searchBar}>
          <Search color={colors.ink} size={18} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search bars, locations, people..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          <Filter color={colors.ink} size={18} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {["All", "Ongoing", "Upcoming", "Nearby", "Easy"].map((label, index) => (
            <View key={label} style={[styles.tag, index === 0 && styles.tagActive]}>
              <Text style={[styles.tagText, index === 0 && styles.tagTextActive]}>{label}</Text>
            </View>
          ))}
        </ScrollView>
        <SectionHeader title="ONGOING PLANS" action={dataStatusLabel(plansStatus)} />
        {plans.length === 0 && <Text style={styles.emptyState}>No plans yet. Create the first one from the Catalog.</Text>}
        {ongoingPlans.map((plan) => <React.Fragment key={plan.id}>{renderPlan(plan, catalog, () => onOpenPlan(plan.id))}</React.Fragment>)}
        <SectionHeader title="UPCOMING PLANS" action={plans.length ? "See all" : "Create one"} />
        {upcomingPlans.map((plan) => <React.Fragment key={plan.id}>{renderPlan(plan, catalog, () => onOpenPlan(plan.id))}</React.Fragment>)}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notificationBell: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notificationCount: { position: "absolute", top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.red, borderWidth: 1, borderColor: colors.paperLight, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  notificationCountText: { color: colors.cream, fontSize: 9, fontWeight: "900" },
  screenContent: { padding: 14, paddingBottom: 90 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 10 },
  filterRow: { gap: 6, paddingBottom: 4 },
  tag: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  tagTextActive: { color: colors.navy },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8, minHeight: 40 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
