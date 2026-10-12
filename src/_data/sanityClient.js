const { createClient } = require('@sanity/client');

module.exports = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'f7bqs4ud',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2026-01-01',
});