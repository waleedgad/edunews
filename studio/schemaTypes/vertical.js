// schemas/vertical.js
// A "Vertical" is a branded mini-publication (Classroom, Staffroom, Exam Paper, EdTech...).
// Create one in Sanity and it automatically gets:
//   - a landing page at /ar/<slug>/ and /en/<slug>/
//   - a card in the homepage "Explore" block (first 4 by Homepage order)
//   - a choice in the article's "Vertical" field
// Its page layout is a template file in src/_includes/layouts/verticals/<template>.njk
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'vertical',
  title: 'Vertical (branded section)',
  type: 'document',
  fields: [
    defineField({
      name: 'title_ar',
      title: 'Name (Arabic)',
      type: 'string',
      description: 'Leave empty to hide this vertical from the Arabic site.',
    }),
    defineField({
      name: 'title_en',
      title: 'Name (English)',
      type: 'string',
      description: 'Leave empty to hide this vertical from the English site.',
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: { source: 'title_en', maxLength: 60 },
      description: 'Latin letters only, e.g. "classroom". Used for both /ar/classroom/ and /en/classroom/. Must not match an existing section slug.',
      validation: (Rule) =>
        Rule.required().custom((slug) =>
          !slug?.current || /^[a-z0-9-]+$/.test(slug.current)
            ? true
            : 'Use lowercase latin letters, numbers and hyphens only'
        ),
    }),
    defineField({
      name: 'template',
      title: 'Page layout',
      type: 'string',
      description: 'Which template file builds this vertical\'s page (src/_includes/layouts/verticals/<value>.njk). To add a layout: create the file there, then add it to this list.',
      options: {
        list: [
          { title: 'Default (lead + two side cards + latest feed)', value: 'default' },
          { title: 'Magazine (overlay lead + headlines + feed)', value: 'magazine' },
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
    defineField({ name: 'tagline_ar', title: 'Tagline (Arabic)', type: 'string' }),
    defineField({ name: 'tagline_en', title: 'Tagline (English)', type: 'string' }),
    defineField({ name: 'description_ar', title: 'Description (Arabic)', type: 'text', rows: 3, description: 'Shown on the vertical page header.' }),
    defineField({ name: 'description_en', title: 'Description (English)', type: 'text', rows: 3 }),
    defineField({
      name: 'color',
      title: 'Accent color',
      type: 'string',
      description: 'Hex value, e.g. #1456a8. Colors the homepage card bar.',
      validation: (Rule) =>
        Rule.custom((v) => (!v || /^#[0-9a-fA-F]{6}$/.test(v) ? true : 'Use a 6-digit hex like #1456a8')),
    }),
    defineField({
      name: 'logo',
      title: 'Logo (optional)',
      type: 'image',
      description: 'If empty, the name is shown as text.',
    }),
    defineField({
      name: 'homeOrder',
      title: 'Homepage order',
      type: 'number',
      description: 'Lowest numbers show first. Only the first 4 appear on the homepage; every vertical still gets its own page.',
    }),
    defineField({
      name: 'showOnHome',
      title: 'Show on homepage',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [
    { title: 'Homepage order', name: 'homeOrder', by: [{ field: 'homeOrder', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title_en', subtitle: 'title_ar', media: 'logo' },
  },
});