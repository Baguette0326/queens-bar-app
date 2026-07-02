import { Alert, Platform } from "react-native";

export function showMessage(title: string, message: string, webMessage = `${title}: ${message}`) {
  if (Platform.OS === "web") {
    window.alert(webMessage);
    return;
  }

  Alert.alert(title, message);
}

export function confirmAction({
  title,
  message,
  confirmText,
  cancelText,
  destructive,
  onConfirm,
  webMessage = message
}: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  destructive?: boolean;
  onConfirm: () => void;
  webMessage?: string;
}) {
  if (Platform.OS === "web") {
    if (window.confirm(webMessage)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: "cancel" },
    { text: confirmText, style: destructive ? "destructive" : "default", onPress: onConfirm }
  ]);
}
