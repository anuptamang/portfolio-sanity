/* eslint-disable no-console */
/**
 * Library seeder for the Sanity dataset.
 *
 * Identity + clean categories come from scripts/master-library.json (title,
 * author, category). Everything else is enriched from the Open Library API:
 *   search    -> work key, first published year, ISBN, page count
 *   work      -> description (summary), subjects
 *   editions  -> latest edition year + latest edition cover (prefers newest
 *                English edition that has a cover, so covers look modern)
 *   authors   -> biography + author photo
 *
 * Idempotent: deterministic _ids + createOrReplace. Cover images and author
 * photos are re-uploaded only when missing (tracked by a source marker), so
 * re-runs are cheap. Managed docs no longer in the catalog are removed.
 *
 * NOTE: deterministic _ids must NOT contain dots (public read grant uses
 * `_id in path("*")`, which excludes dotted ids). We use hyphens.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx npm run seed
 *   SANITY_WRITE_TOKEN=xxxxx npm run seed -- --no-images
 *   SANITY_WRITE_TOKEN=xxxxx npm run seed -- --refresh-covers   # re-fetch covers
 */

const fs = require("fs");
const path = require("path");
const sanityClient = require("@sanity/client");
const {
  loadAuthorProfiles,
  applyAuthorContent,
} = require("./author-utils");

loadEnvFile();

const projectId = process.env.SANITY_PROJECT_ID || "o5lg176f";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const withImages = !process.argv.includes("--no-images");
const refreshCovers = process.argv.includes("--refresh-covers");
const sourcePath =
  process.env.SEED_SOURCE || path.join(__dirname, "master-library.json");

if (!token) {
  console.error(
    "\nMissing SANITY_WRITE_TOKEN.\n" +
      "Create an Editor token at https://www.sanity.io/manage (project > API > Tokens)\n" +
      "then run:  SANITY_WRITE_TOKEN=xxxxx npm run seed\n"
  );
  process.exit(1);
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  apiVersion: "2021-03-25",
  useCdn: false,
});

