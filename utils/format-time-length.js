"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatTimeLength;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Format a positive float duration into a string. The precision will depend on the
 * value: closer to zero the value is, the most precise the resulting string will be.
 */
function formatTimeLength(timeLength) {
  var result = void 0;
  if (timeLength >= 10) {
    result = timeLength.toFixed(0);
  } else if (timeLength >= 1) {
    result = timeLength.toFixed(1);
  } else if (timeLength >= 0.1) {
    result = timeLength.toFixed(2);
  } else {
    result = timeLength.toFixed(3);
  }

  return result;
}