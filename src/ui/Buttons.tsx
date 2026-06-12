import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, interaction, radii, spacing, typeScale } from "./theme";

type ButtonTone = "navy" | "red" | "green";

export function PatchButton({
  label,
  tone,
  onPress
}: {
  label: string;
  tone: ButtonTone;
  onPress: () => void;
}) {
  const backgroundColor = tone === "navy" ? colors.navy : tone === "red" ? colors.red : colors.green;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.patchButton,
        { backgroundColor },
        pressed && styles.pressed
      ]}
    >
      <Text style={styles.patchButtonText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
    >
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  patchButton: {
    minHeight: interaction.minHitSize,
    borderWidth: 2,
    borderColor: colors.gold,
    borderStyle: "dashed",
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    marginTop: spacing.md
  },
  patchButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900"
  },
  outlineButton: {
    minHeight: interaction.minHitSize,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    marginTop: 9,
    backgroundColor: colors.paperLight
  },
  outlineButtonText: {
    color: colors.ink,
    fontSize: typeScale.button,
    fontWeight: "900"
  },
  pressed: {
    transform: [{ scale: interaction.pressedScale }]
  }
});