const MANAGED_TYPES = ["book", "bookAuthor", "bookCategory"];

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function loadEnvFile() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
    raw.split("\n").forEach((line) => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
      }
    });
  } catch (err) {
    // optional
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      console.warn(`  retry ${label} (${i}/${attempts - 1}): ${err.message}`);
      await sleep(i * 1500);
    }
  }
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['".,():/]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function splitAuthors(field) {
  return field
    .split(/\s*&\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toParagraphs(text) {
  if (!text) return [];
  // Open Library descriptions sometimes append a source link after "----".
  const cleaned = decodeEntities(String(text)).split(/\n-{3,}|\(\[source\]/)[0];
  return cleaned
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// Heuristic: is a description usable English prose? Open Library frequently
// returns descriptions in other languages or for the wrong edition/book.
function isUsableEnglish(text) {
  if (!text) return false;
  const t = String(text);
  if (t.length < 40) return false;
  // Non-Latin scripts (Cyrillic, CJK, Devanagari, Arabic) -> reject.
  if (/[\u0400-\u04FF\u0900-\u097F\u0600-\u06FF\u3000-\u9FFF]/.test(t)) return false;
  // Explicit foreign-language source markers Open Library sometimes adds.
  if (/-language description/i.test(t)) return false;
  // Accented-letter ratio: English prose has very few accented characters.
  const letters = (t.match(/[A-Za-zÀ-ÿ]/g) || []).length || 1;
  const accented = (t.match(/[À-ÿ]/g) || []).length;
  if (accented / letters > 0.03) return false;
  // Common non-English stopwords as a final guard.
  const low = " " + t.toLowerCase().replace(/[^a-zñ ]/g, " ") + " ";
  const foreign = [
    " het ", " een ", " van ", " und ", " der ", " die ", " das ", " ist ",
    " nicht ", " auch ", " les ", " une ", " est ", " avec ", " pour ",
    " por ", " que ", " los ", " las ", " del ", " con ", " una ", " como ",
    " più ", " della ", " sono ",
  ];
  let hits = 0;
  for (const w of foreign) if (low.includes(w)) hits++;
  return hits < 2;
}

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

const paragraphsToBlocks = (ps) => ps.map(ptBlock);

function reference(id) {
  return { _type: "reference", _ref: id, _key: id };
}

async function fetchJson(url) {
  return withRetry(
    async () => {
      const res = await fetch(url, {
        headers: { "User-Agent": "portfolio-seed/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    `GET ${url.slice(0, 60)}`,
    3
  );
}

async function urlExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function uploadImageFromUrl(url, filename) {
  const res = await fetch(url, {
    headers: { "User-Agent": "portfolio-seed/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1500) throw new Error("image too small / placeholder");
  const asset = await withRetry(
    () => client.assets.upload("image", buffer, { filename }),
    `upload ${filename}`
  );
  return asset._id;
}

// ---------------------------------------------------------------------------
// Open Library enrichment
// ---------------------------------------------------------------------------

async function enrichBook(title, author) {
  const fields =
    "key,cover_i,first_publish_year,isbn,number_of_pages_median,subject";
  const queries = [
    `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`,
    `title=${encodeURIComponent(title)}`,
  ];

  let doc = null;
  for (const q of queries) {
    try {
      const data = await fetchJson(
        `https://openlibrary.org/search.json?${q}&limit=1&fields=${fields}`
      );
      doc = data.docs && data.docs[0];
      if (doc) break;
    } catch (err) {
      // try next
    }
    await sleep(250);
  }
  if (!doc) return null;

  const result = {
    workKey: doc.key || null,
    firstYear: doc.first_publish_year || null,
    latestYear: null,
    pages: doc.number_of_pages_median || null,
    isbn: (doc.isbn && doc.isbn[0]) || null,
    description: null,
    subjects: doc.subject || [],
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null,
  };

  // Work details: description.
  if (doc.key) {
    try {
      const work = await fetchJson(`https://openlibrary.org${doc.key}.json`);
      result.description =
        typeof work.description === "string"
          ? work.description
          : work.description && work.description.value;
    } catch (err) {
      // ignore
    }

    // Editions: find the newest edition (prefer English) that has a cover.
    try {
      const ed = await fetchJson(
        `https://openlibrary.org${doc.key}/editions.json?limit=400`
      );
      const entries = (ed.entries || [])
        .map((e) => {
          const ym = (e.publish_date || "").match(/\d{4}/);
          const eng =
            !e.languages ||
            e.languages.some((l) => l.key === "/languages/eng");
          return {
            year: ym ? parseInt(ym[0], 10) : 0,
            cover: e.covers && e.covers[0],
            eng,
            isbn: (e.isbn_13 || e.isbn_10 || [])[0] || null,
            pages: e.number_of_pages || null,
          };
        })
        .filter((e) => e.year > 0);

      const years = entries.map((e) => e.year);
      if (years.length) result.latestYear = Math.max(...years);

      const coverPicks = entries
        .filter((e) => e.cover)
        .sort((a, b) => {
          if (a.eng !== b.eng) return a.eng ? -1 : 1; // English first
          return b.year - a.year; // then newest
        });
      // Take newest English cover; if none English, newest overall.
      const englishCovers = coverPicks
        .filter((e) => e.eng)
        .sort((a, b) => b.year - a.year);
      const pick = englishCovers[0] || coverPicks.sort((a, b) => b.year - a.year)[0];
      if (pick) {
        result.coverUrl = `https://covers.openlibrary.org/b/id/${pick.cover}-L.jpg`;
        if (pick.isbn && !result.isbn) result.isbn = pick.isbn;
        if (pick.pages && !result.pages) result.pages = pick.pages;
      }
    } catch (err) {
      // keep search cover
    }
  }

  return result;
}

async function googleBooksFallback(title, author) {
  const q = `intitle:${title}${author ? `+inauthor:${author}` : ""}`;
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
    `&maxResults=1&printType=books`;
  try {
    const data = await fetchJson(url);
    const v = data.items && data.items[0] && data.items[0].volumeInfo;
    if (!v) return null;
    let thumb =
      v.imageLinks &&
      (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail);
    if (thumb) thumb = thumb.replace(/^http:/, "https:").replace(/&edge=curl/, "");
    const ym = (v.publishedDate || "").match(/\d{4}/);
    return {
      coverUrl: thumb || null,
      description: v.description || null,
      pages: v.pageCount || null,
      year: ym ? parseInt(ym[0], 10) : null,
    };
  } catch (err) {
    return null;
  }
}

const authorCache = new Map();

async function enrichAuthor(name) {
  if (authorCache.has(name)) return authorCache.get(name);
  const out = { bio: null, photoUrl: null };
  const profiles = loadAuthorProfiles();
  const profile = profiles[name];
  if (profile) {
    out.bio = profile.bio || null;
    out.career = profile.career || null;
    out.achievements = profile.achievements || null;
    out.description = profile.description || null;
    out.wikipediaUrl = profile.wikipediaUrl || null;
    out.photoUrl = profile.photoUrl || null;
    authorCache.set(name, out);
    return out;
  }
  try {
    const search = await fetchJson(
      `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(
        name
      )}&limit=1`
    );
    const doc = search.docs && search.docs[0];
    if (doc && doc.key) {
      const details = await fetchJson(
        `https://openlibrary.org/authors/${doc.key}.json`
      );
      out.bio =
        typeof details.bio === "string"
          ? details.bio
          : details.bio && details.bio.value;
      const photoId =
        (details.photos || []).find((p) => p > 0) ||
        (doc.photos || []).find((p) => p > 0);
      if (photoId) {
        out.photoUrl = `https://covers.openlibrary.org/a/id/${photoId}-L.jpg`;
      } else {
        const olidUrl = `https://covers.openlibrary.org/a/olid/${doc.key}-L.jpg?default=false`;
        if (await urlExists(olidUrl)) out.photoUrl = olidUrl;
      }
    }
  } catch (err) {
    // ignore
  }
  authorCache.set(name, out);
  return out;
}

// ---------------------------------------------------------------------------
// Catalog model (clean categories from the JSON)
// ---------------------------------------------------------------------------

function loadCatalog() {
  const catalog = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (!Array.isArray(catalog.books)) throw new Error("catalog has no books");
  return catalog;
}

function loadOverrides() {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "overrides.json"), "utf8")
    );
    return { books: data.books || {}, authors: data.authors || {} };
  } catch (err) {
    console.warn("  no overrides.json found, continuing without it");
    return { books: {}, authors: {} };
  }
}

function loadPdfCatalog() {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "book-pdfs.json"), "utf8")
    );
    return data.books || {};
  } catch (err) {
    return {};
  }
}

function loadAudioCatalog() {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "book-audio.json"), "utf8")
    );
    return data.books || {};
  } catch (err) {
    return {};
  }
}

