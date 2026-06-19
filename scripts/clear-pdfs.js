/* eslint-disable no-console */
/**
 * Remove pdfLinks from all books in Sanity (use before re-seeding validated links).
 *
 * Usage: npm run clear-pdfs
 */

const sanityClient = require("@sanity/client");
const { loadEnvFile } = require("./pdf-utils");

loadEnvFile();

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error("\nMissing SANITY_WRITE_TOKEN.\n");
  process.exit(1);
}

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID || "o5lg176f",
  dataset: process.env.SANITY_DATASET || "production",
  token,
  apiVersion: "2021-03-25",
  useCdn: false,
});

async function main() {
  const ids = await client.fetch(`*[_type == "book" && defined(pdfLinks)]._id`);
  if (!ids.length) {
    console.log("No pdfLinks to clear.");
    return;
  }
  let tx = client.transaction();
  ids.forEach((id) => {
    tx = tx.patch(id, (p) => p.unset(["pdfLinks"]));
  });
  await tx.commit();
  console.log(`Cleared pdfLinks from ${ids.length} books.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
