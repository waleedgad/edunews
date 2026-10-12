// src/_data/sectionPages.js
//
// One entry per section PAGE: every section in sections.js, split into numbered pages.
// section.njk paginates over this list (instead of `sections`), so each entry becomes
// one URL:
//
//   page 1  -> the section's normal permalink          /en/universities/index.html
//   page 2+ -> <folder>page/<n>/index.html             /en/universities/page/2/index.html
//
// Each entry is the section's own settings from sections.js (title, lang, template,
// description...) plus:
//
//   permalink     file Eleventy writes for THIS page (page.url is the clean folder URL)
//   pageNumber    1-based
//   totalPages
//   items         the stories shown on this page (from sectionData.js)
//   picks         sidebar list (same on every page)
//   prevUrl / nextUrl   null when there is no previous / next page
//   pageLinks     [{ n, url, current }] for the page numbers; { n: null } marks a "…" gap
//
// Page size: PAGE_SIZE stories per page. A section in sections.js can override it
// with `pageSize: 30`. "directory" sections are not article-driven and stay a single page.

const sections = require('./sections');
const getSectionData = require('./sectionData');

const PAGE_SIZE = 20;

// sections.js permalinks look like "/en/universities/index.html".
// dirOf() gives the folder ("/en/universities/"); the visible link of page n is that folder
// (page 1) or <folder>page/<n>/, and the file Eleventy writes is <folder>page/<n>/index.html.
function dirOf(permalink) {
  const dir = permalink.replace(/index\.html$/, '');
  return dir.endsWith('/') ? dir : dir + '/';
}
function pageUrl(permalink, n) {
  const dir = dirOf(permalink);
  return n === 1 ? dir : `${dir}page/${n}/`;
}
function pagePermalink(permalink, n) {
  return n === 1 ? permalink : `${dirOf(permalink)}page/${n}/index.html`;
}

// 1 … 4 5 [6] 7 8 … 20
function pageLinks(base, current, total) {
  if (total <= 1) return [];
  const wanted = new Set([1, total]);
  for (let n = current - 2; n <= current + 2; n++) if (n >= 1 && n <= total) wanted.add(n);
  const nums = [...wanted].sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push({ n: null });
    out.push({ n, url: pageUrl(base, n), current: n === current });
  });
  return out;
}

function buildPages(allSections, sectionData) {
  const pages = [];

  for (const s of allSections) {
    const single = {
      ...s,
      pageNumber: 1,
      totalPages: 1,
      items: [],
      picks: [],
      prevUrl: null,
      nextUrl: null,
      pageLinks: []
    };

    if (s.template === 'directory') {
      pages.push(single);
      continue;
    }

    const sd = sectionData[`${s.lang}/${s.slug}`] || { articles: [], picks: [] };
    const size = Number.isInteger(s.pageSize) && s.pageSize > 0 ? s.pageSize : PAGE_SIZE;
    const total = Math.max(1, Math.ceil(sd.articles.length / size));

    for (let n = 1; n <= total; n++) {
      pages.push({
        ...s,
        permalink: pagePermalink(s.permalink, n),
        pageNumber: n,
        totalPages: total,
        items: sd.articles.slice((n - 1) * size, n * size),
        picks: sd.picks,
        prevUrl: n > 1 ? pageUrl(s.permalink, n - 1) : null,
        nextUrl: n < total ? pageUrl(s.permalink, n + 1) : null,
        pageLinks: pageLinks(s.permalink, n, total)
      });
    }
  }

  return pages;
}

module.exports = async function () {
  return buildPages(sections, await getSectionData());
};
module.exports.buildPages = buildPages;   // exported for testing
