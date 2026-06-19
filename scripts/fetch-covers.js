const fs = require("fs");
const path = require("path");
const https = require("https");
const sanityClient = require("@sanity/client");

try {
  fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined)
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    });
} catch (e) {}

const token = process.env.SANITY_WRITE_TOKEN;
const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID || "o5lg176f",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2021-03-25",
  token,
  useCdn: false,
});

function fetchBuf(url, depth = 0) {
  return new Promise((res, rej) => {
    if (depth > 6) return rej(new Error("too many redirects"));
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (seed-bot)" } }, (r) => {
        if ([301, 302, 303, 307, 308].includes(r.statusCode)) {
          r.resume();
          return res(fetchBuf(new URL(r.headers.location, url).toString(), depth + 1));
        }
        if (r.statusCode !== 200) return rej(new Error("HTTP " + r.statusCode));
        const ct = r.headers["content-type"] || "";
        const c = [];
        r.on("data", (d) => c.push(d));
        r.on("end", () => res({ buf: Buffer.concat(c), ct }));
      })
      .on("error", rej);
  });
}

async function ogImage(pageUrl) {
  try {
    const { buf } = await fetchBuf(pageUrl);
    const html = buf.toString("utf8");
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

const targets = [
  {
    title: "Financial Affairs of the Common Man",
    slug: "financial-affairs-of-the-common-man",
    candidates: [
      "https://books.google.com/books/content?id=hS2qDwAAQBAJ&printsec=frontcover&img=1&zoom=2",
      "https://covers.openlibrary.org/b/isbn/9780143457459-L.jpg?default=false",
      "https://covers.openlibrary.org/b/isbn/9780670090730-L.jpg?default=false",
    ],
    pages: [
      "https://www.penguin.co.in/book/financial-affairs-of-the-common-man/",
      "https://anillamba.com/product/financial-affairs-of-the-common-man/",
    ],
  },
  {
    title: "The Inner Journey",
    slug: "the-inner-journey",
    candidates: [
      "https://oshoworld.com/uploads/unnamed-file-1420.jpg",
      "https://covers.openlibrary.org/b/isbn/9780140290172-L.jpg?default=false",
    ],
    pages: [
      "https://oshoworld.com/the-inner-journey",
      "https://www.penguin.co.in/book/the-inner-journey/",
    ],
  },
  {
    title: "Timeless Wisdom on Finance",
    slug: "timeless-wisdom-on-finance",
    candidates: [
      "https://covers.openlibrary.org/b/isbn/9789362130716-L.jpg?default=false",
      "https://covers.openlibrary.org/b/isbn/9789362136541-L.jpg?default=false",
    ],
    pages: [
      "https://titlewaves.in/product/timeless-wisdom-on-finance/",
      "https://padhegaindia.in/product/timeless-wisdom-on-finance/",
    ],
  },
];

(async () => {
  for (const t of targets) {
    const urls = [...t.candidates];
    for (const p of t.pages) {
      const og = await ogImage(p);
      if (og) urls.push(og);
    }
    let done = false;
    for (const u of urls) {
      try {
        const { buf, ct } = await fetchBuf(u);
        if (!ct.startsWith("image/")) {
          console.log(`  skip ${u} (ct=${ct})`);
          continue;
        }
        if (buf.length < 3000) {
          console.log(`  skip ${u} (too small ${buf.length}b)`);
          continue;
        }
        const book = await client.fetch(`*[_type=='book' && title==$t][0]{_id}`, { t: t.title });
        if (!book) {
          console.log(`  ${t.title}: NOT FOUND in dataset`);
          break;
        }
        const asset = await client.assets.upload("image", buf, { filename: `${t.slug}.jpg` });
        await client
          .patch(book._id)
          .set({ cover: { _type: "image", asset: { _type: "reference", _ref: asset._id } } })
          .commit();
        console.log(`OK ${t.title} <- ${u} (${buf.length}b, ${ct})`);
        done = true;
        break;
      } catch (e) {
        console.log(`  fail ${u}: ${e.message}`);
      }
    }
    if (!done) console.log(`MISSING ${t.title} (no usable cover from ${urls.length} candidates)`);
  }
})();
