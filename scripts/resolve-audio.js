/* eslint-disable no-console */
/**
 * Resolve validated audiobook / audio links for books in master-library.json.
 * Sources: LibriVox, Internet Archive audio, YouTube search fallback.
 *
 * Usage: npm run resolve-audio
 */

const fs = require("fs");
const path = require("path");
const {
  primaryAuthor,
  authorLastName,
  normalizeAudioLinks,
  titleMatchesStrict,
  authorMatches,
  sleep,
  fetchJson,
} = require("./pdf-utils");

const sourcePath = path.join(__dirname, "master-library.json");
const outputPath = path.join(__dirname, "book-audio.json");

function youtubeSearchLink(title, author) {
  const q = `${title} ${primaryAuthor(author)} audiobook`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

async function librivoxLinks(title, author) {
  const params = new URLSearchParams({ title, format: "json" });
  const data = await fetchJson(
    `https://librivox.org/api/feed/audiobooks?${params.toString()}`,
    { allow404: true }
  );
  if (!data?.books?.length) return null;

  for (const book of data.books) {
    if (!titleMatchesStrict(title, book.title)) continue;
    const lvAuthors = (book.authors || []).map(
      (a) => `${a.first_name || ""} ${a.last_name || ""}`.trim()
    );
    if (lvAuthors.length && !authorMatches(author, lvAuthors)) continue;

    const links = [];
    if (book.url_librivox) {
      links.push({ label: "Listen on LibriVox", url: book.url_librivox });
    }
    if (book.url_iarchive) {
      links.push({ label: "Listen on Internet Archive", url: book.url_iarchive });
    }
    if (book.url_project) {
      links.push({ label: "Listen (Community)", url: book.url_project });
    }
    return links.length ? normalizeAudioLinks(links) : null;
  }

  return null;
}

async function archiveAudioSearch(title, author) {
  const last = authorLastName(author);
  const q = `mediatype:audio AND title:"${title}" AND creator:"${last}"`;
  const params = new URLSearchParams({
    q,
    "fl[]": "identifier,title,creator,mediatype",
    rows: "5",
    output: "json",
  });
  const data = await fetchJson(
    `https://archive.org/advancedsearch.php?${params.toString()}`
  );

  for (const doc of data.response?.docs || []) {
    if (!titleMatchesStrict(title, doc.title)) continue;
    const creators = []
      .concat(doc.creator || [])
      .flat()
      .filter(Boolean);
    if (creators.length && !authorMatches(author, creators)) continue;

    return normalizeAudioLinks([
      {
        label: "Listen on Internet Archive",
        url: `https://archive.org/details/${doc.identifier}`,
      },
    ]);
  }
  return null;
}

async function openLibraryAudio(title, author) {
  const params = new URLSearchParams({
    title,
    author: primaryAuthor(author),
    has_fulltext: "true",
    limit: "6",
    fields: "title,author_name,ia",
  });
  const data = await fetchJson(
    `https://openlibrary.org/search.json?${params.toString()}`
  );

  for (const doc of data.docs || []) {
    if (!titleMatchesStrict(title, doc.title)) continue;
    if (!authorMatches(author, doc.author_name || [])) continue;

    for (const ia of (doc.ia || []).slice(0, 2)) {
      return normalizeAudioLinks([
        {
          label: "Listen on Internet Archive",
          url: `https://archive.org/details/${ia}`,
        },
      ]);
    }
  }
  return null;
}

async function resolveBook(title, author) {
  let links = null;

  try {
    links = await librivoxLinks(title, author);
  } catch (err) {
    console.warn(`  librivox ${title}: ${err.message}`);
  }

  if (!links) {
    try {
      links = await archiveAudioSearch(title, author);
    } catch (err) {
      console.warn(`  archive audio ${title}: ${err.message}`);
    }
  }

  if (!links) {
    try {
      links = await openLibraryAudio(title, author);
    } catch (err) {
      console.warn(`  openlibrary audio ${title}: ${err.message}`);
    }
  }

  if (!links) {
    return normalizeAudioLinks([
      { label: "Search on YouTube", url: youtubeSearchLink(title, author) },
    ]);
  }

  return links;
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const books = {};
  let found = 0;
  let direct = 0;
  let youtubeOnly = 0;

  console.log(
    `Resolving audio links for ${catalog.books.length} books...\n`
  );

  for (const entry of catalog.books) {
    const links = await resolveBook(entry.title, entry.author);
    if (links) {
      books[entry.title] = links;
      found++;
      const isYoutubeOnly =
        links.length === 1 && links[0].label === "Search on YouTube";
      if (isYoutubeOnly) youtubeOnly++;
      else direct++;
      console.log(
        `found ${entry.title} -> ${links.map((l) => l.label).join(", ")}`
      );
    }
    await sleep(250);
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        _comment:
          "Audio links keyed by book title. Regenerate with npm run resolve-audio.",
        version: 1,
        resolvedAt: new Date().toISOString(),
        books,
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    `\nDone. ${found} with audio links (${direct} direct, ${youtubeOnly} YouTube search only).`
  );
}

main().catch((err) => {
  console.error("\nResolve audio failed:", err.message);
  process.exit(1);
});
