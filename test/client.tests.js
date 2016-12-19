const assert = require('chai').assert;
const sinon = require('sinon');

const testUtils = require('./utils.js');

describe('piwik-react-router client tests', function () {
  beforeEach(() => {
    this.jsdom = require('jsdom-global')();

    // piwiks tracking client doesn't properly adds the script tag to jsdom or the other way around.
    // As i won't modify the piwik loading script the easiest was to provide this hacky script tag.
    // Dirty – i know ;)
    document.body.innerHTML = '<script></script>';
  });

  afterEach(() => {
    this.jsdom();
  });

  it ('should correctly return the api if a global window object is present', () => {
    const siteId = 1;
    const url = 'foo.bar';

    const piwikReactRouter = testUtils.requireNoCache('../')({
      siteId,
      url
    });

    assert.sameMembers(Object.keys(piwikReactRouter), [
      '_isShim'
    ].concat(testUtils.API_METHOD_NAMES));

    assert.isFalse(piwikReactRouter._isShim);

    testUtils.API_METHOD_NAMES.forEach(methodName => {
      assert.isFunction(piwikReactRouter[methodName]);
    });
  });

  it ('should correctly push the trackerUrl and siteId to the _paq array on instantiation', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
      enableLinkTracking: true
    });

    assert.sameDeepMembers(window._paq, [
      [ 'setSiteId', 1 ],
      [ 'setTrackerUrl', 'http://foo.bar/piwik.php' ],
      [ 'enableLinkTracking' ]
    ]);
  });

  it ('should correctly disable link tracking', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
      enableLinkTracking: false
    });

    assert.sameDeepMembers(window._paq, [
      [ 'setSiteId', 1 ],
      [ 'setTrackerUrl', 'http://foo.bar/piwik.php' ],
    ]);
  });

  /*it ('should correctly use https as the protocol', () => {
    window.location.protocol = 'https:';

    console.log('window.location.protocol', window.location.protocol);
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
    });

    console.log('window._paq', window._paq);

    assert.includeDeepMembers(window._paq, [
      [ 'setTrackerUrl', 'https://foo.bar/piwik.php' ],
    ]);
  });*/

  it ('should correctly use the passed in url protocol ', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'https://foo.bar',
      siteId: 1
    });

    assert.sameDeepMembers(window._paq, [
      [ 'setSiteId', 1 ],
      [ 'setTrackerUrl', 'https://foo.bar/piwik.php' ],
      [ 'enableLinkTracking' ]
    ]);
  });

  // todo: test warning
  it ('should correctly warn about invalid options and return the api shim', () => {
    assert.isTrue(testUtils.requireNoCache('../')()._isShim);
    assert.isTrue(testUtils.requireNoCache('../')({
      url: 'foo.bar'
    })._isShim);
    assert.isTrue(testUtils.requireNoCache('../')({
      siteId: 1
    })._isShim);
  });

  describe ('javascript error', () => {
    it ('should correctly add the given error to _paq array', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        trackErrors: true
      });

      let err = new Error('unknown error');
      err.filename = 'foo.js';
      err.lineno = 10;

      piwikReactRouter.trackError(err);

      assert.includeDeepMembers(window._paq, [
        [
          'trackEvent',
          'JavaScript Error',
          'unknown error',
          'foo.js: 10'
        ]
      ]);
    });

    it ('should correctly add trackError to the window.addEventListener', () => {
      window.addEventListener = sinon.spy();
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        trackErrors: true
      });

      assert.isTrue(window.addEventListener.calledOnce);
      assert.equal(window.addEventListener.getCall(0).args[0], 'error');
      assert.strictEqual(window.addEventListener.getCall(0).args[1], piwikReactRouter.trackError);
      assert.strictEqual(window.addEventListener.getCall(0).args[2], false);
    });

    it ('should correctly attach the trackError method to window.attachEvent', () => {
      window.addEventListener = undefined;
      window.attachEvent = sinon.spy();

      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        trackErrors: true
      });

      assert.equal(window.attachEvent.getCall(0).args[0], 'onerror');
      assert.strictEqual(window.attachEvent.getCall(0).args[1], piwikReactRouter.trackError);
    });

    it ('should correctly attach the trackError method to window.onerror', () => {
      window.addEventListener = undefined;
      window.attachEvent = undefined;

      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        trackErrors: true
      });

      assert.strictEqual(window.onerror, piwikReactRouter.trackError);
    });


  });

  describe('history', () => {
    it ('should correctly connect to the history', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);

      const history = {
        listen: listenStub
      };

      // it should call the history.listen function once.
      piwikReactRouter.connectToHistory(history);
      assert.isTrue(listenStub.calledOnce);
    });

    it ('should correctly call the unlisten function which was returned by the .listen method', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);

      const history = {
        listen: listenStub
      };

      piwikReactRouter.connectToHistory(history);

      assert.isFalse(unlistenFn.called);
      piwikReactRouter.disconnectFromHistory();
      assert.isTrue(unlistenFn.calledOnce);
    });

    it ('should correctly forward the given location to the track method', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);

      const history = {
        listen: listenStub
      };

      piwikReactRouter.connectToHistory(history);
      listenStub.getCall(0).args[0]({
        pathname: '/foo/bar.html',
        search: '?foo=bar'
      });

      assert.includeDeepMembers(window._paq, [
        [ 'setCustomUrl', '/foo/bar.html?foo=bar' ],
        [ 'trackPageView' ]
      ]);
    });
  });

  it ('should correctly ignore the second call if the location did not change', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
    });

    piwikReactRouter.track({
      pathname: '/foo/bar.html',
      search: '?foo=bar'
    });

    assert.includeDeepMembers(window._paq, [
      [ 'setCustomUrl', '/foo/bar.html?foo=bar' ],
      [ 'trackPageView' ]
    ]);

    const len = window._paq.length;

    piwikReactRouter.track({
      path: '/foo/bar.html?foo=bar',
    });

    assert.strictEqual(len, window._paq.length);
  });

  it ('should correctly update the document title', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
      updateDocumentTitle: true
    });

    document.title = 'title 01';
    piwikReactRouter.track({
      pathname: '/foo/bar.html',
      search: '?foo=bar'
    });

    assert.includeDeepMembers(window._paq, [
      [ 'setDocumentTitle', 'title 01' ],
      [ 'setCustomUrl', '/foo/bar.html?foo=bar' ],
      [ 'trackPageView' ]
    ]);

    document.title = 'other title';
    piwikReactRouter.track({
      path: '/other/url',
    });

    assert.includeDeepMembers(window._paq, [
      [ 'setDocumentTitle', 'other title' ],
      [ 'setCustomUrl', '/other/url' ],
      [ 'trackPageView' ]
    ]);
  });

});
