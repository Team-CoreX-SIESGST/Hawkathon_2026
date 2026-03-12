import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { doctorNearby, patientMe } from "../services/api";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const quickActions = [
  { title: "Talk to Doctor", icon: "TD" },
  { title: "Symptom Checker", icon: "SC" },
  { title: "Health Records", icon: "HR" },
  { title: "Find Medicine", icon: "FM" },
  { title: "Call with Ai", icon: "AI" },
];

const bottomNavItems = [
  { label: "Home", icon: "home" },
  { label: "Consult", icon: "message-circle", route: "PatientConsult" },
  { label: "Records", icon: "file-text", route: "MedicineRecords" },
  { label: "Profile", icon: "user", route: "PatientProfile" },
];

export default function PatientDashboardMock() {
  const navigation = useNavigation();
  const { user, token, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const data = await patientMe(token);
        setProfile(data || null);
      } catch (error) {
        setProfile(null);
      }
    };
    loadProfile();
  }, [token]);

  const activeUser = profile || user;

  useEffect(() => {
    const loadDoctors = async () => {
      if (!activeUser?.locationCoordinates) return;
      try {
        const data = await doctorNearby(
          activeUser.locationCoordinates.latitude,
          activeUser.locationCoordinates.longitude,
          10
        );
        setDoctors(data.results || []);
      } catch (error) {
        setDoctors([]);
      }
    };
    loadDoctors();
  }, [activeUser]);

  const firstName =
    activeUser?.abha_profile?.firstName ||
    activeUser?.name ||
    activeUser?.fullName ||
    "Friend";

  const gender = activeUser?.abha_profile?.gender || activeUser?.gender || "M";
  const avatarSource =
    gender === "F"
      ? require("../../assets/female-icon.png")
      : require("../../assets/male-icon.png");

  const handleLogout = () => {
    setMenuOpen(false);
    signOut();
    navigation.reset({ index: 0, routes: [{ name: "RoleSelection" }] });
  };

  const handleOpenProfile = () => {
    setMenuOpen(false);
    navigation.navigate("PatientProfile");
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSmall}>Good Morning,</Text>
            <Text style={styles.greeting}>{`Hello, ${firstName}`}</Text>
          </View>
          <View style={styles.avatarMenuWrap}>
            <TouchableOpacity
              style={styles.avatarRing}
              activeOpacity={0.7}
              onPress={() => setMenuOpen((prev) => !prev)}
            >
              <Image
                source={avatarSource}
                style={styles.headerAvatar}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {menuOpen && (
              <View style={styles.avatarMenu}>
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={handleOpenProfile}
                >
                  <Text style={styles.menuText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemDanger]}
                  activeOpacity={0.7}
                  onPress={handleLogout}
                >
                  <Text style={[styles.menuText, styles.menuTextDanger]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
      </ScrollView>

      <View style={styles.bottomNav}>
        {bottomNavItems.map((item, index) => {
          const isActive = item.label === "Home";
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              onPress={() => {
                if (item.route) {
                  navigation.navigate(item.route);
                }
              }}
            >
              <Feather
                name={item.icon}
                size={22}
                color={isActive ? "#0F172A" : "#94A3B8"}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  avatarMenuWrap: {
    alignItems: "flex-end",
  },
  avatarMenu: {
    position: "absolute",
    top: 60,
    right: 0,
    width: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6F2F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  menuText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  menuTextDanger: {
    color: "#DC2626",
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
    left: 16,
    right: 16,
    bottom: 16,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  navIconCircleActive: {
    backgroundColor: "#E8F6F4",
  },
  navIconText: {
    fontSize: 18,
    color: "#6B7280",
  },
  navIconTextActive: {
    color: "#10B981",
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
