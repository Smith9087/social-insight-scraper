onst fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const { identifyPlatform } = require('./utils/request_handler');
const youtubeExtractor = require('./extractors/youtube_extractor');
const instagramExtractor = require('./extractors/instagram_extractor');
const tiktokExtractor = require('./extractors/tiktok_extractor');

// Load environment variables from .env if it exists
dotenv.config();

function loadJsonFile(filePath) {
try {
const absolute = path.resolve(filePath);
const raw = fs.readFileSync(absolute, 'utf8');
return JSON.parse(raw);
} catch (err) {
console.error(`[ERROR] Failed to read JSON file at ${filePath}: ${err.message}`);
process.exit(1);
}
}

function writeJsonFile(filePath, data) {
try {
const absolute = path.resolve(filePath);
const dir = path.dirname(absolute);
if (!fs.existsSync(dir)) {
fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(absolute, JSON.stringify(data, null, 2), 'utf8');
console.log(`[INFO] Wrote ${Array.isArray(data) ? data.length : 1} records to ${absolute}`);
} catch (err) {
console.error(`[ERROR] Failed to write JSON file at ${filePath}: ${err.message}`);
process.exit(1);
}
}

function getExtractor(platform) {
switch (platform) {
case 'youtube':
return youtubeExtractor;
case 'instagram':
return instagramExtractor;
case 'tiktok':
return tiktokExtractor;
default:
return null;
}
}

function parseMinPublishedDate() {
const value = process.env.MIN_PUBLISHED_DATE;
if (!value) return null;
const date = new Date(value);
if (Number.isNaN(date.getTime())) {
console.warn(
`[WARN] MIN_PUBLISHED_DATE is set but invalid ("${value}"). Ignoring this filter.`
);
return null;
}
return date.toISOString();
}

async function processItem(item, options) {
const url = typeof item === 'string' ? item : item.url;
if (!url) {
console.warn('[WARN] Skipping item without URL:', item);
return null;
}

const platform = identifyPlatform(url);
const extractor = getExtractor(platform);

if (!extractor || typeof extractor.extract !== 'function') {
console.warn(
`[WARN] No extractor found for platform "${platform}" (url: ${url}). Skipping.`
);
return null;
}

try {
const result = await extractor.extract(url, {
platform,
minPublishedDate: options.minPublishedDate,
});
return result;
} catch (err) {
console.error(
`[ERROR] Extractor for platform "${platform}" failed for URL "${url}": ${err.message}`
);
return null;
}
}

async function main() {
const args = process.argv.slice(2);
const inputPath =
args[0] || path.join(__dirname, '..', 'data', 'input.sample.json');
const outputPath =
args[1] || path.join(__dirname, '..', 'data', 'output.sample.json');

console.log('[INFO] Social Insight Scraper starting...');
console.log(`[INFO] Using input: ${inputPath}`);
console.log(`[INFO] Using output: ${outputPath}`);

const minPublishedDate = parseMinPublishedDate();

const input = loadJsonFile(inputPath);
if (!Array.isArray(input)) {
console.error('[ERROR] Input file must contain a JSON array.');
process.exit(1);
}

const results = [];
for (const item of input) {
// eslint-disable-next-line no-await-in-loop
const record = await processItem(item, { minPublishedDate });
if (record) {
results.push(record);
}
}

writeJsonFile(outputPath, results);
console.log('[INFO] Social Insight Scraper completed successfully.');
}

if (require.main === module) {
main().catch((err) => {
console.error('[FATAL] Unhandled error:', err);
process.exit(1);
});
}