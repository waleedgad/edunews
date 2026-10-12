const client = require('./sanityClient');
const { localizeBySlug } = require('../_lib/localize');

module.exports = async function() {
  // Published documents only; oldest first so the older author keeps a contested slug.
  const query = `*[_type == "author" && !(_id in path("drafts.**")) && (defined(slug_ar.current) || defined(slug_en.current))] | order(_createdAt asc) {
    _id,
    name_ar,
    name_en,
    role_ar,
    role_en,
    "slug_ar": slug_ar.current,
    "slug_en": slug_en.current,
    "avatarUrl": avatar.asset->url,
    bio_ar,
    bio_en,
    credentials_ar,
    credentials_en,
    expertise_ar,
    expertise_en,
    email,
    twitter,
    linkedin,
    website
  }`;

  try {
    const rawAuthors = await client.fetch(query);

    return localizeBySlug(rawAuthors, {
      label: 'authors',
      extra: (author, language, other) => ({
        name: author[`name_${language}`] || author[`name_${other}`]
      })
    });
  } catch (error) {
    console.error('CRITICAL: Error fetching authors from Sanity:', error);
    throw error;
  }
};