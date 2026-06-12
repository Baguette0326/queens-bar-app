import React from "react";
import { Crown, Filter, Search } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { BrowseCategory, Challenge } from "../data/catalog";
import { dataStatusLabel, type DataStatus } from "../ui/statusLabels";
import { colors } from "../ui/theme";

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
  renderChallenge: (challenge: Challenge, pinned: boolean, completed: boolean, onPress: () => void) => React.ReactNode;
};

export function CatalogScreen(props: Props) {
  const filtersActive = props.browseCategory !== "All" || props.difficulty !== "All" || props.completionFilter !== "All" || !!props.query;

  function clearFilters() {
    props.onBrowseCategoryChange("All");
    props.onDifficultyChange("All");
    props.onCompletionFilterChange("All");
    props.onQueryChange("");
  }

  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}><Crown color={colors.gold} size={23} fill={colors.gold} /></View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}><Text style={styles.appHeaderTitle}>CATALOG</Text></View>
        <View style={styles.headerRight}><Text style={styles.xpBadge}>XP {props.xp.toLocaleString()}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.searchBar}>
          <Search color={colors.ink} size={18} />
          <TextInput value={props.query} onChangeText={props.onQueryChange} placeholder="Search challenges..." placeholderTextColor={colors.muted} style={styles.searchInput} />
          <Filter color={colors.ink} size={18} />
        </View>
        <FieldLabel text="BROWSE BY TYPE" />
        <ChoiceRow
          labels={["All", "Social & Games", "Campus & Places", "Music & Movies", "Long-form", "Participation", "Unreviewed"]}
          value={props.browseCategory}
          onChange={(value) => props.onBrowseCategoryChange(value as BrowseCategory | "All")}
        />
        <FieldLabel text="DIFFICULTY" />
        <ChoiceRow
          labels={["All", "Easy", "Medium", "Hard", "Legendary"]}
          value={props.difficulty}
          onChange={(value) => props.onDifficultyChange(value as Challenge["difficulty"] | "All")}
        />
        <FieldLabel text="COMPLETION" />
        <ChoiceRow
          labels={["All", "Completed", "Not completed"]}
          value={props.completionFilter}
          onChange={(value) => props.onCompletionFilterChange(value as CompletionFilter)}
        />
        <Text style={styles.catalogCount}>
          Showing {props.visibleChallenges.length} of {props.filteredCount} bars · {dataStatusLabel(props.catalogStatus)}
        </Text>
        {filtersActive && (
          <Pressable onPress={clearFilters} style={styles.clearFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </Pressable>
        )}
        <View style={styles.catalogGrid}>
          {props.visibleChallenges.map((challenge) => (
            <React.Fragment key={challenge.id}>
              {props.renderChallenge(
                challenge,
                props.pinnedBarIds.includes(challenge.id),
                props.completedBarIds.includes(challenge.id),
                () => props.onOpenChallenge(challenge.id)
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function ChoiceRow({ labels, value, onChange }: { labels: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {labels.map((label) => (
        <Pressable key={label} onPress={() => onChange(label)}>
          <View style={[styles.tag, label === value && styles.tagActive]}>
            <Text style={[styles.tagText, label === value && styles.tagTextActive]}>{label}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appHeader: { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 54, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paperLight },
  headerLeft: { width: 112, alignItems: "flex-start", justifyContent: "center" },
  appHeaderTitleWrap: { position: "absolute", left: 72, right: 72, alignItems: "center" },
  appHeaderTitle: { textAlign: "center", color: colors.ink, fontSize: 22, fontWeight: "900" },
  headerRight: { width: 112, alignItems: "flex-end" },
  xpBadge: { color: colors.ink, fontSize: 12, fontWeight: "900", borderWidth: 1, borderColor: colors.ink, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, fontVariant: ["tabular-nums"] },
  screenContent: { padding: 14, paddingBottom: 90 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 10 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  filterRow: { gap: 6, paddingBottom: 4 },
  tag: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  tagTextActive: { color: colors.navy },
  catalogCount: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 8 },
  clearFilters: { alignSelf: "flex-start", marginTop: 5, paddingVertical: 4 },
  clearFiltersText: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  catalogGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }
});
