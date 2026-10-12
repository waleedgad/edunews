// seed.mjs: loads test content into Sanity so you can check the homepage wiring.
//
//   node seed.mjs            create or update every document in data-to-seed.json (safe to re-run)
//   node seed.mjs --clean    delete exactly those documents (and their drafts), then stop
//   node seed.mjs --reset    --clean, then seed again
//
// Needs in the environment (or a .env file):
//   SANITY_API_TOKEN   an Editor (write) token
//   SANITY_DATASET     optional, defaults to "production". A separate test dataset is strongly recommended.
//   SANITY_PROJECT_ID  optional, defaults to the project below
//
// data-to-seed.json supports two helpers:
//   "$now-3h", "$now+2d", "$now"   resolved to an ISO date relative to when the script runs
//   "$today"                        resolved to today's date (YYYY-MM-DD), for plain date fields
//   { "_seedImage": "hero-1", "alt": "..." }   replaced by a generated placeholder image uploaded to Sanity
//                                              (names: hero-N 1200x675, logo-N 600x200, avatar-N 400x400)

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import 'dotenv/config';

// ---------------------------------------------------------------- config
const projectId = (process.env.SANITY_PROJECT_ID || 'f7bqs4ud').trim();
const dataset = (process.env.SANITY_DATASET || 'production').trim();
const token = (process.env.SANITY_API_TOKEN || '').trim();

if (!projectId) {
  console.error('❌ Missing Sanity Project ID.');
  process.exit(1);
}
if (!token) {
  console.error('❌ Missing SANITY_API_TOKEN. Put an Editor token in your environment or a .env file.');
  console.error('   (The token is no longer hard-coded in this script.)');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const MODE = args.has('--reset') ? 'reset' : args.has('--clean') ? 'clean' : 'seed';

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false });

// ---------------------------------------------------------------- relative dates
const NOW = Date.now();
const UNIT_MS = { m: 60_000, h: 3_600_000, d: 86_400_000 };

function resolveDate(str) {
  if (str === '$today') return new Date(NOW).toISOString().slice(0, 10);   // YYYY-MM-DD, for "date" fields
  const m = /^\$now(?:([+-])(\d+(?:\.\d+)?)([mhd]))?$/.exec(str);
  if (!m) return str;
  if (!m[1]) return new Date(NOW).toISOString();
  const delta = Number(m[2]) * UNIT_MS[m[3]] * (m[1] === '-' ? -1 : 1);
  return new Date(NOW + delta).toISOString();
}

// ---------------------------------------------------------------- placeholder PNGs (no extra dependencies)
function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const PALETTE = [
  [0, 86, 179], [25, 135, 84], [220, 53, 69], [255, 193, 7],
  [111, 66, 193], [13, 202, 240], [253, 126, 20], [32, 201, 151],
];

function makePng(width, height, [r, g, b]) {
  const rowLen = 1 + width * 3;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const shade = 1 - 0.45 * (y / height);            // vertical gradient so images look like images
    const off = y * rowLen;
    raw[off] = 0;                                     // filter: none
    for (let x = 0; x < width; x++) {
      const p = off + 1 + x * 3;
      raw[p] = Math.round(r * shade);
      raw[p + 1] = Math.round(g * shade);
      raw[p + 2] = Math.round(b * shade);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function imageSpec(name) {
  const m = /^(hero|logo|avatar)-(\d+)$/.exec(name);
  if (!m) throw new Error(`Unknown seed image name "${name}". Use hero-N, logo-N or avatar-N.`);
  const size = { hero: [1200, 675], logo: [600, 200], avatar: [400, 400] }[m[1]];
  return { width: size[0], height: size[1], color: PALETTE[(Number(m[2]) - 1) % PALETTE.length] };
}

// ---------------------------------------------------------------- walk the JSON
function collectImageNames(node, set = new Set()) {
  if (Array.isArray(node)) node.forEach((n) => collectImageNames(n, set));
  else if (node && typeof node === 'object') {
    if (typeof node._seedImage === 'string') set.add(node._seedImage);
    Object.values(node).forEach((v) => collectImageNames(v, set));
  }
  return set;
}

function transform(node, assetIds) {
  if (typeof node === 'string') return resolveDate(node);
  if (Array.isArray(node)) return node.map((n) => transform(n, assetIds));
  if (node && typeof node === 'object') {
    if (typeof node._seedImage === 'string') {
      const { _seedImage, ...rest } = node;
      return { _type: 'image', asset: { _type: 'reference', _ref: assetIds[_seedImage] }, ...rest };
    }
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, transform(v, assetIds)]));
  }
  return node;
}

async function uploadImages(names) {
  const ids = {};
  for (const name of names) {
    const { width, height, color } = imageSpec(name);
    const asset = await client.assets.upload('image', makePng(width, height, color), {
      filename: `seed-${name}.png`,
      contentType: 'image/png',
    });
    ids[name] = asset._id;                // identical bytes map to the same asset, so re-runs don't pile up uploads
  }
  return ids;
}

async function inChunks(items, size, fn) {
  for (let i = 0; i < items.length; i += size) await fn(items.slice(i, i + size));
}

// ---------------------------------------------------------------- actions
async function clean(documents) {
  const ids = documents.flatMap((d) => [d._id, `drafts.${d._id}`]);
  // One transaction for everything: documents reference each other (homePage -> articles -> authors...),
  // and Sanity only checks references when the whole transaction ends, so no ordering problems.
  const tx = client.transaction();
  ids.forEach((id) => tx.delete(id));
  await tx.commit();
  console.log(`🧹 Removed ${documents.length} seeded documents (and any drafts of them).`);
}

async function seed(documents) {
  const names = collectImageNames(documents);
  console.log(`🖼  Uploading ${names.size} placeholder images...`);
  const assetIds = await uploadImages(names);

  const prepared = documents.map((d) => transform(d, assetIds));
  console.log(`🚀 Writing ${prepared.length} documents to "${dataset}"...`);

  await inChunks(prepared, 50, async (chunk) => {
    const tx = client.transaction();
    chunk.forEach((doc) => tx.createOrReplace(doc));
    await tx.commit();
  });

  const counts = prepared.reduce((acc, d) => ((acc[d._type] = (acc[d._type] || 0) + 1), acc), {});
  console.log('✅ Seeding completed:', counts);
  console.log('   Note: this replaced the "homePage", "siteSettings" and "morningBrief" documents.');
}

async function main() {
  const documents = JSON.parse(readFileSync('./data-to-seed.json', 'utf-8'));
  const ids = documents.map((d) => d._id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate _id values in data-to-seed.json');

  console.log(`Project ${projectId} / dataset "${dataset}" / mode: ${MODE}`);
  if (MODE === 'clean' || MODE === 'reset') await clean(documents);
  if (MODE === 'seed' || MODE === 'reset') await seed(documents);
}

main().catch((error) => {
  console.error('❌ Failed:', error.message);
  if (/reference/i.test(error.message) || /referenced/i.test(error.message)) {
    console.error('   A document outside this seed file still points at a seeded document. Remove or repoint it, then retry.');
  }
  process.exit(1);
});
