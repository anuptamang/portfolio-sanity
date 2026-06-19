/* eslint-disable no-console */
/**
 * Resolve Wikipedia-style author profiles for all authors in master-library.json.
 *
 * Usage: npm run resolve-authors
 */

const fs = require("fs");
const path = require("path");
const {
  sleep,
  fetchJson,
  uniqueAuthorsFromCatalog,
  loadOverridesAuthors,
} = require("./author-utils");

const catalogPath = path.join(__dirname, "master-library.json");
const outputPath = path.join(__dirname, "author-profiles.json");

const SECTION_PATTERNS = {
  career:
    /^(early life|life and career|career|professional life|work|background|life|scientific career|business career|writing career|academic career|political career|military career|artistic career|philosophical work|teachings|thought|ideas|contributions|economics|investing|trading)$/i,
  achievements:
    /^(awards|honors|honours|achievements|recognition|legacy|distinctions|accomplishments|honorary|prizes|in popular culture|influence|impact)$/i,
  works:
    /^(works|bibliography|publications|selected works|notable works|books|written works|major works|list of works|filmography)$/i,
};

function normalizeName(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function wikiNameMatches(searchName, pageTitle) {
  const parts = normalizeName(searchName).split(" ").filter((p) => p.length > 2);
  const title = normalizeName(pageTitle);
  if (!parts.length || !title) return false;
  const last = parts[parts.length - 1];
  if (!title.includes(last)) return false;
  const others = parts.slice(0, -1);
  if (!others.length) return true;
  return others.filter((p) => title.includes(p)).length >= 1;
}

async function wikiSearch(name) {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: name,
    srlimit: "5",
    format: "json",
    origin: "*",
  });
  const data = await fetchJson(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  return data.query?.search || [];
}

async function wikiSummary(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
    { headers: { "User-Agent": "portfolio-author-resolver/1.0" } }
  );
  if (!res.ok) return null;
  return res.json();
}

async function wikiPageId(title) {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    format: "json",
    origin: "*",
  });
  const data = await fetchJson(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  const pages = data.query?.pages;
  const page = pages && Object.values(pages)[0];
  if (!page || page.missing) return null;
  return page.pageid;
}

