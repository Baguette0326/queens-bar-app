import React from "react";
import { Check, ChevronDown } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Challenge } from "../data/catalog";
import type { CreatePlanDay, Plan } from "../app/types";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type Props = {
  catalog: Challenge[];
  selectedChallenge: Challenge;
  pickerOpen: boolean;
  matchingPlans: Plan[];
  day: CreatePlanDay;
  time: string;
  durationMinutes: number;
  place: string;
  detail: string;
  visibility: "public" | "friends";
  cap: number;
  note: string;
  createMessage: string;
  publishing: boolean;
  onTogglePicker: () => void;
  onSelectChallenge: (challengeId: string) => void;
  onOpenPlan: (planId: string) => void;
  onDayChange: (day: CreatePlanDay) => void;
  onTimeChange: (value: string) => void;
  onDurationChange: (minutes: number) => void;
  onPlaceChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onVisibilityChange: (value: "public" | "friends") => void;
  onCapChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  onPublish: () => void;
  renderProgress: () => React.ReactNode;
  renderButton: (label: string, tone: "navy" | "red" | "green", onPress: () => void) => React.ReactNode;
};

export function CreatePlanScreen(props: Props) {
  return (
    <>
      {props.renderProgress()}
      <FieldLabel text="CHOOSE A CHALLENGE" />
      <ChallengePicker {...props} />
      {props.matchingPlans.length > 0 && (
        <View style={styles.existingPlanNotice}>
          <Text style={styles.existingPlanTitle}>Already on the board</Text>
          <Text style={styles.existingPlanText}>
            {props.matchingPlans.length === 1
              ? "There is already a live or upcoming plan for this bar. You can still publish your own separate plan."
              : `There are already ${props.matchingPlans.length} live or upcoming plans for this bar. You can still publish your own separate plan.`}
          </Text>
          {props.matchingPlans.slice(0, 2).map((plan) => (
            <Pressable key={plan.id} onPress={() => props.onOpenPlan(plan.id)} style={styles.existingPlanRow}>
              <Text style={styles.existingPlanRowTitle}>{plan.place}</Text>
              <Text style={styles.existingPlanRowMeta}>{plan.startsAt} · {plan.attendees.length}/{plan.cap ?? "∞"}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <FieldLabel text="WHEN & DURATION" />
      <ChoiceRow labels={["Today", "Tomorrow"]} value={props.day} onChange={(value) => props.onDayChange(value as CreatePlanDay)} />
      <View style={styles.formRow}>
        <View style={[styles.inputShell, styles.formInputShell]}>
          <TextInput value={props.time} onChangeText={props.onTimeChange} style={styles.input} placeholder="7:00 PM" placeholderTextColor={colors.muted} autoCapitalize="characters" />
        </View>
        <View style={styles.durationSummary}>
          <Text style={styles.durationSummaryLabel}>DURATION</Text>
          <Text style={styles.durationSummaryValue}>{props.durationMinutes} min</Text>
        </View>
      </View>
      <FieldLabel text="DURATION" />
      <ChoiceRow labels={["30 min", "60 min", "120 min", "180 min"]} value={`${props.durationMinutes} min`} onChange={(value) => props.onDurationChange(Number.parseInt(value, 10))} />
      <FieldLabel text="WHERE" />
      <View style={styles.metaRow}>
        {[...props.selectedChallenge.places, "Other location"].map((place) => (
          <Pressable key={place} onPress={() => props.onPlaceChange(place)}>
            <Tag text={place} active={props.place === place} />
          </Pressable>
        ))}
      </View>
      <View style={styles.inputShell}>
        <TextInput value={props.detail} onChangeText={props.onDetailChange} style={styles.input} placeholder="Specific spot, room, lobby, entrance..." placeholderTextColor={colors.muted} />
      </View>
      <FieldLabel text="WHO CAN SEE IT" />
      <ChoiceRow labels={["Public", "Friends"]} value={props.visibility === "public" ? "Public" : "Friends"} onChange={(value) => props.onVisibilityChange(value === "Friends" ? "friends" : "public")} />
      <FieldLabel text="CAP (OPTIONAL)" />
      <View style={styles.stepper}>
        <Pressable onPress={() => props.onCapChange(Math.max(1, props.cap - 1))}><Text style={styles.stepperText}>-</Text></Pressable>
        <Text style={styles.stepperText}>{props.cap}</Text>
        <Pressable onPress={() => props.onCapChange(Math.min(99, props.cap + 1))}><Text style={styles.stepperText}>+</Text></Pressable>
      </View>
      <FieldLabel text="NOTE (OPTIONAL)" />
      <View style={styles.noteBox}>
        <TextInput value={props.note} onChangeText={(text) => props.onNoteChange(text.slice(0, 100))} style={styles.noteInput} multiline placeholder="Add anything people should know..." placeholderTextColor={colors.muted} />
        <Text style={styles.counter}>{props.note.length}/100</Text>
      </View>
      {!!props.createMessage && <Text style={styles.formNotice}>{props.createMessage}</Text>}
      {props.renderButton(props.publishing ? "PUBLISHING..." : "PUBLISH PLAN!", "red", props.publishing ? () => undefined : props.onPublish)}
    </>
  );
}

function ChallengePicker(props: Props) {
  return (
    <View style={styles.challengePicker}>
      <Pressable onPress={props.onTogglePicker} style={styles.challengePickerButton}>
        <AvatarIcon avatar={props.selectedChallenge.icon} color={colors.gold} size={26} />
        <View style={styles.flex}>
          <Text style={styles.selectedChallengeTitle}>{props.selectedChallenge.name.toUpperCase()}</Text>
          <Text style={styles.selectedChallengeMeta}>{props.selectedChallenge.difficulty} · {props.selectedChallenge.xp} XP</Text>
        </View>
        <ChevronDown color={colors.ink} size={20} />
      </Pressable>
      {props.pickerOpen && (
        <ScrollView nestedScrollEnabled style={styles.challengePickerMenu}>
          {props.catalog.map((challenge) => {
            const selected = challenge.id === props.selectedChallenge.id;
            return (
              <Pressable key={challenge.id} onPress={() => props.onSelectChallenge(challenge.id)} style={[styles.challengePickerOption, selected && styles.challengePickerOptionActive]}>
                <AvatarIcon avatar={challenge.icon} color={selected ? colors.cream : colors.ink} size={20} />
                <View style={styles.flex}>
                  <Text numberOfLines={1} style={[styles.challengePickerOptionTitle, selected && styles.challengePickerOptionTitleActive]}>{challenge.name}</Text>
                  <Text style={[styles.challengePickerOptionMeta, selected && styles.challengePickerOptionMetaActive]}>{challenge.difficulty} · {challenge.xp} XP</Text>
                </View>
                {selected && <Check color={colors.cream} size={16} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function ChoiceRow({ labels, value, onChange }: { labels: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {labels.map((label) => <Pressable key={label} onPress={() => onChange(label)}><Tag text={label} active={label === value} /></Pressable>)}
    </ScrollView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function Tag({ text, active }: { text: string; active?: boolean }) {
  return <View style={[styles.tag, active && styles.tagActive]}><Text style={[styles.tagText, active && styles.tagTextActive]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  filterRow: { gap: 6, paddingBottom: 4 },
  tag: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  tagActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  tagText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  tagTextActive: { color: colors.navy },
  challengePicker: { marginBottom: 2 },
  challengePickerButton: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: colors.line, borderRadius: 7, padding: 10, backgroundColor: colors.paperLight },
  challengePickerMenu: { maxHeight: 260, borderWidth: 1, borderTopWidth: 0, borderColor: colors.line, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: colors.paperLight },
  challengePickerOption: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  challengePickerOptionActive: { backgroundColor: colors.navy },
  challengePickerOptionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  challengePickerOptionTitleActive: { color: colors.cream },
  challengePickerOptionMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  challengePickerOptionMetaActive: { color: colors.cream },
  selectedChallengeTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  selectedChallengeMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  existingPlanNotice: { borderWidth: 1, borderColor: colors.gold, borderRadius: 8, backgroundColor: colors.cream, padding: 11, marginTop: 10, marginBottom: 2 },
  existingPlanTitle: { color: colors.ink, fontSize: 13, fontWeight: "900", marginBottom: 4 },
  existingPlanText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  existingPlanRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, marginTop: 8 },
  existingPlanRowTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  existingPlanRowMeta: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 2 },
  formRow: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  inputShell: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, paddingHorizontal: 10 },
  formInputShell: { flex: 1 },
  input: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 10 },
  durationSummary: { minWidth: 104, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  durationSummaryLabel: { color: colors.muted, fontSize: 9, fontWeight: "900" },
  durationSummaryValue: { color: colors.ink, fontSize: 13, fontWeight: "900", marginTop: 3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  stepper: { alignSelf: "flex-end", flexDirection: "row", borderWidth: 1, borderColor: colors.line, borderRadius: 6, overflow: "hidden" },
  stepperText: { color: colors.ink, fontSize: 14, fontWeight: "800", paddingHorizontal: 14, paddingVertical: 7, borderRightWidth: 1, borderRightColor: colors.line },
  noteBox: { height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, padding: 9 },
  noteInput: { flex: 1, color: colors.ink, fontSize: 12, padding: 0, textAlignVertical: "top" },
  counter: { alignSelf: "flex-end", color: colors.muted, fontSize: 10, marginTop: 7 },
  formNotice: { color: colors.ink, fontSize: 12, lineHeight: 17, backgroundColor: "#182B45", borderWidth: 1, borderColor: colors.gold, borderRadius: 8, padding: 10, marginTop: 10 }
});
