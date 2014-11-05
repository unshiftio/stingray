describe('stingray', function () {
  'use strict';

  var qs = require('querystringify')
    , parse = require('url-parse')
    , assume = require('assume')
    , Stingray = require('./')
    , server
    , stingray;

  beforeEach(function () {
    server = 'http://example.com';
    stingray = new Stingray(server);
  });

  it('is exported a function', function () {
    assume(Stingray).is.a('function');
  });

  it('can be constructed without new', function () {
    assume(Stingray()).is.instanceof(Stingray);
  });

  describe('construction', function () {
    it('accepts a custom limit', function () {
      var u = new Stingray(server, { limit : 500 });

      assume(u.limit).does.not.equal(stingray.limit);
      assume(u.limit).equals(500);
    });
  });

  describe('#add', function () {
    it('adds items to the internal data set', function () {
      assume(stingray.dataset).is.a('object');
      assume(stingray.dataset.foo).equals(undefined);

      stingray.add('foo', 'bar');
      assume(stingray.dataset.foo).equals('bar');
    });

    it('overrides existing values', function () {
      stingray.add('foo', 'bar');
      assume(stingray.dataset.foo).equals('bar');

      stingray.add('foo', 'foo');
      assume(stingray.dataset.foo).equals('foo');
    });

    it('chains', function () {
      assume(stingray.add('foo', 'bar')).equals(stingray);
    });
  });

  describe('#payload', function () {
    it('returns an object', function () {
      var data = stingray.payload();

      assume(data).is.a('object');
    });

    it('returns an object that can be transformed in to a querystring', function () {
      var data = stingray.payload()
        , string = qs.stringify(data);

      assume(string).is.a('string');
      assume(string.length).is.below(stingray.limit);
      assume(string).contains('=');
      assume(string).contains('&');

      //
      // Before we can compare we need to transform all the values in the object
      // to strings so we can have a fair chance at matching
      //
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          data[key] = data[key].toString();
        }
      }

      assume(qs.parse(string)).deep.equals(data);
    });

    it('merges data from the initally supplied dataset', function () {
      var u = new Stingray(server, { dataset: { foo: 'bar' }})
        , data = u.payload();

      assume(data.foo).equals('bar');
    });

    it('cannot override values that are previously set', function () {
      var u = new Stingray(server, { dataset: { domain: 'bar' }})
        , data = u.payload();

      assume(data.domain).equals('bar');
      assume(stingray.payload().domain).does.not.equal(data.domain);
    });

    it('adds the custom values from the .add command', function () {
      stingray.add('domain', 'bar');
      assume(stingray.payload().domain).equals('bar');

      stingray.add('foo', 'bar');
      assume(stingray.payload().foo).equals('bar');
    });
  });

  describe('#write', function () {
    it('returns false when the generate url is to damn large', function () {
      var u = new Stingray(server, { limit: 500 })
        , url = u.server + qs.stringify(u.payload(), true);

      assume(url.length).is.above(500);
      assume(u.write()).is.false();
    });

    it('returns true if its successfully written', function () {
      assume(stingray.write()).is.true();
    });
  });
});