async function wikiSections(pageId) {
  const params = new URLSearchParams({
    action: "parse",
    pageid: String(pageId),
    prop: "sections",
    format: "json",
    origin: "*",
  });
  const data = await fetchJson(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  return data.parse?.sections || [];
}

async function wikiSectionExtract(pageId, sectionIndex) {
  const params = new URLSearchParams({
    action: "query",
    pageids: String(pageId),
    prop: "extracts",
    explaintext: "true",
    exsectionformat: "plain",
    exsections: String(sectionIndex),
    format: "json",
    origin: "*",
  });
  const data = await fetchJson(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  const pages = data.query?.pages;
  const page = pages && Object.values(pages)[0];
  return page?.extract?.trim() || null;
}

async function wikiIntro(pageId) {
  const params = new URLSearchParams({
    action: "query",
    pageids: String(pageId),
    prop: "extracts",
    explaintext: "true",
    exintro: "true",
    exsectionformat: "plain",
    format: "json",
    origin: "*",
  });
  const data = await fetchJson(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  const pages = data.query?.pages;
  const page = pages && Object.values(pages)[0];
  return page?.extract?.trim() || null;
}

function findSection(sections, pattern) {
  return sections.find((s) => pattern.test((s.line || "").trim()));
}

function truncateText(text, max = 5000) {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastPara = cut.lastIndexOf("\n\n");
  const trimmed =
    lastPara > max * 0.4 ? cut.slice(0, lastPara) : cut.replace(/\s+\S*$/, "");
  return `${trimmed.trim()}…`;
}

const AUTHOR_ALIASES = {
  "Benedict Spinoza": "Baruch Spinoza",
  "Fyodor Dostoyevsky": "Fyodor Dostoevsky",
  "Thich Nhat Hanh": "Thích Nhất Hạnh",
  "Nicole LePera": "Nicole LePera",
  "Eric Jorgenson": "Eric Jorgenson",
  "Morgan Housel": "Morgan Housel",
  "Joe Dispenza": "Joe Dispenza",
  "Bill Gifford": "Bill Gifford",
  "Darius Foroux": "Darius Foroux",
  "David Veerman": "David Veerman",
  "Thibaut Meurisse": "Thibaut Meurisse",
  "Shunmyo Masuno": "Shunmyo Masuno",
  "Y. Masih": "Y. Masih",
};

async function resolveAuthor(name) {
  const searchName = AUTHOR_ALIASES[name] || name;
  const results = await wikiSearch(searchName);
  const hit =
    results.find((r) => wikiNameMatches(name, r.title)) ||
    results.find((r) => wikiNameMatches(searchName, r.title)) ||
    results[0];
  if (!hit) return null;
  if (!hit) return null;

  const pageId = await wikiPageId(hit.title);
  if (!pageId) return null;

  const [summary, sections] = await Promise.all([
    wikiSummary(hit.title),
    wikiSections(pageId),
  ]);

  const profile = {
    wikipediaTitle: hit.title,
    wikipediaUrl:
      summary?.content_urls?.desktop?.page ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
    description: summary?.description || null,
    bio: summary?.extract || null,
    photoUrl:
      summary?.originalimage?.source || summary?.thumbnail?.source || null,
  };

  // Prefer a longer lead section when the REST summary is very short.
  if (!profile.bio || profile.bio.length < 400) {
    const intro = await wikiIntro(pageId);
    if (intro && intro.length > (profile.bio || "").length) profile.bio = intro;
  }

  const careerSection = findSection(sections, SECTION_PATTERNS.career);
  const worksSection = findSection(sections, SECTION_PATTERNS.works);
  const achievementsSection = findSection(
    sections,
    SECTION_PATTERNS.achievements
  );

  const careerParts = [];
  if (careerSection) {
    const text = await wikiSectionExtract(pageId, careerSection.index);
    if (text) careerParts.push(text);
  }
  if (worksSection) {
    const text = await wikiSectionExtract(pageId, worksSection.index);
    if (text) {
      careerParts.push(
        worksSection.line.toLowerCase().includes("work")
          ? text
          : `Notable works\n\n${text}`
      );
    }
  }
  if (careerParts.length) profile.career = truncateText(careerParts.join("\n\n"));

  if (achievementsSection) {
    const achievements = await wikiSectionExtract(
      pageId,
      achievementsSection.index
    );
    if (achievements) profile.achievements = truncateText(achievements);
  }

  if (profile.bio) profile.bio = truncateText(profile.bio, 3500);

  return profile;
}

async function main() {
  const names = uniqueAuthorsFromCatalog(catalogPath);
  const overrides = loadOverridesAuthors();
  const existing = (() => {
    try {
      return JSON.parse(fs.readFileSync(outputPath, "utf8")).authors || {};
    } catch (err) {
      return {};
    }
  })();
  const authors = { ...existing };
  let found = Object.keys(existing).length;
  let missed = 0;

  console.log(`Resolving Wikipedia profiles for ${names.length} authors...\n`);

  for (const name of names) {
    if (existing[name]?.wikipediaUrl || existing[name]?.bio) {
      console.log(`keep   ${name}`);
      continue;
    }

    try {
      const profile = await resolveAuthor(name);
      if (profile) {
        authors[name] = profile;
        found++;
        console.log(
          `found ${name} -> ${profile.wikipediaTitle}${
            profile.career ? " (career)" : ""
          }${profile.achievements ? " (achievements)" : ""}`
        );
      } else if (overrides[name]?.bio) {
        authors[name] = {
          bio: overrides[name].bio,
          nationality: overrides[name].nationality || null,
          description: null,
          wikipediaUrl: null,
        };
        found++;
        console.log(`fallback ${name} (overrides.json)`);
      } else {
        missed++;
        console.log(`miss   ${name}`);
      }
    } catch (err) {
      missed++;
      console.warn(`error  ${name}: ${err.message}`);
    }
    await sleep(1200);
  }

  const output = {
    _comment:
      "Wikipedia author profiles keyed by name. Regenerate with npm run resolve-authors.",
    version: 1,
    resolvedAt: new Date().toISOString(),
    authors,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
  console.log(
    `\nDone. ${found} profiles, ${missed} without data. Wrote ${outputPath}`
  );
}

main().catch((err) => {
  console.error("\nResolve authors failed:", err.message);
  process.exit(1);
});
