// src/_data/homeData.js
//
// Builds the homepage for BOTH languages from Sanity. Nothing here needs editing
// when a new article is added: each block is filled from the article's
// classification (category, archetype, flags, publishedAt).
//
//   Block                      Filled from
//   -------------------------  ------------------------------------------------
//   (Morning Brief)            If a published "Morning Brief" document exists, its picked stories (in the editor's
//                              order) are claimed FIRST: story 1 = briefingCard ("في الخبر الأبرز هذا الصباح"),
//                              stories 2+ = featured. They are removed from every other block (no repeats).
//                              Without one, the automatic rules below apply.
//   hero                       Homepage Manager picks, else newest NOT already claimed by a block below
//   briefingCover              Homepage Manager pick, else newest unused. News or Report only (BRIEFING_ARCHETYPES)
//   briefingCard               Morning Brief story 1 (the top story), else newest unused News or Report story (BRIEFING_ARCHETYPES), after the hero and cover
//   featured ("لدينا اليوم")    Morning Brief stories 2+, else featured == true
//   ticker                     newest News / Brief stories (reports and editorial/opinion are excluded, no count cap:
//                              everything in the 'latest' pool); isBreaking pinned first (auto-expires, see src/_lib/breaking.js)
//   policyLead / policyWatch   Homepage Manager lead; isPolicyWatch OR category.feedsPolicyWatch (never Editorial/Opinion)
//   sectors ("Explore")        verticals (Sanity "vertical" docs) with showOnHome, ordered by homeOrder
//   investment (+ deals)       Homepage Manager lead; category.feedsInvestmentWatch, EXCLUDING Policy Watch stories and Editorial/Opinion
//   articlesReports            newest archetype == "editorial" or "report", EXCLUDING stories flagged for Policy Watch
//                              or Investment (those stay in their own blocks). Reserved for the "مقالات وتقارير"
//                              section: claimed before the other blocks, so these stories never repeat elsewhere
//   signature                  archetype == "report" (only the ones left after articlesReports)
//   opinion                    archetype == "editorial"  (no template block yet)
//   feed                       newest articles not already shown above (no longer rendered on the Arabic homepage)
//
// Stories that belong to a vertical (their "Vertical" field is set) are excluded from EVERY block
// above except "sectors": they live only on their vertical page. This covers the automatic pools
// (pool()) and the editor picks (hero, briefing cover, Policy / Investment leads, Morning Brief).
//
// Return shape is unchanged: Arabic edition at the top level, English at `.en`.

const client = require('./sanityClient');
const sections = require('./sections');
// Shared rules (one copy each): URL format, Breaking expiry, article card shape + GROQ projection
const { CARD_PROJECTION: projection, toCard } = require('../_lib/cards');

// ---------------------------------------------------------------- limits
const HERO_LIMIT = 6;
// Ticker has no count cap: it shows every eligible story in the LATEST_LIMIT pool below.
// Content Formats that never appear in the ticker:
const TICKER_EXCLUDED_ARCHETYPES = ['report', 'editorial'];
const FEATURED_LIMIT = 6;
const POLICY_LIST_LIMIT = 4;
const SECTOR_LIMIT = 4;
const SIGNATURE_LIMIT = 4;
const OPINION_LIMIT = 4;
const ARTICLES_REPORTS_LIMIT = 6; // "مقالات وتقارير" grid
const INVESTMENT_LIMIT = 8;      // 1 lead + 2 pair + 5 "deals" column
const LATEST_LIMIT = 40;         // pool the feed is carved from

// Morning Briefing (cover + card) only uses these Content Formats: "standard" = Standard News.
// Brief and Editorial / Opinion stories never appear there. A story with no Content Format
// stored (older documents) counts as standard.
const BRIEFING_ARCHETYPES = ['standard', 'report'];
const isBriefingType = (a) => !!a && (!a.archetype || BRIEFING_ARCHETYPES.includes(a.archetype));

// ---------------------------------------------------------------- helpers
// Category slug must match a page in sections.js, otherwise the link would 404.
const sectionPaths = new Set(sections.map(s => `${s.lang}/${s.slug}`));
const warned = new Set();
function sectionUrl(lang, slug) {
  if (!slug) return null;
  if (sectionPaths.has(`${lang}/${slug}`)) return `/${lang}/${slug}/`;
  const key = `${lang}/${slug}`;
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`[homeData] Category slug "${slug}" (${lang}) has no page in sections.js, so its homepage link is omitted.`);
  }
  return null;
}

