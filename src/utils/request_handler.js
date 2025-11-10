js/**
* Utility helpers for platform detection, ID extraction and
* generic retry/sleep logic. Network requests are intentionally
* omitted so that the scraper runs without external dependencies.
*/

function sleep(ms) {
return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
* Generic retry wrapper with exponential backoff.
* Currently used as a building block for future network calls.
*
* @param {Function} fn async function
* @param {object} options
* @returns {Promise<*>}
*/
async function withRetries(fn, options = {}) {
const {
attempts = 3,
baseDelayMs = 300,
factor = 2,
} = options;

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
try {
// eslint-disable-next-line no-await-in-loop
return await fn();
} catch (err) {
lastError = err;
const delay = baseDelayMs * (factor ** (attempt - 1));
console.warn(
`[WARN] Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms`
);
// eslint-disable-next-line no-await-in-loop
await sleep(delay);
}
}
throw lastError;
}

/**
* Best-effort platform detection from a URL.
*
* @param {string} url
* @returns {'youtube'|'instagram'|'tiktok'|'unknown'}
*/
function identifyPlatform(url) {
const lower = String(url).toLowerCase();

if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
return 'youtube';
}
if (lower.includes('instagram.com')) {
return 'instagram';
}
if (lower.includes('tiktok.com')) {
return 'tiktok';
}
return 'unknown';
}

/**
* Extracts a stable reference ID from the URL depending on the platform.
*
* @param {string} url
* @param {string} platform
* @returns {string}
*/
function extractReferenceId(url, platform) {
try {
const parsed = new URL(url);

if (platform === 'youtube') {
const v = parsed.searchParams.get('v');
if (v) return v;
const segments = parsed.pathname.split('/').filter(Boolean);
if (segments.length > 0) {
return segments[segments.length - 1];
}
}

if (platform === 'instagram') {
const segments = parsed.pathname.split('/').filter(Boolean);
const idx = segments.findIndex((s) => s === 'p' || s === 'reel');
if (idx !== -1 && segments[idx + 1]) {
return segments[idx + 1];
}
if (segments.length > 0) {
return segments[segments.length - 1];
}
}

if (platform === 'tiktok') {
const segments = parsed.pathname.split('/').filter(Boolean);
if (segments.length > 0) {
return segments[segments.length - 1];
}
}

// Fallback: a hash of the URL string
return createHashFromString(url);
} catch (err) {
console.warn(
`[WARN] Failed to parse URL for referenceId ("${url}"): ${err.message}`
);
return createHashFromString(url);
}
}

function createHashFromString(str) {
let hash = 0;
const normalized = String(str);
for (let i = 0; i < normalized.length; i += 1) {
hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
}
return Math.abs(hash).toString(36);
}

module.exports = {
sleep,
withRetries,
identifyPlatform,
extractReferenceId,
};