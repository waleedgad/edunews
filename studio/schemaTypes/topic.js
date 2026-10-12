import { customSlugify } from './slugify';

export default {
  name: 'topic',
  title: 'Topic / Tag',
  type: 'document',
  fields: [
    {
      name: 'title_ar',
      title: 'Topic Name (Arabic)',
      type: 'string',
      validation: Rule => Rule.required().error('Arabic topic title is required.'),
    },
    {
      name: 'title_en',
      title: 'Topic Name (English)',
      type: 'string',
    },
    {
      name: 'slug_ar',
      title: 'Slug (Arabic)',
      type: 'slug',
      options: { 
        source: 'title_ar', 
        maxLength: 60,
        slugify: customSlugify
      },
      validation: Rule => Rule.required().error('Arabic topic slug is required for topic routes.'),
    },
    {
      name: 'slug_en',
      title: 'Slug (English)',
      type: 'slug',
      options: { 
        source: 'title_en', 
        maxLength: 60,
        slugify: customSlugify
      },
    },
  ],
};