function isLive(raw) {
  return !raw.publishedAt || new Date(raw.publishedAt) <= new Date();
}

// Builds the homepage card. Shape, URL and "Breaking" expiry come from src/_lib/cards.js.
function toArticle(raw, lang) {
  if (!raw || !isLive(raw)) return null;   // also guards curated picks scheduled for the future
  return toCard(raw, lang);
}

const TICKER_TAGS = {
  ar: { breaking: 'عاجل', update: 'تحديث' },
  en: { breaking: 'Breaking', update: 'Update' }
};

function tickerTag(article, lang) {
  const tags = TICKER_TAGS[lang];
  if (article.isBreaking) return tags.breaking;
  return tags.update;
}

// ---------------------------------------------------------------- edition builder
function buildEdition(lang, curated, pools) {
  const other = lang === 'ar' ? 'en' : 'ar';
  const used = new Set();
  const markUsed = (a) => { if (a) used.add(a._id); return a; };
  const unused = (list) => list.filter(a => !used.has(a._id));
  const take = (list, n) => { const out = unused(list).slice(0, n); out.forEach(markUsed); return out; };
  const convert = (list) => (list || []).map(a => toArticle(a, lang)).filter(Boolean);

  const latest = convert(pools.latest);
  const policyPool = convert(pools.policyWatch);
  const featuredPool = convert(pools.featured);

  // ---- 0. Morning Brief picks claim their stories before anything else ----
  // Order = the editor's order. Deleted / unpublished / other-language / scheduled stories are
  // skipped, and a story picked twice is only used once. Any archetype is allowed: an explicit
  // editorial pick is not filtered by Content Format.
  const briefStories = [];
  convert(pools.briefStories).forEach(a => {
    if (a.title && a.url && !used.has(a._id)) briefStories.push(markUsed(a));
  });

  // ---- 1. Curated picks (Homepage Manager) win ---------------------------
  let hero = unused(convert(Array.isArray(curated.heroArticles) ? curated.heroArticles : []))
    .slice(0, HERO_LIMIT);
  hero.forEach(markUsed);

  // A curated pick already used higher up (e.g. also a hero slide) is dropped
  // and replaced by the automatic fallback below, so nothing repeats.
  const curatedUnused = (raw) => {
    const a = toArticle(raw, lang);
    return a && !used.has(a._id) ? a : null;
  };
  // The Morning Briefing cover must be News or Report; any other curated pick is ignored.
  const coverPick = curatedUnused(curated.briefingCover);
  let briefingCover = markUsed(isBriefingType(coverPick) ? coverPick : null);
  // Opinion pieces never lead Policy Watch, even if picked in Homepage Manager.
  const policyLeadPick = curatedUnused(curated.policyLead);
  let policyLead = markUsed(policyLeadPick && policyLeadPick.archetype !== 'editorial' ? policyLeadPick : null);
  // Investment Watch lead picked in Homepage Manager. Claimed here (like the Policy Watch lead)
  // so the automatic Policy Watch list cannot take it first. Opinion pieces are ignored.
  const investmentLeadPick = curatedUnused(curated.investmentLead);
  const investmentLead = markUsed(investmentLeadPick && investmentLeadPick.archetype !== 'editorial' ? investmentLeadPick : null);

  // ---- 1b. "مقالات وتقارير": newest Opinion/Editorial + Report stories -----
  // Claimed right after the curated picks and BEFORE every other block, so a story shown here
  // is removed from Featured, Signature, the hero/cover fallbacks and the feed. Stories flagged for
  // Policy Watch or Investment are filtered out of this pool by the query, so those blocks keep them.
  // Curated picks above still win (a story picked in Homepage Manager is skipped here).
  const articlesReports = take(convert(pools.articlesReports), ARTICLES_REPORTS_LIMIT);

  // ---- 2a. Classified blocks claim their stories FIRST ------------------
  // An article flagged for a block (Policy Watch, Investment, Report, Brief,
  // Featured) must appear in that block. The hero and cover are catch-alls, so
  // they only get what is left. Otherwise, on a small or new site, the
  // hero/cover would swallow every article before the flagged blocks see them.

  // Policy Watch: lead + list
  if (!policyLead) {
    policyLead = markUsed(unused(policyPool)[0] || null);
  }
  const policyWatch = take(
    policyPool.filter(a => !policyLead || a._id !== policyLead._id),
    POLICY_LIST_LIMIT
  );

  // Investment Watch (lead + pair) and M&A / deals column.
  // The pool is already disjoint from Policy Watch (see the query below). The only overlap
  // left is a Homepage Manager Policy Watch lead pick, which is removed here via `used`.
  // A curated lead (if any) goes first; the category-fed stories fill the rest.
  const invList = [
    ...(investmentLead ? [investmentLead] : []),
    ...take(convert(pools.investment), INVESTMENT_LIMIT - (investmentLead ? 1 : 0))
  ];
  const investment = invList.length ? {
    url: invList[0].category ? sectionUrl(lang, invList[0].category.slug) : null,
    lead: invList[0],
    pair: invList.slice(1, 3),
    deals: invList.slice(3)
  } : null;

  // Signature Series = In-Depth Reports
  const signature = take(convert(pools.signature), SIGNATURE_LIMIT);

  // Today's Picks: stories with the Featured checkbox
  // With a Morning Brief, stories 2+ of the brief fill this list instead.
  const featured = briefStories.length > 1
    ? briefStories.slice(1, 1 + FEATURED_LIMIT)
    : take(featuredPool, FEATURED_LIMIT);

  // ---- 2b. Catch-alls take what is left ----------------------------------
  let heroIsAuto = false;
  if (hero.length === 0) {
    hero = take(latest, HERO_LIMIT);
    heroIsAuto = true;
  }
  if (!briefingCover) {
    briefingCover = markUsed(unused(latest).find(isBriefingType) || null);
  }
  // Small site: the auto hero used everything, so the cover borrows the hero's
  // last News/Report slide rather than repeating the first one.
  if (!briefingCover && heroIsAuto && hero.length > 1) {
    let idx = -1;
    hero.forEach((a, i) => { if (isBriefingType(a)) idx = i; });
    if (idx !== -1) briefingCover = hero.splice(idx, 1)[0];
  }

  // Never leave the top of the page empty: if every story was claimed above
  // (very small site), the hero/cover may repeat one of them.
  if (hero.length === 0) hero = latest.slice(0, HERO_LIMIT);
  if (!briefingCover) briefingCover = latest.find(isBriefingType) || null;

  // Briefing card: newest unused News/Report story. Taken AFTER the hero and cover so it
  // never steals the newest story from them. Hidden by the template when there is none.
  // The Morning Brief's top story IS the card ("في الخبر الأبرز هذا الصباح").
  const briefingCard = briefStories[0] || markUsed(unused(convert(pools.briefs))[0] || null);

  // ---- 2c. Explore by Sector: one card per flagged category --------------
  // "Explore" shows VERTICALS (Classroom, Staffroom, Exam Paper, EdTech...), not categories.
  // A vertical needs a name in this language; its card links to /<lang>/<slug>/ (built by
  // src/verticals.njk). The card headline is the vertical's newest story. Stories that belong
  // to a vertical are kept OUT of every other block and the feed (see pool() and the curated
  // picks below), so the Explore cards are the only place they appear on the homepage.
  const sectors = (pools.verticals || [])
    .filter(v => v[`title_${lang}`])
    .map(v => {
      const articles = convert(v.articles);
      const description = v[`tagline_${lang}`] || v[`description_${lang}`] || '';
      return {
        _id: v._id,
        title: v[`title_${lang}`],
        description,
        color: v.color,
        logo: v.logo,
        slug: v.slug,
        url: `/${lang}/${v.slug}/`,
        lead: articles[0] || null,
        articles: articles.slice(0, 3)
      };
    })
    .slice(0, SECTOR_LIMIT);

  // Opinion: exposed for a future block; not marked used so it still shows in the feed
  const opinion = convert(pools.opinion).slice(0, OPINION_LIMIT);

  // ---- 3. Ticker (not de-duplicated on purpose) --------------------------
  const tickerBase = latest
    .filter(a => !TICKER_EXCLUDED_ARCHETYPES.includes(a.archetype))
    .map(a => ({ ...a, tag: tickerTag(a, lang) }));
  const ticker = [
    ...tickerBase.filter(a => a.isBreaking),
    ...tickerBase.filter(a => !a.isBreaking)
  ];

  // ---- 4. Main feed = everything not shown above -------------------------
  const feed = unused(latest);

  return {
    hero,
    briefingCover,
    briefingCard,
    policyLead,
    policyWatch,
    sectors,
    investment,
    signature,
    opinion,
    articlesReports,
    ticker,
    featured,
    feed
  };
}

