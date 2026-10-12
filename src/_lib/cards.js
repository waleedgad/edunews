// src/_lib/cards.js
// Shared "article card" shape for the homepage, the section pages and the vertical pages:
// one GROQ projection + one function that turns a raw Sanity row into a card.
// The card's URL comes from src/_lib/articleUrl.js (vertical articles live at
// /<lang>/<vertical>/<slug>/, everything else keeps its existing address).

const { articleUrl, verticalFor, VERTICAL_PROJECTION } = require('./articleUrl');
const { isStillBreaking } = require('./breaking');

const CARD_PROJECTION = `
  _id,
  title_ar,
  title_en,
  "slug_ar": slug_ar.current,
  "slug_en": slug_en.current,
  publishedAt,
  archetype,
  featured,
  isBreaking,
  summary_ar,
  summary_en,
  mainImage,
  "imageUrl": mainImage.asset->url,
  "imageAlt": mainImage.alt,
  "category": category->{
    _id,
    title_ar,
    title_en,
    "slug_ar": slug_ar.current,
    "slug_en": slug_en.current,
    color
  },
  ${VERTICAL_PROJECTION}
`;

function toCard(raw, lang) {
  if (!raw) return null;
  const title = raw[`title_${lang}`];
  const slug = raw[`slug_${lang}`];
  if (!title || !slug) return null;

  const other = lang === 'ar' ? 'en' : 'ar';
  return {
    _id: raw._id,
    language: lang,
    title,
    slug,
    url: articleUrl(lang, slug, raw.archetype, raw.publishedAt, raw.vertical),
    publishedAt: raw.publishedAt,
    archetype: raw.archetype,
    featured: !!raw.featured,
    isBreaking: isStillBreaking(raw),
    summary: raw[`summary_${lang}`] || '',
    mainImage: raw.mainImage, // keeps hotspot/crop metadata for the sanityImageUrl filter
    imageUrl: raw.imageUrl,
    imageAlt: raw.imageAlt,
    category: raw.category ? {
      ...raw.category,
      title: raw.category[`title_${lang}`] || raw.category[`title_${other}`],
      slug: raw.category[`slug_${lang}`] || raw.category[`slug_${other}`]
    } : null,
    vertical: verticalFor(raw.vertical, lang)
  };
}

module.exports = { CARD_PROJECTION, toCard };
