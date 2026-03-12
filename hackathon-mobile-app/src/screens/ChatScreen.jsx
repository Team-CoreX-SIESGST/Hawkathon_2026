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
  );
}

export default function ChatScreen({ route }) {
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
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>MediSetu Chatbot</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {conversationId ? `Conversation: ${conversationId}` : "Start a new conversation"}
          </Text>
        </View>
        <Pressable style={styles.newButton} onPress={handleNewChat}>
          <Text style={styles.newButtonText}>New</Text>
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
        ListEmptyComponent={<Text style={styles.emptyText}>Say hi to MediSetu.</Text>}
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

        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Type your message..."
          multiline
          maxLength={4000}
        />
        <Pressable style={styles.toolsButton} onPress={() => setToolsOpen((prev) => !prev)}>
          <Text style={styles.toolsButtonText}>Tools</Text>
        </Pressable>
        <Pressable
          style={[styles.sendButton, loading && styles.disabledButton]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.sendText}>{loading ? "..." : "Send"}</Text>
        </Pressable>
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
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  newButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 22,
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: "#1d4ed8",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    width: "94%",
    backgroundColor: "#f3f4f6",
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
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 10,
    backgroundColor: "#ffffff",
    position: "relative",
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
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    marginRight: 10,
    backgroundColor: "#ffffff",
  },
  toolsButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#ffffff",
  },
  toolsButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  sendButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
