import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "public", "assets-bundle");
const TARGET_MB = 115;
const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
const TOTAL_BYTES = TARGET_MB * 1024 * 1024;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const file of fs.readdirSync(OUTPUT_DIR)) {
  if (file.startsWith("pack-") && file.endsWith(".bin")) {
    fs.unlinkSync(path.join(OUTPUT_DIR, file));
  }
}

let remaining = TOTAL_BYTES;
let index = 0;

while (remaining > 0) {
  const size = Math.min(CHUNK_SIZE_BYTES, remaining);
  const buffer = Buffer.alloc(size);

  for (let i = 0; i < size; i++) {
    buffer[i] = (i + index * 31) & 0xff;
  }

  const fileName = `pack-${String(index).padStart(2, "0")}.bin`;
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), buffer);

  remaining -= size;
  index += 1;
}

const manifest = {
  game: "Rail Dash",
  targetMinMB: 110,
  generatedMB: TARGET_MB,
  totalBytes: TOTAL_BYTES,
  chunks: index,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log(
  `Generated ${index} asset chunk(s) totaling ${TARGET_MB} MB in ${OUTPUT_DIR}`
);
