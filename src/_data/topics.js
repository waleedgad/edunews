const client = require('./sanityClient');
const { localizeBySlug } = require('../_lib/localize');

module.exports = async function() {
  // Published documents only, with at least one valid slug.
  // Oldest first so the older topic keeps a contested slug.
  const query = `*[_type == "topic" && !(_id in path("drafts.**")) && (defined(slug_ar.current) || defined(slug_en.current))] | order(_createdAt asc) {
    _id,
    title_ar,
    title_en,
    "slug_ar": slug_ar.current,
    "slug_en": slug_en.current
  }`;

  try {
    const rawTopics = await client.fetch(query);

    return localizeBySlug(rawTopics, {
      label: 'topics',
      extra: (topic, language, other) => ({
        title: topic[`title_${language}`] || topic[`title_${other}`]
      })
    });
  } catch (error) {
    console.error('CRITICAL: Error fetching topics from Sanity:', error);
    throw error;
  }
};