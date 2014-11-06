'use strict';

var qs = require('querystringify')
  , parse = require('url').parse;

/**
 * Middleware layer for Stingray beacons.
 *
 * @param {String} beacon Full path that we should trigger upon.
 * @param {Function} fn Beacon data callback.
 * @returns {Function} Fully configured middleware;
 * @api public
 */
module.exports = function configure(beacon, fn) {
  return function stingray(req, res, next) {
    //
    // Try to optimize for middleware systems that already pre-parse the
    // incoming URL so we can do a direct pathname match against the URL. If we
    // don't have any pre-defined values we're going to do another parse attempt.
    //
    var uri = req.uri;
    if (!uri || !uri.pathname) uri = parse(req.url);

    if (beacon !== uri.pathname) return next();

    //
    // Return a 204: No Content to lower the amount of bandwidth that needs to
    // be send to the client.
    //
    res.statusCode = 204;

    //
    // Browsers are allowed to cache the 204 requests according to the
    // specifications so we need to explicitly state that these requests should
    // not be cached so we might miss requests. In addition to that we want to
    // include the beacon in the `window.performance` of browsers so tell that
    // it's allowed so we can measure the latency of these requests.
    //
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Timing-Allow-Origin', '*');
    res.end('');

    //
    // If middleware layers parsed URL with query string information we don't
    // have to do it again.
    //
    if ('object' !== typeof uri.query) {
      uri.query = qs.parse(uri.query);
    }

    //
    // Now that all things are parsed we can pass it in our function and do
    // things with it.
    //
    fn(uri.query, req);
  };
};
