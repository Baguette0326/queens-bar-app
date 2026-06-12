import React from "react";
import { Check, Crown } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { AvatarId } from "../data/catalog";
import { AvatarIcon } from "../ui/AvatarIcon";
import { colors } from "../ui/theme";

type Props = {
  username: string;
  role: string;
  avatar: AvatarId;
  avatarOptions: Array<{ id: AvatarId; label: string }>;
  authStatus: "checking" | "ready" | "sending" | "saving";
  onUsernameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onAvatarChange: (value: AvatarId) => void;
  onSave: () => void;
  renderButton: (label: string, tone: "navy" | "red" | "green", onPress: () => void) => React.ReactNode;
};

export function OnboardingScreen(props: Props) {
  return (
    <ScrollView contentContainerStyle={styles.onboarding}>
      <BrandMark />
      <Text style={styles.welcomePill}>WELCOME TO</Text>
      <Text style={styles.heroTitle}>RITUAL</Text>
      <Text style={styles.heroSubtitle}>Let's build your jacket.</Text>
      <FieldLabel text="USERNAME" />
      <View style={styles.inputShell}>
        <TextInput value={props.username} onChangeText={props.onUsernameChange} style={styles.input} autoCapitalize="none" />
        <Check color={colors.green} size={18} />
      </View>
      <FieldLabel text="ROLE" />
      <View style={styles.segmentRow}>
        {["Frosh", "Frec", "Upper Year", "Other"].map((item) => (
          <Pressable key={item} onPress={() => props.onRoleChange(item)} style={[styles.segment, props.role === item && styles.segmentActive]}>
            <Text style={[styles.segmentText, props.role === item && styles.segmentTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <FieldLabel text="PICK YOUR PATCH (AVATAR)" />
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
      <View style={styles.guidelineRow}>
        <View style={styles.checkbox} />
        <Text style={styles.guidelineText}>I agree to the Ritual Guidelines</Text>
      </View>
      {props.renderButton(props.authStatus === "saving" ? "SAVING..." : "LET'S GO!", "navy", props.onSave)}
      <Text style={styles.handNote}>Build Good.{"\n"}Have Fun.</Text>
    </ScrollView>
  );
}

function BrandMark() {
  return (
    <View style={styles.brandMark}>
      <Crown color={colors.gold} size={20} fill={colors.gold} />
      <Text style={styles.brandMarkText}>R</Text>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  onboarding: { padding: 24, paddingBottom: 44, minHeight: "100%" },
  brandMark: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.navy, marginBottom: 8 },
  brandMarkText: { color: colors.cream, fontWeight: "900", fontSize: 17 },
  welcomePill: { alignSelf: "center", color: colors.muted, fontSize: 11, fontWeight: "800", borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  heroTitle: { textAlign: "center", color: colors.ink, fontSize: 30, fontWeight: "900", marginTop: 4 },
  heroSubtitle: { textAlign: "center", color: colors.ink, fontSize: 14, marginBottom: 20 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  inputShell: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, paddingHorizontal: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
  segmentRow: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperLight },
  segmentActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  segmentText: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  segmentTextActive: { color: colors.cream },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avatarOption: { width: 58, height: 58, alignItems: "center", justifyContent: "center", backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 7 },
  avatarOptionActive: { backgroundColor: colors.navy, borderColor: colors.gold, borderWidth: 2 },
  guidelineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 4 },
  checkbox: { width: 14, height: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: colors.paperLight },
  guidelineText: { color: colors.muted, fontSize: 11 },
  handNote: { alignSelf: "flex-end", color: colors.ink, fontSize: 13, fontStyle: "italic", textAlign: "right", marginTop: 12 }
});
