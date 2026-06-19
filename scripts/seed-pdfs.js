/* eslint-disable no-console */
/**
 * Patch pdfLinks onto existing book documents in Sanity (fast — no re-enrichment).
 *
 * Usage: npm run seed-pdfs
 */

const fs = require("fs");
const path = require("path");
const sanityClient = require("@sanity/client");
const {
  loadEnvFile,
  slugify,
  normalizePdfLinks,
  loadPdfCatalog,
} = require("./pdf-utils");

loadEnvFile();

const projectId = process.env.SANITY_PROJECT_ID || "o5lg176f";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const catalogPath = path.join(__dirname, "master-library.json");
const pdfPath = path.join(__dirname, "book-pdfs.json");

if (!token) {
  console.error(
    "\nMissing SANITY_WRITE_TOKEN.\n" +
      "Create an Editor token at https://www.sanity.io/manage (project > API > Tokens)\n" +
      "then run:  SANITY_WRITE_TOKEN=xxxxx npm run seed-pdfs\n"
  );
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error(`\nMissing ${pdfPath}. Run npm run resolve-pdfs first.\n`);
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
  const pdfBooks = loadPdfCatalog();

  console.log(
    `Patching pdfLinks on "${projectId}/${dataset}" (${catalog.books.length} books in catalog)\n`
  );

  let patched = 0;
  let cleared = 0;
  let skipped = 0;

  for (const entry of catalog.books) {
    const links = normalizePdfLinks(pdfBooks[entry.title]);
    const id = `book-${slugify(entry.title)}`;

    if (!links) {
      skipped++;
      try {
        await client.patch(id).unset(["pdfLinks"]).commit();
        cleared++;
        console.log(`cleared ${entry.title}`);
      } catch (err) {
        // book may not exist yet
      }
      continue;
    }

    await client.patch(id).set({ pdfLinks: links }).commit();
    patched++;
    console.log(`patched ${entry.title}`);
  }

  console.log(
    `\nDone. ${patched} links set, ${cleared} stale links removed, ${skipped} without links.`
  );
}

main().catch((err) => {
  console.error("\nseed-pdfs failed:", err.message);
  process.exit(1);
});
