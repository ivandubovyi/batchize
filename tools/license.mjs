#!/usr/bin/env node
// Batchize license keys. ECDSA P-256 signatures, verified offline in the
// browser, so selling Pro needs no server and no database. The private key
// lives OUTSIDE this repository and must never be committed.
//
//   node tools/license.mjs keygen                 # once, ever
//   node tools/license.mjs issue you@example.com ORDER-123
//   node tools/license.mjs verify BATCHIZE-PRO-...
//
import { webcrypto as crypto } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const KEYFILE = process.env.BATCHIZE_LICENSE_KEY_FILE
  ?? join(homedir(), ".batchize-license-key.json");

const ALG = { name: "ECDSA", namedCurve: "P-256" };
const SIGN = { name: "ECDSA", hash: "SHA-256" };
const PREFIX = "BATCHIZE-PRO-";

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const unb64u = (s) => new Uint8Array(Buffer.from(s, "base64url"));

async function keygen() {
  const pair = await crypto.subtle.generateKey(ALG, true, ["sign", "verify"]);
  const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  await writeFile(KEYFILE, JSON.stringify({ private: priv, public: pub }, null, 2), { mode: 0o600 });
  console.log(`Private key written to ${KEYFILE} (mode 600). Back this up. If you`);
  console.log(`lose it you cannot issue keys; if it leaks anyone can.\n`);
  console.log(`Paste this into src/lib/license.ts as PUBLIC_KEY_JWK:\n`);
  console.log(JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, null, 2));
}

async function loadPrivate() {
  let file;
  try {
    file = JSON.parse(await readFile(KEYFILE, "utf8"));
  } catch {
    console.error(`No key file at ${KEYFILE}. Run: node tools/license.mjs keygen`);
    process.exit(1);
  }
  return crypto.subtle.importKey("jwk", file.private, ALG, false, ["sign"]);
}

async function issue(email, order) {
  if (!email) { console.error("usage: issue <email> [orderId]"); process.exit(1); }
  const key = await loadPrivate();
  const payload = { e: email, o: order ?? "", d: new Date().toISOString().slice(0, 10) };
  const body = b64u(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64u(new Uint8Array(await crypto.subtle.sign(SIGN, key, new TextEncoder().encode(body))));
  console.log(`${PREFIX}${body}.${sig}`);
}

async function verify(licence) {
  let file;
  try { file = JSON.parse(await readFile(KEYFILE, "utf8")); } catch {
    console.error(`No key file at ${KEYFILE}.`); process.exit(1);
  }
  const pub = await crypto.subtle.importKey("jwk", file.public, ALG, false, ["verify"]);
  const raw = (licence ?? "").trim().replace(PREFIX, "");
  const [body, sig] = raw.split(".");
  if (!body || !sig) { console.log("INVALID (malformed)"); process.exit(1); }
  const ok = await crypto.subtle.verify(SIGN, pub, unb64u(sig), new TextEncoder().encode(body));
  if (!ok) { console.log("INVALID (bad signature)"); process.exit(1); }
  console.log("VALID", JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "keygen") await keygen();
else if (cmd === "issue") await issue(rest[0], rest[1]);
else if (cmd === "verify") await verify(rest[0]);
else { console.error("usage: license.mjs keygen | issue <email> [order] | verify <key>"); process.exit(1); }
