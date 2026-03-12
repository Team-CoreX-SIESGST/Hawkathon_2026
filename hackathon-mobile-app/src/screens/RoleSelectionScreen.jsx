import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
} from "react-native";

const roles = [
  {
    key: "patient",
    title: "Patient",
    description: "Consult doctors remotely and manage your health records.",
    icon: require("../../assets/female-icon.png"),
    background: "#F3FBFA",
  },
  {
    key: "doctor",
    title: "Doctor",
    description: "Provide tele-consultations and help patients digitally.",
    icon: require("../../assets/male-doctor-icon.png"),
    background: "#F5FBFF",
  },
  {
    key: "asha",
    title: "ASHA Worker",
    description: "Support patients locally and coordinate health services.",
    icon: require("../../assets/male-icon.png"),
    background: "#FFF8EC",
  },
];

export default function RoleSelectionScreen({ navigation }) {
  const [selectedRole, setSelectedRole] = useState("patient");
  const currentSelection = useMemo(
    () => roles.find((role) => role.key === selectedRole),
    [selectedRole],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.appName}>ArogyaGram</Text>
        <Text style={styles.heading}>Choose your role</Text>

        <View style={styles.cardsBlock}>
          {roles.map((role) => {
            const isActive = role.key === selectedRole;
            return (
              <Pressable
                key={role.key}
                onPress={() => setSelectedRole(role.key)}
                style={[
                  styles.card,
                  isActive && styles.cardActive,
                  { backgroundColor: role.background },
                ]}
              >
                <View style={styles.avatarWrap}>
                  <Image
                    source={role.icon}
                    style={styles.avatar}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("AuthChoice", { role: currentSelection?.key })
          }
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  heading: {
    marginTop: 6,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  cardsBlock: {
    marginTop: 22,
    gap: 18,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  cardActive: {
    borderColor: "#5DC1B9",
    shadowColor: "#5DC1B9",
    shadowOpacity: 0.18,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 84,
    height: 84,
  },
  cardTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 24,
  },
  primaryButton: {
    backgroundColor: "#5DC1B9",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#5DC1B9",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
