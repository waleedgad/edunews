// src/_data/verticals.js
//
// The list of vertical PAGES, one per (vertical x language). This is the verticals
// equivalent of sections.js, except it is built from Sanity, so adding a vertical
// there adds its pages here with no code change.
//
//   { lang, slug, title, description, template }
//
// The stories for each page come from src/_data/verticalData.js.
// Templates live in src/_includes/layouts/verticals/<template>.njk. A vertical that
// names a template whose file does not exist falls back to "default".

const fs = require('fs');
const path = require('path');
const client = require('./sanityClient');
const sections = require('./sections');   // only used to avoid URL clashes with real sections

const TEMPLATE_DIR = path.join(__dirname, '..', '_includes', 'layouts', 'verticals');
const sectionPaths = new Set(sections.map(s => `${s.lang}/${s.slug}`));

function resolveTemplate(name, slug) {
  const wanted = name || 'default';
  if (fs.existsSync(path.join(TEMPLATE_DIR, `${wanted}.njk`))) return wanted;
  console.warn(`[verticals] "${slug}" asks for template "${wanted}" but layouts/verticals/${wanted}.njk does not exist. Using "default".`);
  return 'default';
}

module.exports = async function () {
  const rows = await client.fetch(`*[_type == "vertical" && !(_id in path("drafts.**")) && defined(slug.current)]
    | order(coalesce(homeOrder, 9999) asc, _createdAt asc){
      title_ar, title_en,
      description_ar, description_en,
      template,
      "slug": slug.current
    }`);

  const pages = [];

  for (const v of rows) {
    for (const lang of ['ar', 'en']) {
      const title = v[`title_${lang}`];
      if (!title) continue;   // no name in this language = no page in this language

      if (sectionPaths.has(`${lang}/${v.slug}`)) {
        console.warn(`[verticals] Slug "${v.slug}" (${lang}) collides with a section in sections.js, so this vertical page is skipped.`);
        continue;
      }

      pages.push({
        lang,
        slug: v.slug,
        title,
        description: v[`description_${lang}`] || '',
        template: resolveTemplate(v.template, v.slug)
      });
    }
  }

  return pages;
};