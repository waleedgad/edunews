const client = require('./sanityClient');
const { localizeBySlug } = require('../_lib/localize');

module.exports = async function() {
  // Published documents only. Ordered by creation date so that, if two
  // categories ever share a slug, the OLDER one always keeps the URL.
  const query = `*[_type == "category" && !(_id in path("drafts.**")) && (defined(slug_ar.current) || defined(slug_en.current))] | order(_createdAt asc) {
    _id,
    title_ar,
    title_en,
    "slug_ar": slug_ar.current,
    "slug_en": slug_en.current,
    color,
    description_ar,
    description_en
  }`;

  try {
    const rawCategories = await client.fetch(query);

    // One record per language, slug fallback and duplicate-slug protection
    // (two categories with the same slug would crash the Eleventy build).
    return localizeBySlug(rawCategories, {
      label: 'categories',
      extra: (cat, language, other) => ({
        // Convenience fields with fallback, so templates never print "undefined"
        title: cat[`title_${language}`] || cat[`title_${other}`],
        description: cat[`description_${language}`] || cat[`description_${other}`] || ''
      })
    });
  } catch (error) {
    console.error('CRITICAL: Error fetching categories from Sanity:', error);
    throw error;
  }
};