// ---------------------------------------------------------------- queries
module.exports = async function() {
  // Published (no drafts), has this language, and not scheduled for the future.
  const live = (lang) =>
    `!(_id in path("drafts.**")) && defined(title_${lang}) && defined(slug_${lang}.current) && publishedAt <= now()`;

  const pool = (lang, extra, limit) =>
    `*[_type == "article" && ${live(lang)} && !defined(vertical)${extra ? ` && ${extra}` : ''}] | order(publishedAt desc)[0..${limit - 1}]{ ${projection} }`;

  // Investment is disjoint from Policy Watch BY QUERY: anything that qualifies for Policy Watch
  // (article checkbox or policy category) never reaches Investment, whatever the build order.
  // Editorial / Opinion stories (archetype "editorial") are excluded from BOTH blocks.
  const pools = (lang) => `{
    "latest": ${pool(lang, '', LATEST_LIMIT)},
    "briefStories": *[_type == "morningBrief" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0].stories[defined(@) && !defined(@->vertical)]->{ ${projection} },
    "policyWatch": ${pool(lang, '(isPolicyWatch == true || category->feedsPolicyWatch == true) && archetype != "editorial"', 12)},
    "featured": ${pool(lang, 'featured == true', FEATURED_LIMIT * 3)},
    "investment": ${pool(lang, 'category->feedsInvestmentWatch == true && isPolicyWatch != true && category->feedsPolicyWatch != true && archetype != "editorial"', 16)},
    "articlesReports": ${pool(lang, 'archetype in ["editorial", "report"] && isPolicyWatch != true && category->feedsPolicyWatch != true && category->feedsInvestmentWatch != true', 12)},
    "signature": ${pool(lang, 'archetype == "report"', 12)},
    "briefs": ${pool(lang, `(archetype in ${JSON.stringify(BRIEFING_ARCHETYPES)} || !defined(archetype))`, 8)},
    "opinion": ${pool(lang, 'archetype == "editorial"', 8)},
    "verticals": *[_type == "vertical" && showOnHome != false && defined(slug.current)
        && defined(title_${lang}) && !(_id in path("drafts.**"))]
      | order(coalesce(homeOrder, 9999) asc, _createdAt asc)[0..${SECTOR_LIMIT - 1}]{
        _id,
        title_ar,
        title_en,
        tagline_ar,
        tagline_en,
        description_ar,
        description_en,
        color,
        "logo": logo.asset->url,
        "slug": slug.current,
        "articles": *[_type == "article" && vertical._ref == ^._id && ${live(lang)}]
          | order(publishedAt desc)[0..2]{ ${projection} }
      }
  }`;

  const query = `{
    "curated": *[_type == "homePage"] | order(_updatedAt desc)[0]{
      "heroArticles": heroArticles[defined(@) && !defined(@->vertical)]->{ ${projection} },
      "briefingCover": select(!defined(briefingCover->vertical) => briefingCover->{ ${projection} }),
      "policyLead": select(!defined(policyWatchLead->vertical) => policyWatchLead->{ ${projection} }),
      "investmentLead": select(!defined(investmentWatchLead->vertical) => investmentWatchLead->{ ${projection} })
    },
    "ar": ${pools('ar')},
    "en": ${pools('en')}
  }`;

  try {
    const data = await client.fetch(query);
    const curated = data.curated || {};

    const ar = buildEdition('ar', curated, data.ar || {});
    const en = buildEdition('en', curated, data.en || {});

    return { ...ar, en };
  } catch (error) {
    console.error('CRITICAL: Error fetching homepage data from Sanity:', error);
    throw error;
  }
};