import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ashaMe } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const fallbackProfile = {
  name: "Meera Kumari",
  username: "asha.meera",
  registrations: 128,
  assisted: 54,
  locationCoordinates: { latitude: 30.3719, longitude: 76.1528 },
};

export default function AbhaSevakProfile() {
  const { token, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(fallbackProfile);
  const [cityLabel, setCityLabel] = useState("Nabha, Punjab");
  const [loading, setLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);

  const mergedProfile = useMemo(() => {
    if (!user) return profile;
    return {
      ...profile,
      name: user.name || profile.name,
      username: user.username || profile.username,
      registrations: user.registrations || profile.registrations,
      assisted: user.assisted || profile.assisted,
      locationCoordinates: user.locationCoordinates || profile.locationCoordinates,
    };
  }, [profile, user]);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await ashaMe(token);
        if (!isMounted || !data) return;
        setProfile((prev) => ({
          ...prev,
          name: data.name || prev.name,
          username: data.username || prev.username,
          registrations: data.registrations || prev.registrations,
          assisted: data.assisted || prev.assisted,
          locationCoordinates: data.locationCoordinates || prev.locationCoordinates,
        }));
      } catch (err) {
        // keep fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    const coords = mergedProfile.locationCoordinates;
    if (!coords?.latitude || !coords?.longitude || !GOOGLE_PLACES_API_KEY) {
      return;
    }

    let isActive = true;
    const fetchCity = async () => {
      setCityLoading(true);
      try {
        const latlng = `${coords.latitude},${coords.longitude}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${GOOGLE_PLACES_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const result = data?.results?.[0];
        const cityComponent = result?.address_components?.find((c) =>
          c.types.includes("locality")
        );
        const stateComponent = result?.address_components?.find((c) =>
          c.types.includes("administrative_area_level_1")
        );
        const city = cityComponent?.long_name || result?.formatted_address;
        const state = stateComponent?.short_name || "";
        if (isActive && city) {
          setCityLabel(state ? `${city}, ${state}` : city);
        }
      } catch (err) {
        // ignore errors
      } finally {
        if (isActive) setCityLoading(false);
      }
    };

    fetchCity();
    return () => {
      isActive = false;
    };
  }, [mergedProfile.locationCoordinates]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={require("../../assets/abhaa-icon.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.name}>{mergedProfile.name}</Text>
          <Text style={styles.username}>@{mergedProfile.username}</Text>
          <View style={styles.locationPill}>
            <Feather name="map-pin" size={14} color="#E8F6F4" />
            <Text style={styles.locationText}>
              {cityLoading ? "Fetching location..." : cityLabel}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Registrations</Text>
            <Text style={styles.statValue}>{mergedProfile.registrations}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Assisted</Text>
            <Text style={styles.statValue}>{mergedProfile.assisted}</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Edit Profile Information</Text>
        </Pressable>

        <Pressable style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#5DC1B9" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAFB",
  },
  container: {
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#5DC1B9",
    paddingTop: 44,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    alignItems: "center",
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  username: {
    marginTop: 4,
    fontSize: 14,
    color: "#E8F6F4",
  },
  locationPill: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  locationText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  statsRow: {
    marginTop: -28,
    paddingHorizontal: 24,
    flexDirection: "row",
    gap: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  primaryButton: {
    marginTop: 28,
    marginHorizontal: 24,
    backgroundColor: "#5DC1B9",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutButton: {
    marginTop: 16,
    marginHorizontal: 24,
    backgroundColor: "#FEECEC",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingOverlay: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
});
