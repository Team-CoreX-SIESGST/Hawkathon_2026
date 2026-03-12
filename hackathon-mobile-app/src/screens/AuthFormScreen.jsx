import React, { useContext, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import {
  patientLogin,
  patientRegister,
  doctorLogin,
  doctorRegister,
  ashaLogin,
  ashaRegister,
} from "../services/api";
import { AuthContext } from "../context/AuthContext";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  asha: "ASHA Worker",
};

const initialState = {
  name: "",
  abhaId: "",
  phoneNumber: "",
  username: "",
  password: "",
  hospitalName: "",
  city: "",
  latitude: "",
  longitude: "",
};

export default function AuthFormScreen({ navigation, route }) {
  const role = route?.params?.role || "patient";
  const mode = route?.params?.mode || "login";
  const isLogin = mode === "login";
  const roleLabel = useMemo(() => ROLE_LABELS[role] || "User", [role]);
  const { signIn } = useContext(AuthContext);

  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseLocation = () => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    return { latitude, longitude };
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!isLogin) {
        const locationCoordinates = parseLocation();
        if (!locationCoordinates) {
          setError("Enter valid latitude and longitude");
          setLoading(false);
          return;
        }
      }

      let response;
      if (role === "patient") {
        if (isLogin) {
          response = await patientLogin({ abhaId: form.abhaId.trim() });
        } else {
          const locationCoordinates = parseLocation();
          response = await patientRegister({
            name: form.name.trim(),
            abhaId: form.abhaId.trim(),
            phoneNumber: form.phoneNumber.trim(),
            locationCoordinates,
          });
        }
      } else if (role === "doctor") {
        if (isLogin) {
          response = await doctorLogin({
            username: form.username.trim(),
            password: form.password,
          });
        } else {
          const locationCoordinates = parseLocation();
          response = await doctorRegister({
            name: form.name.trim(),
            username: form.username.trim(),
            password: form.password,
            hospitalName: form.hospitalName.trim(),
            locationCoordinates,
          });
        }
      } else {
        if (isLogin) {
          response = await ashaLogin({
            username: form.username.trim(),
            password: form.password,
          });
        } else {
          const locationCoordinates = parseLocation();
          response = await ashaRegister({
            name: form.name.trim(),
            username: form.username.trim(),
            password: form.password,
            locationCoordinates,
          });
        }
      }

      const { token, ...profile } = response || {};
      signIn({ user: profile, token, role });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, onChangeText, props = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isLogin ? `${roleLabel} Login` : `${roleLabel} Register`}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "Enter your credentials to continue."
            : "Create a new account to access the app."}
        </Text>

        {!isLogin && renderInput("Full Name", form.name, (v) => updateField("name", v))}

        {role === "patient" &&
          renderInput("ABHA ID", form.abhaId, (v) => updateField("abhaId", v), {
            autoCapitalize: "none",
          })}

        {role !== "patient" &&
          renderInput("Username", form.username, (v) => updateField("username", v), {
            autoCapitalize: "none",
          })}

        {(role !== "patient" || isLogin) &&
          role !== "patient" &&
          renderInput("Password", form.password, (v) => updateField("password", v), {
            secureTextEntry: true,
          })}

        {!isLogin && role === "patient" &&
          renderInput("Phone Number", form.phoneNumber, (v) => updateField("phoneNumber", v), {
            keyboardType: "phone-pad",
          })}

        {!isLogin && role === "doctor" &&
          renderInput("Hospital Name", form.hospitalName, (v) => updateField("hospitalName", v))}

        {!isLogin && (
          <>
            {renderInput("City (Google Places)", form.city, (v) => updateField("city", v))}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                {renderInput(
                  "Latitude",
                  form.latitude,
                  (v) => updateField("latitude", v),
                  { keyboardType: "numeric" }
                )}
              </View>
              <View style={styles.rowItem}>
                {renderInput(
                  "Longitude",
                  form.longitude,
                  (v) => updateField("longitude", v),
                  { keyboardType: "numeric" }
                )}
              </View>
            </View>
            <Text style={styles.helperText}>
              Use Google Places to select a city and fill coordinates.
            </Text>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </Text>
        </Pressable>
      </ScrollView>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },
  field: {
    marginTop: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  row: {
    marginTop: 4,
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#94A3B8",
  },
  errorText: {
    marginTop: 12,
    color: "#DC2626",
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "#5DC1B9",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
