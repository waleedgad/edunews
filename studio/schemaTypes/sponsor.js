export default {
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    // --- NAMES (alt text for the logo + screen readers; not shown visibly) ---
    {
      name: 'name_ar',
      title: 'Sponsor Name (Arabic)',
      type: 'string',
      validation: Rule => Rule.custom((nameAr, context) => {
        if (!nameAr && !context.document.name_en) {
          return 'Provide the sponsor name in at least one language (Arabic or English).';
        }
        return true;
      }),
    },
    {
      name: 'name_en',
      title: 'Sponsor Name (English)',
      type: 'string',
      validation: Rule => Rule.custom((nameEn, context) => {
        if (!nameEn && !context.document.name_ar) {
          return 'Provide the sponsor name in at least one language (Arabic or English).';
        }
        return true;
      }),
    },

    // --- LOGO ---
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'SVG or transparent PNG works best. Use a wide, tightly-cropped logo (no extra empty margins).',
      options: { hotspot: false, accept: 'image/svg+xml,image/png,image/webp,image/jpeg' },
      validation: Rule => Rule.required().error('A logo is required.'),
    },

    // --- LINK ---
    {
      name: 'url',
      title: 'Website Link',
      type: 'url',
      description: 'Where the logo goes when clicked (opens in a new tab). Must start with https://',
      validation: Rule => Rule.required().uri({ scheme: ['http', 'https'] })
        .error('A valid link starting with https:// is required.'),
    },

    // --- DISPLAY CONTROL ---
    {
      name: 'sortOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first (1, 2, 3...). Sponsors with no number come last.',
      validation: Rule => Rule.integer().min(1),
    },
    {
      name: 'active',
      title: 'Show on website',
      type: 'boolean',
      description: 'Turn off to hide this sponsor without deleting it.',
      initialValue: true,
    },
  ],

  orderings: [
    {
      title: 'Display Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      nameAr: 'name_ar',
      nameEn: 'name_en',
      media: 'logo',
      url: 'url',
      active: 'active',
    },
    prepare({ nameAr, nameEn, media, url, active }) {
      return {
        title: nameAr || nameEn || 'Untitled Sponsor',
        subtitle: `${active === false ? '⏸ Hidden — ' : ''}${url || 'No link'}`,
        media,
      };
    },
  },
};