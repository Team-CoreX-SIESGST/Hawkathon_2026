import React, { useEffect, useState, useMemo, useContext, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

const API_BASE = (
  process.env.EXPO_PUBLIC_LOCAL_SERVER_URL || "http://10.0.16.63:5002"
).replace(/\/+$/, "");

export default function MedicineRecordsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasDistance, setHasDistance] = useState(false);

  // Get user coordinates
  const userCoords = user?.locationCoordinates
    ? { lat: user.locationCoordinates.latitude, lng: user.locationCoordinates.longitude }
    : null;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let url = `${API_BASE}/api/sheets/medicine`;
      if (userCoords) {
        url += `?lat=${userCoords.lat}&lng=${userCoords.lng}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load records");

      setData(json.records || []);
      // Check if backend returned distance info
      setHasDistance(userCoords && json.records?.some((r) => r._distance));
    } catch (err) {
      setError(err.message || "Failed to load medicine records.");
    } finally {
      setLoading(false);
    }
  }, [userCoords?.lat, userCoords?.lng]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(query)
      )
    );
  }, [data, searchQuery]);

  const renderItem = ({ item }) => {
    const name = item["medicine name"] || item["name"] || "Unknown Medicine";
    const genericName = item["generic name"] || "—";
    const stock = item["current stock"] || "0";
    const price = item["sell price (₹)"] || item["sell price"] || "N/A";
    const category = item["category"] || "General";
    const rackLocation = item["location / rack"] || item["rack location"] || "";
    const locationName = (item["location"] || "").trim();
    const rawStatus = item["stock status"] || "";
    const isOutOfStock =
      rawStatus.toLowerCase().includes("out") || parseInt(stock) <= 0;

    // Distance info from backend
    const distance = item._distance || null;
    const duration = item._duration || null;

    return (
      <View style={[styles.card, isOutOfStock && styles.cardDimmed]}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.medicineName}>{name}</Text>
            <Text style={styles.genericName}>{genericName}</Text>
          </View>
          <View style={styles.badgesColumn}>
            <View style={[styles.statusBadge, isOutOfStock && styles.statusBadgeOut]}>
              <Text style={[styles.statusText, isOutOfStock && styles.statusTextOut]}>
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </Text>
            </View>
            {distance ? (
              <View style={styles.distanceBadge}>
                <Feather name="navigation" size={10} color="#0d9488" />
                <Text style={styles.distanceText}> {distance}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Key stats */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Stock</Text>
            <Text style={[styles.detailValue, isOutOfStock && { color: "#DC2626" }]}>{stock}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{price}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{category}</Text>
          </View>
        </View>

        {/* Location footer */}
        <View style={styles.locationFooter}>
          {rackLocation ? (
            <View style={styles.locationChip}>
              <Feather name="box" size={11} color="#475569" />
              <Text style={styles.locationChipText}>{rackLocation}</Text>
            </View>
          ) : null}
          {locationName ? (
            <View style={[styles.locationChip, styles.locationChipPlace]}>
              <Feather name="map-pin" size={11} color="#0d9488" />
              <Text style={[styles.locationChipText, { color: "#0d9488" }]} numberOfLines={1}>
                {locationName}
              </Text>
            </View>
          ) : null}
          {duration ? (
            <View style={styles.locationChip}>
              <Feather name="clock" size={11} color="#475569" />
              <Text style={styles.locationChipText}>{duration} away</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0F172A" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Medicine Records</Text>
          {hasDistance ? (
            <Text style={styles.headerSub}>Sorted by distance from you</Text>
          ) : null}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Distance banner */}
      {hasDistance ? (
        <View style={styles.distanceBanner}>
          <Feather name="navigation" size={14} color="#0d9488" />
          <Text style={styles.distanceBannerText}>
            Showing nearest locations first with live ETAs
          </Text>
        </View>
      ) : null}

      {!userCoords ? (
        <View style={styles.noLocationBanner}>
          <Feather name="alert-circle" size={13} color="#d97706" />
          <Text style={styles.noLocationText}>
            Enable location on your profile to see nearest pharmacies
          </Text>
        </View>
      ) : null}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, category, rack..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Feather name="x" size={18} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5DC1B9" />
          <Text style={styles.loadingText}>Loading medicine records...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) =>
            `${item["medicine id"] || item["medicine name"]}-${index}`
          }
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListHeaderComponent={
            <Text style={styles.countLabel}>
              {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No medicines match your search.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", textAlign: "center" },
  headerSub: { fontSize: 11, color: "#0d9488", textAlign: "center", marginTop: 1 },
  distanceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccfbf1",
  },
  distanceBannerText: { fontSize: 12, color: "#0d9488", fontWeight: "600" },
  noLocationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  noLocationText: { fontSize: 12, color: "#92400e", flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#0F172A" },
  clearButton: { padding: 4 },
  countLabel: { fontSize: 13, color: "#94A3B8", marginBottom: 12, fontWeight: "500" },
  listContent: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardDimmed: { opacity: 0.75 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  nameContainer: { flex: 1, paddingRight: 12 },
  medicineName: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  genericName: { fontSize: 13, color: "#64748B" },
  badgesColumn: { alignItems: "flex-end", gap: 6 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
  },
  statusBadgeOut: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#059669" },
  statusTextOut: { color: "#DC2626" },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  distanceText: { fontSize: 11, fontWeight: "700", color: "#0d9488" },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: "#94A3B8", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.3 },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#334155" },
  locationFooter: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: "65%",
  },
  locationChipPlace: { backgroundColor: "#f0fdfa" },
  locationChipText: { fontSize: 12, color: "#475569", fontWeight: "500" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  loadingText: { marginTop: 16, fontSize: 15, color: "#64748B" },
  errorText: { fontSize: 15, color: "#334155", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#5DC1B9", borderRadius: 12 },
  retryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  emptyContainer: { padding: 48, alignItems: "center" },
  emptyText: { marginTop: 16, fontSize: 15, color: "#94A3B8", textAlign: "center" },
});
