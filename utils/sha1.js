'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sha1;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Copied and adapted from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time).
    var value = view.getUint32(i);
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16);
    // We use concatenation and slice for padding
    var padding = '00000000';
    var paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one.
  return hexCodes.join('');
}

function sha1(data) {
  var arrayData = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return window.crypto.subtle.digest('SHA-1', arrayData).then(hex);
}