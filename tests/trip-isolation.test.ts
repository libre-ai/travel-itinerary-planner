import { describe, expect, test } from "bun:test";
import {
  checkEncodedPatterns,
  checkInstanceShape,
  checkPackComments,
  checkTripsDirectory,
  loadEncodedPatterns,
  loadPackCommentPatterns,
} from "../tools/ci/check-trip-isolation";

/** Literal fragments of an instance — forbidden everywhere. */
const encoded = await loadEncodedPatterns();
/** Domain vocabulary — forbidden only inside a pack comment. */
const packOnly = await loadPackCommentPatterns();

/**
 * The first test of this suite is the one that matters most, and it is a
 * negative: the gate must stay silent on a legitimate pack calendar. Three of
 * the four captures of a naive date-grep were public event dates, and a gate
 * that cries wolf on the facts a pack is asked to carry gets disabled.
 */
describe("the gate leaves public city facts alone", () => {
  const packCalendar = `slug: copenhagen
calendar:
  - id: some-pride
    start: 2026-08-08
    end: 2026-08-16
    peak_day: 2026-08-15
    structuring: true
  - id: some-food-festival
    start: 2026-08-21
    end: 2026-08-30
currency:
  local: DKK
`;

  test("event dates in a pack do not trigger the lexical rule", () => {
    expect(checkEncodedPatterns("data/cities/copenhagen.yaml", packCalendar, encoded)).toEqual([]);
  });

  test("a pack calendar is not mistaken for a trip instance", () => {
    expect(checkInstanceShape("data/cities/copenhagen.yaml", packCalendar)).toEqual([]);
  });

  test("neutral pack comments pass", () => {
    const commented = `# Several major museums close on Mondays.\n${packCalendar}`;
    expect(checkPackComments("data/cities/copenhagen.yaml", commented, encoded)).toEqual([]);
  });
});

describe("the gate catches an instance by shape, whatever its dates", () => {
  test("three instance keys are enough, with dates the gate has never seen", () => {
    const instance = `checkin: 2031-03-04
checkout: 2031-03-19
party_size: 2
home_currency: EUR
`;
    const violations = checkInstanceShape("docs/notes.yaml", instance);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("trip instance");
  });

  test("two instance keys stay below the threshold", () => {
    expect(checkInstanceShape("docs/notes.yaml", "checkin: 2031-03-04\nparty_size: 2\n")).toEqual([]);
  });

  test("a published demo trip is exempt by design", () => {
    const demo = `checkin: 2031-09-03
checkout: 2031-09-15
party_size: 2
home_currency: EUR
`;
    expect(checkInstanceShape("trips/demo-copenhagen.yaml", demo)).toEqual([]);
  });
});

describe("the gate keeps trips/ closed", () => {
  test("a real trip tracked under trips/ is refused", () => {
    const violations = checkTripsDirectory("trips/my-actual-trip.yaml");
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toContain("only demo-");
  });

  test("the demo, the readme and the ignore file are allowed", () => {
    expect(checkTripsDirectory("trips/demo-copenhagen.yaml")).toEqual([]);
    expect(checkTripsDirectory("trips/README.md")).toEqual([]);
    expect(checkTripsDirectory("trips/.gitignore")).toEqual([]);
  });
});

describe("the lexical backstop catches the known window", () => {
  /**
   * Built from the encoded list rather than written in clear text: spelling a
   * protected fragment here would defeat the gate inside its own test suite.
   */
  const knownFragment = encoded[0] ?? "";

  test("a document carrying a protected fragment is refused", () => {
    const violations = checkEncodedPatterns("docs/plan.md", `Departure on ${knownFragment}.`, encoded);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(1);
  });

  test("a pack comment tying the city to a stay is refused", () => {
    const phrase = packOnly[0] ?? "";
    const pack = `# The ${phrase} contains two closures.\nslug: copenhagen\n`;
    expect(checkPackComments("data/cities/copenhagen.yaml", pack, [...encoded, ...packOnly])).toHaveLength(1);
  });

  test("the pattern files are exempt, or the gate would flag its own source", () => {
    expect(checkEncodedPatterns("tools/ci/trip-patterns.b64", knownFragment, encoded)).toEqual([]);
    expect(checkEncodedPatterns("tools/ci/pack-comment-patterns.b64", knownFragment, encoded)).toEqual([]);
  });
});

/**
 * Regression tests for the gate's first real run, which raised ten violations
 * and every one was false. Both causes are pinned here: without these, the
 * noise returns and the next person routes around the gate instead of fixing it.
 */
describe("the gate stays silent on legitimate work", () => {
  test("prose may name a stay window in order to forbid one", () => {
    const doc = "A pack comment must never reference a stay window.";
    expect(checkEncodedPatterns("AGENTS.md", doc, encoded)).toEqual([]);
  });

  test("domain vocabulary outside a pack comment is not a violation", () => {
    const phrase = packOnly[0] ?? "";
    expect(checkEncodedPatterns("docs/specs/phases.md", `On ${phrase} handling.`, encoded)).toEqual([]);
  });

  test("a source file holding instance-shaped fixtures is not an instance", () => {
    const source = `const fixture = \`
checkin: 2031-03-04
checkout: 2031-03-19
party_size: 2
home_currency: EUR
\`;`;
    expect(checkInstanceShape("tests/some.test.ts", source)).toEqual([]);
  });

  test("but the same content in a data file still is one", () => {
    const data = "checkin: 2031-03-04\ncheckout: 2031-03-19\nparty_size: 2\n";
    expect(checkInstanceShape("config/whatever.yaml", data)).toHaveLength(1);
  });
});
