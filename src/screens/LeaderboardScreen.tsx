import React from "react";
import { StyleSheet, Text } from "react-native";
import type { Profile } from "../data/profileRepository";
import { colors } from "../ui/theme";

type Props = {
  profiles: Profile[];
  status: "idle" | "loading" | "error";
  onOpenProfile: (profile: Profile) => void;
  renderRow: (profile: Profile, place: number, onPress: () => void) => React.ReactNode;
};

export function LeaderboardScreen(props: Props) {
  return (
    <>
      {props.status === "loading" && <Text style={styles.emptyState}>Loading leaderboard...</Text>}
      {props.status === "error" && <Text style={styles.emptyState}>Could not load the leaderboard yet.</Text>}
      {props.profiles.map((profile, index) => (
        <React.Fragment key={profile.id}>
          {props.renderRow(profile, index + 1, () => props.onOpenProfile(profile))}
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
