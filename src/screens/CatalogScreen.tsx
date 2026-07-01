import React from "react";
import { Bookmark, Check, Crown, Search } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  getBrowseCategories,
  type BrowseCategory,
  type Challenge,
  type ChallengeTone
} from "../data/catalog";
import { AvatarIcon } from "../ui/AvatarIcon";
import { dataStatusLabel, type DataStatus } from "../ui/statusLabels";
import { colors, interaction, radii, spacing, typeScale } from "../ui/theme";

type CompletionFilter = "All" | "Completed" | "Not completed";

type Props = {
  xp: number;
  query: string;
  browseCategory: BrowseCategory | "All";
  difficulty: Challenge["difficulty"] | "All";
  completionFilter: CompletionFilter;
  catalogStatus: DataStatus;
  visibleChallenges: Challenge[];
  filteredCount: number;
  pinnedBarIds: string[];
  completedBarIds: string[];
  onQueryChange: (value: string) => void;
  onBrowseCategoryChange: (value: BrowseCategory | "All") => void;
  onDifficultyChange: (value: Challenge["difficulty"] | "All") => void;
  onCompletionFilterChange: (value: CompletionFilter) => void;
  onOpenChallenge: (challengeId: string) => void;
};

export function CatalogScreen(props: Props) {
  const filtersActive =
    props.browseCategory !== "All" ||
    props.difficulty !== "All" ||
    props.completionFilter !== "All" ||
    !!props.query;

  function clearFilters() {
    props.onBrowseCategoryChange("All");
    props.onDifficultyChange("All");
    props.onCompletionFilterChange("All");
    props.onQueryChange("");
  }

  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.brandButton}><Crown color={colors.gold} size={22} fill={colors.gold} /></View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}><Text style={styles.appHeaderTitle}>CATALOG</Text></View>
        <View style={styles.headerRight}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpValue}>{props.xp.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.searchBar}>
          <Search color={colors.muted} size={19} />
          <TextInput
            value={props.query}
            onChangeText={props.onQueryChange}
            placeholder="Search bars and types"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <FilterGroup label="DIFFICULTY">
          <ChoiceRow
            labels={["All", "Easy", "Medium", "Hard", "Legendary"]}
            value={props.difficulty}
            onChange={(value) => props.onDifficultyChange(value as Challenge["difficulty"] | "All")}
          />
        </FilterGroup>

        <FilterGroup label="TYPE">
          <ChoiceRow
            labels={["All", "Social & Games", "Campus & Places", "Music & Movies", "Long-form", "Participation"]}
            value={props.browseCategory}
            onChange={(value) => props.onBrowseCategoryChange(value as BrowseCategory | "All")}
          />
        </FilterGroup>

        <FilterGroup label="STATUS">
          <ChoiceRow
            labels={["All", "Completed", "Not completed"]}
            value={props.completionFilter}
            onChange={(value) => props.onCompletionFilterChange(value as CompletionFilter)}
          />
        </FilterGroup>

        <View style={styles.resultsRow}>
          <Text style={styles.catalogCount}>
            {props.visibleChallenges.length} of {props.filteredCount} bars
          </Text>
          <Text style={styles.sourceLabel}>{dataStatusLabel(props.catalogStatus)}</Text>
          {filtersActive && (
            <Pressable onPress={clearFilters} style={({ pressed }) => [styles.clearFilters, pressed && styles.pressed]}>
              <Text style={styles.clearFiltersText}>Reset</Text>
            </Pressable>
          )}
        </View>

        {props.visibleChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No bars match these filters</Text>
            <Text style={styles.emptyCopy}>Reset filters or try a broader search.</Text>
          </View>
        ) : (
          <View style={styles.catalogGrid}>
            {props.visibleChallenges.map((challenge) => (
              <CatalogCard
                key={challenge.id}
                challenge={challenge}
                pinned={props.pinnedBarIds.includes(challenge.id)}
                completed={props.completedBarIds.includes(challenge.id)}
                onPress={() => props.onOpenChallenge(challenge.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ChoiceRow({ labels, value, onChange }: { labels: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {labels.map((label) => (
        <Pressable
          key={label}
          onPress={() => onChange(label)}
          style={({ pressed }) => [
            styles.filterButton,
            label === value && styles.filterButtonActive,
            pressed && styles.pressed
          ]}
        >
          <Text style={[styles.filterText, label === value && styles.filterTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CatalogCard({
  challenge,
  pinned,
  completed,
  onPress
}: {
  challenge: Challenge;
  pinned: boolean;
  completed: boolean;
  onPress: () => void;
}) {
  const accent = toneAccent(challenge.tone);
  const typeLabels = getBrowseCategories(challenge)
    .filter((label) => label !== "Unreviewed")
    .slice(0, 2);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.catalogCard, pressed && styles.pressed]}>
      <View style={[styles.cardAccent, { backgroundColor: accent }]} />
      <View style={styles.cardTopRow}>
        <View style={[styles.cardIcon, { borderColor: accent }]}>
          <AvatarIcon avatar={challenge.icon} color={accent} size={27} />
        </View>
        <View style={styles.cardStatusRow}>
          {pinned && <View style={styles.statusIcon}><Bookmark color={colors.gold} size={13} fill={colors.gold} /></View>}
          {completed && <View style={styles.completedIcon}><Check color="#F3FFF7" size={13} /></View>}
        </View>
      </View>
      <Text numberOfLines={2} style={styles.cardTitle}>{challenge.name.toUpperCase()}</Text>
      <View style={styles.cardLabels}>
        <View style={[styles.difficultyPill, { borderColor: accent }]}>
          <Text style={[styles.difficultyText, { color: accent }]}>{challenge.difficulty}</Text>
        </View>
        {typeLabels.map((label) => (
          <View key={label} style={styles.typePill}><Text numberOfLines={1} style={styles.typeText}>{label}</Text></View>
        ))}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.xpCardValue}>{challenge.xp} XP</Text>
        <Text style={styles.openText}>Open</Text>
      </View>
    </Pressable>
  );
}

function toneAccent(tone: ChallengeTone) {
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
  brandButton: { width: interaction.minHitSize, height: interaction.minHitSize, alignItems: "center", justifyContent: "center" },
  appHeaderTitleWrap: { position: "absolute", left: 100, right: 100, alignItems: "center" },
  appHeaderTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  headerRight: { minWidth: 92, alignItems: "flex-end" },
  xpBadge: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.pill,
    backgroundColor: "#1B304A",
    paddingHorizontal: spacing.md
  },
  xpLabel: { color: colors.gold, fontSize: 9, fontWeight: "900" },
  xpValue: { color: colors.ink, fontSize: typeScale.label, fontWeight: "900", fontVariant: ["tabular-nums"] },
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
  filterGroup: { marginTop: spacing.md },
  fieldLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", marginBottom: 6 },
  filterRow: { gap: 6, paddingRight: spacing.lg },
  filterButton: {
    minHeight: 36,
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
  resultsRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  catalogCount: { color: colors.ink, fontSize: typeScale.label, fontWeight: "900", fontVariant: ["tabular-nums"] },
  sourceLabel: { flex: 1, color: colors.muted, fontSize: typeScale.caption },
  clearFilters: { minWidth: interaction.minHitSize, minHeight: interaction.minHitSize, alignItems: "center", justifyContent: "center" },
  clearFiltersText: { color: "#7DB7F0", fontSize: typeScale.label, fontWeight: "900" },
  catalogGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  catalogCard: {
    position: "relative",
    width: "48.5%",
    minHeight: 196,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#29415F",
    borderRadius: radii.md,
    backgroundColor: "#101E31",
    padding: spacing.md,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2
  },
  cardAccent: { position: "absolute", left: 0, top: 0, right: 0, height: 3 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: "#162A43",
    alignItems: "center",
    justifyContent: "center"
  },
  cardStatusRow: { flexDirection: "row", gap: 5 },
  statusIcon: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: "#1B304A",
    alignItems: "center",
    justifyContent: "center"
  },
  completedIcon: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: "#2A7B4B",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "900", marginTop: spacing.sm },
  cardLabels: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: spacing.sm },
  difficultyPill: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 3 },
  difficultyText: { fontSize: 8, fontWeight: "900" },
  typePill: { maxWidth: "100%", borderRadius: radii.pill, backgroundColor: "#1B304A", paddingHorizontal: 7, paddingVertical: 4 },
  typeText: { color: colors.muted, fontSize: 8, fontWeight: "800" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  xpCardValue: { color: colors.gold, fontSize: typeScale.label, fontWeight: "900", fontVariant: ["tabular-nums"] },
  openText: { color: "#7DB7F0", fontSize: typeScale.caption, fontWeight: "800" },
  emptyState: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#29415F",
    borderRadius: radii.md,
    backgroundColor: "#101E31",
    padding: spacing.xl,
    marginTop: spacing.sm
  },
  emptyTitle: { color: colors.ink, fontSize: typeScale.body, fontWeight: "900" },
  emptyCopy: { color: colors.muted, fontSize: typeScale.label, marginTop: 4 },
  pressed: { transform: [{ scale: interaction.pressedScale }] }
});
