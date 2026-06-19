/* eslint-disable no-console */
/**
 * Patch missing book summaries from Google Books / Open Library.
 *
 * Usage: npm run seed-summaries
 */

const fs = require("fs");
const path = require("path");
const sanityClient = require("@sanity/client");
const {
  loadEnvFile,
  slugify,
  primaryAuthor,
  titleMatchesStrict,
  authorMatches,
  sleep,
  fetchJson,
} = require("./pdf-utils");

loadEnvFile();

const projectId = process.env.SANITY_PROJECT_ID || "o5lg176f";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const catalogPath = path.join(__dirname, "master-library.json");
const overridesPath = path.join(__dirname, "overrides.json");

if (!token) {
  console.error("\nMissing SANITY_WRITE_TOKEN.\n");
  process.exit(1);
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  apiVersion: "2021-03-25",
  useCdn: false,
});

function randomKey() {
  return Math.random().toString(36).slice(2, 12);
}

function ptBlock(text) {
  return {
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: randomKey(), text, marks: [] }],
  };
}

function toParagraphs(text) {
  if (!text) return [];
  return String(text)
    .replace(/<[^>]+>/g, " ")
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40);
}

function isUsableEnglish(text) {
  if (!text || text.length < 40) return false;
  if (/[\u0400-\u04FF\u0900-\u097F\u0600-\u06FF\u3000-\u9FFF]/.test(text)) {
    return false;
  }
  return true;
}

async function googleBooksSummary(title, author) {
  const q = `intitle:${title}+inauthor:${primaryAuthor(author)}`;
  const data = await fetchJson(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3&printType=books`
  );
  for (const item of data.items || []) {
    const v = item.volumeInfo || {};
    if (!titleMatchesStrict(title, v.title || "")) continue;
    if (!authorMatches(author, v.authors || [])) continue;
    if (v.description && isUsableEnglish(v.description)) return v.description;
  }
  return null;
}

async function openLibrarySummary(title, author) {
  const params = new URLSearchParams({
    title,
    author: primaryAuthor(author),
    limit: "3",
    fields: "title,author_name,key",
  });
  const data = await fetchJson(
    `https://openlibrary.org/search.json?${params.toString()}`
  );
  for (const doc of data.docs || []) {
    if (!titleMatchesStrict(title, doc.title)) continue;
    if (!authorMatches(author, doc.author_name || [])) continue;
    if (!doc.key) continue;
    try {
      const work = await fetchJson(`https://openlibrary.org${doc.key}.json`);
      const desc =
        typeof work.description === "string"
          ? work.description
          : work.description?.value;
      if (desc && isUsableEnglish(desc)) return desc;
    } catch (err) {
      // try next
    }
  }
  return null;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  const bookOverrides = overrides.books || {};

  const existing = await client.fetch(
    `*[_type == "book"]{ _id, title, "hasSummary": defined(summary) }`
  );
  const summaryMap = new Map(
    existing.map((b) => [b.title, b.hasSummary])
  );

  let patched = 0;
  let skipped = 0;

  console.log(`Patching summaries on "${projectId}/${dataset}"\n`);

  for (const entry of catalog.books) {
    if (summaryMap.get(entry.title)) {
      skipped++;
      continue;
    }

    const ovSummary = bookOverrides[entry.title]?.summary;
    let description = ovSummary || null;

    if (!description) {
      try {
        description = await googleBooksSummary(entry.title, entry.author);
      } catch (err) {
        console.warn(`  google ${entry.title}: ${err.message}`);
      }
    }

    if (!description) {
      await sleep(400);
      try {
        description = await openLibrarySummary(entry.title, entry.author);
      } catch (err) {
        console.warn(`  openlibrary ${entry.title}: ${err.message}`);
      }
    }

    if (!description) {
      console.log(`miss  ${entry.title}`);
      await sleep(200);
      continue;
    }

    const blocks = toParagraphs(description).map(ptBlock);
    if (!blocks.length) continue;

    const id = `book-${slugify(entry.title)}`;
    await client.patch(id).set({ summary: blocks }).commit();
    patched++;
    console.log(`patched ${entry.title}`);
    await sleep(300);
  }

  console.log(`\nDone. ${patched} summaries added, ${skipped} already had one.`);
}

main().catch((err) => {
  console.error("\nseed-summaries failed:", err.message);
  process.exit(1);
});
