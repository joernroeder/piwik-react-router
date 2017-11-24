'use strict';

var warning = require('warning');
var urljoin = require('url-join');

// api shim. used for serverside rendering and misconfigured tracker instances
var apiShim = {
  _isShim: true,
	track: function () {},
	push: function (args) {},
	setUserId: function (userId) {},
	trackError: function (e) {},
	connectToHistory: function (history, modifier) { return history; },
	disconnectFromHistory: function () {}
};

var previousPath = null;
var unlistenFromHistory = null;

var PiwikTracker = function(opts) {
  var getEnvironment = function () {
    return process && process.env && process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';
  };

  opts = opts || {};
	opts.trackErrors = ((opts.trackErrors !== undefined) ? opts.trackErrors : false);
	opts.trackErrorHandler = ((opts.trackErrorHandler !== undefined) ? opts.trackErrorHandler : trackError);
	opts.enableLinkTracking = ((opts.enableLinkTracking !== undefined) ? opts.enableLinkTracking : true);
	opts.updateDocumentTitle = ((opts.updateDocumentTitle !== undefined) ? opts.updateDocumentTitle : true);
	opts.ignoreInitialVisit = ((opts.ignoreInitialVisit !== undefined) ? opts.ignoreInitialVisit : false);
	opts.injectScript = ((opts.injectScript !== undefined) ? opts.injectScript : true);
	opts.clientTrackerName = ((opts.clientTrackerName !== undefined) ? opts.clientTrackerName : 'piwik.js');
	opts.serverTrackerName = ((opts.serverTrackerName !== undefined) ? opts.serverTrackerName : 'piwik.php');

  if (!opts.url || !opts.siteId) {
		// Only return warning if this is not in the test environment as it can break the Tests/CI.
		if (getEnvironment() !== 'test') {
			warning(null, 'PiwikTracker cannot be initialized! You haven\'t passed a url and siteId to it.');
		}

		return apiShim;
	}

	window._paq = window['_paq'] || [];

	/**
	 * Adds a page view for the given location
	 */
	var track = function track (loc) {
		var currentPath;

		if (loc.path) {
		  currentPath = loc.path;
		} else if (loc.basename) {
		  currentPath = urljoin(loc.basename, loc.pathname, loc.search);
		} else {
		  currentPath = urljoin(loc.pathname, loc.search);
		}

		if (previousPath === currentPath) {
			return;
		}

		if (opts.updateDocumentTitle) {
			push(['setDocumentTitle', document.title]);
		}
		push(['setCustomUrl', currentPath]);
		push(['trackPageView']);

		previousPath = currentPath;
	};

	/**
	 * Pushes the specified args to the piwik tracker.
	 * You can use this method as the low-level api to call methods from the piwik API or call custom functions
	 *
	 * @see https://developer.piwik.org/guides/tracking-javascript-guide
	 */
	var push = function push (args) {
		window._paq.push(args);
	};

  /**
	 * Sets a user ID to the piwik tracker.
	 * This method can be used after PiwikReactRouter is instantiated, for example after a user has logged in
	 *
	 * @see https://developer.piwik.org/guides/tracking-javascript-guide#user-id
	 */
	var setUserId = function setUserId (userId) {
		window._paq.push(['setUserId', userId])
	};

	/**
	 * Tracks occurring javascript errors as a `JavaScript Error` piwik event.
	 *
	 * @see http://davidwalsh.name/track-errors-google-analytics
	 */
	function trackError (e, eventName) {
		eventName = eventName || 'JavaScript Error';

		push([
			'trackEvent',
			eventName,
			e.message,
			e.filename + ': ' + e.lineno
		]);
	};

	/**
	 * Connects to the given history
	 */
	var connectToHistory = function (history, modifier) {
        modifier = (typeof modifier === 'function') ? modifier : function (location) { return location; };

        var applyModifierAndTrackLocation = function (modifier, location) {
            var modifiedLocation = modifier(location);

            if (modifiedLocation !== undefined) {
                track(modifiedLocation);
            }
            else if (getEnvironment() === 'development') {
                warning(null, 'The modifier given to .connectToHistory did not return any object. Please make sure to return the modified location object in your modifier.');
            }
        }

		unlistenFromHistory = history.listen(function (location) {
            applyModifierAndTrackLocation(modifier, location);
		});

        if (!opts.ignoreInitialVisit && history.location) {
            applyModifierAndTrackLocation(modifier, history.location);
        }

		return history;
	};

	/**
	 * Disconnects from a previous connected history
	 */
	var disconnectFromHistory = function () {
		if (unlistenFromHistory) {
			unlistenFromHistory();
      return true;
		}

    return false;
	};

	if (opts.trackErrors) {
		if (window.addEventListener) {
			window.addEventListener('error', opts.trackErrorHandler, false);
		}
		else if (window.attachEvent) {
			window.attachEvent('onerror', opts.trackErrorHandler);
		}
		else {
			window.onerror = opts.trackErrorHandler;
		}
	}

	// piwik initializer
	(function() {
    if (opts.url.indexOf('http://') !== -1 || opts.url.indexOf('https://') !== -1) {
      var u = opts.url + '/';
    } else {
      var u = (('https:' == document.location.protocol) ? 'https://' + opts.url + '/' : 'http://' + opts.url + '/');
    }

		push(['setSiteId', opts.siteId]);
		push(['setTrackerUrl', u+opts.serverTrackerName]);

		if (opts.userId) {
			push(['setUserId', opts.userId]);
		}

		if (opts.enableLinkTracking) {
			push(['enableLinkTracking']);
		}

		if (opts.injectScript) {
			var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript'; g.defer=true; g.async=true; g.src=u+opts.clientTrackerName;
			s.parentNode.insertBefore(g,s);
		}
	})();

	// return api
	return {
    _isShim: false,
		track: track,
		push: push,
		setUserId, setUserId,
		trackError: opts.trackErrorHandler,
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
