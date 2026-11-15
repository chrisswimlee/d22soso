/* Builds one plain, crawlable page per exhibit (/arena/, /garden/, …) from archive/content.js.
   The 3D archive stays the front door; these pages carry the same text as real HTML for search
   engines, link previews and readers without WebGL, and each links back into the world.
   Run from the repo root after changing content.js:  node tools/build-exhibits.mjs */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { SECTORS, EMAIL } from "../archive/content.js";
import { UI, LOCALES, localizeSectors } from "../archive/i18n.js";

const SITE = "https://d22soso.com";
let ui = UI.en;
const HTML_LANG = { en: "en", ko: "ko", zh: "zh-Hans" };
// Page chrome. Exhibit text itself comes from content.js and its translations in i18n.js.
const CHROME = {
  en: { open: "Open in the 3D archive", skip: "Skip to the exhibit", six: "six exhibits", archive: "The 3D archive", demo: "A playable 2 Hand Hold’em demo is in the <a href=\"{href}\">3D archive</a>.", exhibits: "Exhibits", language: "Language" },
  ko: { open: "3D 아카이브에서 열기", skip: "전시 내용으로 건너뛰기", six: "여섯 개의 전시", archive: "3D 아카이브", demo: "플레이 가능한 2 Hand Hold’em 데모는 <a href=\"{href}\">3D 아카이브</a>에 있습니다.", exhibits: "전시", language: "언어" },
  zh: { open: "在3D档案馆中打开", skip: "跳到展区内容", six: "六个展区", archive: "3D档案馆", demo: "可试玩的 2 Hand Hold’em 演示在<a href=\"{href}\">3D档案馆</a>中。", exhibits: "展区", language: "语言" },
};
let loc = "en", chrome = CHROME.en;
const pathFor = (l, id) => (l === "en" ? `/${id}/` : `/${l}/${id}/`);
const worldFor = (l, id) => (l === "en" ? `/#${id}` : `/?lang=${l}#${id}`);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// content.js paths are written for the root page ("../assets/…" resolves to /assets/…). Make them absolute.
const abs = (p) => (/^https?:/.test(p) ? p : "/" + String(p).replace(/^(\.\.\/|\.\/)+/, ""));
const full = (p) => (/^https?:/.test(p) ? p : SITE + abs(p));
const ext = (href) => (/^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "");

const BLOCKS = {
  gallery: (b) => `<div class="gallery">${b.items.map((it) => it.rounds
    ? `<figure class="path"><ol>${it.rounds.map((r) => `<li>${esc(r)}</li>`).join("")}</ol><figcaption><a href="${esc(abs(it.src))}">${esc(it.caption)}</a></figcaption></figure>`
    : `<figure><img src="${esc(abs(it.src))}" alt="${esc(it.alt)}" loading="lazy" decoding="async" style="object-position:${esc(it.pos || "50% 50%")}" />${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ""}</figure>`).join("")}</div>`,
  story: (b) => `<section>${b.title ? `<h2>${esc(b.title)}</h2>` : ""}${b.text.map((p) => `<p>${esc(p)}</p>`).join("")}</section>`,
  quote: (b) => `<blockquote><p>${esc(b.text)}</p><cite>${esc(b.cite)}</cite></blockquote>`,
  timeline: (b) => `<section>${b.title ? `<h2>${esc(b.title)}</h2>` : ""}<ol class="timeline">${b.items.map(([d, t, key]) => `<li${key ? ' class="key"' : ""}><span>${esc(d)}</span><span>${esc(t)}</span></li>`).join("")}</ol></section>`,
  facts: (b) => `<dl class="facts">${b.items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`,
  links: (b) => `<section>${b.title ? `<h2>${esc(b.title)}</h2>` : ""}<ul class="links">${b.items.map((l) => `<li><a href="${esc(abs(l.href))}"${ext(l.href)}>${esc(l.label)}</a></li>`).join("")}</ul></section>`,
  media: (b) => `<section><h2>${esc(b.title)}</h2><ul class="cards">${b.items.map((m) => `<li><a href="${esc(m.href)}"${ext(m.href)}><strong>${esc(m.title)}</strong><span>${esc(m.source)}</span></a></li>`).join("")}</ul></section>`,
  monitors: (b) => BLOCKS.media(b),
  steps: (b) => `<section><h2>${esc(b.title)}</h2><ol class="steps">${b.items.map(([k, v]) => `<li><strong>${esc(k)}</strong> ${esc(v)}</li>`).join("")}</ol></section>`,
  demo: () => `<p class="note">${chrome.demo.replace("{href}", worldFor(loc, "foundry"))}</p>`,
  book: (b) => `<figure class="book"><img src="${esc(abs(b.cover))}" alt="${esc(ui.bookCoverAlt)}" loading="lazy" /><figcaption><strong>${esc(ui.bookQuote)}</strong> ${esc(ui.bookDesc)}</figcaption></figure>`,
  contact: () => `<section class="contact"><p class="eyebrow">${esc(ui.contactEyebrow)}</p><p><a href="mailto:${esc(EMAIL)}">${esc(EMAIL)}</a></p></section>`,
  downloads: (b) => `<section><h2>${esc(b.title)}</h2><ul class="links">${b.items.map((d) => `<li><a href="${esc(abs(d.href))}" download>${esc(d.label)}</a></li>`).join("")}</ul></section>`,
};

