import React, { useContext, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  uploadAbhaCard,
  patientLogin,
  sendPatientOtp,
  verifyPatientOtp,
  doctorLogin,
  sendDoctorOtp,
  verifyDoctorOtp,
} from "../services/api";
import { AuthContext } from "../context/AuthContext";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  asha: "ASHA Worker",
};

export default function AuthChoiceScreen({ navigation, route }) {
  const role = route?.params?.role || "patient";
  const roleLabel = useMemo(() => ROLE_LABELS[role] || "User", [role]);

  const [patientMethod, setPatientMethod] = useState("abha");
  const [abhaMode, setAbhaMode] = useState("id");
  const [abhaId, setAbhaId] = useState("");
  const [abhaImage, setAbhaImage] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState("");
  const [abhaLoading, setAbhaLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [doctorMethod, setDoctorMethod] = useState("username");
  const [doctorUsername, setDoctorUsername] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [doctorPhoneNumber, setDoctorPhoneNumber] = useState("");
  const [doctorOtp, setDoctorOtp] = useState("");
  const [doctorOtpSent, setDoctorOtpSent] = useState(false);
  const [doctorLoginLoading, setDoctorLoginLoading] = useState(false);
  const [doctorOtpSending, setDoctorOtpSending] = useState(false);
  const [doctorOtpVerifying, setDoctorOtpVerifying] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleGalleryPick = async () => {
    setStatus("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus("Gallery permission is required to upload an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets?.[0];
      if (asset?.uri) {
        setAbhaImage({
          uri: asset.uri,
          name: asset.fileName,
          type: asset.mimeType,
        });
      }
    }
  };

  const handleCameraPick = async () => {
    setStatus("");
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setStatus("Camera permission is required to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets?.[0];
      if (asset?.uri) {
        setAbhaImage({
          uri: asset.uri,
          name: asset.fileName,
          type: asset.mimeType,
        });
      }
    }
  };

  const handleAbhaLogin = async () => {
    setStatus("");
    setAbhaLoading(true);
    try {
      let resolvedAbhaId = abhaId.trim();
      if (abhaMode === "upload") {
        if (!abhaImage?.uri) {
          setStatus("Upload your ABHA card to continue.");
          return;
        }
        const payload = await uploadAbhaCard({
          uri: abhaImage.uri,
          name: abhaImage.name,
          type: abhaImage.type,
        });
        resolvedAbhaId = payload?.abhaId || "";
        if (!resolvedAbhaId) {
          setStatus("Could not detect the ABHA ID. Try a clearer photo.");
          return;
        }
        setAbhaId(resolvedAbhaId);
      }

      if (!resolvedAbhaId) {
        setStatus("Enter your ABHA ID to continue.");
        return;
      }

      const response = await patientLogin({ abhaId: resolvedAbhaId });
      const { token, ...profile } = response || {};
      signIn({ user: profile, token, role: "patient" });
      navigation.reset({ index: 0, routes: [{ name: "PatientDashboardMock" }] });
    } catch (error) {
      setStatus(error.message || "Unable to login right now.");
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setStatus("");
    if (phoneNumber.trim().length < 10) {
      setStatus("Enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSending(true);
    try {
      await sendPatientOtp({ phoneNumber });
      setOtpSent(true);
      setStatus("OTP sent to your mobile number.");
    } catch (error) {
      setStatus(error.message || "Unable to send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setStatus("");
    if (otp.trim().length < 4) {
      setStatus("Enter the OTP to continue.");
      return;
    }
    setOtpVerifying(true);
    try {
      const response = await verifyPatientOtp({ phoneNumber, otp });
      const { token, ...profile } = response || {};
      signIn({ user: profile, token, role: "patient" });
      navigation.reset({ index: 0, routes: [{ name: "PatientDashboardMock" }] });
    } catch (error) {
      setStatus(error.message || "Unable to verify OTP.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleDoctorLogin = async () => {
    setStatus("");
    if (!doctorUsername.trim() || !doctorPassword) {
      setStatus("Enter username and password to continue.");
      return;
    }
    setDoctorLoginLoading(true);
    try {
      const response = await doctorLogin({
        username: doctorUsername.trim(),
        password: doctorPassword,
      });
      const { token, ...profile } = response || {};
      signIn({ user: profile, token, role: "doctor" });
      navigation.reset({ index: 0, routes: [{ name: "DoctorProfile" }] });
    } catch (error) {
      setStatus(error.message || "Unable to login.");
    } finally {
      setDoctorLoginLoading(false);
    }
  };

  const handleDoctorSendOtp = async () => {
    setStatus("");
    if (doctorPhoneNumber.trim().length < 10) {
      setStatus("Enter a valid 10-digit mobile number.");
      return;
    }
    setDoctorOtpSending(true);
    try {
      await sendDoctorOtp({ phoneNumber: doctorPhoneNumber });
      setDoctorOtpSent(true);
      setStatus("OTP sent to your mobile number.");
    } catch (error) {
      setStatus(error.message || "Unable to send OTP.");
    } finally {
      setDoctorOtpSending(false);
    }
  };

  const handleDoctorVerifyOtp = async () => {
    setStatus("");
    if (doctorOtp.trim().length < 4) {
      setStatus("Enter the OTP to continue.");
      return;
    }
    setDoctorOtpVerifying(true);
    try {
      const response = await verifyDoctorOtp({
        phoneNumber: doctorPhoneNumber,
        otp: doctorOtp,
      });
      const { token, ...profile } = response || {};
      signIn({ user: profile, token, role: "doctor" });
      navigation.reset({ index: 0, routes: [{ name: "DoctorProfile" }] });
    } catch (error) {
      setStatus(error.message || "Unable to verify OTP.");
    } finally {
      setDoctorOtpVerifying(false);
    }
  };

  if (role === "doctor") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Doctor Login</Text>
          <Text style={styles.subtitle}>
            Choose how you want to sign in.
          </Text>

          <View style={styles.tabRow}>
            <Pressable
              style={[
                styles.tabButton,
                doctorMethod === "username" && styles.tabActive,
              ]}
              onPress={() => {
                setDoctorMethod("username");
                setStatus("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  doctorMethod === "username" && styles.tabTextActive,
                ]}
              >
                Login with Username
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabButton,
                doctorMethod === "mobile" && styles.tabActive,
              ]}
              onPress={() => {
                setDoctorMethod("mobile");
                setStatus("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  doctorMethod === "mobile" && styles.tabTextActive,
                ]}
              >
                Login with Mobile
              </Text>
            </Pressable>
          </View>

          {doctorMethod === "username" ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Username Login</Text>
              <Text style={styles.sectionSubtitle}>
                Enter your doctor username and password.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setDoctorUsername}
                  placeholder="doctor.username"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setDoctorPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>

              <Pressable
                style={[
                  styles.primaryButton,
                  doctorLoginLoading && styles.buttonDisabled,
                ]}
                onPress={handleDoctorLogin}
                disabled={doctorLoginLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {doctorLoginLoading ? "Signing in..." : "Login"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Mobile OTP</Text>
              <Text style={styles.sectionSubtitle}>
                Enter your mobile number to receive an OTP.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  value={doctorPhoneNumber}
                  onChangeText={(value) => {
                    setDoctorPhoneNumber(value.replace(/[^0-9]/g, ""));
                    setDoctorOtpSent(false);
                    setDoctorOtp("");
                  }}
                  placeholder="00000 00000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              {!doctorOtpSent ? (
                <Pressable
                  style={[
                    styles.primaryButton,
                    doctorOtpSending && styles.buttonDisabled,
                  ]}
                  onPress={handleDoctorSendOtp}
                  disabled={doctorOtpSending}
                >
                  <Text style={styles.primaryButtonText}>
                    {doctorOtpSending ? "Sending..." : "Send OTP"}
                  </Text>
                </Pressable>
              ) : (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>Enter OTP</Text>
                    <TextInput
                      style={styles.input}
                      value={doctorOtp}
                      onChangeText={(value) =>
                        setDoctorOtp(value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="123456"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <Pressable
                    style={[
                      styles.primaryButton,
                      doctorOtpVerifying && styles.buttonDisabled,
                    ]}
                    onPress={handleDoctorVerifyOtp}
                    disabled={doctorOtpVerifying}
                  >
                    <Text style={styles.primaryButtonText}>
                      {doctorOtpVerifying ? "Verifying..." : "Verify OTP"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}

          {status ? <Text style={styles.statusText}>{status}</Text> : null}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New doctor?</Text>
            <Pressable
              onPress={() => navigation.navigate("AuthForm", { role, mode: "register" })}
            >
              <Text style={styles.footerLink}>Register here</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (role !== "patient") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Continue as {roleLabel}</Text>
          <Text style={styles.subtitle}>
            Choose how you want to access the app.
          </Text>

          <View style={styles.cardStack}>
            <Pressable
              style={[styles.card, styles.cardPrimary]}
              onPress={() =>
                navigation.navigate("AuthForm", { role, mode: "login" })
              }
            >
              <Text style={styles.cardTitle}>{roleLabel} Login</Text>
              <Text style={styles.cardText}>
                Already have an account? Sign in to continue.
              </Text>
            </Pressable>

            <Pressable
              style={[styles.card, styles.cardSecondary]}
              onPress={() =>
                navigation.navigate("AuthForm", { role, mode: "register" })
              }
            >
              <Text style={styles.cardTitle}>{roleLabel} Register</Text>
              <Text style={styles.cardText}>
                Create a new account to get started.
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Patient Login</Text>
        <Text style={styles.subtitle}>
          Choose how you want to verify your identity.
        </Text>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, patientMethod === "abha" && styles.tabActive]}
            onPress={() => {
              setPatientMethod("abha");
              setStatus("");
            }}
          >
            <Text
              style={[
                styles.tabText,
                patientMethod === "abha" && styles.tabTextActive,
              ]}
            >
              Login with ABHA ID
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, patientMethod === "mobile" && styles.tabActive]}
            onPress={() => {
              setPatientMethod("mobile");
              setStatus("");
            }}
          >
            <Text
              style={[
                styles.tabText,
                patientMethod === "mobile" && styles.tabTextActive,
              ]}
            >
              Login with Mobile
            </Text>
          </Pressable>
        </View>

        {patientMethod === "abha" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ABHA Verification</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your ABHA ID or upload your ABHA card.
            </Text>

            <View style={styles.subTabRow}>
              <Pressable
                style={[
                  styles.subTabButton,
                  abhaMode === "id" && styles.subTabActive,
                ]}
                onPress={() => {
                  setAbhaMode("id");
                  setStatus("");
                }}
              >
                <Text
                  style={[
                    styles.subTabText,
                    abhaMode === "id" && styles.subTabTextActive,
                  ]}
                >
                  Enter ABHA ID
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.subTabButton,
                  abhaMode === "upload" && styles.subTabActive,
                ]}
                onPress={() => {
                  setAbhaMode("upload");
                  setStatus("");
                }}
              >
                <Text
                  style={[
                    styles.subTabText,
                    abhaMode === "upload" && styles.subTabTextActive,
                  ]}
                >
                  Upload ABHA Card
                </Text>
              </Pressable>
            </View>

            {abhaMode === "id" ? (
              <View style={styles.field}>
                <Text style={styles.label}>ABHA ID</Text>
                <TextInput
                  style={styles.input}
                  value={abhaId}
                  onChangeText={setAbhaId}
                  placeholder="XXXX-XXXX-XXXX"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={styles.uploadBlock}>
                <View style={styles.uploadRow}>
                  <Pressable
                    style={styles.uploadButton}
                    onPress={handleGalleryPick}
                  >
                    <Text style={styles.uploadButtonText}>Upload from Gallery</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.uploadButton, styles.uploadButtonSecondary]}
                    onPress={handleCameraPick}
                  >
                    <Text style={styles.uploadButtonText}>Take a Photo</Text>
                  </Pressable>
                </View>
                {abhaImage?.uri ? (
                  <View style={styles.preview}>
                    <Image
                      source={{ uri: abhaImage.uri }}
                      style={styles.previewImage}
                    />
                    <Text style={styles.previewText}>ABHA card selected</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>
                    Upload a clear image of your ABHA card.
                  </Text>
                )}
              </View>
            )}

            <Pressable
              style={[styles.primaryButton, abhaLoading && styles.buttonDisabled]}
              onPress={handleAbhaLogin}
              disabled={abhaLoading}
            >
              <Text style={styles.primaryButtonText}>
                {abhaLoading ? "Processing..." : "Continue"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Mobile OTP</Text>
            <Text style={styles.sectionSubtitle}>
              Enter your mobile number to receive an OTP.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={(value) => {
                  setPhoneNumber(value.replace(/[^0-9]/g, ""));
                  setOtpSent(false);
                  setOtp("");
                }}
                placeholder="00000 00000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {!otpSent ? (
              <Pressable
                style={[styles.primaryButton, otpSending && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={otpSending}
              >
                <Text style={styles.primaryButtonText}>
                  {otpSending ? "Sending..." : "Send OTP"}
                </Text>
              </Pressable>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={(value) =>
                      setOtp(value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="123456"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <Pressable
                  style={[styles.primaryButton, otpVerifying && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otpVerifying}
                >
                  <Text style={styles.primaryButtonText}>
                    {otpVerifying ? "Verifying..." : "Verify OTP"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {status ? <Text style={styles.statusText}>{status}</Text> : null}
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#6B7280",
  },
  cardStack: {
    marginTop: 24,
    gap: 16,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardPrimary: {
    backgroundColor: "#E7FAF8",
  },
  cardSecondary: {
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardText: {
    marginTop: 6,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  tabRow: {
    marginTop: 20,
    flexDirection: "row",
    backgroundColor: "#E7FAF8",
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#5DC1B9",
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  sectionCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  subTabRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subTabActive: {
    backgroundColor: "#E7FAF8",
    borderColor: "#5DC1B9",
  },
  subTabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
  },
  subTabTextActive: {
    color: "#0F766E",
  },
  field: {
    marginTop: 16,
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
  uploadBlock: {
    marginTop: 14,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
  },
  uploadButtonSecondary: {
    backgroundColor: "#5DC1B9",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  preview: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    gap: 6,
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  previewText: {
    fontSize: 12.5,
    color: "#475569",
    fontWeight: "600",
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: "#94A3B8",
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#5DC1B9",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  statusText: {
    marginTop: 16,
    textAlign: "center",
    color: "#0F172A",
    fontSize: 12.5,
    fontWeight: "600",
  },
  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13.5,
    color: "#6B7280",
  },
  footerLink: {
    fontSize: 13.5,
    color: "#5DC1B9",
    fontWeight: "700",
  },
});
