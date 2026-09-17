/**
 * Trip-isolation gate — refuses any tracked file that carries, or lets one
 * reconstruct, a real trip instance (stay window, party, budget, lodging).
 *
 * Design constraint, measured before this file was written (phases §6): a gate
 * that merely greps for dates is mostly wrong. On the first city pack, three
 * captures out of four were calendar event dates — legitimate public facts, and
 * precisely the ones the pack is asked to carry. A noisy gate is disarmed by the
 * third person who works around it.
 *
 * Hence: structural checks first, lexical last. The structural rules catch the
 * shape of an instance regardless of the dates it holds; the lexical rule is a
 * backstop for one known window, and its patterns live base64-encoded in
 * `trip-patterns.b64` so this repository never spells them out.
 *
 * Exit code 0 when the tree is clean, 1 on the first category of violation.
 */

/** Literal fragments of an instance — forbidden in every tracked file. */
const TRIP_PATTERNS_FILE = new URL("./trip-patterns.b64", import.meta.url).pathname;

/**
 * Domain vocabulary — forbidden only inside a city pack comment.
 *
 * Kept separate after the first real run: applying these globally raised ten
 * violations, every one of them a false positive, because the specs and this
 * toolchain must be able to name a stay window in order to forbid one.
 */
const PACK_COMMENT_PATTERNS_FILE = new URL("./pack-comment-patterns.b64", import.meta.url).pathname;

/** Both pattern files quote what they forbid; scanning them would flag themselves. */
const PATTERN_FILES = new Set(["tools/ci/trip-patterns.b64", "tools/ci/pack-comment-patterns.b64"]);

/**
 * The shape rule reads data documents only. A source file legitimately holds
 * instance-shaped fixtures — the gate's own test suite does — and flagging it
 * would push contributors to weaken the rule. A real instance smuggled into a
 * source file is still caught by the literal-fragment rule below.
 */
const DATA_FILE = /\.(ya?ml|json)$/;

/**
 * Top-level keys that, together, make a document an instance rather than a
 * city fact. Any three of them in one file is a trip profile, whatever it is
 * called. Deliberately excludes `currency` and `calendar`, which belong to a
 * pack, and `nights` alone, which a skeleton may legitimately carry.
 */
const INSTANCE_KEYS = [
  "checkin",
  "checkout",
  "check_in",
  "check_out",
  "party",
  "party_size",
  "travellers",
  "home_currency",
  "budget_total",
  "accommodation_address",
  "lodging",
] as const;

const INSTANCE_KEY_THRESHOLD = 3;

/** Files under `trips/` allowed to be tracked. Everything else there is private. */
const TRIPS_ALLOWLIST = /^trips\/(\.gitignore|README\.md|demo-[a-z0-9-]+\.yaml)$/;

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly reason: string;
}

