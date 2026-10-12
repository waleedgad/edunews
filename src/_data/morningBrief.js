// src/_data/morningBrief.js  ->  global `morningBrief` in templates
// Same folder as articles.js and sponsors.js (uses the same ./sanityClient).
const client = require('./sanityClient');

module.exports = async function () {
  // Newest published "Morning Brief" document (any id). Sponsors are references to Sponsor
  // documents: dereferenced in the order picked, skipping hidden / incomplete ones.
  const query = `*[_type == "morningBrief" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{
    issueDate,
    "storyIds": stories[]._ref,
    sponsorsTitle_ar,
    sponsorsTitle_en,
    "sponsors": sponsors[]->{
      active,
      name_ar,
      name_en,
      url,
      "logoUrl": logo.asset->url
    }
  }`;

  try {
    const doc = await client.fetch(query);
    if (!doc) {
      console.warn('[morningBrief] no PUBLISHED Morning Brief document found in Sanity: using automatic stories and site-wide sponsors.');
      return null;
    }

    const result = {
      issueDate: doc.issueDate || null,
      storyIds: doc.storyIds || [],
      sponsorsTitle: {
        ar: doc.sponsorsTitle_ar || '',
        en: doc.sponsorsTitle_en || ''
      },
      // A reference to a deleted/unpublished sponsor comes back as null: drop those, plus hidden or incomplete ones
      sponsors: (doc.sponsors || [])
        .filter(sp => sp && sp.active !== false && sp.logoUrl && sp.url)
        .map(sp => ({
        name: { ar: sp.name_ar || sp.name_en, en: sp.name_en || sp.name_ar },
        url: sp.url,
        logoUrl: sp.logoUrl
      }))
    };
    console.log(`[morningBrief] loaded: ${result.storyIds.length} picked stories, ${result.sponsors.length} sponsors.`);
    return result;
  } catch (error) {
    // The brief is optional content: do not break the whole build over it.
    console.warn('[morningBrief] could not fetch the Morning Brief document, using automatic mode:', error.message);
    return null;
  }
};