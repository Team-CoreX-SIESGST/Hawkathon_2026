import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { doctorNearby } from "../services/api";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

const quickActions = [
  { title: "Talk to Doctor", icon: "TD" },
  { title: "Symptom Checker", icon: "SC" },
  { title: "Health Records", icon: "HR" },
  { title: "Find Medicine", icon: "FM" },
  { title: "Call with Ai", icon: "AI" },
  { title: "Medicine Availability", icon: "MA" },
];

const pharmacies = [
  {
    name: "HealthFirst Medico",
    meta: "0.8 km · Open 24/7",
    badge: "HF",
    tint: "#E7F1FF",
  },
  {
    name: "CureAll Pharmacy",
    meta: "1.2 km · Closing at 10 PM",
    badge: "CA",
    tint: "#E9F7EE",
  },
];

export default function PatientDashboardMock() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.locationCoordinates) return;
      try {
        const data = await doctorNearby(
          user.locationCoordinates.latitude,
          user.locationCoordinates.longitude,
          10
        );
        setDoctors(data.results || []);
      } catch (error) {
        setDoctors([]);
      }
    };
    load();
  }, [user]);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSmall}>Good Morning,</Text>
            <Text style={styles.greeting}>Hello, Elsie</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarRing}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Profile", "Profile avatar tapped")}
          >
            <Image
              source={require("../../assets/male-icon.png")}
              style={styles.headerAvatar}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.quickCard}
              activeOpacity={0.8}
              onPress={() => {
                if (item.title === "Talk to Doctor") {
                  navigation.navigate("Chat");
                  return;
                }
                if (item.title === "Medicine Availability") {
                  navigation.navigate("MedicineAvailability");
                  return;
                }
                Alert.alert("Quick Action", `${item.title} tapped`);
              }}
            >
              <View style={styles.quickIconCircle}>
                <Text style={styles.quickIconText}>{item.icon}</Text>
              </View>
              <Text style={styles.quickTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Popular Doctors</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Alert.alert("Doctors", "See all doctors tapped")}
          >
            <Text style={styles.sectionLink}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.doctorRow}>
          {doctors.map((doctor) => (
            <TouchableOpacity
              key={doctor._id}
              style={styles.doctorCard}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert("Doctor", `${doctor.name} card tapped`)
              }
            >
              <View style={styles.doctorAvatarWrap}>
                <Image
                  source={require("../../assets/male-doctor-icon.png")}
                  style={styles.doctorAvatar}
                />
              </View>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorMeta}>
                {doctor.hospitalName || "Nearby Doctor"}
              </Text>
              <Text style={styles.doctorRating}>
                {doctor.distanceKm} km away
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Nearby Pharmacy</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Alert.alert("Pharmacy", "View map tapped")}
          >
            <Text style={styles.sectionLink}>View Map</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pharmacyList}>
          {pharmacies.map((pharmacy) => (
            <TouchableOpacity
              key={pharmacy.name}
              style={styles.pharmacyCard}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert("Pharmacy", `${pharmacy.name} card tapped`)
              }
            >
              <View
                style={[
                  styles.pharmacyBadge,
                  { backgroundColor: pharmacy.tint },
                ]}
              >
                <Text style={styles.pharmacyBadgeText}>{pharmacy.badge}</Text>
              </View>
              <View style={styles.pharmacyInfo}>
                <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                <Text style={styles.pharmacyMeta}>{pharmacy.meta}</Text>
              </View>
              <View style={styles.pharmacyArrow}>
                <Text style={styles.pharmacyArrowText}>{">"}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {["Home", "Consult", "Records", "Pharmacy", "Profile"].map(
          (label, index) => (
            <TouchableOpacity
              key={label}
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() =>
                label === "Consult"
                  ? navigation.navigate("PatientConsult")
                  : Alert.alert("Navigation", `${label} tab tapped`)
              }
            >
              <View
                style={[styles.navDot, index === 0 && styles.navDotActive]}
              />
              <Text
                style={[styles.navLabel, index === 0 && styles.navLabelActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFB",
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  greetingSmall: {
    fontSize: 15,
    color: "#7A8798",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#5DC1B9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerAvatar: {
    width: 34,
    height: 34,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 18,
    marginBottom: 12,
  },
  sectionRow: {
    marginTop: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLink: {
    fontSize: 14,
    color: "#5DC1B9",
    fontWeight: "600",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  quickIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5DC1B9",
  },
  quickTitle: {
    marginTop: 12,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "center",
  },
  doctorRow: {
    flexDirection: "row",
    gap: 14,
  },
  doctorCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  doctorAvatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#F3F5F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  doctorMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  doctorRating: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
  pharmacyList: {
    gap: 14,
  },
  pharmacyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  pharmacyBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  pharmacyBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B5563",
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  pharmacyMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  pharmacyArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  pharmacyArrowText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5DC1B9",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF1F4",
  },
  navItem: {
    alignItems: "center",
    gap: 6,
  },
  navDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
  },
  navDotActive: {
    backgroundColor: "#5DC1B9",
  },
  navLabel: {
    fontSize: 12,
    color: "#9AA3AF",
  },
  navLabelActive: {
    color: "#5DC1B9",
    fontWeight: "700",
  },
});
