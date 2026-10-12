// studio/schemaTypes/siteSettings.js  (replace your current file, then redeploy / restart Studio)
export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fieldsets: [
    { name: 'social', title: 'Social accounts', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    // ---- Identity ----
    { name: 'title_ar', title: 'Platform Name (Arabic)', type: 'string' },
    { name: 'title_en', title: 'Platform Name (English)', type: 'string' },
    { name: 'description_ar', title: 'Site Description (Arabic)', type: 'text', rows: 3 },
    { name: 'description_en', title: 'Site Description (English)', type: 'text', rows: 3 },
    {
      name: 'siteUrl',
      title: 'Website URL',
      type: 'url',
      description: 'Full address with https://, e.g. https://www.edunews.com (needed for share previews)',
      validation: (Rule) => Rule.uri({ scheme: ['https', 'http'] }),
    },

    // ---- Branding ----
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'PNG or SVG with transparent background.',
    },
    {
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Square image, at least 512x512 PNG. Used for the browser tab and phone home screen.',
    },
    {
      name: 'themeColor',
      title: 'Brand / Theme Color',
      type: 'string',
      description: 'Hex color for the mobile browser bar, e.g. #0d6efd',
      validation: (Rule) => Rule.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { name: 'hex color' }),
    },

    // ---- Social sharing ----
    {
      name: 'defaultOgImage',
      title: 'Default Social Sharing Image',
      type: 'image',
      description: 'Shown when a page has no image of its own. Best size: 1200x630.',
    },
    {
      name: 'twitterHandle',
      title: 'X (Twitter) handle',
      type: 'string',
      description: 'e.g. @edunews',
      fieldset: 'social',
    },
    { name: 'facebookUrl', title: 'Facebook page URL', type: 'url', fieldset: 'social' },
    { name: 'xUrl', title: 'X (Twitter) profile URL', type: 'url', fieldset: 'social' },
    { name: 'instagramUrl', title: 'Instagram URL', type: 'url', fieldset: 'social' },
    { name: 'youtubeUrl', title: 'YouTube URL', type: 'url', fieldset: 'social' },
    { name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url', fieldset: 'social' },
    { name: 'tiktokUrl', title: 'TikTok URL', type: 'url', fieldset: 'social' },
  ],
};