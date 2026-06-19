/* eslint-disable no-console */
/**
 * Patch rich author profiles onto existing bookAuthor documents in Sanity.
 *
 * Usage: npm run seed-authors
 */

const fs = require("fs");
const path = require("path");
const sanityClient = require("@sanity/client");
const {
  loadEnvFile,
  slugify,
  loadAuthorProfiles,
  loadOverridesAuthors,
  uniqueAuthorsFromCatalog,
  applyAuthorContent,
} = require("./author-utils");

loadEnvFile();

const projectId = process.env.SANITY_PROJECT_ID || "o5lg176f";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;
const catalogPath = path.join(__dirname, "master-library.json");
const profilesPath = path.join(__dirname, "author-profiles.json");

if (!token) {
  console.error(
    "\nMissing SANITY_WRITE_TOKEN.\n" +
      "Create an Editor token at https://www.sanity.io/manage (project > API > Tokens)\n" +
      "then run:  SANITY_WRITE_TOKEN=xxxxx npm run seed-authors\n"
  );
  process.exit(1);
}

if (!fs.existsSync(profilesPath)) {
  console.error(`\nMissing ${profilesPath}. Run npm run resolve-authors first.\n`);
  process.exit(1);
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  apiVersion: "2021-03-25",
  useCdn: false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function uploadPhotoFromUrl(url, filename) {
  const res = await fetch(url, {
    headers: { "User-Agent": "portfolio-seed/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return client.assets.upload("image", buffer, { filename });
}

async function main() {
  const names = uniqueAuthorsFromCatalog(catalogPath);
  const profiles = loadAuthorProfiles();
  const overrides = loadOverridesAuthors();

  console.log(
    `Patching author profiles on "${projectId}/${dataset}" (${names.length} authors)\n`
  );

  let patched = 0;
  let skipped = 0;

  for (const name of names) {
    const profile = profiles[name];
    const ov = overrides[name] || {};
    if (!profile && !ov.bio) {
      skipped++;
      continue;
    }

    const id = `bookAuthor-${slugify(name)}`;
    const doc = applyAuthorContent({ _id: id }, profile || {}, ov);

    const patch = client.patch(id);
    const fields = [
      "bio",
      "career",
      "achievements",
      "description",
      "nationality",
      "website",
      "wikipediaUrl",
    ];
    fields.forEach((field) => {
      if (doc[field] !== undefined) patch.set({ [field]: doc[field] });
    });

    if (profile?.photoUrl) {
      try {
        const existing = await client.fetch(
          `*[_id == $id][0]{ "ref": photo.asset._ref }`,
          { id }
        );
        if (!existing?.ref) {
          const asset = await uploadPhotoFromUrl(
            profile.photoUrl,
            `author-${slugify(name)}.jpg`
          );
          patch.set({
            photo: {
              _type: "image",
              asset: { _type: "reference", _ref: asset._id },
            },
          });
        }
      } catch (err) {
        console.warn(`  photo skip ${name}: ${err.message}`);
      }
    }

    await patch.commit();
    patched++;
    console.log(
      `patched ${name}${doc.career ? " (career)" : ""}${
        doc.achievements ? " (achievements)" : ""
      }`
    );
    await sleep(80);
  }

  console.log(`\nDone. ${patched} authors updated, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error("\nseed-authors failed:", err.message);
  process.exit(1);
});
