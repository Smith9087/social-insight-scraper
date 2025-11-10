onst { extractReferenceId } = require('../utils/request_handler');
const {
buildEngagementRecord,
} = require('../utils/data_cleaner');

/**
* Extracts metadata and engagement metrics for a TikTok URL.
* In a real integration this would rely on TikTok's APIs or
* a compliant scraping layer.
*
* @param {string} url
* @param {object} options
* @returns {Promise<object|null>}
*/
async function extract(url, options = {}) {
const platform = options.platform || 'tiktok';
const referenceId = extractReferenceId(url, platform);
const type = 'video';

const meta = {
screenName: `Unknown TikTok Creator`,
username: null,
title: `TikTok ${type} ${referenceId}`,
description: `Auto-generated metadata for TikTok ${type} at ${url}`,
};

const record = buildEngagementRecord({
url,
platform,
referenceId,
type,
meta,
});

if (options.minPublishedDate) {
const published = new Date(record.data.result.publishedDate);
const minDate = new Date(options.minPublishedDate);
if (published < minDate) {
return null;
}
}

return record;
}

module.exports = {
extract,
};