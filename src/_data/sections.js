// Each article-driven section has a short `key` (the same key for its Arabic and English page).
// Editors choose that key per category in Sanity ("Section page" on the category), so a new
// category never needs a code change. If you ADD a section here, add the same key to the
// "Section page" list in the Studio's category.js.
// Sections with no key (articles-and-reports) are filled by Content Format (`archetypes`)
// and directory sections are not article-driven.
module.exports = [
  // ==================== ARABIC SECTIONS ====================
  {
    lang: "ar",
    slug: "مدارس",
    key: "schools",
    title: "مدارس",
    description: "تغطية شاملة لأخبار المدارس الحكومية والخاصة والدولية والتقويم الدراسي.",
    permalink: "/ar/مدارس/index.html",
    template: "default"
  },
  {
    lang: "ar",
    slug: "جامعات",
    key: "universities",
    title: "جامعات",
    description: "أحدث قرارات الجامعات، التنسيق، ومستجدات البحث العلمي والتعليم العالي.",
    permalink: "/ar/جامعات/index.html",
    template: "magazine"
  },
  {
    lang: "ar",
    slug: "التعليم-الفني-والتكنولوجي",
    key: "technical",
    title: "التعليم الفني والتكنولوجي",
    description: "مستجدات مدارس التكنولوجيا التطبيقية والجامعات التكنولوجية وسوق العمل.",
    permalink: "/ar/التعليم-الفني-والتكنولوجي/index.html",
    template: "magazine"
  },
  {
    lang: "ar",
    slug: "السياسات-والقرارات",
    key: "policy",
    title: "السياسات والقرارات",
    description: "قرارات وزارة التربية والتعليم، وزارة التعليم العالي، واللوائح المنظمة.",
    permalink: "/ar/السياسات-والقرارات/index.html",
    template: "magazine"
  },
  {
    lang: "ar",
    slug: "مقالات-وتقارير",
    title: "مقالات وتقارير",
    description: "تحليلات عميقة وآراء خبراء حول استراتيجيات التعليم ومستقبله.",
    permalink: "/ar/مقالات-وتقارير/index.html",
    template: "magazine",
    archetypes: ["editorial", "report"]   // Opinion + In-Depth Reports, whatever their category
  },
  {
    lang: "ar",
    slug: "اقتصاد-واستثمار-التعليم",
    key: "economy",
    title: "اقتصاد واستثمار التعليم",
    description: "أخبار الاستثمار التعليمي، الشراكات الدولية، والمشروعات الجديدة.",
    permalink: "/ar/اقتصاد-واستثمار-التعليم/index.html",
    template: "magazine"
  },
  {
    lang: "ar",
    slug: "دليل-المدارس-والجامعات",
    title: "دليل المدارس والجامعات",
    description: "دليل موثوق وشامل للمؤسسات التعليمية والبرامج الأكاديمية والاعتمادات.",
    permalink: "/ar/دليل-المدارس-والجامعات/index.html",
    template: "directory"
  },

  // ==================== ENGLISH SECTIONS ====================
  {
    lang: "en",
    slug: "schools",
    key: "schools",
    title: "Schools",
    description: "Latest updates on public, private, and international school education.",
    permalink: "/en/schools/index.html",
    template: "default"
  },
  {
    lang: "en",
    slug: "universities",
    key: "universities",
    title: "Universities",
    description: "Comprehensive coverage of higher education, research, and admissions.",
    permalink: "/en/universities/index.html",
    template: "magazine"
  },
  {
    lang: "en",
    slug: "technical-and-technological-education",
    key: "technical",
    title: "Technical and Vocational Education and Training",
    description: "Updates on applied technology schools and technological university networks.",
    permalink: "/en/technical-and-technological-education/index.html",
    template: "magazine"
  },
  {
    lang: "en",
    slug: "policies-and-decisions",
    key: "policy",
    title: "Policies & Decisions",
    description: "Official ministry directives, educational policies, and governance updates.",
    permalink: "/en/policies-and-decisions/index.html",
    template: "magazine"
  },
  {
    lang: "en",
    slug: "articles-and-reports",
    title: "Articles & Reports",
    description: "In-depth insights, expert opinions, and analytical education stories.",
    permalink: "/en/articles-and-reports/index.html",
    template: "magazine",
    archetypes: ["editorial", "report"]   // Opinion + In-Depth Reports, whatever their category
  },
  {
    lang: "en",
    slug: "education-economy-and-investment",
    key: "economy",
    title: "Economy & Investment",
    description: "Educational enterprise news, public-private partnerships, and market trends.",
    permalink: "/en/education-economy-and-investment/index.html",
    template: "magazine"
  },
  {
    lang: "en",
    slug: "schools-and-universities-directory",
    title: "Directory",
    description: "Complete directory of accredited educational institutions and programs.",
    permalink: "/en/schools-and-universities-directory/index.html",
    template: "directory"
  }
];