const CSS = `:root{--bg:#07080b;--panel:#101116;--ink:#ece8dc;--small:#b9b4a8;--rule:rgba(236,232,220,.14);--gold:#e8c44a;--display:"Space Grotesk",system-ui,sans-serif;--body:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--ink);font:400 17px/1.6 var(--body)}
a{color:var(--gold)}a:hover{color:#fff}.skip{position:absolute;left:8px;top:-60px;background:var(--gold);color:#07080b;padding:8px 12px;border-radius:6px}.skip:focus{top:8px}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}header.top{border-bottom:1px solid var(--rule);padding:16px 0}header.top .wrap{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.brand{font:600 17px var(--display);color:var(--ink);text-decoration:none}.cta{display:inline-block;background:var(--gold);color:#07080b;font:600 13px var(--mono);letter-spacing:.06em;text-transform:uppercase;padding:10px 14px;border-radius:6px;text-decoration:none}.cta:hover{color:#07080b;background:#f3d571}
main{padding:40px 0 56px}.head{display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:28px;align-items:start}.head:not(:has(figure)){grid-template-columns:1fr}.hero{margin:6px 0 0;border:2px solid var(--gold);border-radius:8px;overflow:hidden;background:radial-gradient(circle,#1f2a24,#0c0d11);box-shadow:0 0 28px rgba(232,196,74,.16)}.hero img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:0;display:block}.hero.logo img{object-fit:contain;padding:14px;background:none}.hero.wide img{aspect-ratio:16/9}
.langs{display:flex;gap:10px;font:500 13px var(--mono)}.langs [aria-current]{color:var(--ink);text-decoration:none}.kicker,.eyebrow{font:500 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}h1{font:700 clamp(30px,6vw,46px)/1.08 var(--display);margin:8px 0 16px;letter-spacing:-.02em}
h2{font:600 13px var(--mono);letter-spacing:.12em;text-transform:uppercase;margin:40px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--rule)}.lede{font-size:19px;color:var(--ink)}p{max-width:66ch}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:24px 0}figure{margin:0}figure img{width:100%;height:auto;border-radius:6px;background:#000;display:block}.gallery figure img{max-height:560px;object-fit:cover}
html[lang="ko"] body{word-break:keep-all;overflow-wrap:anywhere}figcaption{font-size:14px;color:var(--small);margin-top:6px}
.path ol{list-style:none;margin:0 0 8px;padding:0 0 0 14px;border-left:2px solid var(--rule)}.path li{font:600 17px/1.9 var(--display)}.path li:last-child{color:var(--gold)}
blockquote{margin:28px 0;padding:4px 0 4px 18px;border-left:3px solid var(--gold);font-size:19px}cite{display:block;font:500 12px var(--mono);color:var(--small);font-style:normal;margin-top:6px}
.timeline{list-style:none;padding:0;margin:0}.timeline li{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:8px 0;border-bottom:1px solid var(--rule)}.timeline li span:first-child{font:500 13px var(--mono);color:var(--small)}.timeline li.key span:last-child{color:var(--gold)}
.facts{margin:24px 0;display:grid;gap:0}.facts div{display:grid;grid-template-columns:180px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule)}dt{font:500 13px var(--mono);color:var(--small)}dd{margin:0}
.links,.cards{list-style:none;padding:0;margin:0;display:grid;gap:8px}.cards a{display:grid;padding:12px 14px;border:1px solid var(--rule);border-radius:6px;text-decoration:none;color:var(--ink)}.cards a:hover{border-color:var(--gold)}.cards span{font-size:14px;color:var(--small)}
.steps{padding-left:20px}.steps li{margin:6px 0}.book{display:grid;grid-template-columns:160px 1fr;gap:18px;align-items:center;margin:24px 0}.book img{aspect-ratio:2/3}.note{color:var(--small)}
nav.exhibits{border-top:1px solid var(--rule);padding:24px 20px 40px}nav.exhibits ol{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;font:500 14px var(--mono)}nav.exhibits [aria-current]{color:var(--ink);text-decoration:none}
footer{font:500 13px var(--mono);color:var(--small);padding-bottom:40px}
@media (max-width:560px){.head{grid-template-columns:1fr;gap:16px}.hero{max-width:200px;order:-1}.hero.wide{max-width:none}.facts div,.book{grid-template-columns:1fr}.timeline li{grid-template-columns:80px 1fr}body{font-size:16px}}`;

