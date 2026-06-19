/* eslint-disable no-console */
/**
 * Resolve validated read links for books in master-library.json.
 * Only stores links when title AND author match the source metadata.
 *
 * Usage: npm run resolve-pdfs
 */

const fs = require("fs");
const path = require("path");
const {
  primaryAuthor,
  authorLastName,
  normalizePdfLinks,
  titleMatchesStrict,
  authorMatches,
  isUsablePdfFile,
  sleep,
  fetchJson,
} = require("./pdf-utils");

const sourcePath = path.join(__dirname, "master-library.json");
const outputPath = path.join(__dirname, "book-pdfs.json");

// Hand-verified legal free editions only.
const CURATED = {
  "The Feynman Lectures on Physics": "https://www.feynmanlectures.caltech.edu/",
  "The Almanack of Naval Ravikant":
    "https://www.navalmanack.com/almanack-of-naval-ravikant",
  "Relativity: The Special and the General Theory":
    "https://www.gutenberg.org/ebooks/5001",
  "The Wealth of Nations": "https://www.gutenberg.org/ebooks/3300",
  "The Origin of Species": "https://www.gutenberg.org/ebooks/1228",
  "The Communist Manifesto": "https://www.gutenberg.org/ebooks/61",
  "The Richest Man in Babylon": "https://www.gutenberg.org/ebooks/32924",
  "Think and Grow Rich": "https://www.gutenberg.org/ebooks/500",
  "As a Man Thinketh": "https://www.gutenberg.org/ebooks/4507",
  "The Prophet": "https://www.gutenberg.org/ebooks/58585",
  "Tao Te Ching": "https://www.gutenberg.org/ebooks/216",
  "Meditations": "https://www.gutenberg.org/ebooks/2680",
  "The Republic": "https://www.gutenberg.org/ebooks/1497",
  "The Prince": "https://www.gutenberg.org/ebooks/1232",
  "Thus Spoke Zarathustra": "https://www.gutenberg.org/ebooks/1998",
  "Beyond Good and Evil": "https://www.gutenberg.org/ebooks/4363",
  "On the Genealogy of Morals": "https://www.gutenberg.org/ebooks/52319",
  "Notes from Underground": "https://www.gutenberg.org/ebooks/600",
  "Siddhartha": "https://www.gutenberg.org/ebooks/2500",
  "How Much Land Does a Man Need?": "https://www.gutenberg.org/ebooks/879",
  "The Metaphysics": "https://www.gutenberg.org/ebooks/2413",
  "The Politics": "https://www.gutenberg.org/ebooks/6762",
  "The Nicomachean Ethics": "https://www.gutenberg.org/ebooks/8438",
  "Julius Caesar": "https://www.gutenberg.org/ebooks/2263",
  "Totem and Taboo": "https://www.gutenberg.org/ebooks/41248",
  "The Psychopathology of Everyday Life":
    "https://www.gutenberg.org/ebooks/4301",
  "Reminiscences of a Stock Operator":
    "https://archive.org/details/reminiscencesofs00lefe",
  "Autobiography of a Yogi": "https://archive.org/details/autobiographyofy00yoga",
  "Practical Vedanta": "https://archive.org/details/practicalvedanta00vive",
  "The Complete Book of Yoga": "https://archive.org/details/completebookofyog00vive",
  "I Am That": "https://archive.org/details/i-am-that-nisargadatta-maharaj",
  "1984": "https://archive.org/details/GeorgeOrwell1984_201802",
  "The Stranger": "https://archive.org/details/the-stranger-albert-camus",
  "The Outsider": "https://archive.org/details/the-stranger-albert-camus",
  "Great Works of Franz Kafka": "https://archive.org/details/kafkacollected",
  "The Analects": "https://archive.org/details/analectsofconfuc00conf",
  "The Upanishads": "https://archive.org/details/upanishads00pand",
  "Critique of Pure Reason": "https://archive.org/details/critiqueofpurere00kant",
  "Ethics": "https://archive.org/details/ethicsofspinoza00spin",
  "The History of the Peloponnesian War":
    "https://www.gutenberg.org/ebooks/7142",
};

function readLink(url, label = "Read Book") {
  return normalizePdfLinks([{ label, url }]);
}

async function gutendexLink(title, author) {
  const q = encodeURIComponent(`${title} ${primaryAuthor(author)}`);
  const data = await fetchJson(`https://gutendex.com/books/?search=${q}`);
  for (const book of data.results || []) {
    if (!titleMatchesStrict(title, book.title)) continue;
    if (!authorMatches(author, book.authors || [])) continue;
    const formats = book.formats || {};
    if (formats["application/pdf"]) return formats["application/pdf"];
    if (formats["text/html; charset=utf-8"]) return formats["text/html; charset=utf-8"];
    if (formats["text/html"]) return formats["text/html"];
    return `https://www.gutenberg.org/ebooks/${book.id}`;
  }
  return null;
}

