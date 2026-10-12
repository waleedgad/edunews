// src/_lib/permalinks.js
// The ONE place that decides what an article URL looks like.
// Used by articles.js, homeData.js and sectionData.js (via cards.js).

function formatDatePath(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRouteSection(archetype) {
  switch (archetype) {
    case 'editorial':
      return 'opinion';
    case 'report':
      return 'reports';
    case 'brief':
    case 'standard':
    default:
      return 'news';
  }
}

function buildPermalink(lang, slug, archetype, publishedAt) {
  const section = getRouteSection(archetype);
  const dateStr = formatDatePath(publishedAt);
  const dateSegment = dateStr ? `${dateStr}/` : '';
  return `/${lang}/${section}/${dateSegment}${slug}/`;
}

module.exports = { formatDatePath, getRouteSection, buildPermalink };
