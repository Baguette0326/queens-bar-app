import React from "react";
import { BookOpen, Map, MessageCircle, Plus, UserRound } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Screen } from "../app/types";
import { colors, interaction } from "./theme";

export function BottomTabs({ active, onChange }: { active: Screen; onChange: (screen: Screen) => void }) {
  const tabs: { screen: Screen; label: string; icon: React.ReactNode }[] = [
    { screen: "discover", label: "Discover", icon: <Map color={active === "discover" ? colors.ink : colors.muted} size={20} /> },
    { screen: "catalog", label: "Catalog", icon: <BookOpen color={active === "catalog" ? colors.ink : colors.muted} size={20} /> },
    { screen: "create", label: "", icon: <Plus color={colors.cream} size={26} /> },
    {
      screen: "chats",
      label: "Chat",
      icon: <MessageCircle color={active === "chat" || active === "chats" || active === "dmThread" ? colors.ink : colors.muted} size={20} />
    },
    { screen: "profile", label: "Profile", icon: <UserRound color={active === "profile" ? colors.ink : colors.muted} size={20} /> }
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.screen}
          onPress={() => onChange(tab.screen)}
          style={({ pressed }) => [
            tab.screen === "create" ? styles.createTab : styles.tab,
            pressed && styles.pressed
          ]}
        >
          {tab.icon}
          {!!tab.label && (
            <Text style={[styles.tabText, (active === tab.screen || (tab.screen === "chats" && (active === "chat" || active === "dmThread"))) && styles.tabTextActive]}>
              {tab.label}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabs: { position: "absolute", left: 0, right: 0, bottom: 0, height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: colors.paperLight, borderTopWidth: 1, borderTopColor: colors.line },
  tab: { width: 58, alignItems: "center", gap: 2 },
  tabText: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  tabTextActive: { color: colors.ink },
  createTab: { width: 48, height: 48, marginTop: -18, borderRadius: 24, backgroundColor: colors.gold, borderWidth: 2, borderColor: colors.ink, alignItems: "center", justifyContent: "center" },
  pressed: { transform: [{ scale: interaction.pressedScale }] }
});
