const assert = require('chai').assert;
const sinon = require('sinon');

const testUtils = require('./utils.js');

describe('piwikReactRouter', function () {
  beforeEach(() => {
    this.jsdom = require('jsdom-global')();
    // piwiks tracking client doesn't properly adds the script tag to jsdom.
    // As i won't modify the piwik loading script the easiest was to provide the script tag.
    // dirty – i know ;)
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
      siteId: 1
    });

    assert.sameDeepMembers(window._paq, [
      [ 'setSiteId', 1 ],
      [ 'setTrackerUrl', 'http://foo.bar/piwik.php' ],
      [ 'enableLinkTracking' ]
    ]);
  });

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

  it ('should correctly track javascript errors', () => {
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

    const loc = { path: '/foo/bar.html' };
    listenStub.getCall(0).args[0](loc);

    assert.includeDeepMembers(window._paq, [
      [ 'setCustomUrl', '/foo/bar.html' ],
      [ 'trackPageView' ]
    ]);

    const len = window._paq.length;

    // the path didn't change and the track function should not be called.
    listenStub.getCall(0).args[0](loc);
    assert.strictEqual(len, window._paq.length);
  });

});