function normalizePdfLinks(entry, ov = {}) {
  const links = ov.pdfLinks || entry?.pdfLinks;
  if (Array.isArray(links) && links.length > 0) {
    return links
      .filter((link) => link && link.url)
      .map((link) => ({
        label: link.label || "Read Book",
        url: link.url,
      }));
  }
  const url = ov.pdfUrl || entry?.pdfUrl;
  if (url) return [{ label: "Read Book", url }];
  return null;
}

function normalizeAudioLinks(entry, ov = {}) {
  const links = ov.audioLinks || entry?.audioLinks;
  if (Array.isArray(links) && links.length > 0) {
    return links
      .filter((link) => link && link.url)
      .map((link) => ({
        label: link.label || "Listen",
        url: link.url,
      }));
  }
  const url = ov.audioUrl || entry?.audioUrl;
  if (url) return [{ label: "Listen", url }];
  return null;
}

function buildModel(catalog) {
  const categoryIds = new Map();
  const authorIds = new Map();
  const ensureCategory = (slug) => {
    if (!categoryIds.has(slug)) categoryIds.set(slug, `bookCategory-${slug}`);
    return categoryIds.get(slug);
  };
  const ensureAuthor = (n) => {
    if (!authorIds.has(n)) {
      authorIds.set(n, { _id: `bookAuthor-${slugify(n)}`, name: n, slug: slugify(n) });
    }
    return authorIds.get(n);
  };

  (catalog.categories || []).forEach((s) => ensureCategory(slugify(s)));

  const books = catalog.books.map((entry) => {
    const slug = slugify(entry.title);
    const catSlugs = (
      Array.isArray(entry.categories) ? entry.categories : [entry.category]
    )
      .filter(Boolean)
      .map(slugify);
    catSlugs.forEach(ensureCategory);
    const authors = splitAuthors(entry.author).map(ensureAuthor);
    const pdfLinks = normalizePdfLinks(entry);
    return {
      _id: `book-${slug}`,
      slug,
      title: entry.title,
      rawAuthor: entry.author,
      authorRefs: authors.map((a) => a._id),
      categoryRefs: catSlugs.map((c) => `bookCategory-${c}`),
      ...(pdfLinks ? { pdfLinks } : {}),
    };
  });

  const categories = Array.from(categoryIds.entries()).map(([slug, _id]) => ({
    _id,
    slug,
    title: titleCase(slug),
  }));
  const authors = Array.from(authorIds.values());
  return { categories, authors, books };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  const catalog = loadCatalog();
  const overrides = loadOverrides();
  const pdfCatalog = loadPdfCatalog();
  const audioCatalog = loadAudioCatalog();
  const authorProfiles = loadAuthorProfiles();
  const { categories, authors, books } = buildModel(catalog);

  console.log(
    `Seeding "${projectId}/${dataset}" from ${path.basename(sourcePath)} ` +
      `(images: ${withImages ? "on" : "off"}${refreshCovers ? ", refresh" : ""})\n` +
      `catalog: ${categories.length} categories, ${authors.length} authors, ` +
      `${books.length} books\n`
  );

  const desiredIds = new Set();

  // Categories
  for (const cat of categories) {
    desiredIds.add(cat._id);
    await withRetry(
      () =>
        client.createOrReplace({
          _id: cat._id,
          _type: "bookCategory",
          title: cat.title,
        }),
      `category ${cat.title}`
    );
  }
  console.log(`categories ${categories.length} upserted`);

  // Authors (bio + photo)
  for (const author of authors) {
    desiredIds.add(author._id);
    const existing = await withRetry(
      () =>
        client.fetch(`*[_id == $id][0]{ "ref": photo.asset._ref }`, {
          id: author._id,
        }),
      `fetch ${author.name}`
    );

    const info = await enrichAuthor(author.name);
    const ov = overrides.authors[author.name] || {};
    const profile = authorProfiles[author.name] || {};
    const doc = applyAuthorContent(
      {
        _id: author._id,
        _type: "bookAuthor",
        name: author.name,
        slug: { _type: "slug", current: author.slug },
      },
      { ...profile, ...info },
      ov
    );

    if (withImages) {
      const photoUrl = info.photoUrl || ov.photoUrl;
      if (existing && existing.ref && !refreshCovers) {
        doc.photo = { _type: "image", asset: { _type: "reference", _ref: existing.ref } };
      } else if (photoUrl) {
        try {
          const assetId = await uploadImageFromUrl(
            photoUrl,
            `author-${author.slug}.jpg`
          );
          doc.photo = { _type: "image", asset: { _type: "reference", _ref: assetId } };
        } catch (err) {
          if (existing && existing.ref) {
            doc.photo = {
              _type: "image",
              asset: { _type: "reference", _ref: existing.ref },
            };
          }
        }
      } else if (existing && existing.ref) {
        doc.photo = { _type: "image", asset: { _type: "reference", _ref: existing.ref } };
      }
    }

    await withRetry(() => client.createOrReplace(doc), `author ${author.name}`);
    console.log(
      `author     ${author.name}${doc.bio ? " (bio)" : ""}${
        doc.career ? " (career)" : ""
      }${doc.achievements ? " (achievements)" : ""}${
        doc.nationality ? " (nat)" : ""
      }${doc.photo ? " (photo)" : ""}`
    );
    await sleep(120);
  }

  // Books (full enrichment)
  for (const book of books) {
    desiredIds.add(book._id);
    const existing = await withRetry(
      () =>
        client.fetch(`*[_id == $id][0]{ "ref": cover.asset._ref, pdfLinks, audioLinks }`, {
          id: book._id,
        }),
      `fetch ${book.title}`
    );

    const primaryAuthor = splitAuthors(book.rawAuthor)[0] || "";
    const meta = (await enrichBook(book.title, primaryAuthor)) || {};
    const ov = {
      ...(overrides.books[book.title] || {}),
      ...(pdfCatalog[book.title]
        ? { pdfLinks: pdfCatalog[book.title] }
        : {}),
      ...(audioCatalog[book.title]
        ? { audioLinks: audioCatalog[book.title] }
        : {}),
    };

    // Discard non-English descriptions from Open Library (wrong language/edition).
    if (meta.description && !isUsableEnglish(meta.description)) {
      meta.description = null;
    }

    // When Open Library lacks a cover or usable description, try Google Books.
    if (!meta.coverUrl || !meta.description) {
      const gb = await googleBooksFallback(book.title, primaryAuthor);
      if (gb) {
        if (!meta.coverUrl && gb.coverUrl) meta.coverUrl = gb.coverUrl;
        if (!meta.description && gb.description && isUsableEnglish(gb.description))
          meta.description = gb.description;
        if (!meta.pages && gb.pages) meta.pages = gb.pages;
        if (!meta.firstYear && gb.year) meta.firstYear = gb.year;
      }
    }

    const doc = {
      _id: book._id,
      _type: "book",
      title: book.title,
      slug: { _type: "slug", current: book.slug },
      authors: book.authorRefs.map(reference),
      categories: book.categoryRefs.map(reference),
    };
    const year = meta.firstYear || ov.publishedYear;
    if (year) doc.publishedYear = year;
    if (meta.latestYear) doc.latestEditionYear = meta.latestYear;
    const pages = meta.pages || ov.pages;
    if (pages) doc.pages = pages;
    const isbn = meta.isbn || ov.isbn;
    if (isbn) doc.isbn = isbn;
    const description = meta.description || ov.summary;
    if (description) doc.summary = paragraphsToBlocks(toParagraphs(description));

    const pdfLinks =
      normalizePdfLinks(null, ov) || book.pdfLinks || existing?.pdfLinks;
    if (pdfLinks?.length) doc.pdfLinks = pdfLinks;

    const audioLinks =
      normalizeAudioLinks(null, ov) || existing?.audioLinks;
    if (audioLinks?.length) doc.audioLinks = audioLinks;

    if (withImages) {
      const coverUrl = meta.coverUrl || ov.coverUrl;
      if (existing && existing.ref && !refreshCovers) {
        doc.cover = {
          _type: "image",
          asset: { _type: "reference", _ref: existing.ref },
        };
      } else if (coverUrl) {
        try {
          const assetId = await uploadImageFromUrl(coverUrl, `${book.slug}.jpg`);
          doc.cover = {
            _type: "image",
            asset: { _type: "reference", _ref: assetId },
          };
        } catch (err) {
          if (existing && existing.ref) {
            doc.cover = {
              _type: "image",
              asset: { _type: "reference", _ref: existing.ref },
            };
          }
          console.warn(`  cover skip ${book.title}: ${err.message}`);
        }
      } else if (existing && existing.ref) {
        doc.cover = {
          _type: "image",
          asset: { _type: "reference", _ref: existing.ref },
        };
      }
    }

    await withRetry(() => client.createOrReplace(doc), `book ${book.title}`);
    console.log(
      `book       ${book.title} -> ${doc.publishedYear || "?"}${
        doc.latestEditionYear ? `/${doc.latestEditionYear}` : ""
      }, ${doc.pages || "?"}p${doc.summary ? ", summary" : ""}${
        doc.cover ? ", cover" : ""
      }${doc.pdfLinks?.length ? ", pdf" : ""}${doc.audioLinks?.length ? ", audio" : ""}`
    );
    await sleep(150);
  }

  // Library page singleton
  await withRetry(
    () =>
      client.createOrReplace({
        _id: "library",
        _type: "library",
        title: "Library",
        intro: [
          ptBlock(
            "A curated collection of the books I have read, spanning investing, " +
              "trading, finance, science, psychology, and spirituality. Browse by " +
              "category or explore an author to see their work."
          ),
        ],
      }),
    "library page"
  );
  console.log(`page       library`);

  // Cleanup stale managed docs
  const staleIds = await client.fetch(
    `*[_type in $types && !(_id in $keep)]._id`,
    { types: MANAGED_TYPES, keep: Array.from(desiredIds) }
  );
  if (staleIds.length > 0) {
    let tx = client.transaction();
    staleIds.forEach((id) => (tx = tx.delete(id)));
    await withRetry(() => tx.commit(), "cleanup stale");
    console.log(`cleanup    removed ${staleIds.length} stale documents`);
  }

  console.log("\nDone.");
}

seed().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
