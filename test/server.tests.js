const assert = require('chai').assert;

const testUtils = require('./utils.js');

describe('piwik react router serverside tests', function () {
  it ('should correctly return the api shim', () => {
    const siteId = 1;
    const url = 'foo.bar';

    const piwikReactRouter = testUtils.requireNoCache('../')(({
      siteId,
      url
    }));

    assert.sameMembers(Object.keys(piwikReactRouter), [
      '_isShim'
    ].concat(testUtils.API_METHOD_NAMES));

    assert.isTrue(piwikReactRouter._isShim);
  });

  it ('should correctly return a noop function for every public api method', () => {
    const piwikReactRouter = testUtils.requireNoCache('../')(({
      siteId: 1,
      url: 'foo.bar'
    }));

    testUtils.API_METHOD_NAMES.forEach(methodName => {
      assert.isFunction(piwikReactRouter[methodName]);
      assert.isUndefined(piwikReactRouter[methodName]());
    });
  });

  it ('should correctly return the passed in history object from the mocked connectToHistory method', () => {
    const history = { history: true };

    const piwikReactRouter = testUtils.requireNoCache('../')(({
      siteId: 1,
      url: 'foo.bar'
    }));

    assert.strictEqual(history, piwikReactRouter.connectToHistory(history));
  });

});
