import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Challenge } from "../data/catalog";
import type { Plan } from "../app/types";
import { getBrowseCategories } from "../data/catalog";
import { colors } from "../ui/theme";

type Props = {
  challenge: Challenge;
  catalog: Challenge[];
  plans: Plan[];
  pinned: boolean;
  completed: boolean;
  interestSaving: boolean;
  completionSaving: boolean;
  onToggleInterest: () => void;
  onToggleCompletion: () => void;
  onMoreInfo: () => void;
  onOpenPlan: (planId: string) => void;
  onCreatePlan: () => void;
  renderHero: (challenge: Challenge) => React.ReactNode;
  renderTag: (text: string, active?: boolean) => React.ReactNode;
  renderStat: (value: string, label: string) => React.ReactNode;
  renderButton: (label: string, tone: "navy" | "red" | "green", onPress: () => void) => React.ReactNode;
  renderOutlineButton: (label: string, onPress: () => void) => React.ReactNode;
  renderSectionHeader: (title: string, action?: string) => React.ReactNode;
  renderPlan: (plan: Plan, catalog: Challenge[], onPress: () => void) => React.ReactNode;
};

export function ChallengeDetailScreen(props: Props) {
  const ongoingPlans = props.plans.filter(
    (plan) => plan.challengeId === props.challenge.id && plan.status === "ongoing"
  );

  return (
    <>
      {props.renderHero(props.challenge)}
      <View style={styles.metaRow}>
        {getBrowseCategories(props.challenge)
          .filter((category) => category !== "Unreviewed")
          .map((category) => <React.Fragment key={category}>{props.renderTag(category, true)}</React.Fragment>)}
        {props.challenge.tags
          .filter((tag) => tag !== "Shenanigans")
          .map((tag) => <React.Fragment key={tag}>{props.renderTag(tag)}</React.Fragment>)}
      </View>
      <FieldLabel text="ABOUT THIS BAR" />
      <Text style={styles.detailCopy}>{props.challenge.summary}</Text>
      <FieldLabel text={props.challenge.reviewed ? "TRADITIONAL REQUIREMENT" : "INSTRUCTIONS"} />
      <Text style={styles.detailCopy}>{props.challenge.instructions}</Text>
      <FieldLabel text="COMMON LOCATIONS" />
      <View style={styles.metaRow}>
        {props.challenge.places.map((place) => <React.Fragment key={place}>{props.renderTag(place)}</React.Fragment>)}
      </View>
      <View style={styles.statRow}>
        {props.renderStat((props.challenge.interested + (props.pinned ? 1 : 0)).toLocaleString(), "Interested")}
        {props.renderStat(`${props.challenge.upcoming}`, "Upcoming Plans")}
      </View>
      {props.renderButton(
        props.interestSaving ? "SAVING..." : props.pinned ? "PINNED - NOTIFY ME" : "PIN THIS BAR",
        props.pinned ? "green" : "navy",
        props.interestSaving ? () => undefined : props.onToggleInterest
      )}
      {props.renderButton(
        props.completionSaving ? "SAVING..." : props.completed ? "UNDO COMPLETION" : `MARK COMPLETED (+${props.challenge.xp} XP)`,
        props.completed ? "green" : "red",
        props.onToggleCompletion
      )}
      {props.renderOutlineButton("MORE INFO", props.onMoreInfo)}
      {props.renderSectionHeader("ONGOING PLANS", "See all")}
      {ongoingPlans.map((plan) => (
        <React.Fragment key={plan.id}>
          {props.renderPlan(plan, props.catalog, () => props.onOpenPlan(plan.id))}
        </React.Fragment>
      ))}
      {props.renderButton("CREATE A PLAN", "red", props.onCreatePlan)}
    </>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  detailCopy: { color: colors.ink, fontSize: 14, lineHeight: 20, marginVertical: 10 },
  statRow: { flexDirection: "row", gap: 8, marginVertical: 10 }
});
