// src/_lib/articleUrl.js
//
// The ONE place that decides an article's URL.
//   - Article with a Vertical (and that vertical has a name in this language):
//         /<lang>/<vertical-slug>/<article-slug>/
//   - Any other article: the existing rule, buildPermalink() in src/_lib/permalinks.js
//
// Used by src/_lib/cards.js (homepage, section and vertical pages) and
// src/_data/articles.js (the article pages themselves), so every link matches
// the page it points to.

const { buildPermalink } = require('./permalinks');

// GROQ piece that fetches the article's vertical (add to any article projection)
const VERTICAL_PROJECTION = `"vertical": vertical->{
    _id,
    title_ar,
    title_en,
    color,
    "slug": slug.current
  }`;

// The vertical as the templates need it, or null when the article has none or the
// vertical has no name (= no landing page) in this language.
function verticalFor(rawVertical, lang) {
  if (!rawVertical || !rawVertical.slug) return null;
  const title = rawVertical[`title_${lang}`];
  if (!title) return null;
  return {
    _id: rawVertical._id,
    title,
    slug: rawVertical.slug,
    color: rawVertical.color || '',
    url: `/${lang}/${rawVertical.slug}/`
  };
}

function articleUrl(lang, slug, archetype, publishedAt, rawVertical) {
  const v = verticalFor(rawVertical, lang);
  return v ? `/${lang}/${v.slug}/${slug}/` : buildPermalink(lang, slug, archetype, publishedAt);
}

module.exports = { VERTICAL_PROJECTION, verticalFor, articleUrl };