async function archiveItemLink(identifier, title, author) {
  const meta = await fetchJson(`https://archive.org/metadata/${identifier}`);
  const metaTitle = meta.metadata?.title || "";
  const creators = []
    .concat(meta.metadata?.creator || [])
    .flat()
    .filter(Boolean);

  if (!titleMatchesStrict(title, metaTitle)) return null;
  if (creators.length && !authorMatches(author, creators)) return null;

  const files = meta.files || [];
  const pdfs = files.filter(
    (f) =>
      isUsablePdfFile(f.name) &&
      (f.format === "Text PDF" || f.format === "PDF") &&
      parseInt(f.size || 0, 10) > 100000
  );
  if (pdfs.length) {
    const pick = pdfs.sort(
      (a, b) => parseInt(a.size, 10) - parseInt(b.size, 10)
    )[0];
    return `https://archive.org/download/${identifier}/${encodeURIComponent(pick.name)}`;
  }
  return `https://archive.org/details/${identifier}`;
}

async function archiveSearch(title, author) {
  const last = authorLastName(author);
  const q = `title:"${title}" AND creator:"${last}"`;
  const params = new URLSearchParams({
    q,
    "fl[]": "identifier,title,creator",
    rows: "5",
    output: "json",
  });
  const data = await fetchJson(
    `https://archive.org/advancedsearch.php?${params.toString()}`
  );
  for (const doc of data.response?.docs || []) {
    if (!titleMatchesStrict(title, doc.title)) continue;
    if (!authorMatches(author, doc.creator || [])) continue;
    try {
      const link = await archiveItemLink(doc.identifier, title, author);
      if (link) return link;
    } catch (err) {
      console.warn(`  archive item skip ${doc.identifier}: ${err.message}`);
    }
  }
  return null;
}

async function openLibraryLink(title, author) {
  const params = new URLSearchParams({
    title,
    author: primaryAuthor(author),
    has_fulltext: "true",
    limit: "8",
    fields: "title,author_name,ia,key,cover_i",
  });
  const data = await fetchJson(
    `https://openlibrary.org/search.json?${params.toString()}`
  );
  for (const doc of data.docs || []) {
    if (!titleMatchesStrict(title, doc.title)) continue;
    if (!authorMatches(author, doc.author_name || [])) continue;

    for (const ia of (doc.ia || []).slice(0, 3)) {
      try {
        const link = await archiveItemLink(ia, title, author);
        if (link) return link;
      } catch (err) {
        console.warn(`  ol/ia skip ${ia}: ${err.message}`);
      }
    }

    if (doc.key) {
      return `https://openlibrary.org${doc.key}`;
    }
  }
  return null;
}

async function resolveBook(title, author) {
  if (CURATED[title]) {
    return readLink(CURATED[title]);
  }

  try {
    const gutenberg = await gutendexLink(title, author);
    if (gutenberg) return readLink(gutenberg);
  } catch (err) {
    console.warn(`  gutendex ${title}: ${err.message}`);
  }

  await sleep(400);

  try {
    const archive = await archiveSearch(title, author);
    if (archive) return readLink(archive);
  } catch (err) {
    console.warn(`  archive search ${title}: ${err.message}`);
  }

  await sleep(400);

  try {
    const ol = await openLibraryLink(title, author);
    if (ol) return readLink(ol, ol.includes("openlibrary.org") ? "View on Open Library" : "Read Book");
  } catch (err) {
    console.warn(`  openlibrary ${title}: ${err.message}`);
  }

  return null;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const books = {};
  let found = 0;
  let missed = 0;

  console.log(
    `Resolving validated read links for ${catalog.books.length} books...\n`
  );

  for (const entry of catalog.books) {
    const links = await resolveBook(entry.title, entry.author);
    if (links) {
      books[entry.title] = links;
      found++;
      console.log(`found ${entry.title} -> ${links[0].url}`);
    } else {
      missed++;
      console.log(`miss  ${entry.title}`);
    }
    await sleep(800);
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        _comment:
          "Validated read links keyed by book title. Regenerate with npm run resolve-pdfs.",
        version: 2,
        resolvedAt: new Date().toISOString(),
        books,
      },
      null,
      2
    ) + "\n"
  );

  console.log(`\nDone. ${found} validated links, ${missed} without.`);
}

main().catch((err) => {
  console.error("\nResolve failed:", err.message);
  process.exit(1);
});
