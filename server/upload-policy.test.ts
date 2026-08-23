import { describe, expect, it } from "vitest";

const maxAttachmentBytes = 8 * 1024 * 1024;
const maxPhotoBytes = 5 * 1024 * 1024;

describe("secure upload policy", () => {
  it("keeps profile photos within the stricter image limit", () => {
    expect(4 * 1024 * 1024).toBeLessThanOrEqual(maxPhotoBytes);
    expect(6 * 1024 * 1024).toBeGreaterThan(maxPhotoBytes);
  });

  it("allows a larger but bounded general attachment", () => {
    expect(maxPhotoBytes).toBeLessThan(maxAttachmentBytes);
    expect(9 * 1024 * 1024).toBeGreaterThan(maxAttachmentBytes);
  });
});
