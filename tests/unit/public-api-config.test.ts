import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../../src/lib/api/config";

describe("public API config", () => {
  it("uses the local API base URL when no public URL is configured", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("http://localhost:8000/api/v1");
  });

  it("trims whitespace and trailing slashes from promoted API URLs", () => {
    expect(resolveApiBaseUrl(" https://api.example.com/api/v1/// ")).toBe(
      "https://api.example.com/api/v1"
    );
  });
});
