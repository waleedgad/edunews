// src/_data/sponsors.js
// Reads sponsors from Sanity and returns the same shape the sponsors partial expects.
// Manage them in Studio -> Sponsor. Only published, "Show on website" sponsors
// that have BOTH a logo and a link are returned.
const client = require('./sanityClient');

module.exports = async function () {
  const query = `*[_type == "sponsor"
      && active != false
      && defined(logo.asset)
      && defined(url)
    ] | order(coalesce(sortOrder, 9999) asc, _createdAt asc) {
      _id,
      name_ar,
      name_en,
      url,
      "logoUrl": logo.asset->url
    }`;

  try {
    const rows = await client.fetch(query);

    return {
      // Section heading (edit here if you want different wording)
      title: {
        ar: 'بدعم من',
        en: 'Supported by'
      },
      items: rows.map(r => ({
        name: {
          ar: r.name_ar || r.name_en,
          en: r.name_en || r.name_ar
        },
        logoUrl: r.logoUrl,
        url: r.url
      }))
    };
  } catch (error) {
    console.error('CRITICAL: Error fetching sponsors from Sanity:', error);
    throw error;
  }
};