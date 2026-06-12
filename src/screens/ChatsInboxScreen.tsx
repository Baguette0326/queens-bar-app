import React from "react";
import { Crown } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Plan } from "../app/types";
import type { Challenge } from "../data/catalog";
import type { RemoteDmThread } from "../data/dmRepository";
import { dataStatusLabel, type DataStatus } from "../ui/statusLabels";
import { colors } from "../ui/theme";

type Props = {
  joinedPlans: Plan[];
  dmThreads: RemoteDmThread[];
  catalog: Challenge[];
  plansStatus: DataStatus;
  onOpenChat: (planId: string) => void;
  onOpenDm: (threadId: string) => void;
  renderPlan: (plan: Plan, catalog: Challenge[], onPress: () => void) => React.ReactNode;
  renderDmThread: (thread: RemoteDmThread, onPress: () => void) => React.ReactNode;
};

export function ChatsInboxScreen(props: Props) {
  return (
    <View style={styles.flex}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}><Crown color={colors.gold} size={23} fill={colors.gold} /></View>
        <View pointerEvents="none" style={styles.appHeaderTitleWrap}><Text style={styles.appHeaderTitle}>CHATS</Text></View>
        <View style={styles.headerRight}>
          <Text style={styles.countBadge}>{props.joinedPlans.length + props.dmThreads.length}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <SectionHeader title="YOUR GROUP CHATS" action={dataStatusLabel(props.plansStatus)} />
        {props.joinedPlans.length === 0 && <Text style={styles.emptyState}>Join a plan to start seeing its group chat here.</Text>}
        {props.joinedPlans.map((plan) => (
          <React.Fragment key={plan.id}>
            {props.renderPlan(plan, props.catalog, () => props.onOpenChat(plan.id))}
          </React.Fragment>
        ))}
        <SectionHeader title="DIRECT MESSAGES" action={props.dmThreads.length ? `${props.dmThreads.length}` : undefined} />
        {props.dmThreads.length === 0 && <Text style={styles.emptyState}>Open someone's profile and tap MESSAGE to start a DM.</Text>}
        {props.dmThreads.map((thread) => (
          <React.Fragment key={thread.id}>
            {props.renderDmThread(thread, () => props.onOpenDm(thread.id))}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && <Text style={styles.sectionAction}>{action}</Text>}
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
  countBadge: { color: colors.ink, fontSize: 12, fontWeight: "900", borderWidth: 1, borderColor: colors.ink, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, fontVariant: ["tabular-nums"] },
  screenContent: { padding: 14, paddingBottom: 90 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
