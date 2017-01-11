const proxyquire = require('proxyquire');

// copied from https://gist.github.com/adam-lynch/11037907

const _invalidateRequireCacheForFile = function (filePath) {
	delete require.cache[require.resolve(filePath)];
};
const requireNoCache = function (filePath, opts) {
	_invalidateRequireCacheForFile(filePath);
	return opts ? proxyquire(filePath, opts) : require(filePath);
};

const API_METHOD_NAMES = [
  'track',
  'push',
  'trackError',
  'connectToHistory',
  'disconnectFromHistory'
];

module.exports = {
	requireNoCache,
  API_METHOD_NAMES
};
