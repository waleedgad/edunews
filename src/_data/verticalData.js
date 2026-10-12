// src/_data/verticalData.js
//
// The stories for the vertical pages, the verticals equivalent of sectionData.js.
// One entry per vertical and language, keyed "<lang>/<slug>", for example
// verticalData["en/classroom"] or verticalData["ar/classroom"]:
//
//   {
//     articles: [...],   newest first, flat and single-language (max PER_VERTICAL)
//     picks:    [...]    sidebar list: stories with the Featured checkbox,
//                        else the newest ones
//   }
//
// A story belongs to a vertical when its "Vertical" field points at it. Only stories
// that exist in the page's language (title + slug) are listed. A vertical with no
// stories gets empty lists, and the template shows its "no stories yet" message.

const client = require('./sanityClient');
const { CARD_PROJECTION: projection, toCard } = require('../_lib/cards');

const PER_VERTICAL = 24;   // newest stories fetched per vertical (lead + side + feed)
const PICKS_LIMIT = 5;     // sidebar list length

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

module.exports = async function () {
  try {
    const rows = await client.fetch(`*[_type == "vertical" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "slug": slug.current,
      "articles": *[_type == "article" && vertical._ref == ^._id
          && !(_id in path("drafts.**")) && publishedAt <= now()]
        | order(publishedAt desc)[0..${PER_VERTICAL - 1}]{ ${projection} }
    }`);

    const out = {};

    for (const v of rows) {
      for (const lang of ['ar', 'en']) {
        const articles = v.articles
          .filter(a => a[`title_${lang}`] && a[`slug_${lang}`])
          .map(a => toArticle(a, lang))
          .filter(Boolean);

        let picks = articles.filter(a => a.featured).slice(0, PICKS_LIMIT);
        if (picks.length === 0) picks = articles.slice(0, PICKS_LIMIT);

        out[`${lang}/${v.slug}`] = { articles, picks };
      }
    }

    return out;
  } catch (error) {
    console.error('CRITICAL: Error fetching vertical data from Sanity:', error);
    throw error;
  }
};