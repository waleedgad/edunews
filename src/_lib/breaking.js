// src/_lib/breaking.js
// The ONE place that decides how long the "Breaking" label lasts.

const BREAKING_TTL_HOURS = 24; // 0 = never expire

function isStillBreaking(raw) {
  if (!raw || !raw.isBreaking) return false;
  if (!BREAKING_TTL_HOURS || !raw.publishedAt) return true;
  const ageMs = Date.now() - new Date(raw.publishedAt).getTime();
  return ageMs <= BREAKING_TTL_HOURS * 3600 * 1000;
}

module.exports = { BREAKING_TTL_HOURS, isStillBreaking };
