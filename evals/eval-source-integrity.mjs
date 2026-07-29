// A regex that silently does nothing is worse than a missing one, because the
// tests still pass and the finding just never fires.
//
// This exists because it happened: an editing script wrote `\b` through a
// non-raw string, turning every regex word boundary into a literal backspace
// byte (0x08). The source still read correctly in an editor, the regex still
// printed correctly with String(), and the primacy-claim check was dead in the
// shipped build for two deploys. Only a corpus case caught it.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOTS = ["src", "scripts"];
// Control characters that have no business in source and are invisible when
// they land inside a regex literal.
const FORBIDDEN = [
  [0x08, "\\b (backspace) - a regex word boundary eaten by a non-raw string"],
  [0x07, "\\a (bell)"],
  [0x0c, "\\f (form feed)"],
  [0x0b, "\\v (vertical tab)"],
  [0x00, "NUL"],
];

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx|mjs|js)$/.test(e.name)) yield p;
  }
}

let bad = 0;
let scanned = 0;
for (const root of ROOTS) {
  for await (const file of walk(root)) {
    scanned++;
    const buf = await readFile(file);
    for (const [byte, label] of FORBIDDEN) {
      let idx = buf.indexOf(byte);
      while (idx !== -1) {
        const line = buf.slice(0, idx).toString("utf8").split("\n").length;
        console.log(`FAIL ${file}:${line} contains a raw ${label}`);
        bad++;
        idx = buf.indexOf(byte, idx + 1);
      }
    }
  }
}

console.log(
  bad
    ? `\n${bad} corrupted byte${bad === 1 ? "" : "s"} in source`
    : `PASS no control-character corruption in ${scanned} source files`
);
process.exit(bad ? 1 : 0);
