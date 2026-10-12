// src/_lib/localize.js
// Turns one bilingual Sanity row into up to two single-language rows
// (one per language), with slug fallback and duplicate-slug protection.
// Used by categories.js, authors.js and topics.js.
//
//   extra(row, lang, other) -> object of extra fields to merge into each row
//   label                   -> name shown in the console warning

function localizeBySlug(rows, { label, extra = () => ({}) }) {
  const out = [];
  const seen = new Map(); // "lang/slug" -> first row that claimed it
  const nameOf = (r) => r.title_ar || r.title_en || r.name_ar || r.name_en;

  rows.forEach(row => {
    const slugAr = row.slug_ar || row.slug_en;
    const slugEn = row.slug_en || row.slug_ar;

    const add = (language, slug) => {
      if (!slug) return;
      const key = `${language}/${slug}`;

      // Two documents with the same slug would write the same page and crash
      // the Eleventy build. Keep the first, skip the rest, and say so.
      if (seen.has(key)) {
        const first = seen.get(key);
        console.warn(
          `[${label}] DUPLICATE SLUG "${key}": skipped ${row._id} ` +
          `("${nameOf(row)}"), already used by ${first._id} ` +
          `("${nameOf(first)}"). Give one of them a unique slug in Studio.`
        );
        return;
      }
      seen.set(key, row);

      const other = language === 'ar' ? 'en' : 'ar';
      out.push({ ...row, language, slug, ...extra(row, language, other) });
    };

    add('ar', slugAr);
    add('en', slugEn);
  });

  return out;
}

module.exports = { localizeBySlug };
