// src/_data/sectionData.js
//
// Feeds the section pages (default.njk and magazine.njk) from Sanity.
// One entry per section in sections.js, keyed "<lang>/<slug>", for example
// sectionData["ar/جامعات"] or sectionData["en/universities"]:
//
//   {
//     articles: [...],   ALL the section's stories, newest first, flat and single-language
//                        (safety cap MAX_PER_SECTION). Split into pages by sectionPages.js.
//     picks:    [...]    sidebar list: stories with the Featured checkbox among the newest
//                        PICKS_POOL stories, else the newest ones
//   }
//
// A section is matched to categories in this order:
//   1. By the category's "Section page" setting in Sanity. Each section in sections.js has
//      a `key`; a category whose Section page equals that key shows on the section (Arabic
//      and English). This is the normal way: no code change for a new category.
//   2. Backup, only for categories with NO Section page chosen: by SLUG. The section's
//      slug in sections.js (or one listed in its optional `categorySlugs`) must equal the
//      category's slug in that language. If a category has no slug in one language it
//      falls back to the other one, exactly like categories.js.
// A category with a Section page chosen shows ONLY on that section, never on another.
// A section with no matching category, or no stories yet, gets an empty list and the
// template shows a "no stories yet" message.
//
// A section can ALSO collect stories by Content Format (the article's "archetype"
// field: standard | brief | report | editorial), whatever their category:
//   archetypes: ["editorial", "report"]
// A story is listed when its category matches OR its archetype is in that list.
//
// Stories that belong to a vertical (their "Vertical" field is set) are never listed here:
// they appear only on their vertical page.
//
// The "directory" template is not article-driven, so those sections are skipped.

const client = require('./sanityClient');
const sections = require('./sections');
// Shared rules (one copy each): URL format, Breaking expiry, article card shape + GROQ projection
const { CARD_PROJECTION: projection, toCard } = require('../_lib/cards');

// ---------------------------------------------------------------- limits
const MAX_PER_SECTION = 1000;    // safety cap on stories fetched per section (all pages together)
const PICKS_POOL = 24;           // sidebar picks are chosen among the newest N stories
const PICKS_LIMIT = 5;           // sidebar list length

// ---------------------------------------------------------------- helpers
const hasArchetypes = s => Array.isArray(s.archetypes) && s.archetypes.length > 0;

// Small label shown above a headline (the "pick-tag" in the templates)
const TAGS = {
  ar: { breaking: 'عاجل', brief: 'موجز', report: 'تقرير', editorial: 'رأي', standard: 'أخبار' },
  en: { breaking: 'Breaking', brief: 'Brief', report: 'Report', editorial: 'Opinion', standard: 'News' }
};

// Shared card (src/_lib/cards.js) plus the small label shown above the headline.
function toArticle(raw, lang) {
  const card = toCard(raw, lang);
  if (!card) return null;
  const tags = TAGS[lang];
  return {
    ...card,
    tag: card.isBreaking ? tags.breaking : (tags[card.archetype] || tags.standard)
  };
}

// ---------------------------------------------------------------- data
async function fetchSectionData() {
  const pageSections = sections.filter(s => s.template !== 'directory');
  if (pageSections.length === 0) return {};

  // One request for every section. Slugs and archetypes are passed as parameters,
  // so Arabic slugs need no escaping. A category's slug in a language falls back to
  // its other-language slug (same rule as categories.js).
  const params = {};
  const parts = pageSections.map((s, i) => {
    const other = s.lang === 'ar' ? 'en' : 'ar';
    params[`s${i}`] = [s.slug, ...(Array.isArray(s.categorySlugs) ? s.categorySlugs : [])];
    // Backup rule: slug match, only for categories that have no Section page chosen.
    const slugMatch = `(!defined(category->sectionPage) && coalesce(category->slug_${s.lang}.current, category->slug_${other}.current) in $s${i})`;
    let inCategory = slugMatch;
    if (s.key) {
      params[`p${i}`] = s.key;
      inCategory = `(category->sectionPage == $p${i} || ${slugMatch})`;
    }

    let match = inCategory;
    if (hasArchetypes(s)) {
      params[`a${i}`] = s.archetypes;
      match = `(${inCategory} || archetype in $a${i})`;
    }

    return `"k${i}": *[_type == "article"
      && !(_id in path("drafts.**"))
      && !defined(vertical)
      && defined(title_${s.lang}) && defined(slug_${s.lang}.current)
      && publishedAt <= now()
      && ${match}
    ] | order(publishedAt desc)[0..${MAX_PER_SECTION - 1}]{ ${projection} }`;
  });

  try {
    const result = await client.fetch(`{ ${parts.join(',\n')} }`, params);
    const out = {};

    pageSections.forEach((s, i) => {
      const articles = (result[`k${i}`] || [])
        .map(raw => toArticle(raw, s.lang))
        .filter(Boolean);

      const recent = articles.slice(0, PICKS_POOL);
      let picks = recent.filter(a => a.featured).slice(0, PICKS_LIMIT);
      if (picks.length === 0) picks = recent.slice(0, PICKS_LIMIT);

      out[`${s.lang}/${s.slug}`] = { articles, picks };

      // Tells you which section pages will show "no stories" and why.
      if (articles.length === 0) {
        console.warn(
          `[sectionData] "${s.lang}/${s.slug}" has 0 stories. It needs a published article in ${s.lang.toUpperCase()} ` +
          `(title + slug, publishedAt in the past) in a category whose "Section page" is "${s.key || '(none: this section has no key)'}"` +
          `${s.key ? '' : ` or whose ${s.lang.toUpperCase()} slug is "${s.slug}"`}` +
          `${hasArchetypes(s) ? ', or whose Content Format is one of: ' + s.archetypes.join(', ') : ''}. ` +
          `Set "Section page" on the story's category in Sanity.`
        );
      }
    });

    return out;
  } catch (error) {
    console.error('CRITICAL: Error fetching section data from Sanity:', error);
    throw error;
  }
}

// Eleventy calls this once for sectionData and sectionPages.js calls it again.
// Sharing one request (kept for a few seconds) avoids fetching everything twice per build,
// while `eleventy --serve` rebuilds still get fresh data.
let cached = null;
let cachedAt = 0;
module.exports = function() {
  if (!cached || Date.now() - cachedAt > 10000) {
    cachedAt = Date.now();
    cached = fetchSectionData().catch(err => { cached = null; throw err; });
  }
  return cached;
};