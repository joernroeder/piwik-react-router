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

});