async function trackedFiles(): Promise<string[]> {
  const proc = Bun.spawn(["git", "ls-files"], { stdout: "pipe", stderr: "pipe" });
  const [out, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
  if (code !== 0) {
    throw new Error("git ls-files failed — is this a git repository?");
  }
  return out.split("\n").filter((path) => path.length > 0);
}

/**
 * Reads the *staged* content of a path, not the working copy.
 *
 * Found the hard way: an earlier version read from disk, and a file that was
 * staged and then deleted from the working tree became invisible to the gate.
 * It reported a clean tree while the index still held a trip instance — the one
 * failure mode a privacy gate may never have, since the index is what a commit
 * is made of. Reading the blob makes the gate check what is actually about to
 * be committed, and closes the `git add` / `rm` window entirely.
 *
 * Binary blobs are skipped: an identifier inside one would escape a text scan
 * anyway, and `git grep -I` draws the line at the same place.
 */
async function readStagedTextOrNull(path: string): Promise<string | null> {
  const proc = Bun.spawn(["git", "show", `:${path}`], { stdout: "pipe", stderr: "pipe" });
  const [text, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
  if (code !== 0) return null;
  return text.includes("\0") ? null : text;
}

async function loadPatternFile(path: string): Promise<string[]> {
  const raw = await Bun.file(path).text();
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => Buffer.from(line, "base64").toString("utf8").toLowerCase());
}

export async function loadEncodedPatterns(): Promise<string[]> {
  return loadPatternFile(TRIP_PATTERNS_FILE);
}

export async function loadPackCommentPatterns(): Promise<string[]> {
  return loadPatternFile(PACK_COMMENT_PATTERNS_FILE);
}

/** Rule 1 — a tracked data document shaped like a trip instance. */
export function checkInstanceShape(path: string, text: string): Violation[] {
  if (TRIPS_ALLOWLIST.test(path) || !DATA_FILE.test(path)) return [];

  const found = new Set<string>();
  for (const line of text.split("\n")) {
    const match = /^\s*([a-z_]+)\s*:/.exec(line);
    const key = match?.[1];
    if (key !== undefined && (INSTANCE_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
  }

  if (found.size < INSTANCE_KEY_THRESHOLD) return [];
  return [
    {
      file: path,
      line: 1,
      reason: `document shaped like a trip instance (${[...found].sort().join(", ")}) — instances live outside the repository`,
    },
  ];
}

/** Rule 2 — `trips/` holds nothing tracked but its own scaffolding and demos. */
export function checkTripsDirectory(path: string): Violation[] {
  if (!path.startsWith("trips/") || TRIPS_ALLOWLIST.test(path)) return [];
  return [
    {
      file: path,
      line: 1,
      reason: "tracked under trips/ but not a demo — only demo-*.yaml, README.md and .gitignore belong there",
    },
  ];
}

/**
 * Rule 3 — a pack comment must not tie the city to somebody's stay.
 *
 * The calendar itself is exempt by construction: this only reads comments, and
 * event dates are data. That exemption is what the accompanying test pins.
 */
export function checkPackComments(path: string, text: string, encoded: string[]): Violation[] {
  if (!path.startsWith("data/cities/")) return [];

  const violations: Violation[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const comment = /^\s*#(.*)$/.exec(line)?.[1]?.toLowerCase();
    if (comment === undefined) continue;
    for (const needle of encoded) {
      if (comment.includes(needle)) {
        violations.push({
          file: path,
          line: index + 1,
          reason: "pack comment references a stay window — a pack describes a city, never a traveller",
        });
        break;
      }
    }
  }
  return violations;
}

/** Rule 4 — lexical backstop on the known window, across every tracked file. */
export function checkEncodedPatterns(path: string, text: string, encoded: string[]): Violation[] {
  if (PATTERN_FILES.has(path)) return [];

  const violations: Violation[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const haystack = (lines[index] ?? "").toLowerCase();
    for (const needle of encoded) {
      if (haystack.includes(needle)) {
        violations.push({
          file: path,
          line: index + 1,
          reason: "literal fragment of a known trip instance",
        });
        break;
      }
    }
  }
  return violations;
}

export async function collectViolations(): Promise<Violation[]> {
  const [tripFragments, packComments] = await Promise.all([loadEncodedPatterns(), loadPackCommentPatterns()]);
  // A pack comment is fautive on either list: a literal date and the phrase
  // "our stay" disclose the same thing by different routes.
  const packNeedles = [...tripFragments, ...packComments];
  const violations: Violation[] = [];

  for (const path of await trackedFiles()) {
    violations.push(...checkTripsDirectory(path));

    const text = await readStagedTextOrNull(path);
    if (text === null) continue;

    violations.push(...checkInstanceShape(path, text));
    violations.push(...checkPackComments(path, text, packNeedles));
    violations.push(...checkEncodedPatterns(path, text, tripFragments));
  }

  return violations;
}

if (import.meta.main) {
  const violations = await collectViolations();
  if (violations.length === 0) {
    console.log("OK: no trip instance in tracked files.");
    process.exit(0);
  }
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line}: ${violation.reason}`);
  }
  console.error(`\n${violations.length} trip-isolation violation(s).`);
  process.exit(1);
}
