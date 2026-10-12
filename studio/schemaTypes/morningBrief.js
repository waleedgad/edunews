// schemaTypes/morningBrief.js  (Sanity Studio v3)
// Add to your schema list:  import morningBrief from './morningBrief'  ->  types: [..., morningBrief]
//
// One single document ("singleton") that controls the Morning Brief page.
// To keep it single, add this to your desk structure (structureTool) so the editor opens the
// document directly instead of a list:
//
//   S.listItem()
//     .title('Morning Brief')
//     .id('morningBrief')
//     .child(S.document().schemaType('morningBrief').documentId('morningBrief'))
//
// (optional but recommended, keeps it to one document) and hide it from the "new document" menu:
//
//   document: { newDocumentOptions: (prev) => prev.filter((o) => o.templateId !== 'morningBrief') }

import {defineType, defineField, defineArrayMember} from 'sanity'

export default defineType({
  name: 'morningBrief',
  title: 'Morning Brief',
  type: 'document',
  groups: [
    {name: 'stories', title: 'Stories', default: true},
    {name: 'sponsors', title: 'Sponsors'},
  ],
  fields: [
    defineField({
      name: 'issueDate',
      title: 'Issue date (optional)',
      type: 'date',
      group: 'stories',
      description: 'Shown under the title. Leave empty to use the date of the first story.',
    }),

    defineField({
      name: 'stories',
      title: 'Stories in this issue',
      type: 'array',
      group: 'stories',
      description:
        'Drag to reorder. The FIRST story is the top story ("الخبر الأبرز") and its photo opens the page. ' +
        'If you leave this empty, the page picks the newest stories automatically. ' +
        'A story is skipped on the Arabic page if it has no Arabic version, and the same for English.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'article'}],
          options: {filter: 'publishedAt <= now()'},
        }),
      ],
      validation: (Rule) => [
        Rule.unique().error('The same article is in the list twice.'),
        Rule.max(12).warning('More than 12 stories makes a very long brief.'),
      ],
    }),

    defineField({
      name: 'sponsorsTitle_ar',
      title: 'Sponsors heading (Arabic)',
      type: 'string',
      group: 'sponsors',
      initialValue: 'بدعم من',
    }),
    defineField({
      name: 'sponsorsTitle_en',
      title: 'Sponsors heading (English)',
      type: 'string',
      group: 'sponsors',
      initialValue: 'Supported by',
    }),
    defineField({
      name: 'sponsors',
      title: 'Sponsors of this brief',
      type: 'array',
      group: 'sponsors',
      description:
        'Pick from your Sponsor documents. Drag to reorder. Sponsors switched off ("Show on website") are skipped. ' +
        'Leave empty to show no sponsors on the brief.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'sponsor'}],
          options: {filter: 'active != false'},
        }),
      ],
      validation: (Rule) => Rule.unique().error('The same sponsor is in the list twice.'),
    }),
  ],
  preview: {prepare: () => ({title: 'Morning Brief'})},
})