import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const API_BASE = (
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://hawkathon-2026-five.vercel.app"
).replace(/\/+$/, "");

export default function MedicineRecordsScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/sheets/medicine`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load records");
      }

      setData(json.records || []);
    } catch (err) {
      setError(err.message || "Failed to load medicine records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

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
    const name =
      item["medicine name"] || item["name"] || "Unknown Medicine";
    const genericName = item["generic name"] || "—";
    const stock = item["current stock"] || "0";
    const price = item["sell price (₹)"] || item["sell price"] || "N/A";
    const category = item["category"] || "General";
    const location = item["location"] || item["rack location"] || "";
    const rawStatus = item["stock status"] || "";
    const isOutOfStock =
      rawStatus.toLowerCase().includes("out") || parseInt(stock) <= 0;
    const statusLabel = isOutOfStock ? "Out of Stock" : "Available";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.medicineName}>{name}</Text>
            <Text style={styles.genericName}>{genericName}</Text>
          </View>
          <View
            style={[styles.statusBadge, isOutOfStock && styles.statusBadgeOut]}
          >
            <Text
              style={[styles.statusText, isOutOfStock && styles.statusTextOut]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Stock</Text>
            <Text style={styles.detailValue}>{stock}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{price}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {category}
            </Text>
          </View>
        </View>

        {location ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="#64748B" />
            <Text style={styles.locationText}>Loc: {location}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Medicine Records</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color="#94A3B8"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, category, rack..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Feather name="x" size={18} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5DC1B9" />
          <Text style={styles.loadingText}>Loading medicine records...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather
            name="alert-circle"
            size={48}
            color="#EF4444"
            style={{ marginBottom: 16 }}
          />
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
              {filteredData.length} record
              {filteredData.length !== 1 ? "s" : ""}
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
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  clearButton: {
    padding: 4,
  },
  countLabel: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 12,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  nameContainer: {
    flex: 1,
    paddingRight: 12,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  genericName: {
    fontSize: 13,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#D1FAE5",
  },
  statusBadgeOut: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  statusTextOut: {
    color: "#DC2626",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#64748B",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#64748B",
  },
  errorText: {
    fontSize: 15,
    color: "#334155",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#5DC1B9",
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
  },
});
