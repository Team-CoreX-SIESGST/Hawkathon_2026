import React from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { streamChatMessage } from "../services/api";
import { Feather } from "@expo/vector-icons";

const quickSymptoms = [
  { id: 1, label: "Fever", icon: "🌡️" },
  { id: 2, label: "Headache", icon: "💆" },
  { id: 3, label: "Cough", icon: "💨" },
  { id: 4, label: "Stomach Pain", icon: "🤢" },
];

function dedupeByUrl(items, keyName = "url") {
  const seen = new Set();
  const output = [];

  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const key = item[keyName] || item.imageUrl || item.pageUrl || item.thumbnailUrl;
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(item);
  });

  return output;
}

function parseInlineMarkdownImages(content) {
  if (typeof content !== "string" || !content) {
    return { text: "", images: [] };
  }

  const images = [];
  const text = content.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_, alt = "", url = "") => {
    images.push({
      title: alt || "Image",
      imageUrl: url,
      pageUrl: url,
      thumbnailUrl: url,
    });
    return "";
  });

  return {
    text: text.replace(/\n{3,}/g, "\n\n"),
    images,
  };
}

function tokenizeInlineMarkdown(text) {
  const tokens = [];
  const pattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|((?:https?:\/\/)[^\s)]+)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      tokens.push({ type: "link", label: match[1], url: match[2] });
    } else if (match[3]) {
      tokens.push({ type: "link", label: match[3], url: match[3] });
    } else if (match[4]) {
      tokens.push({ type: "bold", value: match[4] });
    } else if (match[5]) {
      tokens.push({ type: "italic", value: match[5] });
    } else if (match[6]) {
      tokens.push({ type: "code", value: match[6] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}

function InlineMarkdownText({ text, isUser, onOpenUrl, style, tokenPrefix }) {
  const tokens = React.useMemo(() => tokenizeInlineMarkdown(text), [text]);

  return (
    <Text style={style}>
      {tokens.map((token, index) => {
        if (token.type === "link") {
          return (
            <Text
              key={`${tokenPrefix}-link-${index}`}
              style={[styles.inlineLink, isUser ? styles.inlineLinkUser : null]}
              onPress={() => onOpenUrl(token.url)}
            >
              {token.label}
            </Text>
          );
        }

        if (token.type === "bold") {
          return (
            <Text key={`${tokenPrefix}-bold-${index}`} style={styles.inlineBold}>
              {token.value}
            </Text>
          );
        }

        if (token.type === "code") {
          return (
            <Text
              key={`${tokenPrefix}-code-${index}`}
              style={[styles.inlineCode, isUser ? styles.inlineCodeUser : null]}
            >
              {token.value}
            </Text>
          );
        }

        if (token.type === "italic") {
          return (
            <Text key={`${tokenPrefix}-italic-${index}`} style={styles.inlineItalic}>
              {token.value}
            </Text>
          );
        }

        return <Text key={`${tokenPrefix}-text-${index}`}>{token.value}</Text>;
      })}
    </Text>
  );
}

function MarkdownMessage({ text, isUser, onOpenUrl }) {
  const lines = React.useMemo(() => String(text || "").replace(/\r/g, "").split("\n"), [text]);
  const baseTextStyle = [styles.messageText, isUser ? styles.userText : styles.assistantText];
  const elements = [];
  let inCodeFence = false;
  let codeLines = [];

  function flushCodeFence(keySeed) {
    if (!codeLines.length) {
      return;
    }
    elements.push(
      <View key={`code-${keySeed}`} style={[styles.codeBlock, isUser ? styles.codeBlockUser : null]}>
        <Text style={[styles.codeBlockText, isUser ? styles.codeBlockTextUser : null]}>{codeLines.join("\n")}</Text>
      </View>
    );
    codeLines = [];
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const key = `line-${index}`;

    if (trimmed.startsWith("```")) {
      if (inCodeFence) {
        flushCodeFence(index);
      }
      inCodeFence = !inCodeFence;
      return;
    }

    if (inCodeFence) {
      codeLines.push(line);
      return;
    }

    if (!trimmed) {
      elements.push(<View key={key} style={styles.markdownSpacer} />);
      return;
    }

    const quote = trimmed.match(/^>\s+(.+)/);
    if (quote) {
      elements.push(
        <View key={key} style={[styles.quoteRow, isUser ? styles.quoteRowUser : null]}>
          <InlineMarkdownText
            text={quote[1]}
            isUser={isUser}
            onOpenUrl={onOpenUrl}
            tokenPrefix={key}
            style={[...baseTextStyle, styles.quoteText]}
          />
        </View>
      );
      return;
    }

    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) {
      elements.push(
        <InlineMarkdownText
          key={key}
          text={h3[1]}
          isUser={isUser}
          onOpenUrl={onOpenUrl}
          tokenPrefix={key}
          style={[...baseTextStyle, styles.heading3]}
        />
      );
      return;
    }

    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) {
      elements.push(
        <InlineMarkdownText
          key={key}
          text={h2[1]}
          isUser={isUser}
          onOpenUrl={onOpenUrl}
          tokenPrefix={key}
          style={[...baseTextStyle, styles.heading2]}
        />
      );
      return;
    }

    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) {
      elements.push(
        <InlineMarkdownText
          key={key}
          text={h1[1]}
          isUser={isUser}
          onOpenUrl={onOpenUrl}
          tokenPrefix={key}
          style={[...baseTextStyle, styles.heading1]}
        />
      );
      return;
    }

    const numbered = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numbered) {
      elements.push(
        <View key={key} style={styles.listRow}>
          <Text style={[styles.listMarker, isUser ? styles.userText : styles.assistantText]}>
            {numbered[1]}.
          </Text>
          <InlineMarkdownText
            text={numbered[2]}
            isUser={isUser}
            onOpenUrl={onOpenUrl}
            tokenPrefix={key}
            style={[...baseTextStyle, styles.listContent]}
          />
        </View>
      );
      return;
    }

    const bulleted = trimmed.match(/^[-*]\s+(.+)/);
    if (bulleted) {
      elements.push(
        <View key={key} style={styles.listRow}>
          <Text style={[styles.listMarker, isUser ? styles.userText : styles.assistantText]}>•</Text>
          <InlineMarkdownText
            text={bulleted[1]}
            isUser={isUser}
            onOpenUrl={onOpenUrl}
            tokenPrefix={key}
            style={[...baseTextStyle, styles.listContent]}
          />
        </View>
      );
      return;
    }

    elements.push(
      <InlineMarkdownText
        key={key}
        text={line}
        isUser={isUser}
        onOpenUrl={onOpenUrl}
        tokenPrefix={key}
        style={baseTextStyle}
      />
    );
  });

  if (inCodeFence) {
    flushCodeFence("tail");
  }

  return <View>{elements}</View>;
}

