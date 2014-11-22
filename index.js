'use strict';

var EventEmitter = require('eventemitter3')
  , has = Object.prototype.hasOwnProperty
  , qs = require('querystringify')
  , beacon = require('beacons');

/**
 * The maximum size of an URL. Restriction only seems to apply to IE which has
 * limit of 2083. The next lowest boundary is Safari at 60k. That would be more
 * than enough to send some data to a server.
 *
 * @type {Number}
 * @private
 */
var nav = 'undefined' !== typeof navigator ? navigator : {}
  , limit = /([MS]?IE).\d/.test(navigator.userAgent) ? 2083 : 60000;

/**
 * Stingray.
 *
 * Options:
 *
 * - limit: The maximum size of the URL that we can generate. Certain browsers
 *   like Internet Explorer have a maximum size and will error if URL's are
 *   generated that are larger. We default to lowest known limit of Internet
 *   Explorer when detected or default to 60.000 which seems to be the minimum
 *   in older Safari browsers.
 *
 * - document: Reference to the HTML document that we can use to create an
 *   element. This way we easily polyfill this for testing as well allow sending
 *   of data through an iframe element.
 *
 * - payload: Initial set of data that should be send to the server.
 *
 * - ignore: We add some useful data structures by default, but sometimes you
 *   want to ignore them as you just want to send your own custom data.
 *
 * - timeout: How long it can take for the beacon to load, if it takes longer we
 *   call the supplied callback with an error argument. Defaults to 1000 in the
 *   beacons module.
 *
 * @constructor
 * @param {String} server The server address we want to send the data to.
 * @param {Object} options Additional configuration.
 * @api public
 */
function Stingray(server, options) {
  if (!(this instanceof Stingray)) return new Stingray(server, options);
  options = options || {};

  this.server = server;
  this.document = options.document || document;
  this.limit = options.limit || limit;
  this.ignore = options.ignore || {};
  this.timeout = options.timeout;

  //
  // Allow the user to define a pre-set dataset that needs to be transmitted to
  // the server.
  //
  this.dataset = options.dataset || {};
}

Stingray.prototype = new EventEmitter();
Stingray.prototype.constructor = Stingray;

/**
 * The actual method which starts sending data to the server.
 *
 * @returns {Boolean} Successfully written something.
 * @param {Function} fn Optional completion callback.
 * @api public
 */
Stingray.prototype.write = function write(fn) {
  var target
    , object
    , stingray = this
    , document = stingray.document
    , url = stingray.server + qs.stringify(stingray.payload(), true);

  if (url.length > stingray.limit) return false;

  beacon(url, function sent(err) {
    if (err) stingray.emit('error', err);

    fn.apply(this, arguments);
  }, stingray.timeout);

  return true;
};

/**
 * Set additional custom information to the payload.
 *
 * @param {String} key Name of the value.
 * @param {String} value Value that needs to be stored.
 * @returns {Stingray}
 * @api public
 */
Stingray.prototype.set = function set(key, value) {
  this.dataset[key] = value;
  return this;
};

/**
 * Remove assigned keys again from the internal dataset. Sometimes you just need
 * to send data only once.
 *
 * @param {Arguments} ..args__ The keys that need to be removed.
 * @returns {Stingray}
 * @api private
 */
Stingray.prototype.remove = function remove() {
  var args = arguments
    , i, l;

  if (args.length === 1 && 'string' === typeof args[0]) {
    args = args[0].split(/[\,|\s]+/);
  }

  for (i = 0, l = args.length; i < l; i++) {
    delete this.dataset[args[i]];
  }

  return this;
};

/**
 * Generate a payload that needs to be transmitted to the server.
 *
 * @returns {Object}
 * @api public
 */
Stingray.prototype.payload = function payload() {
  var dataset = [this.dataset]
    , document = this.document
    , ignore = this.ignore
    , data = {}
    , domain;

  if (!ignore.navigator && 'object' === typeof navigator) {
    dataset.push(navigator);
  }

  if (!ignore.document && 'object' === typeof document) {
    //
    // Windows phone is known to throw errors when document.domain is accessed.
    //
    try { domain = document.domain; }
    catch (e) { this.emit('error', e); }

    dataset.push({
      charset: document.charset,
      domain: domain,
      encoding: document.inputEncoding,
      readyState: document.readyState,
      referrer: document.referrer,
      url: document.URL,
      visibility: document.visibilityState
    });
  }

  //
  // Add some timing information.
  //
  if (!ignore.performance && 'object' === typeof performance) {
    if (!ignore.timing && 'object' === typeof performance.timing) {
      dataset.push(performance.timing);
    }

    if (!ignore.memory && 'object' === typeof performance.memory) {
      dataset.push(performance.memory);
    }
  }

  for (var i = 0, key, type, value; i < dataset.length; i++) {
    for (key in dataset[i]) {
      value = dataset[i][key];
      type = typeof value;

      //
      // Narrow down the data that we're allowed to gather. We only want things
      // that can easily be converted to strings and non complex objects. We
      // don't want to support nesting and we don't want to send useless empty
      // strings.
      //
      if (!(key in data) && has.call(dataset[i], key) && (
          'string'  === type
       || 'number'  === type
       || 'boolean' === type
      ) && value !== ''
        && value !== 0) {
        data[key] = value;
      }
    }
  }

  return data;
};

//
// Expose the module.
//
module.exports = Stingray;
