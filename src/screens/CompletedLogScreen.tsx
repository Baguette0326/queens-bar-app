import React from "react";
import { StyleSheet, Text } from "react-native";
import type { Challenge } from "../data/catalog";
import { colors } from "../ui/theme";

type Props = {
  completedBarIds: string[];
  catalogCount: number;
  completedChallenges: Challenge[];
  onOpenChallenge: (challengeId: string) => void;
  renderHonorLog: (completed: number, total: number) => React.ReactNode;
  renderCompletedBar: (challenge: Challenge, onPress: () => void) => React.ReactNode;
};

export function CompletedLogScreen(props: Props) {
  return (
    <>
      {props.renderHonorLog(props.completedBarIds.length, props.catalogCount)}
      {props.completedChallenges.length === 0 && (
        <Text style={styles.emptyState}>No completed bars yet. Completed bars will show up here.</Text>
      )}
      {props.completedChallenges.map((challenge) => (
        <React.Fragment key={challenge.id}>
          {props.renderCompletedBar(challenge, () => props.onOpenChallenge(challenge.id))}
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
