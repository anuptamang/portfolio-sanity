const fs = require("fs");
const path = require("path");
const { slugify, sleep, fetchJson, loadEnvFile } = require("./pdf-utils");

function randomKey() {
  return Math.random().toString(36).slice(2, 12);
}

function ptBlock(text, style = "normal") {
  return {
    _type: "block",
    _key: randomKey(),
    style,
    markDefs: [],
    children: [{ _type: "span", _key: randomKey(), text, marks: [] }],
  };
}

function textToBlocks(text) {
  if (!text) return undefined;
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((p) => ptBlock(p));
}

function loadAuthorProfiles() {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "author-profiles.json"), "utf8")
    );
    return data.authors || {};
  } catch (err) {
    return {};
  }
}

function loadOverridesAuthors() {
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "overrides.json"), "utf8")
    );
    return data.authors || {};
  } catch (err) {
    return {};
  }
}

function uniqueAuthorsFromCatalog(catalogPath) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const names = new Set();
  (catalog.books || []).forEach((book) => {
    (book.author || "")
      .split(/\s*&\s*|\s+and\s+/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((name) => names.add(name));
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function applyAuthorContent(doc, profile = {}, overrides = {}) {
  const bioText = overrides.bio || profile.bio;
  const careerText = overrides.career || profile.career;
  const achievementsText = overrides.achievements || profile.achievements;

  if (bioText) doc.bio = textToBlocks(bioText);
  if (careerText) doc.career = textToBlocks(careerText);
  if (achievementsText) doc.achievements = textToBlocks(achievementsText);

  if (overrides.nationality || profile.nationality) {
    doc.nationality = overrides.nationality || profile.nationality;
  }
  if (overrides.description || profile.description) {
    doc.description = overrides.description || profile.description;
  }
  if (overrides.website || profile.website) {
    doc.website = overrides.website || profile.website;
  }
  if (profile.wikipediaUrl) doc.wikipediaUrl = profile.wikipediaUrl;

  return doc;
}

module.exports = {
  slugify,
  sleep,
  fetchJson,
  loadEnvFile,
  textToBlocks,
  loadAuthorProfiles,
  loadOverridesAuthors,
  uniqueAuthorsFromCatalog,
  applyAuthorContent,
};
