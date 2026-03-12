import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { doctorAppointments } from "../services/api";

export default function DoctorPastPatientsScreen() {
  const { token } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);

  const load = async () => {
    if (!token) return;
    const data = await doctorAppointments(token);
    const completed = (data.results || []).filter(
      (appt) => appt.status === "COMPLETED"
    );
    setAppointments(completed);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Past Patients</Text>
      {appointments.length === 0 ? (
        <Text style={styles.helper}>No past patients yet.</Text>
      ) : (
        appointments.map((appt) => (
          <View key={appt._id} style={styles.card}>
            <Text style={styles.name}>
              {appt.patient?.abha_profile?.name || "Patient"}
            </Text>
            <Text style={styles.meta}>
              {appt.preferredDate} · {appt.preferredTime}
            </Text>
            {appt.conversationSummary ? (
              <Text style={styles.meta}>Summary: {appt.conversationSummary}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  helper: {
    marginTop: 10,
    color: "#64748B",
  },
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  name: {
    fontWeight: "700",
    color: "#0F172A",
  },
  meta: {
    marginTop: 4,
    color: "#64748B",
  },
});
