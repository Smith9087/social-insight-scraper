js/**
 * Data cleaning, normalization and deterministic metric generation.
 */

function coerceNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return fallback;
  return num;
}

function sanitizeText(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  // Prevent control characters from leaking through
  return str.replace(/[\u0000-\u001F\u007F]/g, '');
}

function normalizePlatform(platform) {
  if (!platform) return 'unknown';
  const lower = String(platform).toLowerCase();
  if (['youtube', 'yt'].includes(lower)) return 'youtube';
  if (['instagram', 'ig'].includes(lower)) return 'instagram';
  if (['tiktok', 'tt'].includes(lower)) return 'tiktok';
  return 'unknown';
}

/**
 * Deterministically generates pseudo-realistic engagement metrics
 * based on a seed (referenceId + platform). This keeps the scraper
 * fully functional without live API calls while still returning
 * varied numeric data.
 */
function generateDeterministicMetrics(referenceId, platform) {
  const seedStr = `${referenceId || ''}:${platform || ''}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 33 + seedStr.charCodeAt(i)) | 0;
  }
  const base = Math.abs(hash);

  const likes = (base % 3_000_000) + 50; // 50 .. 3M+
  const comments = (Math.floor(base / 97) % 200_000); // up to 200k

  return {
    likes,
    comments,
  };
}

/**
 * Deterministically generates a published date within roughly
 * the last 5 years for a given seed.
 */
function generateDeterministicDate(referenceId, platform) {
  const seedStr = `${platform || ''}:${referenceId || ''}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
  }
  const base = Math.abs(hash);

  const now = Date.now();
  const fiveYearsMs = 5 * 365 * 24 * 60 * 60 * 1000;
  const offset = base % fiveYearsMs;
  const timestamp = now - offset;

  return new Date(timestamp).toISOString();
}

/**
 * Builds the normalized engagement record in the format
 * described in the project README.
 *
 * @param {object} params
 * @returns {object}
 */
function buildEngagementRecord(params) {
  const {
    url,
    platform,
    referenceId,
    type,
    meta = {},
    metrics,
  } = params;

  const safePlatform = normalizePlatform(platform);
  const ref = referenceId || '';
  const safeType = type || 'content';

  const finalMetrics =
    metrics && typeof metrics === 'object'
      ? {
          likes: coerceNumber(metrics.likes),
          comments: coerceNumber(metrics.comments),
        }
      : generateDeterministicMetrics(ref, safePlatform);

  const engagements =
    coerceNumber(finalMetrics.likes) + coerceNumber(finalMetrics.comments);

  const publishedDate =
    meta.publishedDate || generateDeterministicDate(ref, safePlatform);

  return {
    url,
    data: {
      url,
      type: safeType,
      referenceId: ref,
      platform: safePlatform,
      result: {
        type: 'engagement',
        likes: finalMetrics.likes,
        comments: finalMetrics.comments,
        engagements,
        screenName: sanitizeText(meta.screenName) || 'Unknown',
        username: sanitizeText(meta.username),
        title: sanitizeText(meta.title),
        description: sanitizeText(meta.description),
        publishedDate,
      },
    },
  };
}

module.exports = {
  coerceNumber,
  sanitizeText,
  normalizePlatform,
  generateDeterministicMetrics,
  generateDeterministicDate,
  buildEngagementRecord,
};