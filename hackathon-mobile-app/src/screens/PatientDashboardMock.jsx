import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  ScrollView,
} from "react-native";

const quickActions = [
  { title: "Talk to Doctor", icon: "TD" },
  { title: "Symptom Checker", icon: "SC" },
  { title: "Health Records", icon: "HR" },
  { title: "Find Medicine", icon: "FM" },
];

const doctors = [
  {
    name: "Dr. Sarah Miller",
    specialty: "Cardiologist",
    rating: "4.8 (120+)",
    avatar: require("../../assets/female-icon.png"),
  },
  {
    name: "Dr. John Doe",
    specialty: "Pediatrician",
    rating: "4.9 (90+)",
    avatar: require("../../assets/male-doctor-icon.png"),
  },
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSmall}>Good Morning,</Text>
            <Text style={styles.greeting}>Hello, Elsie</Text>
          </View>
          <View style={styles.avatarRing}>
            <Image
              source={require("../../assets/male-icon.png")}
              style={styles.headerAvatar}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <View key={item.title} style={styles.quickCard}>
              <View style={styles.quickIconCircle}>
                <Text style={styles.quickIconText}>{item.icon}</Text>
              </View>
              <Text style={styles.quickTitle}>{item.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Popular Doctors</Text>
          <Text style={styles.sectionLink}>See All</Text>
        </View>
        <View style={styles.doctorRow}>
          {doctors.map((doctor) => (
            <View key={doctor.name} style={styles.doctorCard}>
              <View style={styles.doctorAvatarWrap}>
                <Image source={doctor.avatar} style={styles.doctorAvatar} />
              </View>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorMeta}>{doctor.specialty}</Text>
              <Text style={styles.doctorRating}>* {doctor.rating}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Nearby Pharmacy</Text>
          <Text style={styles.sectionLink}>View Map</Text>
        </View>
        <View style={styles.pharmacyList}>
          {pharmacies.map((pharmacy) => (
            <View key={pharmacy.name} style={styles.pharmacyCard}>
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
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {["Home", "Consult", "Records", "Pharmacy", "Profile"].map(
          (label, index) => (
            <View key={label} style={styles.navItem}>
              <View
                style={[styles.navDot, index === 0 && styles.navDotActive]}
              />
              <Text
                style={[styles.navLabel, index === 0 && styles.navLabelActive]}
              >
                {label}
              </Text>
            </View>
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
