# Piwik React Router

[![npm package](https://img.shields.io/npm/v/piwik-react-router.svg?style=flat-square)](https://www.npmjs.org/package/piwik-react-router)
[![dependency status](https://img.shields.io/david/peer/joernroeder/piwik-react-router.svg?style=flat-square)](https://david-dm.org/joernroeder/piwik-react-router)

[Piwik](https://piwik.org) analytics component for [react-router](https://github.com/rackt/react-router)

## Installation

	npm install piwik-react-router --save

## Features

- asynchronous loading of Piwik
- javascript error tracking


## Usage

Simply create your instance with the same `url` and `siteId` as described in the piwik [documentation](https://developer.piwik.org/guides/tracking-javascript-guide).

	var PiwikReactRouter = require('piwik-react-router');
	
	var piwik = PiwikReactRouter({
		url			: 'your-piwik-installation.com',
		siteId		: 1
	});
	
	<Router history={piwik.connectToHistory(history)}>
		<Route path="/" component={MyComponent} />
	</Router>
	
If you're using react-router prior to 1.0 please head over to the [react-router0.13.x branch](https://github.com/joernroeder/piwik-react-router/tree/react-router0.13.x).

## Options

### enableLinkTracking: `true`

[Link tracking](http://developer.piwik.org/api-reference/tracking-javascript#using-the-tracker-object) to track outgoing and download links is enabled by default.

### updateDocumentTitle: `true`

Updates the document title before adding a new page view as the title may changed during the route rendering. Make sure you call `piwik.track` __after__ React has rendered the `<Handler />` to make this work correctly.  
If you don't know how to update the title, check out the great [react-document-title](https://github.com/gaearon/react-document-title) module.

### trackErrors: `false`

By enabling this option occurring javascript errors will be tracked as a `JavaScript Error` piwik event.

see [http://davidwalsh.name/track-errors-google-analytics](http://davidwalsh.name/track-errors-google-analytics) for further details

## API

### track (ReactRouterState state)

Adds a page view from a react-router [state object](https://github.com/rackt/react-router/blob/master/docs/api/run.md#callbackhandler-state) if the path changed.

### push (args)

Pushes the specified args to the Piwik tracker the same way as you're using the `_paq.push(args);` directly. You can use this method as the low-level api to call methods from the [Piwik API](http://developer.piwik.org/api-reference/tracking-javascript#list-of-all-methods-available-in-the-tracking-api), [track events](http://piwik.org/docs/event-tracking/#tracking-events) or call [custom functions](http://developer.piwik.org/guides/tracking-javascript-guide).

### trackError (error, [eventName])

Tracks the given error as a new [Piwik Event](http://piwik.org/docs/event-tracking/#tracking-events) for the given event name. If you don't specify any name here it will fallback to `JavaScript Error`.

### connectToHistory(history)

Adds a listener to the passed in history object and triggers `track(state)` on every history change.

## A note on serverside rendering

Piwik tracking is disabled for serverside rendering and all API methods are replaced with noop-functions so you don't have to worry about it.