function page(s, i, SECTORS) {
  const ex = s.exhibit;
  const url = `${SITE}${pathFor(loc, s.id)}`;
  const title = `${ex.title} · ${s.name.replace(/^The /, "")} · Wayne “D22-soso” Chiang`;
  const k = s.key || {};
  const heroSrc = k.src ? abs(k.m ? k.src.replace(/\.webp(\?|$)/, "-m.webp$1") : k.src) : "";
  const heroClass = k.fit === "contain" && (k.ratio || 1) <= 1.3 ? "hero logo" : (k.ratio || 1) > 1.3 ? "hero wide" : "hero";
  // A wide poster is the exhibit's own lead photo a few lines below, so it is not shown twice.
  const hero = heroSrc && heroClass !== "hero wide" ? `<figure class="${heroClass}"><img src="${esc(heroSrc)}" alt="${esc(k.alt)}" style="object-position:${esc(k.pos || "50% 30%")}" fetchpriority="high" /></figure>` : "";
  const alternates = LOCALES.map((l) => `<link rel="alternate" hreflang="${HTML_LANG[l.code]}" href="${SITE}${pathFor(l.code, s.id)}" />`).join("\n") +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE}${pathFor("en", s.id)}" />`;
  const langs = `<nav class="langs" aria-label="${esc(chrome.language)}">${LOCALES.map((l) => `<a href="${pathFor(l.code, s.id)}" hreflang="${HTML_LANG[l.code]}" lang="${HTML_LANG[l.code]}"${l.code === loc ? ' aria-current="page"' : ""}>${esc(l.label)}</a>`).join("")}</nav>`;
  const desc = ex.lede.length > 300 ? ex.lede.slice(0, 297).replace(/\s+\S*$/, "") + "…" : ex.lede;
  const image = s.key?.src ? full(s.key.src.replace(/\?.*$/, "")) : `${SITE}/assets/img/og-living-archive.jpg`;
  const prev = SECTORS[(i - 1 + SECTORS.length) % SECTORS.length], next = SECTORS[(i + 1) % SECTORS.length];
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": url, url, name: title, description: desc, image, inLanguage: HTML_LANG[loc],
        isPartOf: { "@type": "WebSite", name: "D22-soso", url: `${SITE}/` },
        about: { "@type": "Person", name: "Wayne Chiang", alternateName: "D22-soso", url: `${SITE}/` } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: ui.livingArchive, item: `${SITE}/${loc === "en" ? "" : `?lang=${loc}`}` },
        { "@type": "ListItem", position: 2, name: s.name, item: url } ] },
    ],
  };
  return `<!doctype html>
<html lang="${HTML_LANG[loc]}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${url}" />
${alternates}
<meta property="og:type" content="article" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="D22-soso" />
<meta property="og:title" content="${esc(ex.title)} · Wayne “D22-soso” Chiang" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:alt" content="${esc(s.key?.alt || "")}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="theme-color" content="#07080b" />
<link rel="icon" href="/assets/img/apple-touch-icon.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400&family=Space+Grotesk:wght@600;700&display=swap" />
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#content">${esc(chrome.skip)}</a>
<header class="top"><div class="wrap"><a class="brand" href="${loc === "en" ? "/" : `/?lang=${loc}`}">Wayne “D22-soso” Chiang</a>${langs}<a class="cta" href="${worldFor(loc, s.id)}">${esc(chrome.open)} →</a></div></header>
<main id="content" class="wrap">
<div class="head"><div>
<p class="kicker">${esc(ex.kicker)} · ${esc(s.era)}</p>
<h1>${esc(ex.title)}</h1>
<p class="lede">${esc(ex.lede)}</p>
</div>${hero}</div>
${ex.blocks.map((b) => (BLOCKS[b.type] ? BLOCKS[b.type](b) : "")).join("\n")}
</main>
<nav class="exhibits wrap" aria-label="${esc(chrome.exhibits)}">
<p class="eyebrow">${esc(ui.livingArchive)} · ${esc(chrome.six)}</p>
<ol>${SECTORS.map((x) => `<li><a href="${pathFor(loc, x.id)}"${x.id === s.id ? ' aria-current="page"' : ""}>${esc(x.name)}</a></li>`).join("")}</ol>
<p><a href="${pathFor(loc, prev.id)}" rel="prev">← ${esc(prev.short)}</a> · <a href="${pathFor(loc, next.id)}" rel="next">${esc(next.short)} →</a></p>
</nav>
<footer class="wrap"><a href="${loc === "en" ? "/" : `/?lang=${loc}`}">${esc(chrome.archive)}</a> · <a href="/classic.html">${esc(ui.classicSite)}</a> · <a href="https://chrisswimlee.com" target="_blank" rel="noopener noreferrer">${esc(ui.designedBy || "Designed by chrisswimlee")}</a></footer>
</body>
</html>
`;
}

for (const { code } of LOCALES) {
  loc = code; chrome = CHROME[code]; ui = { ...UI.en, ...UI[code] };
  const sectors = localizeSectors(SECTORS, code);
  for (const [i, s] of sectors.entries()) {
    const dir = pathFor(code, s.id).slice(1);
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}index.html`, page(s, i, sectors));
    console.log(`wrote ${dir}index.html`);
  }
}

// Keep the sitemap in step: one entry per exhibit page, dated today.
const today = new Date().toISOString().slice(0, 10);
let map = await readFile("sitemap.xml", "utf8");
map = map.replace(/\s*<url>\s*<loc>https:\/\/d22soso\.com\/((ko|zh)\/)?(arena|garden|broadcast|foundry|library|command)\/<\/loc>[\s\S]*?<\/url>/g, "");
const entries = LOCALES.flatMap(({ code }) => SECTORS.map((s) => `  <url>\n    <loc>${SITE}${pathFor(code, s.id)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${code === "en" ? "0.8" : "0.7"}</priority>\n  </url>`)).join("\n");
map = map.replace("</urlset>", `${entries}\n</urlset>`);
await writeFile("sitemap.xml", map);
console.log("updated sitemap.xml");
