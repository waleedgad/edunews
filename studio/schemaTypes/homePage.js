export default {
  name: 'homePage',
  title: 'Homepage Manager',
  type: 'document',
  fields: [
    {
      name: 'heroArticles',
      title: 'Hero Slider Articles (Max 6)',
      type: 'array',
      description: 'Pick up to 6 stories for the top slider, in the order you want them. Used on both the Arabic and English homepages; a pick with no version in a language is skipped on that homepage. If left empty, the 6 newest articles in each language are used automatically.',
      of: [{ type: 'reference', to: [{ type: 'article' }], options: { disableNew: true } }],
      validation: Rule => Rule.max(6).unique()
    },
    {
      name: 'briefingCover',
      title: 'Morning Briefing Cover Story',
      type: 'reference',
      description: 'The cover story of the Morning Briefing block. If left empty, the newest article not already used above is shown (separately on the Arabic and English homepages). A story with no version in a language is replaced by the newest one on that homepage. If this story is also in the Hero Slider, it is replaced by the newest unused story so nothing repeats.',
      to: [{ type: 'article' }],
      options: { disableNew: true }
    },
    {
      name: 'policyWatchLead',
      title: 'Policy Watch Lead Story',
      type: 'reference',
      description: 'The lead story of the Policy Watch section. If left empty, the newest article marked "Policy Watch" leads. The other Policy Watch stories are filled in automatically from articles with the "Policy Watch" checkbox and from categories set to feed Policy Watch automatically. If this story is also in the Hero Slider, it is replaced here by the newest Policy Watch story so nothing repeats.',
      to: [{ type: 'article' }],
      options: { disableNew: true }
    },
    {
      name: 'investmentWatchLead',
      title: 'Investment Watch Lead Story',
      type: 'reference',
      description: 'The lead story of the Investment Watch section. If left empty, the newest story from categories set to feed Investment Watch leads. The other Investment Watch stories are filled in automatically from those categories. Editorial / Opinion stories are ignored. If this story is also in the Hero Slider or is the Policy Watch lead, it is replaced here by the newest Investment Watch story so nothing repeats.',
      to: [{ type: 'article' }],
      options: { disableNew: true }
    }
  ]
};