import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View, Pressable } from "react-native";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  asha: "ASHA Worker",
};

export default function AuthChoiceScreen({ navigation, route }) {
  const role = route?.params?.role || "patient";
  const roleLabel = useMemo(() => ROLE_LABELS[role] || "User", [role]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Continue as {roleLabel}</Text>
        <Text style={styles.subtitle}>
          Choose how you want to access the app.
        </Text>

        <View style={styles.cardStack}>
          <Pressable
            style={[styles.card, styles.cardPrimary]}
            onPress={() =>
              navigation.navigate("AuthForm", { role, mode: "login" })
            }
          >
            <Text style={styles.cardTitle}>{roleLabel} Login</Text>
            <Text style={styles.cardText}>
              Already have an account? Sign in to continue.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.card, styles.cardSecondary]}
            onPress={() =>
              navigation.navigate("AuthForm", { role, mode: "register" })
            }
          >
            <Text style={styles.cardTitle}>{roleLabel} Register</Text>
            <Text style={styles.cardText}>
              Create a new account to get started.
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#6B7280",
  },
  cardStack: {
    marginTop: 24,
    gap: 16,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardPrimary: {
    backgroundColor: "#E7FAF8",
  },
  cardSecondary: {
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardText: {
    marginTop: 6,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});
