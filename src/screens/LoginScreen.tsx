import React from "react";
import { Crown } from "lucide-react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../ui/theme";

type Props = {
  email: string;
  authStatus: "checking" | "ready" | "sending" | "saving";
  authMessage: string;
  onEmailChange: (value: string) => void;
  onSendLink: () => void;
  renderButton: (label: string, tone: "navy" | "red" | "green", onPress: () => void) => React.ReactNode;
};

export function LoginScreen(props: Props) {
  return (
    <View style={styles.loginScreen}>
      <BrandMark />
      <Text style={styles.welcomePill}>WELCOME TO</Text>
      <Text style={styles.heroTitle}>RITUAL</Text>
      <Text style={styles.heroSubtitle}>Find the group. Do the bar. Build the jacket.</Text>
      <Text style={styles.fieldLabel}>EMAIL</Text>
      <View style={styles.inputShell}>
        <TextInput
          value={props.email}
          onChangeText={props.onEmailChange}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
        />
      </View>
      {props.renderButton(props.authStatus === "sending" ? "SENDING..." : "SEND LOGIN LINK", "navy", props.onSendLink)}
      {!!props.authMessage && <Text style={styles.authMessage}>{props.authMessage}</Text>}
      {props.authStatus === "checking" && <Text style={styles.authMessage}>Checking login...</Text>}
    </View>
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

const styles = StyleSheet.create({
  loginScreen: { flex: 1, justifyContent: "center", padding: 24 },
  brandMark: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.navy, marginBottom: 8 },
  brandMarkText: { color: colors.cream, fontWeight: "900", fontSize: 17 },
  welcomePill: { alignSelf: "center", color: colors.muted, fontSize: 11, fontWeight: "800", borderWidth: 1, borderColor: colors.line, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  heroTitle: { textAlign: "center", color: colors.ink, fontSize: 30, fontWeight: "900", marginTop: 4 },
  heroSubtitle: { textAlign: "center", color: colors.ink, fontSize: 14, marginBottom: 20 },
  fieldLabel: { color: colors.ink, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 5 },
  inputShell: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paperLight, paddingHorizontal: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 },
  authMessage: { color: colors.ink, fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 12, textAlign: "center" }
});
