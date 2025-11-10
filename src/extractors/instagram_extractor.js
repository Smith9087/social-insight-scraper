onst { extractReferenceId } = require('../utils/request_handler');
const {
buildEngagementRecord,
} = require('../utils/data_cleaner');

/**
* Extracts metadata and engagement metrics for an Instagram URL.
* A production version would use the Instagram Graph API or
* headless browser scraping with proper authorization.
*
* @param {string} url
* @param {object} options
* @returns {Promise<object|null>}
*/
async function extract(url, options = {}) {
const platform = options.platform || 'instagram';
const referenceId = extractReferenceId(url, platform);
const type = url.includes('/reel/') ? 'reel' : 'post';

const meta = {
screenName: 'Unknown Instagram Creator',
username: null,
title: `Instagram ${type} ${referenceId}`,
description: `Auto-generated metadata for Instagram ${type} at ${url}`,
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