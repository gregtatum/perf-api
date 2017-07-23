'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseRangeFilters = parseRangeFilters;
exports.stringifyRangeFilters = stringifyRangeFilters;
exports.getFormattedTimeLength = getFormattedTimeLength;
exports.getRangeFilterLabels = getRangeFilterLabels;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function parseRangeFilters() {
  var stringValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  if (!stringValue) {
    return [];
  }
  return stringValue.split('~').map(function (s) {
    var m = s.match(/(-?[0-9.]+)_(-?[0-9.]+)/);
    if (!m) {
      return { start: 0, end: 1000 };
    }
    return { start: m[1] * 1000, end: m[2] * 1000 };
  });
}

function stringifyRangeFilters() {
  var arrayValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  return arrayValue.map(function (_ref) {
    var start = _ref.start,
        end = _ref.end;

    var startStr = (start / 1000).toFixed(4);
    var endStr = (end / 1000).toFixed(4);
    return startStr + '_' + endStr;
  }).join('~');
}

function getFormattedTimeLength(length) {
  if (length >= 10000) {
    return (length / 1000).toFixed(0) + ' sec';
  }
  if (length >= 1000) {
    return (length / 1000).toFixed(1) + ' sec';
  }
  return length.toFixed(0) + ' ms';
}

function getRangeFilterLabels(rangeFilters) {
  var labels = rangeFilters.map(function (range) {
    return getFormattedTimeLength(range.end - range.start);
  });
  labels.unshift('Full Range');
  return labels;
}