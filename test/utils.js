
// copied from https://gist.github.com/adam-lynch/11037907

const _invalidateRequireCacheForFile = function (filePath) {
	delete require.cache[require.resolve(filePath)];
};
const requireNoCache = function (filePath) {
	_invalidateRequireCacheForFile(filePath);
	return require(filePath);
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
