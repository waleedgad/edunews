import { customSlugify } from './slugify';

export default {
  name: 'article',
  title: 'News Article',
  type: 'document',
  fields: [
    // --- BILINGUAL TITLES ---
    {
      name: 'title_ar',
      title: 'Title (Arabic)',
      type: 'string',
      validation: Rule => Rule.custom((titleAr, context) => {
        if (!titleAr && !context.document.title_en) {
          return 'You must provide a title in at least one language (Arabic or English).';
        }
        return true;
      }),
    },
    {
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      validation: Rule => Rule.custom((titleEn, context) => {
        if (!titleEn && !context.document.title_ar) {
          return 'You must provide a title in at least one language (Arabic or English).';
        }
        return true;
      }),
    },

    // --- BILINGUAL SLUGS ---
    {
      name: 'slug_ar',
      title: 'Slug (Arabic)',
      type: 'slug',
      description: 'Part of the story\'s web address. Changing it after publishing breaks links that already point to the story.',
      options: { 
        source: 'title_ar', 
        maxLength: 60,
        slugify: customSlugify
      },
      validation: Rule => Rule.custom((slugAr, context) => {
        if (context.document.title_ar && !slugAr) {
          return 'An Arabic slug is required to complete the Arabic version.';
        }
        return true;
      }),
    },
    {
      name: 'slug_en',
      title: 'Slug (English)',
      type: 'slug',
      description: 'Part of the story\'s web address. Changing it after publishing breaks links that already point to the story.',
      options: { 
        source: 'title_en', 
        maxLength: 60,
        slugify: customSlugify
      },
      validation: Rule => Rule.custom((slugEn, context) => {
        if (context.document.title_en && !slugEn) {
          return 'An English slug is required to complete the English version.';
        }
        return true;
      }),
    },

    // --- GLOBAL SETTINGS ---
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      description: 'Defaults to now. Set a future time to schedule: the story stays off the site and homepage until then (needs the scheduled rebuild). The date is part of the story\'s web address, so changing it after publishing changes the address.',
      initialValue: () => new Date().toISOString(),
      validation: Rule => Rule.required().error('Publishing date and time is required.'),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: Rule => Rule.required().error('Articles must belong to a primary category.'),
    },
    {
      name: 'vertical',
      title: 'Vertical',
      type: 'reference',
      to: [{ type: 'vertical' }],
      options: { disableNew: true },   // verticals are created from their own menu, not from inside an article
      description: 'Optional. Puts this story in a branded vertical such as Classroom, Staffroom, Exam Paper or EdTech. It appears on that vertical\'s page (/ar/<slug>/ and /en/<slug>/) and in the homepage "Explore" cards. The story keeps its category either way.',
    },
    {
      name: 'topics',
      title: 'Topics & Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'topic' }] }],
    },
    {
      name: 'archetype',
      title: 'Content Format',
      type: 'string',
      description: 'Decides where the story lives and where it appears. Standard and Brief go under /news/, In-Depth Report under /reports/ (and in the homepage Signature Series), Editorial under /opinion/. A Brief can also fill the Morning Briefing card. Changing this after publishing changes the story\'s web address.',
      options: {
        list: [
          { title: 'Standard News', value: 'standard' },
          { title: 'News Brief (Short)', value: 'brief' },
          { title: 'In-Depth Report', value: 'report' },
          { title: 'Editorial / Opinion', value: 'editorial' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'standard',
    },
    {
      // Retired: this duplicated the Hero Slider picker in Homepage Manager.
      // Kept in the schema but hidden so existing documents (which already have
      // hero: false stored) don't show an "unknown field" warning in Studio.
      // Safe to delete once the stored values are cleaned up.
      name: 'hero',
      title: 'Hero Banner Story (retired)',
      type: 'boolean',
      hidden: true,
    },
    {
      name: 'featured',
      title: 'Featured Story',
      type: 'boolean',
      description: 'Shows this story in the "لدينا اليوم" / "Today\'s Picks" list on the homepage of each language it is published in. The 6 newest featured stories are shown. It also fills the "picks" sidebar on the story\'s section page.',
      initialValue: false,
    },
    {
      name: 'isBreaking',
      title: 'Breaking News (Urgent)',
      type: 'boolean',
      description: 'Labels this story "عاجل" / "Breaking" and pins it to the front of the news ticker on the homepage of each language it is published in. The label switches itself off 24 hours after the publish time (at the next site rebuild), on the homepage, section pages and the story page.',
      initialValue: false,
    },
    {
      name: 'isPolicyWatch',
      title: 'Policy Watch',
      type: 'boolean',
      description: 'Adds this story to the "رصد السياسات التعليمية" / "Education Policy Watch" section on the homepage of each language it is published in. Stories in a category set to "Feed Policy Watch automatically" appear there without ticking this. The lead story is picked in Homepage Manager; if none is picked, the newest Policy Watch story leads.',
      initialValue: false,
    },

    // --- BILINGUAL SUMMARIES ---
    {
      name: 'summary_ar',
      title: 'Summary (Arabic)',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.custom((summaryAr, context) => {
        if (context.document.title_ar && !summaryAr) {
          return 'An Arabic summary is required to complete the Arabic version.';
        }
        return true;
      }).max(250).warning('Summaries should ideally be under 250 characters.'),
    },
    {
      name: 'summary_en',
      title: 'Summary (English)',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.custom((summaryEn, context) => {
        if (context.document.title_en && !summaryEn) {
          return 'An English summary is required to complete the English version.';
        }
        return true;
      }).max(250).warning('Summaries should ideally be under 250 characters.'),
    },

    // --- MEDIA & META ---
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text (Alt)',
          description: 'Important for SEO and screen readers.',
        },
      ],
    },
    {
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      description: 'Optional. Used for search/social previews; falls back to the summary if empty.',
      validation: Rule => Rule.max(160).warning('Search engines usually cut descriptions at about 160 characters.'),
    },
    {
      name: 'imageCaption',
      title: 'Image Caption',
      type: 'string',
    },
    {
      name: 'imageCredit',
      title: 'Photo Credit',
      type: 'string',
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
    },

    // --- BILINGUAL BODY CONTENT ---
    {
      name: 'body_ar',
      title: 'Body Content (Arabic)',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } }
      ],
      validation: Rule => Rule.custom((bodyAr, context) => {
        if (context.document.title_ar && (!bodyAr || bodyAr.length === 0)) {
          return 'Arabic body content is required to complete the Arabic version.';
        }
        return true;
      }),
    },
    {
      name: 'body_en',
      title: 'Body Content (English)',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } }
      ],
      validation: Rule => Rule.custom((bodyEn, context) => {
        if (context.document.title_en && (!bodyEn || bodyEn.length === 0)) {
          return 'English body content is required to complete the English version.';
        }
        return true;
      }),
    },
  ],

  // Studio Preview prioritizes whichever language is currently filled out
  preview: {
    select: {
      titleAr: 'title_ar',
      titleEn: 'title_en',
      media: 'mainImage',
      date: 'publishedAt',
    },
    prepare({ titleAr, titleEn, media, date }) {
      const formattedDate = date ? new Date(date).toLocaleDateString() : 'Draft';
      const title = titleAr || titleEn || 'Untitled Article';
      const subtitle = (titleAr && titleEn) ? `[AR + EN] — ${formattedDate}` : 
                       (titleAr) ? `[AR] — ${formattedDate}` : 
                       `[EN] — ${formattedDate}`;
      
      return {
        title,
        subtitle,
        media,
      };
    },
  },
};