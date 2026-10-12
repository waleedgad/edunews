import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {BulkDeleteTool} from './bulkDeleteTool'

export default defineConfig({
  name: 'default',
  title: 'edunews',

  projectId: 'f7bqs4ud',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton item for Homepage Manager
            S.listItem()
              .title('Homepage Manager')
              .id('homePage')
              .child(
                S.document()
                  .schemaType('homePage')
                  .documentId('homePage')
              ),

            S.divider(),

            // Filter out homePage from the general document list so it doesn't duplicate
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== 'homePage'
            ),
          ]),
    }),
    visionTool(),
  ],

  tools: [{name: 'bulk-delete', title: 'Bulk Delete', component: BulkDeleteTool}],

  schema: {
    types: schemaTypes,
  },
})