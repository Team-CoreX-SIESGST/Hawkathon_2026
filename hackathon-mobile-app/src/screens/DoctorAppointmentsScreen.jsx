import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import {
  doctorAppointments,
  doctorUpdateAppointmentStatus,
  doctorStartCall,
  doctorAddSummary,
} from "../services/api";
import { getCalendlyLink } from "../services/callLinks";

export default function DoctorAppointmentsScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [transcripts, setTranscripts] = useState({});
  const [notes, setNotes] = useState({});

  const load = async () => {
    try {
      const data = await doctorAppointments(token);
      setAppointments(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to load appointments");
    }
  };

  const isAppointmentTime = () => true;

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await doctorUpdateAppointmentStatus(token, id, status);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update status");
    }
  };

  const startCall = async (appointment, callType) => {
    try {
      const result = await doctorStartCall(token, appointment._id, callType);
      const url =
        result?.videoLink || getCalendlyLink(callType || appointment?.appointmentType);
      navigation.navigate("CallScreen", {
        url,
        title: callType === "AUDIO_CALL" ? "Schedule Audio Call" : "Schedule Video Call",
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to start call");
    }
  };

  const saveSummary = async (appointment) => {
    try {
      await doctorAddSummary(token, appointment._id, {
        transcript: transcripts[appointment._id] || "",
        notes: notes[appointment._id] || "",
      });
      await updateStatus(appointment._id, "COMPLETED");
    } catch (err) {
      setError(err.message || "Unable to save summary");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Appointments</Text>
      <Text style={styles.subtitle}>
        Urgency score is visible only to doctors.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {appointments.map((appt) => (
        <View key={appt._id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {appt.patient.abha_profile.name || "Patient"}
          </Text>
          <Text style={styles.cardMeta}>
            {appt.preferredDate} - {appt.preferredTime}
          </Text>
          <Text style={styles.cardMeta}>
            Type: {appt.appointmentType}
          </Text>
          <Text style={styles.cardMeta}>Status: {appt.status}</Text>
          <Text style={styles.cardMeta}>
            Urgency: {appt.urgencyScore}/100
          </Text>
          {appt.aiSummary ? (
            <Text style={styles.cardMeta}>AI: {appt.aiSummary}</Text>
          ) : null}
          {appt.structuredQuery ? (
            <Text style={styles.cardMeta}>
              Structured: {appt.structuredQuery}
            </Text>
          ) : null}
          {appt.conversationSummary ? (
            <Text style={styles.cardMeta}>
              Summary: {appt.conversationSummary}
            </Text>
          ) : null}
          {appt.conversationInsights ? (
            <Text style={styles.cardMeta}>
              Insights: {appt.conversationInsights}
            </Text>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => updateStatus(appt._id, "BOOKED")}
            >
              <Text style={styles.actionText}>Mark Booked</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => updateStatus(appt._id, "CANCELLED")}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
          </View>

          {appt.status !== "CANCELLED" &&
          appt.status !== "COMPLETED" &&
          isAppointmentTime(appt.preferredDate) ? (
            <View style={styles.callRow}>
              <Pressable
                style={styles.callButton}
                onPress={() => startCall(appt, "VIDEO_CALL")}
              >
                <Text style={styles.callButtonText}>Schedule Video Call</Text>
              </Pressable>
              <Pressable
                style={styles.callButtonAlt}
                onPress={() => startCall(appt, "AUDIO_CALL")}
              >
                <Text style={styles.callButtonAltText}>Schedule Audio Call</Text>
              </Pressable>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Conversation transcript"
            value={transcripts[appt._id] || ""}
            onChangeText={(val) =>
              setTranscripts((prev) => ({ ...prev, [appt._id]: val }))
            }
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Doctor notes"
            value={notes[appt._id] || ""}
            onChangeText={(val) =>
              setNotes((prev) => ({ ...prev, [appt._id]: val }))
            }
            multiline
          />

          <Pressable
            style={styles.summaryButton}
            onPress={() => saveSummary(appt)}
          >
            <Text style={styles.summaryButtonText}>Generate Summary</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    color: "#64748B",
  },
  errorText: {
    marginTop: 10,
    color: "#DC2626",
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    fontWeight: "700",
    color: "#0F172A",
  },
  cardMeta: {
    marginTop: 4,
    color: "#64748B",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#E7FAF8",
    alignItems: "center",
  },
  actionText: {
    color: "#0F172A",
    fontWeight: "600",
  },
  callButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#0F172A",
    alignItems: "center",
  },
  callButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  callRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  callButtonAlt: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
  },
  callButtonAltText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    minHeight: 60,
    backgroundColor: "#F9FAFB",
  },
  summaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#5DC1B9",
    alignItems: "center",
  },
  summaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
