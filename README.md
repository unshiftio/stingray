# Stingray

Stingray is a small beacon library that can send small packets of information to
your server. This can be really helpful to get some insight in how your
front-end application is running and can provide additional information when
"shit hits the fan".

The transport of this information is done using [beacons]. This will send an
`GET` request to your server with a massive query string that will contain all
the information.

By default we add the following information to the generated query string:

- `navigator` (all strings, numbers, boolean values)
- Properties from the `document` object:
  - `document.charset` as `charset`
  - `document.domain` as `domain`
  - `document.inputEncoding` as `encoding`
  - `document.readyState` as `readyState`
  - `document.referrer` as `referrer`
  - `document.URL` as `url`
  - `document.visibilityState` as `visibility`
- `performance.timing` if exists
- `performance.memory` if exists

## Installation

Stingray was specifically written to be used in a system that supports commonjs,
like browserify does and is therefor released in npm. Installation is as simple
as typing the following command in your CLI:

```
npm install --save stingray
```

## Usage

In all examples we assume that you've required the library as following:

```js
'use strict';

var Stingray = require('stingray')
  , server = 'http://example.org/path/'
  , stingray;
```

The `Stingray` constructor accepts 2 arguments:

1. `server`, The address and or path that we need to send the gathered
   information to. This path/address needs to accept `GET` requests and parse
   our the supplied query string.
2. `options`, Optional object which allows you to configure the `Stingray`
   instance. The following properties are accepted in the object:
   - `limit`: The maximum size of the URL that we can generate. Certain browsers
     like Internet Explorer have a maximum size and will error if URL's are
     generated that are larger. We default to lowest known limit of Internet
     Explorer when detected or default to 60.000 which seems to be the minimum
     in older Safari browsers.
   - `document`: Reference to the HTML document that we can use to create an
     element. This way we easily polyfill this for testing as well allow sending
     of data through an iframe element. Defaults to `document` global.
  - `payload`: Initial object which contains data that should be send to the
    server. 
  - `ignore`: Object that instructs `Stingray` to ignore data structures it want
    to add by default. You can set the following properties: `navigator`,
    `document`, `performance`, `timing` and `memory`.
  - timeout: How long it can take for the beacon to load, if it takes longer we
    call the supplied callback with an error argument. Defaults to `1000` in the
    beacons module.

Now that we know the arguments it accepts we can construct our first `Stingray`
instance.

```js
stingray = new Stingray(server, { /* options, which are optional */ });
```

### Stingray.set

There's already a lot of default debug information available but you might want
to set some addition information that specific to your application or you just
want to override some default values. The `Stingray.set` method accepts 2
arguments:

1. `key`: The name of key you want to store or override.
2. `value`: Data that you want to store or override with. Please note that we
   only accept `booleans`, `numbers` and `strings` as accepted values. All other
   values will be **ignored**.

This method returns it self once it's executed so you can chain it if you wish.

```js
stingray.set('foo', 'bar')
        .set('bar', 'foo');
```

### Stingray.remove

Now that you can set new information to the beacon request it's also good to
know that you can remove it as well. The remove method accepts the keys of
values that you want to remove from the internal dataset. You can supply it with
multiple arguments to remove multiple keys:

```js
stingray.remove('foo', 'bar');
```

But you can also use space/comma separation in the first argument to instruct
multiple key removal.

```js
stingray.remove('foo, bar');
```

It also chains, so you can use that as an alternate api as well:

```js
stingray.remove('foo')
        .remove('bar');
```

### Stingray.write

This is where all the magic actually happens. When you call the `Stingray.write`
method it will send the beacon request to the server. It will return a boolean
indicating if was successfully written. It can return `false` if the generated
payload was to large and reached the `limit` of a single URL.

The write method accepts an option callback function which will be called once
the payload has reached the server.

```js
stingray.write();
stingray.write(function () {
  //
  // The only problem is that you don't know if beacon was processed succesfully
  // as there is no error support for failed beacons as it uses Image()'s
  //
});

if (!stingray.write()) {
  console.log('payload to big', stingray.payload());
}
```

### Stingray.payload

This method gathers all the information that should be transformed in to a
query string and be send to the supplied server. So if you just want to have
quick peek at the data, you can just call this method and it will return an
object with all data.

```js
console.log(stingray.payload());

//
// Example of the returned object
//
{
  "domain": "bar",
  "doNotTrack": "1",
  "onLine": true,
  "language": "en-US",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
  "product": "Gecko",
  "platform": "MacIntel",
  "appVersion": "5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
  "appName": "Netscape",
  "appCodeName": "Mozilla",
  "hardwareConcurrency": 4,
  "vendor": "Google Inc.",
  "productSub": "20030107",
  "cookieEnabled": true,
  "charset": "UTF-8",
  "encoding": "UTF-8",
  "readyState": "complete",
  "url": "http://localhost:54181/__testling?show=true",
  "visibility": "visible",
  "loadEventEnd": 1415184360414,
  "loadEventStart": 1415184360414,
  "domComplete": 1415184360414,
  "domContentLoadedEventEnd": 1415184360384,
  "domContentLoadedEventStart": 1415184360384,
  "domInteractive": 1415184360384,
  "domLoading": 1415184360272,
  "responseEnd": 1415184360275,
  "responseStart": 1415184360268,
  "requestStart": 1415184360253,
  "connectEnd": 1415184360252,
  "connectStart": 1415184360252,
  "domainLookupEnd": 1415184360252,
  "domainLookupStart": 1415184360252,
  "fetchStart": 1415184360252,
  "navigationStart": 1415184360061,
  "jsHeapSizeLimit": 793000000,
  "usedJSHeapSize": 10000000,
  "totalJSHeapSize": 10000000
}
```

## License

MIT

[beacons]: https://github.com/unshiftio/beacons
