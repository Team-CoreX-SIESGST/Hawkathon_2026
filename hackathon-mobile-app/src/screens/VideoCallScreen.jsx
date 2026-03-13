import React, { useContext, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import useVideoCall from "../hooks/useVideoCall";

const getRTCView = () => {
  if (Platform.OS === "web") return null;
  try {
    return require("react-native-webrtc").RTCView;
  } catch {
    return null;
  }
};

export default function VideoCallScreen({ route, navigation }) {
  const { user, role } = useContext(AuthContext);
  const { roomId, userRole, userName, remoteName } = route.params || {};
  const RTCView = useMemo(() => getRTCView(), []);

  const resolvedRole = userRole || role || "patient";
  const resolvedName =
    userName ||
    user?.abha_profile?.name ||
    user?.name ||
    "User";

  const call = useVideoCall({
    roomId,
    userId: user?._id,
    userRole: resolvedRole,
    userName: resolvedName,
  });

  const { width } = Dimensions.get("window");
  const pipPosition = useRef(
    new Animated.ValueXY({ x: width - 140, y: 40 })
  ).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pipPosition.setOffset({
            x: pipPosition.x.__getValue(),
            y: pipPosition.y.__getValue(),
          });
          pipPosition.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pipPosition.x, dy: pipPosition.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: () => {
          pipPosition.flattenOffset();
        },
      }),
    [pipPosition]
  );

  const handleEnd = async () => {
    await call.endCall();
    navigation.goBack();
  };

  const waitingTitle =
    resolvedRole === "doctor" ? "Waiting for patient" : "Waiting for doctor";

  if (!RTCView) {
    return (
      <View style={styles.container}>
        <View style={styles.waiting}>
          <Text style={styles.waitingTitle}>WebRTC Unavailable</Text>
          <Text style={styles.waitingSubtitle}>
            This build does not include the native WebRTC module.
          </Text>
          <Pressable
            style={styles.endButtonWide}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.endText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {call.remoteStream ? (
        <RTCView
          streamURL={call.remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.waiting}>
          <Text style={styles.waitingTitle}>{waitingTitle}</Text>
          <Text style={styles.waitingSubtitle}>
            {remoteName || call.remoteInfo?.name || "Connecting..."}
          </Text>
          <ActivityIndicator size="large" color="#5DC1B9" style={styles.spinner} />
        </View>
      )}

      {RTCView && call.localStream ? (
        <Animated.View
          style={[styles.localPreview, pipPosition.getLayout()]}
          {...panResponder.panHandlers}
        >
          <RTCView
            streamURL={call.localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror
          />
        </Animated.View>
      ) : null}

      {call.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{call.error}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={call.toggleMute}>
          <Text style={styles.controlText}>
            {call.isMuted ? "Unmute" : "Mute"}
          </Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={call.toggleCamera}>
          <Text style={styles.controlText}>
            {call.isVideoEnabled ? "Hide Cam" : "Show Cam"}
          </Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={call.flipCamera}>
          <Text style={styles.controlText}>Flip</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.endButton]} onPress={handleEnd}>
          <Text style={styles.endText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  remoteVideo: {
    flex: 1,
  },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  waitingTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  waitingSubtitle: {
    marginTop: 8,
    color: "#CBD5F5",
  },
  spinner: {
    marginTop: 16,
  },
  localPreview: {
    position: "absolute",
    width: 120,
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  errorBanner: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.9)",
  },
  errorText: {
    color: "#0F172A",
    fontWeight: "700",
    textAlign: "center",
  },
  controls: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },
  endButtonWide: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#EF4444",
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
  },
  controlText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  endButton: {
    backgroundColor: "#EF4444",
  },
  endText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
