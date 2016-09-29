'use strict';

var warning = require('warning');

// api shim. used for serverside rendering and misconfigured tracker instances
var apiShim = {
	track: function () {},
	push: function (args) {},
	trackError: function (e) {},
	connectToHistory: function (history) { return history; },
	disconnectFromHistory: function () {}
};

var previousPath = null;
var unlistenFromHistory = null;

var PiwikTracker = function(opts) {
	opts = opts || {};
	opts.trackErrors = ((opts.trackErrors !== undefined) ? opts.trackErrors : false);
	opts.enableLinkTracking = ((opts.enableLinkTracking !== undefined) ? opts.enableLinkTracking : true);
	opts.updateDocumentTitle = ((opts.updateDocumentTitle !== undefined) ? opts.updateDocumentTitle : true); 

	if (!opts.url || !opts.siteId) {
		warning(null, 'PiwikTracker cannot be initialized! You haven\'t passed a url and sideId to it.');
		return apiShim;
	}

	window['_paq'] = window['_paq'] || [];

	/**
	 * Adds a page view for the the given location
	 */
	var track = function track (loc) {
		var currentPath = loc.path || (loc.pathname + loc.search);

		if (previousPath === currentPath) {
			return;
		}

		if (opts.updateDocumentTitle) {
			_paq.push(['setDocumentTitle', document.title]);
		}
		_paq.push(['setCustomUrl', currentPath]);
		_paq.push(['trackPageView']);

		previousPath = currentPath;
	};

	/**
	 * Pushes the specified args to the piwik tracker. 
	 * You can use this method as the low-level api to call methods from the piwik API or call custom functions
	 *
	 * @see https://developer.piwik.org/guides/tracking-javascript-guide
	 */
	var push = function push (args) {
		_paq.push(args);
	};

	/**
	 * Tracks occurring javascript errors as a `JavaScript Error` piwik event.
	 * 
	 * @see http://davidwalsh.name/track-errors-google-analytics
	 */
	var trackError = function trackError (e, eventName) {
		eventName = eventName || 'JavaScript Error';
		
		push([
			'trackEvent',
			eventName,
			e.message,
			e.filename + ':  ' + e.lineno
		]);
	};

	var connectToHistory = function (history) {
		unlistenFromHistory = history.listen(function (loc) {
			track(loc);
		});

		return history;
	};
	
	var disconnectFromHistory = function () {
		if (unlistenFromHistory) {
			unlistenFromHistory();
		}
	};

	if (opts.trackErrors) {
		if (window.addEventListener) {
			window.addEventListener('error', trackError, false);
		}
		else if (window.attachEvent) {
			window.attachEvent('onerror', trackError);
		}
		else {
			window.onerror = trackError;
		}
	}

	// piwik initializer
	(function() {
    if (opts.url.indexOf('http://') !== -1 || opts.url.indexOf('https://') !== -1) {
      var u = opts.url + '/';
    } else {
      var u = (('https:' == document.location.protocol) ? 'https://' + opts.url + '/' : 'http://' + opts.url + '/');
    }
		
		_paq.push(['setSiteId', opts.siteId]);
		_paq.push(['setTrackerUrl', u+'piwik.php']);

		if (opts.enableLinkTracking) {
			_paq.push(['enableLinkTracking']);
		}

		var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript'; g.defer=true; g.async=true; g.src=u+'piwik.js';
		s.parentNode.insertBefore(g,s);
	})();

	// return api
	return {
		track: track,
		push: push,
		trackError: trackError,
		connectToHistory: connectToHistory,
		disconnectFromHistory: disconnectFromHistory
	};
};

if (typeof window === 'undefined') {
	module.exports = function() {
		return apiShim;
	};
}
else {
	module.exports = PiwikTracker;
}