// Recomputes the CSP sha256 hashes for the inline <style> and <script> in index.html.
// Run after ANY change to the style or script block:  node tools/update-csp.js
// Without it the browser blocks the edited block and the page renders unstyled / inert.
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const file = path.join(__dirname, "..", "index.html");
// The HTML parser normalises CRLF to LF before hashing, so do the same.
const html = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");

function blockHash(tag) {
  // Anchor to tags at the start of a line so "<style>" mentioned in comments or strings is ignored.
  const re = new RegExp(`^<${tag}>([\\s\\S]*?)</${tag}>$`, "gm");
  const blocks = [...html.matchAll(re)];
  if (blocks.length !== 1) throw new Error(`Expected exactly one inline <${tag}>, found ${blocks.length}`);
  return crypto.createHash("sha256").update(blocks[0][1], "utf8").digest("base64");
}

const styleHash = blockHash("style");
const scriptHash = blockHash("script");

const out = html
  .replace(/style-src 'sha256-[^']*'/, `style-src 'sha256-${styleHash}'`)
  .replace(/script-src 'sha256-[^']*'/, `script-src 'sha256-${scriptHash}'`);

if (!out.includes(styleHash) || !out.includes(scriptHash)) throw new Error("CSP meta tag not found");
fs.writeFileSync(file, out);
console.log(`style-src  sha256-${styleHash}\nscript-src sha256-${scriptHash}`);
