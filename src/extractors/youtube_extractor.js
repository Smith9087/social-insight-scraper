onst { extractReferenceId } = require('../utils/request_handler');
const {
buildEngagementRecord,
} = require('../utils/data_cleaner');

/**
* Extracts metadata and engagement metrics for a YouTube URL.
* In a real-world setup this would call the YouTube Data API.
* Here we generate deterministic, realistic-looking metrics without
* performing any external network requests.
*
* @param {string} url
* @param {object} options
* @returns {Promise<object|null>}
*/
async function extract(url, options = {}) {
const platform = options.platform || 'youtube';
const referenceId = extractReferenceId(url, platform);
const type = 'video';

const meta = {
screenName: 'Unknown YouTube Creator',
username: null,
title: `YouTube video ${referenceId}`,
description: `Auto-generated metadata for YouTube video at ${url}`,
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