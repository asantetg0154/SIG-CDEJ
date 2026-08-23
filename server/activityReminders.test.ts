import { describe, expect, it } from "vitest";
import { ACTIVITY_REMINDER_CRON, shouldSendActivityReminder } from "./activityReminders";

describe("activity reminders", () => {
  const now = new Date("2026-08-23T07:00:00Z");

  it("uses the documented daily UTC schedule", () => {
    expect(ACTIVITY_REMINDER_CRON).toBe("0 0 7 * * *");
  });

  it("sends only once for planned or active activities inside the configured reminder window", () => {
    expect(shouldSendActivityReminder("planned", new Date("2026-08-24T06:00:00Z"), null, now, 24)).toBe(true);
    expect(shouldSendActivityReminder("completed", new Date("2026-08-24T06:00:00Z"), null, now, 24)).toBe(false);
    expect(shouldSendActivityReminder("planned", new Date("2026-08-24T06:00:00Z"), new Date(), now, 24)).toBe(false);
    expect(shouldSendActivityReminder("planned", new Date("2026-08-24T08:00:00Z"), null, now, 24)).toBe(false);
  });
});
