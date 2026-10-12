import { customSlugify } from './slugify';

export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {
      name: 'title_ar',
      title: 'Category Name (Arabic)',
      type: 'string',
      validation: Rule => Rule.required().error('Arabic category name is required.'),
    },
    {
      name: 'title_en',
      title: 'Category Name (English)',
      type: 'string',
    },
    {
      name: 'slug_ar',
      title: 'Slug (Arabic)',
      type: 'slug',
      description: 'Part of the category\'s web address. Which section page the category appears on is chosen in "Section page" below, not by this slug.',
      options: { 
        source: 'title_ar', 
        maxLength: 60,
        slugify: customSlugify
      },
      validation: Rule => Rule.required().error('Arabic slug is required for category routes.'),
    },
    {
      name: 'slug_en',
      title: 'Slug (English)',
      type: 'slug',
      description: 'Part of the category\'s web address. Which section page the category appears on is chosen in "Section page" below, not by this slug.',
      options: { 
        source: 'title_en', 
        maxLength: 60,
        slugify: customSlugify
      },
      validation: Rule => Rule.custom((slugEn, context) => {
        if (context.document.title_en && !slugEn) {
          return 'An English slug is required when an English name is set (it links the category to its English section page).';
        }
        return true;
      }),
    },
    {
      name: 'description_ar',
      title: 'Description (Arabic)',
      type: 'text',
      rows: 2,
    },
    {
      name: 'description_en',
      title: 'Description (English)',
      type: 'text',
      rows: 2,
    },
    // --- SECTION PAGE (set once per category; every future article follows it) ---
    {
      name: 'sectionPage',
      title: 'Section page',
      type: 'string',
      description: 'The section page (Arabic and English) that shows this category\'s stories. Pick one and the stories appear there with no code change. Leave empty only if the category\'s slug already matches a section\'s slug. "Articles & Reports" is not listed because it fills itself with every Opinion and In-Depth Report story.',
      options: {
        list: [
          { title: 'Schools / مدارس', value: 'schools' },
          { title: 'Universities / جامعات', value: 'universities' },
          { title: 'Technical & Vocational Education / التعليم الفني والتكنولوجي', value: 'technical' },
          { title: 'Policies & Decisions / السياسات والقرارات', value: 'policy' },
          { title: 'Economy & Investment / اقتصاد واستثمار التعليم', value: 'economy' },
        ],
        layout: 'dropdown',
      },
    },

    // --- HOMEPAGE ROUTING (set once per category; every future article follows it) ---
    {
      name: 'showInSectors',
      title: 'Show in "Explore by Sector" (homepage)',
      type: 'boolean',
      description: 'Adds a card for this category showing its newest story. Cards follow "Homepage Order"; the first 4 are shown.',
      initialValue: false,
    },
    {
      name: 'homeOrder',
      title: 'Homepage Order',
      type: 'number',
      description: 'Lower numbers come first (1, 2, 3...). Categories with no number come last.',
      validation: Rule => Rule.integer().min(1),
    },
    {
      name: 'feedsPolicyWatch',
      title: 'Feed "Policy Watch" automatically',
      type: 'boolean',
      description: 'Every story in this category appears in Policy Watch, with no need to tick the checkbox on each article. Cannot be combined with Investment Watch.',
      initialValue: false,
      validation: Rule => Rule.custom((value, context) =>
        value && context.document.feedsInvestmentWatch
          ? 'A category can feed Policy Watch or Investment Watch, not both.'
          : true
      ),
    },
    {
      name: 'feedsInvestmentWatch',
      title: 'Feed "Investment Watch" automatically',
      type: 'boolean',
      description: 'Every story in this category appears in the Investment Watch / Deals block on the homepage. Cannot be combined with Policy Watch.',
      initialValue: false,
      validation: Rule => Rule.custom((value, context) =>
        value && context.document.feedsPolicyWatch
          ? 'A category can feed Investment Watch or Policy Watch, not both.'
          : true
      ),
    },
    {
      name: 'color',
      title: 'Badge Color Theme',
      type: 'string',
      description: 'Must be a valid hex code (e.g., #0056b3) or a Bootstrap class (e.g., primary, success).',
      validation: Rule => Rule.custom(color => {
        if (!color) return true;
        const isHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/i.test(color);
        const validClasses = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
        if (isHex || validClasses.includes(color.toLowerCase())) return true;
        return 'Must be a valid hex code starting with # or a standard Bootstrap color name.';
      })
    },
  ],
};