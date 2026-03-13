import React, { useContext, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { createSocket } from "../services/socket";

export default function IncomingCallListener({ navigationRef }) {
  const { user, role } = useContext(AuthContext);
  const [incomingCall, setIncomingCall] = useState(null);

  const displayName = useMemo(
    () => user?.abha_profile?.name || user?.name || "Patient",
    [user]
  );

  useEffect(() => {
    if (!user?._id || role !== "patient") return;
    const socket = createSocket();

    socket.emit("register-user", {
      userId: user._id,
      role: "patient",
      name: displayName,
    });

    socket.on("incoming-call", (payload) => {
      setIncomingCall(payload || {});
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, role, displayName]);

  const handleAccept = () => {
    const payload = incomingCall;
    setIncomingCall(null);
    if (!payload?.roomId) return;
    navigationRef?.current?.navigate("VideoCall", {
      roomId: payload.roomId,
      userRole: "patient",
      userName: displayName,
      remoteName: payload.fromName || "Doctor",
      callType: payload.callType,
    });
  };

  return (
    <Modal visible={!!incomingCall} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            Incoming {incomingCall?.callType === "AUDIO_CALL" ? "Audio" : "Video"} Call
          </Text>
          <Text style={styles.subtitle}>
            {incomingCall?.fromName || "Doctor"} is calling you
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.decline]}
              onPress={() => setIncomingCall(null)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.accept]}
              onPress={handleAccept}
            >
              <Text style={styles.acceptText}>Join</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    color: "#64748B",
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  decline: {
    backgroundColor: "#FEE2E2",
  },
  declineText: {
    color: "#B91C1C",
    fontWeight: "700",
  },
  accept: {
    backgroundColor: "#0F172A",
  },
  acceptText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
