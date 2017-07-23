'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timeCode = timeCode;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function timeCode(label, codeAsACallback) {
  if (typeof performance !== 'undefined' && process.env.NODE_ENV === 'development') {
    var start = performance.now();
    var result = codeAsACallback();
    var elapsed = Math.round(performance.now() - start);
    console.log(label + ' took ' + elapsed + 'ms to execute.');
    return result;
  }
  return codeAsACallback();
}