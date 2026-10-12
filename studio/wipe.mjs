import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'f7bqs4ud',   // from sanity.config.ts or sanity.io/manage
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
})

const count = await client.fetch('count(*[!(_id in path("_.**"))])')
console.log('About to delete', count, 'documents')

await client.delete({query: '*[!(_id in path("_.**"))]'})
console.log('Done')