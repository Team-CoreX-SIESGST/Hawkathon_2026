import React, { useContext, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { ashaMe, doctorMe, patientMe } from "../services/api";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  asha: "ASHA Worker",
};

export default function HomeScreen({ navigation }) {
  const { user, token, role, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshProfile = async () => {
    if (!token || !role) return;
    setLoading(true);
    setError("");
    try {
      const data =
        role === "patient"
          ? await patientMe(token)
          : role === "doctor"
          ? await doctorMe(token)
          : await ashaMe(token);
      setProfile(data);
    } catch (err) {
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigation.reset({ index: 0, routes: [{ name: "RoleSelection" }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        {ROLE_LABELS[role] || "User"} dashboard
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Snapshot</Text>
        <Text style={styles.cardText}>
          {profile?.name || "Name not set"}
        </Text>
        {profile?.abhaId ? (
          <Text style={styles.cardSubText}>ABHA ID: {profile.abhaId}</Text>
        ) : null}
        {profile?.username ? (
          <Text style={styles.cardSubText}>Username: {profile.username}</Text>
        ) : null}
        {profile?.hospitalName ? (
          <Text style={styles.cardSubText}>
            Hospital: {profile.hospitalName}
          </Text>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={refreshProfile}>
        <Text style={styles.primaryButtonText}>
          {loading ? "Refreshing..." : "Refresh Profile"}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleLogout}>
        <Text style={styles.secondaryButtonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
  },
  card: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    backgroundColor: "#F9FAFB",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  cardSubText: {
    marginTop: 6,
    fontSize: 13,
    color: "#4B5563",
  },
  errorText: {
    marginTop: 14,
    color: "#DC2626",
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#5DC1B9",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 15,
  },
});
