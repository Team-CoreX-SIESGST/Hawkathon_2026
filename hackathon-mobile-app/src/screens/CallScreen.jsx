import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export default function CallScreen({ route }) {
  const url = route?.params?.url || "https://meet.jit.si/";
  const title = route?.params?.title || "Call";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{title}</Text>
      </View>
      <WebView source={{ uri: url }} style={styles.webview} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    padding: 12,
    backgroundColor: "#0F172A",
  },
  headerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
  },
  webview: {
    flex: 1,
  },
});
