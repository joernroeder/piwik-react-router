const assert = require('chai').assert;
const sinon = require('sinon');

const testUtils = require('./utils.js');

describe('piwik-react-router client tests', function () {
  let jsdomBody;

  beforeEach(() => {
    // piwiks tracking client doesn't properly adds the script tag to jsdom or the other way around.
    // As i won't modify the piwik loading script the easiest was to provide this hacky script tag.
    // Dirty – i know ;)
    jsdomBody = '<script></script>';

    this.jsdom = require('jsdom-global')(jsdomBody, {
      url: 'http://foo.bar'
    });
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

  it ('should correctly push the userId', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
      userId: 'test_user'
    });

    assert.sameDeepMembers(window._paq, [
      [ 'setSiteId', 1 ],
      [ 'setUserId', 'test_user' ],
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

  it ('should correctly use client and server tracker name defaults', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1
    });

    assert.sameDeepMembers(window._paq, [
      [ 'setSiteId', 1 ],
      [ 'setTrackerUrl', 'http://foo.bar/piwik.php' ],
      [ 'enableLinkTracking' ]
    ]);
    assert.strictEqual(window.document.querySelector('script').src, 'http://foo.bar/piwik.js');
  });

  describe ('use https protocol', () => {
    before(() => {
      this.jsdom();
      this.jsdom = require('jsdom-global')(jsdomBody, {
        url: 'https://foo.bar'
      });
    });

    it ('should correctly use https as the protocol', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      assert.includeDeepMembers(window._paq, [
        [ 'setTrackerUrl', 'https://foo.bar/piwik.php' ],
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
  });

  describe ('should allow overriding piwik.js and piwik.php names', () => {
    before(() => {
      this.jsdom();
      this.jsdom = require('jsdom-global')(jsdomBody, {
        url: 'https://foo.bar'
      });
    });

    it('should use specified names for piwik.js and piwik.php', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        clientTrackerName: 'foo.js',
        serverTrackerName: 'bar.php'
      });

      assert.includeDeepMembers(window._paq, [
        ['setTrackerUrl', 'https://foo.bar/bar.php'],
      ]);
      assert.strictEqual(window.document.querySelector('script').src, 'https://foo.bar/foo.js');
    });
  });

  // todo: test warning
  describe ('should correctly warn about invalid options and return the api shim', () => {
    it('should correctly return the shim and throw a warning without parameters', () =>{
      let warningSpy = sinon.spy();
      assert.isTrue(testUtils.requireNoCache('../', {
        'warning': warningSpy
      })()._isShim);
      assert.isTrue(warningSpy.calledOnce);
      assert.include(warningSpy.args[0][1], 'PiwikTracker cannot be initialized');
    });

    it('should correctly return the shim and throw a warning without the siteId', () =>{
      let warningSpy = sinon.spy();
      assert.isTrue(testUtils.requireNoCache('../', {
        'warning': warningSpy
      })({
        url: 'foo.bar'
      })._isShim);
      assert.isTrue(warningSpy.calledOnce);
    });

    it('should correctly return the shim and throw a warning without the url', () =>{
      let warningSpy = sinon.spy();
      assert.isTrue(testUtils.requireNoCache('../', {
        'warning': warningSpy
      })({
        siteId: 1
      })._isShim);
      assert.isTrue(warningSpy.calledOnce);
    });
  });

  describe ('it should correctly suppress the warning', () => {
    let env;

    before(() => {
      env = process.env;
      process.env = { NODE_ENV: 'TEST' };
    });

    after(() => {
      process.env = env;
    });

    it ('in test environment', () => {
      const warningSpy = sinon.spy();

      testUtils.requireNoCache('../', {
        'warning': warningSpy
      })();

      assert.isFalse(warningSpy.called);
    });

  });

  //it ('should correctly warn')

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

    it('should use a custom error handler if provided', function() {
      window.addEventListener = undefined;
      window.attachEvent = undefined;

      const trackErrorHandler = sinon.spy();

      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        trackErrors: true,
        trackErrorHandler: trackErrorHandler
      });

      assert.strictEqual(window.onerror, trackErrorHandler);
      assert.strictEqual(piwikReactRouter.trackError, trackErrorHandler);
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
      assert.isTrue(piwikReactRouter.disconnectFromHistory());
      assert.isTrue(unlistenFn.calledOnce);
    });

    it ('should correctly ignore the disconnectFromHistory call if it wasn\'t connected before', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      assert.isFalse(piwikReactRouter.disconnectFromHistory());
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

    it ('should correctly forward the given location via the given modifier to the track method', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);
      const modifierStub = sinon.stub().returnsArg(0);

      const history = {
        listen: listenStub
      };

      piwikReactRouter.connectToHistory(history, modifierStub);
      listenStub.getCall(0).args[0]({
        pathname: '/foo/bar.html',
        search: '?foo=bar'
      });
      assert.isTrue(modifierStub.calledOnce);

      assert.includeDeepMembers(window._paq, [
        [ 'setCustomUrl', '/foo/bar.html?foo=bar' ],
        [ 'trackPageView' ]
      ]);
    });

    it('should correctly ignore the visit and throw a warning during development if the .connectToHistory modifier did not return an object.', () => {
      let warningSpy = sinon.spy();
      const piwikReactRouter = testUtils.requireNoCache('../', {
        'warning': warningSpy
      })({
        url: 'foo.bar',
        siteId: 1
      })

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);

      const history = {
        listen: listenStub,
        location: {
          pathname: '/foo/bar.html',
          search: '?foo=bar'
        }
      };

      const modifier = function (location) {
          location.search = 'campain=ID';
      };

      piwikReactRouter.connectToHistory(history, modifier);

      assert.isTrue(warningSpy.calledOnce);
    });

    describe ('should correctly ignore the visit and suppress a warning if the .connectToHistory modifier did not return an object.', () => {

        let env;

        before(() => {
          env = process.env;
          process.env = { NODE_ENV: 'PRODUCTION' };
        });

        after(() => {
          process.env = env;
        });

      it ('inores the warning in production', function () {
          let warningSpy = sinon.spy();
          const piwikReactRouter = testUtils.requireNoCache('../', {
            'warning': warningSpy
          })({
            url: 'foo.bar',
            siteId: 1
          })

          const unlistenFn = sinon.spy();
          let listenStub = sinon.stub().returns(unlistenFn);

          const history = {
            listen: listenStub,
            location: {
              pathname: '/foo/bar.html',
              search: '?foo=bar'
            }
          };

          const modifier = function (location) {
              location.search = 'campain=ID';
          };

          piwikReactRouter.connectToHistory(history, modifier);

          assert.isFalse(warningSpy.called);
      });
    });

    it ('should correctly track the initial visit if opts.ignoreInitialVisit is disabled', ()  => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
      });

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);

      const history = {
        listen: listenStub,
        location: {
          pathname: '/foo/bar.html',
          search: '?foo=bar'
        }
      };

      piwikReactRouter.connectToHistory(history);

      assert.includeDeepMembers(window._paq, [
        [ 'setCustomUrl', '/foo/bar.html?foo=bar' ],
        [ 'trackPageView' ]
      ]);
    });

    it ('should correctly ignore the initial visit if the appropriate option is enabled', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        ignoreInitialVisit: true
      });

      const unlistenFn = sinon.spy();
      let listenStub = sinon.stub().returns(unlistenFn);

      const history = {
        listen: listenStub,
        location: {
          pathname: '/foo/bar.html',
          search: '?foo=bar'
        }
      };

      piwikReactRouter.track = sinon.spy();
      piwikReactRouter.connectToHistory(history);

      assert.isFalse(piwikReactRouter.track.called);
    });
  });

  describe('should correctly inject piwik script', () => {
    it ('should inject piwik.js if opts.injectScript is enabled', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        injectScript: true
      });

      var allScripts = [].slice.call(window.document.scripts);
      var piwikScripts = allScripts.filter((script) => {
        return script.src.indexOf('piwik.js') !== -1;
      });

      assert.isTrue(piwikScripts.length >= 1);
    });

    it ('should not inject piwik.js if opts.injectScript is disabled', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1,
        injectScript: false
      });

      var allScripts = [].slice.call(window.document.scripts);
      var piwikScripts = allScripts.filter((script) => {
        return script.src.indexOf('piwik.js') !== -1;
      });

      assert.isTrue(piwikScripts.length === 0);
    });

    it ('should not inject piwik.js twice if multiple piwicReactRouter intances are created', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1
      });

      const piwikReactRouter2 = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1
      });

      var allScripts = [].slice.call(window.document.scripts);
      var piwikScripts = allScripts.filter((script) => {
        return script.src.indexOf('piwik.js') !== -1;
      });

      assert.isTrue(piwikScripts.length === 1);
    });

    it ('it should correctly setup a second piwik-react-router instance without url and siteId', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 1
      });

      const piwikReactRouter2 = testUtils.requireNoCache('../')();
    });

    it ('it should correctly store the string representation of siteId in the data-piwik-react-router attribute of the script', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 100
      });

      const piwikReactRouter2 = testUtils.requireNoCache('../')();

      var allScripts = [].slice.call(window.document.scripts);
      var piwikScripts = allScripts.filter((script) => {
        return script.src.indexOf('piwik.js') !== -1;
      });

      assert.isTrue(piwikScripts[0].getAttribute('data-piwik-react-router') === '100');
    });

    it ('should correctly use the given piwikScriptDataAttribute option.', () => {
      const piwikReactRouter = testUtils.requireNoCache('../')({
        url: 'foo.bar',
        siteId: 100,
        piwikScriptDataAttribute: 'foobar'
      });

      const piwikReactRouter2 = testUtils.requireNoCache('../')();

      var allScripts = [].slice.call(window.document.scripts);
      var piwikScripts = allScripts.filter((script) => {
        return script.src.indexOf('piwik.js') !== -1;
      });

      assert.isTrue(piwikScripts[0].getAttribute('data-foobar') === '100');
    })
  });

  it ('should correctly handle basename', () => {
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
      basename: '/baseName',
      pathname: '/foo/bar.html',
      search: '?foo=bar'
    });

    assert.includeDeepMembers(window._paq, [
      [ 'setCustomUrl', '/baseName/foo/bar.html?foo=bar' ],
      [ 'trackPageView' ]
    ]);
  });

  it ('should correctly ignore the second call if the location did not change', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')({
      url: 'foo.bar',
      siteId: 1,
      updateDocumentTitle: false
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
