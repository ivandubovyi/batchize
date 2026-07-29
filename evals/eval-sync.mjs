// Sync decides what to overwrite, so its state machine is the one place a bug
// costs somebody an application rather than a rendering glitch.
import { fingerprint, describe } from "./sync.bundle.mjs";
let fail = 0;
const ck = (n, c, x = "") => { if (!c) fail++; console.log(`${c ? "PASS" : "FAIL"} ${n}${x ? " :: " + x : ""}`); };

// --- fingerprint --------------------------------------------------------
const a = { answers: { one_liner: "Stripe for freight invoices" } };
const b = { answers: { one_liner: "Stripe for freight invoices" } };
const c = { answers: { one_liner: "Stripe for freight invoice" } };

ck("same content, same fingerprint", fingerprint(a) === fingerprint(b));
ck("one character changes it", fingerprint(a) !== fingerprint(c));
ck("empty is stable", fingerprint({}) === fingerprint({}));
ck("empty differs from content", fingerprint({}) !== fingerprint(a));

// Key order matters to JSON.stringify, and the document is always built by the
// same code, so this is documenting the limit rather than asserting a bug.
const k1 = fingerprint({ x: 1, y: 2 });
const k2 = fingerprint({ y: 2, x: 1 });
ck("fingerprint is order sensitive (documented limit)", k1 !== k2, "built by one code path, so order is fixed");

// Two answers swapping content must not collide: a length-only hash would.
const s1 = fingerprint({ answers: { a: "hello", b: "world" } });
const s2 = fingerprint({ answers: { a: "world", b: "hello" } });
ck("swapped content is not a collision", s1 !== s2);

// A realistic long document changes when one late field changes.
const big = (v) => ({ answers: Object.fromEntries(
  Array.from({ length: 26 }, (_, i) => [`q${i}`, i === 25 ? v : "x".repeat(200)])) });
ck("a change in the last field is detected", fingerprint(big("a")) !== fingerprint(big("b")));

// --- status wording -----------------------------------------------------
const texts = {
  synced: describe({ kind: "synced", at: "2026-07-29T10:00:00Z" }),
  local: describe({ kind: "local-ahead" }),
  remote: describe({ kind: "remote-ahead", remoteAt: "2026-07-29T10:00:00Z", device: "Chrome on Mac" }),
  conflict: describe({ kind: "conflict", remoteAt: "2026-07-29T10:00:00Z", device: "Safari on iPhone" }),
  error: describe({ kind: "error", message: "network down" }),
};
console.log("\nstatus wording:");
for (const [k, v] of Object.entries(texts)) console.log(`  ${k.padEnd(9)} ${v}`);

ck("every status says something", Object.values(texts).every((t) => t && t.length > 10));
ck("conflict promises nothing was overwritten", /nothing has been overwritten/i.test(texts.conflict));
ck("remote-ahead names the device", texts.remote.includes("Chrome on Mac"));
ck("no status uses the word 'conflict' at the user", !/\bconflict\b/i.test(texts.conflict), texts.conflict.slice(0, 40));
ck("error surfaces the real message", texts.error.includes("network down"));

console.log(fail ? `\n${fail} FAILURES` : "\nALL PASS");
process.exit(fail ? 1 : 0);
