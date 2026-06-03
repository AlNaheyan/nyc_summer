import { describe, expect, it } from "vitest";
import { applyCompletion, daysBetween } from "./streak";

const fresh = { current_streak: 0, longest_streak: 0, last_completion_date: null };

describe("daysBetween", () => {
  it("counts whole days, including across months", () => {
    expect(daysBetween("2026-07-01", "2026-07-02")).toBe(1);
    expect(daysBetween("2026-06-30", "2026-07-01")).toBe(1);
    expect(daysBetween("2026-07-01", "2026-07-01")).toBe(0);
    expect(daysBetween("2026-07-05", "2026-07-01")).toBe(-4);
  });
});

describe("applyCompletion", () => {
  it("starts a streak at 1 on the first completion", () => {
    const r = applyCompletion(fresh, "2026-07-01");
    expect(r).toMatchObject({ current_streak: 1, longest_streak: 1, last_completion_date: "2026-07-01", sameDay: false });
  });

  it("increments on a consecutive day", () => {
    const r = applyCompletion(
      { current_streak: 3, longest_streak: 3, last_completion_date: "2026-07-01" },
      "2026-07-02",
    );
    expect(r.current_streak).toBe(4);
    expect(r.longest_streak).toBe(4);
  });

  it("does not change the streak for a second completion same day", () => {
    const r = applyCompletion(
      { current_streak: 3, longest_streak: 5, last_completion_date: "2026-07-02" },
      "2026-07-02",
    );
    expect(r).toMatchObject({ current_streak: 3, longest_streak: 5, sameDay: true });
  });

  it("resets to 1 after a gap", () => {
    const r = applyCompletion(
      { current_streak: 6, longest_streak: 6, last_completion_date: "2026-07-02" },
      "2026-07-05",
    );
    expect(r.current_streak).toBe(1);
    expect(r.longest_streak).toBe(6); // preserved
  });

  it("preserves longest when current dips", () => {
    let s = applyCompletion(fresh, "2026-07-01");
    s = applyCompletion(s, "2026-07-02");
    s = applyCompletion(s, "2026-07-03"); // streak 3
    s = applyCompletion(s, "2026-07-10"); // gap → reset
    expect(s.current_streak).toBe(1);
    expect(s.longest_streak).toBe(3);
  });
});
