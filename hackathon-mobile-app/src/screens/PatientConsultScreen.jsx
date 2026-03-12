import React, { useContext, useEffect, useMemo, useState } from "react";
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
  doctorNearby,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
} from "../services/api";

export default function PatientConsultScreen() {
  const { token, user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [problem, setProblem] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const coords = useMemo(() => user?.locationCoordinates, [user]);

  const loadDoctors = async () => {
    if (!coords?.latitude || !coords?.longitude) return;
    try {
      const data = await doctorNearby(coords.latitude, coords.longitude, 10);
      setDoctors(data.results || []);
    } catch (err) {
      setError(err.message || "Unable to load doctors");
    }
  };

  const loadAppointments = async () => {
    if (!token) return;
    try {
      const data = await getMyAppointments(token);
      setAppointments(data.results || []);
    } catch (err) {
      setError(err.message || "Unable to load appointments");
    }
  };

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, []);

  const handleBook = async () => {
    if (!selectedDoctor) {
      setError("Please select a doctor");
      return;
    }
    if (!problem || !preferredDate || !preferredTime) {
      setError("Problem, date, and time are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createAppointment(token, {
        doctorId: selectedDoctor._id,
        problem,
        symptoms,
        preferredDate,
        preferredTime,
      });
      setProblem("");
      setSymptoms("");
      setPreferredDate("");
      setPreferredTime("");
      setSelectedDoctor(null);
      await loadAppointments();
    } catch (err) {
      setError(err.message || "Unable to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelAppointment(token, id);
      await loadAppointments();
    } catch (err) {
      setError(err.message || "Unable to cancel appointment");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Consult</Text>
      <Text style={styles.subtitle}>
        Book an appointment with doctors near you.
      </Text>

      <Text style={styles.sectionTitle}>Nearby Doctors</Text>
      {doctors.length === 0 ? (
        <Text style={styles.helperText}>
          No doctors found nearby. Update your location.
        </Text>
      ) : (
        doctors.map((doctor) => (
          <Pressable
            key={doctor._id}
            style={[
              styles.doctorCard,
              selectedDoctor?._id === doctor._id && styles.doctorCardActive,
            ]}
            onPress={() => setSelectedDoctor(doctor)}
          >
            <View>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorMeta}>
                {doctor.hospitalName || "Nearby doctor"}
              </Text>
              <Text style={styles.doctorMeta}>
                {doctor.distanceKm} km away
              </Text>
            </View>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>Book Appointment</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your problem"
        value={problem}
        onChangeText={setProblem}
      />
      <TextInput
        style={styles.input}
        placeholder="Symptoms (optional)"
        value={symptoms}
        onChangeText={setSymptoms}
      />
      <TextInput
        style={styles.input}
        placeholder="Preferred date (YYYY-MM-DD)"
        value={preferredDate}
        onChangeText={setPreferredDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Preferred time (e.g. 10:30 AM)"
        value={preferredTime}
        onChangeText={setPreferredTime}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleBook}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Booking..." : "Book Appointment"}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>My Appointments</Text>
      {appointments.length === 0 ? (
        <Text style={styles.helperText}>No appointments yet.</Text>
      ) : (
        appointments.map((appt) => (
          <View key={appt._id} style={styles.appointmentCard}>
            <Text style={styles.appointmentTitle}>
              {appt.doctor?.name || "Doctor"}
            </Text>
            <Text style={styles.appointmentMeta}>
              {appt.preferredDate} · {appt.preferredTime}
            </Text>
            <Text style={styles.appointmentMeta}>
              Status: {appt.status}
            </Text>
            {appt.status === "BOOKED" ? (
              <Pressable
                style={styles.cancelButton}
                onPress={() => handleCancel(appt._id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
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
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    color: "#64748B",
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  doctorCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  doctorCardActive: {
    borderColor: "#5DC1B9",
    backgroundColor: "#E7FAF8",
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  doctorMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },
  input: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  primaryButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#5DC1B9",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  appointmentCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  appointmentTitle: {
    fontWeight: "700",
    color: "#0F172A",
  },
  appointmentMeta: {
    marginTop: 4,
    color: "#64748B",
  },
  cancelButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },
  cancelButtonText: {
    color: "#B91C1C",
    fontWeight: "700",
  },
  helperText: {
    marginTop: 8,
    color: "#64748B",
  },
  errorText: {
    marginTop: 10,
    color: "#DC2626",
  },
});