function MessageBubble({ message, onOpenUrl }) {
  const isUser = message.role === "user";
  const parsedText = parseInlineMarkdownImages(message.content);
  const eventImages = Array.isArray(message.images) ? message.images : [];
  const images = dedupeByUrl([...eventImages, ...parsedText.images], "imageUrl");
  const videos = dedupeByUrl(message.videos, "url");
  const sources = dedupeByUrl(message.sources, "url");
  const hasText = parsedText.text.trim().length > 0;

  return (
    <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.assistantMessageRow]}>
      {!isUser && (
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>AG</Text>
        </View>
      )}
      <View style={[styles.messageContent, isUser ? styles.userMessageContent : styles.assistantMessageContent]}>
        {!isUser && <Text style={styles.assistantName}>ArogyaGram Assistant</Text>}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {hasText ? (
            <MarkdownMessage text={parsedText.text} isUser={isUser} onOpenUrl={onOpenUrl} />
          ) : null}

          {!isUser && images.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {images.map((item, index) => (
              <Pressable
                key={`${message.id}-image-${index}`}
                style={styles.mediaCard}
                onPress={() => onOpenUrl(item.pageUrl || item.imageUrl)}
              >
                <Image
                  source={{ uri: item.thumbnailUrl || item.imageUrl }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
                <Text numberOfLines={2} style={styles.mediaTitle}>
                  {String(item.title || "Image")}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {!isUser && videos.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>YouTube</Text>
          {videos.map((video, index) => {
            const thumb =
              video?.thumbnails?.high?.url ||
              video?.thumbnails?.medium?.url ||
              video?.thumbnails?.default?.url;

            return (
              <Pressable
                key={`${message.id}-video-${index}`}
                style={styles.videoCard}
                onPress={() => onOpenUrl(video.url)}
              >
                {thumb ? <Image source={{ uri: thumb }} style={styles.videoThumb} resizeMode="cover" /> : null}
                <Text numberOfLines={2} style={styles.videoTitle}>
                  {String(video.title || "YouTube video")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!isUser && sources.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Sources</Text>
          {sources.map((source, index) => (
            <Pressable
              key={`${message.id}-source-${index}`}
              onPress={() => onOpenUrl(source.url)}
              style={styles.sourceRow}
            >
              <Text numberOfLines={2} style={styles.sourceText}>
                {String((source.title || source.url || "").trim())}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
        </View>
        {!isUser && <Text style={styles.messageTime}>Just now</Text>}
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const headerHeight = useHeaderHeight();
  const listRef = React.useRef(null);
  const abortStreamRef = React.useRef(null);
  const authToken = route?.params?.token;

  const [prompt, setPrompt] = React.useState("");
  const [conversationId, setConversationId] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [includeYouTube, setIncludeYouTube] = React.useState(false);
  const [includeWebImages, setIncludeWebImages] = React.useState(false);

  React.useEffect(() => {
    return () => {
      abortStreamRef.current?.();
    };
  }, []);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, loading]);

  function updateMessage(messageId, update) {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== messageId) {
          return message;
        }
        const nextPatch = typeof update === "function" ? update(message) : update;
        return { ...message, ...nextPatch };
      })
    );
  }

  async function handleOpenUrl(url) {
    if (!url) {
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Ignore URL open failures in UI.
    }
  }

  function handleSend() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || loading) {
      return;
    }

    const now = Date.now();
    const userId = `${now}-user`;
    const assistantId = `${now}-assistant`;

    setError("");
    setPrompt("");
    setLoading(true);
    setToolsOpen(false);
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: trimmedPrompt },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        images: [],
        videos: [],
        sources: [],
      },
    ]);

    abortStreamRef.current?.();
    abortStreamRef.current = streamChatMessage({
      token: authToken,
      prompt: trimmedPrompt,
      conversationId: conversationId || undefined,
      options: {
        includeYouTube,
        includeImageSearch: includeWebImages,
      },
      onEvent: ({ event, data }) => {
        if (event === "conversationId" && typeof data?.conversationId === "string") {
          setConversationId(data.conversationId);
          return;
        }

        if (event === "message") {
          const chunk = typeof data?.text === "string" ? data.text : typeof data?.raw === "string" ? data.raw : "";
          if (chunk) {
            updateMessage(assistantId, (message) => ({
              content: `${message.content || ""}${chunk}`,
            }));
          }
          return;
        }

        if (event === "images") {
          const incoming = Array.isArray(data?.images) ? data.images : [];
          updateMessage(assistantId, (message) => ({
            images: dedupeByUrl([...(message.images || []), ...incoming], "imageUrl"),
          }));
          return;
        }

        if (event === "youtubeResults") {
          const incoming = Array.isArray(data?.videos) ? data.videos : [];
          updateMessage(assistantId, (message) => ({
            videos: dedupeByUrl([...(message.videos || []), ...incoming], "url"),
          }));
          return;
        }

        if (event === "sources") {
          const incoming = Array.isArray(data?.sources) ? data.sources : [];
          updateMessage(assistantId, (message) => ({
            sources: dedupeByUrl([...(message.sources || []), ...incoming], "url"),
          }));
          return;
        }

        if (event === "error") {
          setError(data?.message || data?.error || "Chat stream failed");
        }
      },
      onComplete: () => {
        setLoading(false);
        abortStreamRef.current = null;
      },
      onError: (streamError) => {
        setLoading(false);
        setError(streamError?.message || "Chat stream failed");
        abortStreamRef.current = null;
      },
    });
  }

  function handleNewChat() {
    abortStreamRef.current?.();
    abortStreamRef.current = null;
    setToolsOpen(false);
    setConversationId("");
    setMessages([]);
    setError("");
    setLoading(false);
    setPrompt("");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 20}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color="#4B5563" />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>ArogyaGram AI</Text>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.subtitle}>Online</Text>
          </View>
        </View>
        <Pressable style={styles.headerAvatar} onPress={handleNewChat}>
          <Feather name="user" size={20} color="#5DC1B9" />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        renderItem={({ item }) => <MessageBubble message={item} onOpenUrl={handleOpenUrl} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>TAP A SYMPTOM TO BEGIN</Text>
            <View style={styles.symptomsGrid}>
              {quickSymptoms.map((symptom) => (
                <Pressable
                  key={symptom.id}
                  style={styles.symptomCard}
                  onPress={() => {
                    setPrompt(symptom.label);
                  }}
                >
                  <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                  <Text style={styles.symptomLabel}>{symptom.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.symptomCard, styles.symptomCardFull]}
              onPress={() => setPrompt("Fatigue (Tiredness)")}
            >
              <Text style={styles.symptomIcon}>😴</Text>
              <Text style={styles.symptomLabel}>Fatigue (Tiredness)</Text>
            </Pressable>
          </View>
        }
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {toolsOpen ? <Pressable style={styles.toolsBackdrop} onPress={() => setToolsOpen(false)} /> : null}

      <View style={styles.composerRow}>
        {toolsOpen ? (
          <View style={styles.toolsMenu}>
            <View style={styles.toolItem}>
              <Text style={styles.toolLabel}>YouTube</Text>
              <Switch value={includeYouTube} onValueChange={setIncludeYouTube} />
            </View>
            <View style={styles.toolItem}>
              <Text style={styles.toolLabel}>Web Images</Text>
              <Switch value={includeWebImages} onValueChange={setIncludeWebImages} />
            </View>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Type other symptoms..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={4000}
          />
          <Pressable
            style={[styles.sendButton, (loading || !prompt.trim()) && styles.disabledButton]}
            onPress={handleSend}
            disabled={loading || !prompt.trim()}
          >
            <Feather name="send" size={18} color="#ffffff" style={styles.sendIcon} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#22c55e",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 1,
    marginBottom: 16,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  symptomCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ccfbf1",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  symptomCardFull: {
    width: "100%",
  },
  symptomIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  symptomLabel: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  assistantMessageRow: {
    justifyContent: "flex-start",
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5DC1B9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  messageContent: {
    flex: 1,
  },
  userMessageContent: {
    alignItems: "flex-end",
  },
  assistantMessageContent: {
    alignItems: "flex-start",
  },
  assistantName: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
    marginLeft: 2,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  userBubble: {
    backgroundColor: "#1d4ed8",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageTime: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
    marginLeft: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: "#ffffff",
  },
  assistantText: {
    color: "#111827",
  },
  markdownSpacer: {
    height: 8,
  },
  heading1: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  heading3: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 1,
  },
  listMarker: {
    width: 20,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  listContent: {
    flex: 1,
  },
  inlineLink: {
    color: "#1d4ed8",
    textDecorationLine: "underline",
  },
  inlineLinkUser: {
    color: "#dbeafe",
  },
  inlineBold: {
    fontWeight: "700",
  },
  inlineItalic: {
    fontStyle: "italic",
  },
  inlineCode: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  inlineCodeUser: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  codeBlock: {
    marginTop: 6,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  codeBlockUser: {
    backgroundColor: "rgba(17,24,39,0.6)",
  },
  codeBlockText: {
    color: "#f9fafb",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
    lineHeight: 18,
  },
  codeBlockTextUser: {
    color: "#ffffff",
  },
  quoteRow: {
    borderLeftWidth: 3,
    borderLeftColor: "#9ca3af",
    paddingLeft: 10,
    marginVertical: 2,
  },
  quoteRowUser: {
    borderLeftColor: "rgba(255,255,255,0.7)",
  },
  quoteText: {
    opacity: 0.95,
  },
  sectionBlock: {
    marginTop: 10,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  imageRow: {
    paddingRight: 6,
  },
  mediaCard: {
    width: 180,
    marginRight: 10,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  mediaImage: {
    width: "100%",
    height: 102,
  },
  mediaTitle: {
    fontSize: 12,
    color: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  videoCard: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  videoThumb: {
    width: "100%",
    height: 170,
  },
  videoTitle: {
    fontSize: 13,
    color: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sourceRow: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    backgroundColor: "#ffffff",
  },
  sourceText: {
    fontSize: 13,
    color: "#0f4c81",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#dc2626",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  composerRow: {
    padding: 16,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  toolsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    bottom: 0,
    zIndex: 5,
  },
  toolsMenu: {
    position: "absolute",
    bottom: 72,
    right: 74,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 210,
    zIndex: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toolItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  toolLabel: {
    fontSize: 17,
    color: "#111827",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 120,
    color: "#1f2937",
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#5DC1B9",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  sendIcon: {
    marginLeft: -2,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
