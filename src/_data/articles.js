const client = require('./sanityClient');
const { articleUrl, verticalFor, VERTICAL_PROJECTION } = require('../_lib/articleUrl');
const { isStillBreaking } = require('../_lib/breaking');

module.exports = async function() {
  const query = `*[_type == "article" && !(_id in path("drafts.**")) && publishedAt <= now() && (defined(slug_ar.current) || defined(slug_en.current))] | order(publishedAt desc) {
    _id,
    title_ar,
    title_en,
    "slug_ar": slug_ar.current,
    "slug_en": slug_en.current,
    publishedAt,
    featured,
    isBreaking,
    isPolicyWatch,
    archetype,
    summary_ar,
    summary_en,
    mainImage,
    "imageUrl": mainImage.asset->url,
    "imageAlt": mainImage.alt,
    imageCaption,
    imageCredit,
    seoDescription,
    "category": category->{
      _id,
      title_ar,
      title_en,
      "slug_ar": slug_ar.current,
      "slug_en": slug_en.current,
      color
    },
    ${VERTICAL_PROJECTION},
    "author": author->{
      _id,
      name_ar,
      name_en,
      role_ar,
      role_en,
      "slug_ar": slug_ar.current,
      "slug_en": slug_en.current,
      "avatarUrl": avatar.asset->url
    },
    "topics": topics[defined(@)]->{
      _id,
      title_ar,
      title_en,
      "slug_ar": slug_ar.current,
      "slug_en": slug_en.current
    },
    body_ar,
    body_en
  }`;

  try {
    const rawArticles = await client.fetch(query);
    const articles = [];
    const seenPermalinks = new Map(); // permalink -> _id that claimed it

    // Two articles with the same address would write the same page and crash the
    // build (same section, date and slug, or the same vertical and slug). Keep the
    // first (newest), skip the rest, and warn.
    const pushUnique = (article) => {
      if (seenPermalinks.has(article.permalink)) {
        console.warn(
          `[articles] DUPLICATE PERMALINK "${article.permalink}": skipped ${article._id}, ` +
          `already used by ${seenPermalinks.get(article.permalink)}. Change one slug in Studio.`
        );
        return;
      }
      seenPermalinks.set(article.permalink, article._id);
      articles.push(article);
    };

    rawArticles.forEach(raw => {
      const formatRelations = (lang) => {
        const category = raw.category ? {
          ...raw.category,
          slug: lang === 'ar'
            ? (raw.category.slug_ar || raw.category.slug_en)
            : (raw.category.slug_en || raw.category.slug_ar)
        } : null;

        const author = raw.author ? {
          ...raw.author,
          slug: lang === 'ar'
            ? (raw.author.slug_ar || raw.author.slug_en)
            : (raw.author.slug_en || raw.author.slug_ar)
        } : null;

        const topics = Array.isArray(raw.topics)
          ? raw.topics.filter(Boolean).map(t => ({
              ...t,
              slug: lang === 'ar'
                ? (t.slug_ar || t.slug_en)
                : (t.slug_en || t.slug_ar)
            }))
          : [];

        // null when the story has no vertical, or the vertical has no page in this language
        const vertical = verticalFor(raw.vertical, lang);

        return { category, author, topics, vertical };
      };

      // One URL rule for the whole site (src/_lib/articleUrl.js):
      // /<lang>/<vertical>/<slug>/ for vertical stories, the existing rule otherwise.
      const link = (lang, slug) => articleUrl(lang, slug, raw.archetype, raw.publishedAt, raw.vertical);

      if (raw.title_ar && raw.slug_ar) {
        const relations = formatRelations('ar');
        pushUnique({
          _id: `${raw._id}-ar`,
          language: 'ar',
          title: raw.title_ar,
          slug: raw.slug_ar,
          permalink: link('ar', raw.slug_ar),
          summary: raw.summary_ar || '',
          body: raw.body_ar || [],
          publishedAt: raw.publishedAt,
          featured: raw.featured,
          isBreaking: isStillBreaking(raw), // expires after 24h, same as homepage / section pages
          isPolicyWatch: raw.isPolicyWatch,
          archetype: raw.archetype,
          mainImage: raw.mainImage, // Preserves hotspot/crop metadata for sanityImageUrl filter
          imageUrl: raw.imageUrl,
          imageAlt: raw.imageAlt,
          imageCaption: raw.imageCaption,
          imageCredit: raw.imageCredit,
          seoDescription: raw.seoDescription,
          category: relations.category,
          vertical: relations.vertical,
          author: relations.author,
          topics: relations.topics,
          translationUrl: raw.slug_en ? link('en', raw.slug_en) : null
        });
      }

      if (raw.title_en && raw.slug_en) {
        const relations = formatRelations('en');
        pushUnique({
          _id: `${raw._id}-en`,
          language: 'en',
          title: raw.title_en,
          slug: raw.slug_en,
          permalink: link('en', raw.slug_en),
          summary: raw.summary_en || '',
          body: raw.body_en || [],
          publishedAt: raw.publishedAt,
          featured: raw.featured,
          isBreaking: isStillBreaking(raw), // expires after 24h, same as homepage / section pages
          isPolicyWatch: raw.isPolicyWatch,
          archetype: raw.archetype,
          mainImage: raw.mainImage, // Preserves hotspot/crop metadata for sanityImageUrl filter
          imageUrl: raw.imageUrl,
          imageAlt: raw.imageAlt,
          imageCaption: raw.imageCaption,
          imageCredit: raw.imageCredit,
          seoDescription: raw.seoDescription,
          category: relations.category,
          vertical: relations.vertical,
          author: relations.author,
          topics: relations.topics,
          translationUrl: raw.slug_ar ? link('ar', raw.slug_ar) : null
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('CRITICAL: Error fetching articles from Sanity:', error);
    throw error;
  }
};