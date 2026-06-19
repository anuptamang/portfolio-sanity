const fs = require("fs");
const path = require("path");

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

function normalizePdfLinks(links) {
  return normalizeMediaLinks(links, "Read Book");
}

function normalizeAudioLinks(links) {
  return normalizeMediaLinks(links, "Listen");
}

function normalizeMediaLinks(links, defaultLabel = "Read Book") {
  if (!links) return null;
  if (typeof links === "string") {
    return [{ label: defaultLabel, url: links }];
  }
  if (Array.isArray(links)) {
    const normalized = links
      .filter((link) => link && (link.url || typeof link === "string"))
      .map((link) =>
        typeof link === "string"
          ? { label: defaultLabel, url: link }
          : { label: link.label || defaultLabel, url: link.url }
      );
    return normalized.length ? normalized : null;
  }
  return null;
}

function loadPdfCatalog() {
  const catalogPath = path.join(__dirname, "book-pdfs.json");
  try {
    const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    return data.books || {};
  } catch (err) {
    return {};
  }
}

function loadAudioCatalog() {
  const catalogPath = path.join(__dirname, "book-audio.json");
  try {
    const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    return data.books || {};
  } catch (err) {
    return {};
  }
}

function primaryAuthor(author) {
  return (author || "").split(/\s*&\s*|\s+and\s+|,/i)[0].trim();
}

function authorLastName(author) {
  const parts = primaryAuthor(author)
    .replace(/^(dr|prof|sir|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return (parts[parts.length - 1] || "").toLowerCase();
}

function normalizeTitle(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function significantWords(title) {
  const stop = new Set([
    "the", "and", "for", "with", "from", "that", "this", "your", "book",
    "vol", "volume", "edition", "paperback", "hardcover", "english",
  ]);
  return normalizeTitle(title)
    .split(" ")
    .filter((w) => w.length > 2 && !stop.has(w));
}

function titleMatchesStrict(wanted, candidate) {
  const w = normalizeTitle(wanted);
  const c = normalizeTitle(candidate);
  if (!w || !c) return false;
  if (w === c) return true;

  const wantedWords = significantWords(wanted);
  if (!wantedWords.length) return false;

  const matched = wantedWords.filter((word) => c.includes(word)).length;
  if (matched / wantedWords.length < 0.85) return false;

  // Reject when candidate introduces a conflicting keyword (e.g. Greek vs Western).
  const conflicts = [
    ["western", "eastern", "greek", "roman", "chinese", "indian", "japanese"],
    ["investing", "trading", "physics", "biology", "yoga", "buddhism"],
  ];
  for (const group of conflicts) {
    const inWanted = group.filter((k) => w.includes(k));
    const inCandidate = group.filter((k) => c.includes(k));
    if (
      inWanted.length &&
      inCandidate.length &&
      !inWanted.some((k) => inCandidate.includes(k))
    ) {
      return false;
    }
  }

  return true;
}

function authorMatches(wantedAuthor, candidates) {
  const last = authorLastName(wantedAuthor);
  if (!last || last.length < 3) return false;
  const list = Array.isArray(candidates) ? candidates : [candidates];
  return list.some((entry) => {
    const name =
      typeof entry === "string"
        ? entry
        : entry?.name || entry?.creator || entry?.author || "";
    return normalizeTitle(name).includes(last);
  });
}

function isUsablePdfFile(name) {
  return (
    /\.pdf$/i.test(name || "") &&
    !/encrypted|_lcp|_restricted|scandata|abbyy|daisy|jp2/i.test(name || "")
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      const wait = err.message.includes("429") ? i * 5000 : i * 1500;
      console.warn(`  retry ${label} (${i}/${attempts - 1}): ${err.message}`);
      await sleep(wait);
    }
  }
}

async function fetchJson(url, { allow404 = false } = {}) {
  return withRetry(async () => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "PortfolioLibrary/1.0 (portfolio-sanity; +https://github.com)",
      },
    });
    if (allow404 && res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, url.slice(0, 70), allow404 ? 2 : 5);
}

module.exports = {
  loadEnvFile,
  slugify,
  normalizePdfLinks,
  normalizeAudioLinks,
  normalizeMediaLinks,
  loadPdfCatalog,
  loadAudioCatalog,
  primaryAuthor,
  authorLastName,
  titleMatchesStrict,
  authorMatches,
  isUsablePdfFile,
  sleep,
  fetchJson,
};
