import React from "react";
import { Filter, Search } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { FriendRequest } from "../data/friendRepository";
import type { Profile } from "../data/profileRepository";
import { colors } from "../ui/theme";

type Props = {
  incomingRequests: FriendRequest[];
  friends: Profile[];
  query: string;
  results: Profile[];
  status: "idle" | "loading" | "error";
  friendActionSaving: boolean;
  onQueryChange: (value: string) => void;
  onOpenProfile: (profile: Profile) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  renderPerson: (profile: Profile, onPress: () => void) => React.ReactNode;
  renderRequest: (
    request: FriendRequest,
    onProfile: () => void,
    onAccept: () => void,
    onDecline: () => void,
    disabled: boolean
  ) => React.ReactNode;
};

export function PeopleScreen(props: Props) {
  return (
    <>
      {props.incomingRequests.length > 0 && (
        <>
          <SectionHeader title="FRIEND REQUESTS" action={`${props.incomingRequests.length}`} />
          {props.incomingRequests.map((request) => request.requester && (
            <React.Fragment key={request.id}>
              {props.renderRequest(
                request,
                () => request.requester && props.onOpenProfile(request.requester),
                () => props.onAcceptRequest(request.id),
                () => props.onDeclineRequest(request.id),
                props.friendActionSaving
              )}
            </React.Fragment>
          ))}
        </>
      )}

      {props.friends.length > 0 && (
        <>
          <SectionHeader title="FRIENDS" action={`${props.friends.length}`} />
          {props.friends.map((profile) => (
            <React.Fragment key={profile.id}>
              {props.renderPerson(profile, () => props.onOpenProfile(profile))}
            </React.Fragment>
          ))}
        </>
      )}

      <SectionHeader title="FIND PEOPLE" action={props.status === "loading" ? "Loading" : undefined} />
      <View style={styles.searchBar}>
        <Search color={colors.ink} size={18} />
        <TextInput
          value={props.query}
          onChangeText={props.onQueryChange}
          placeholder="Search display names..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        <Filter color={colors.ink} size={18} />
      </View>
      {props.status === "loading" && <Text style={styles.emptyState}>Searching profiles...</Text>}
      {props.status === "error" && <Text style={styles.emptyState}>Could not load profiles. Check Supabase policies and try again.</Text>}
      {props.status !== "loading" && props.results.length === 0 && (
        <Text style={styles.emptyState}>{props.query.trim() ? "No matching profiles yet." : "No other profiles found yet."}</Text>
      )}
      {props.results.map((profile) => (
        <React.Fragment key={profile.id}>
          {props.renderPerson(profile, () => props.onOpenProfile(profile))}
        </React.Fragment>
      ))}
    </>
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
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  sectionAction: { color: "#7DB7F0", fontSize: 11, fontWeight: "800" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13, paddingVertical: 10 },
  emptyState: { color: colors.muted, fontSize: 13, lineHeight: 19, backgroundColor: colors.paperLight, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 12, marginBottom: 8 }
});
