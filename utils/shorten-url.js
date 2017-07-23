'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = shortenURL;

var _fetchJsonp = require('fetch-jsonp');

var _fetchJsonp2 = _interopRequireDefault(_fetchJsonp);

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function shortenURL(urlToShorten) {
  var longURL = urlToShorten;
  if (!longURL.startsWith('https://perf-html.io/')) {
    var parsedURL = _url2.default.parse(longURL);
    var parsedURLOnCanonicalHost = Object.assign({}, parsedURL, {
      protocol: 'https:',
      host: 'perf-html.io'
    });
    longURL = _url2.default.format(parsedURLOnCanonicalHost);
  }

  var bitlyQueryURL = 'https://api-ssl.bitly.com/v3/shorten?' + _queryString2.default.stringify({
    longUrl: longURL,
    domain: 'perfht.ml',
    format: 'json',
    access_token: 'b177b00a130faf3ecda6960e8b59fde73e902422'
  });
  return (0, _fetchJsonp2.default)(bitlyQueryURL).then(function (response) {
    return response.json();
  }).then(function (json) {
    return json.data.url;
  });
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */