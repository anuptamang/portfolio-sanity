/* eslint-disable no-console */
/**
 * Patch audioLinks onto existing book documents in Sanity.
 *
 * Usage: npm run seed-audio
 */

const fs = require("fs");
const path = require("path");
const sanityClient = require("@sanity/client");
const {
  loadEnvFile,
  slugify,
  normalizeAudioLinks,
  loadAudioCatalog,
} = require("./pdf-utils");

loadEnvFile();

const projectId = process.env.SANITY_PROJECT_ID || "o5lg176f";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const catalogPath = path.join(__dirname, "master-library.json");
const audioPath = path.join(__dirname, "book-audio.json");

if (!token) {
  console.error("\nMissing SANITY_WRITE_TOKEN.\n");
  process.exit(1);
}

if (!fs.existsSync(audioPath)) {
  console.error(`\nMissing ${audioPath}. Run npm run resolve-audio first.\n`);
  process.exit(1);
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  apiVersion: "2021-03-25",
  useCdn: false,
});

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const audioBooks = loadAudioCatalog();

  console.log(
    `Patching audioLinks on "${projectId}/${dataset}" (${catalog.books.length} books)\n`
  );

  let patched = 0;

  for (const entry of catalog.books) {
    const links = normalizeAudioLinks(audioBooks[entry.title]);
    if (!links) continue;

    const id = `book-${slugify(entry.title)}`;
    await client.patch(id).set({ audioLinks: links }).commit();
    patched++;
    console.log(`patched ${entry.title}`);
  }

  console.log(`\nDone. ${patched} books updated with audio links.`);
}

main().catch((err) => {
  console.error("\nseed-audio failed:", err.message);
  process.exit(1);
});
