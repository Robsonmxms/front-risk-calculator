import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, updateAccessToken } from "../../src/features/auth/sessionStore";
import { connectRealtime } from "../../src/lib/realtime/client";

describe("realtime client", () => {
  beforeEach(() => {
    clearSession();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("authorizes a scoped stream and publishes valid SSE messages", async () => {
    updateAccessToken("access-token");
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("event: connected\ndata: {}\n\n"));
        controller.enqueue(encoder.encode("event: analytics.updated\ndata: {invalid}\n\n"));
        controller.enqueue(
          encoder.encode(
            'event: analytics.updated\ndata: {"type":"analytics.updated","portfolioId":"prt_main"}\n\n'
          )
        );
        controller.close();
      }
    });
    vi.mocked(fetch).mockResolvedValue(new Response(stream, { status: 200 }));
    const statuses: string[] = [];
    const onMessage = vi.fn();

    connectRealtime({
      portfolioId: "prt_main",
      onStatus: (status) => statuses.push(status),
      onMessage
    });

    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/realtime?portfolioId=prt_main",
      expect.objectContaining({
        headers: { Authorization: "Bearer access-token" },
        signal: expect.any(AbortSignal)
      })
    );
    expect(onMessage).toHaveBeenCalledWith({
      type: "analytics.updated",
      portfolioId: "prt_main"
    });
    expect(statuses).toEqual(["connecting", "connected", "disconnected"]);
  });

  it("reports unavailable streams without sending an empty authorization header", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
    const statuses: string[] = [];
    const onError = vi.fn();

    connectRealtime({
      onStatus: (status) => statuses.push(status),
      onMessage: vi.fn(),
      onError
    });

    await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/realtime",
      expect.objectContaining({ headers: {} })
    );
    expect(statuses[0]).toBe("connecting");
    expect(statuses[statuses.length - 1]).toBe("disconnected");
  });

  it("aborts a pending connection without surfacing a transport error", async () => {
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        })
    );
    const onError = vi.fn();
    const statuses: string[] = [];

    const connection = connectRealtime({
      onStatus: (status) => statuses.push(status),
      onMessage: vi.fn(),
      onError
    });
    connection.close();

    await vi.waitFor(() => expect(statuses[statuses.length - 1]).toBe("disconnected"));
    expect(onError).not.toHaveBeenCalled();
  });
});
