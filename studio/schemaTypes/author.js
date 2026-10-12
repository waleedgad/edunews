import { customSlugify } from './slugify';

export default {
  name: 'author',
  title: 'Author',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'authority', title: 'Authority & credentials' },
    { name: 'links', title: 'Links & contact' },
  ],
  fields: [
    // ---------- Identity ----------
    {
      name: 'name_ar',
      title: 'Name (Arabic)',
      type: 'string',
      group: 'identity',
      validation: Rule => Rule.required().error('Arabic author name is required.'),
    },
    { name: 'name_en', title: 'Name (English)', type: 'string', group: 'identity' },
    {
      name: 'slug_ar',
      title: 'Slug (Arabic)',
      type: 'slug',
      group: 'identity',
      options: { source: 'name_ar', maxLength: 60, slugify: customSlugify },
      validation: Rule => Rule.required().error('Arabic slug is required for author routing.'),
    },
    {
      name: 'slug_en',
      title: 'Slug (English)',
      type: 'slug',
      group: 'identity',
      options: { source: 'name_en', maxLength: 60, slugify: customSlugify },
    },
    {
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      group: 'identity',
      options: { hotspot: true },
      description: 'A real, professional headshot. Shown at the top of the profile page.',
    },

    // ---------- Authority ----------
    { name: 'role_ar', title: 'Title / Role (Arabic)', type: 'string', group: 'authority',
      description: 'e.g. Senior Education Editor' },
    { name: 'role_en', title: 'Title / Role (English)', type: 'string', group: 'authority' },
    {
      name: 'credentials_ar',
      title: 'Credentials (Arabic)',
      type: 'string',
      group: 'authority',
      description: 'One line that builds trust, e.g. "PhD in Curriculum Design · 12 years in education journalism".',
      validation: Rule => Rule.max(160),
    },
    {
      name: 'credentials_en',
      title: 'Credentials (English)',
      type: 'string',
      group: 'authority',
      validation: Rule => Rule.max(160),
    },
    {
      name: 'expertise_ar',
      title: 'Areas of expertise (Arabic)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'authority',
      options: { layout: 'tags' },
      validation: Rule => Rule.max(8),
    },
    {
      name: 'expertise_en',
      title: 'Areas of expertise (English)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'authority',
      options: { layout: 'tags' },
      validation: Rule => Rule.max(8),
    },
    {
      name: 'bio_ar',
      title: 'Bio (Arabic)',
      type: 'text',
      rows: 5,
      group: 'authority',
      description: 'Aim for 60–120 words: background, focus, and what readers can expect.',
    },
    { name: 'bio_en', title: 'Bio (English)', type: 'text', rows: 5, group: 'authority' },

    // ---------- Links & contact ----------
    { name: 'linkedin', title: 'LinkedIn Profile URL', type: 'url', group: 'links' },
    { name: 'twitter', title: 'Twitter/X Handle', type: 'string', group: 'links' },
    { name: 'website', title: 'Personal / Institutional Website', type: 'url', group: 'links' },
    {
      name: 'email',
      title: 'Public contact email',
      type: 'string',
      group: 'links',
      description: 'Shown publicly on the profile page. Leave empty to hide the contact link.',
    },
  ],
}