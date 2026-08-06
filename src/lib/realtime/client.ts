import { getAccessToken } from "../session/sessionStore";
import type { RealtimeMessage } from "../contracts/portfolio";
import { API_BASE_URL } from "../api/client";

export type RealtimeConnectionStatus = "connecting" | "connected" | "disconnected";

export interface RealtimeConnection {
  close: () => void;
}

export function connectRealtime(input: {
  portfolioId?: string;
  onStatus: (status: RealtimeConnectionStatus) => void;
  onMessage: (message: RealtimeMessage) => void;
  onError?: () => void;
}): RealtimeConnection {
  const controller = new AbortController();
  const params = new URLSearchParams();
  if (input.portfolioId) {
    params.set("portfolioId", input.portfolioId);
  }
  const query = params.toString();

  input.onStatus("connecting");
  void readStream(`${API_BASE_URL}/realtime${query ? `?${query}` : ""}`, controller, input);

  return {
    close: () => controller.abort()
  };
}

async function readStream(
  url: string,
  controller: AbortController,
  input: {
    onStatus: (status: RealtimeConnectionStatus) => void;
    onMessage: (message: RealtimeMessage) => void;
    onError?: () => void;
  }
) {
  try {
    const accessToken = getAccessToken();
    const response = await fetch(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      input.onStatus("disconnected");
      input.onError?.();
      return;
    }

    input.onStatus("connected");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!controller.signal.aborted) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const message = parseSseMessage(event);
        if (message) {
          input.onMessage(message);
        }
      }
    }
  } catch {
    if (!controller.signal.aborted) {
      input.onError?.();
    }
  } finally {
    input.onStatus("disconnected");
  }
}

function parseSseMessage(rawEvent: string): RealtimeMessage | null {
  const eventName = rawEvent
    .split("\n")
    .find((line) => line.startsWith("event: "))
    ?.slice("event: ".length);
  const dataLine = rawEvent
    .split("\n")
    .find((line) => line.startsWith("data: "))
    ?.slice("data: ".length);

  if (!dataLine || eventName === "connected") {
    return null;
  }

  try {
    return JSON.parse(dataLine) as RealtimeMessage;
  } catch {
    return null;
  }
}
