'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.parseCallTreeFilters = parseCallTreeFilters;
exports.stringifyCallTreeFilters = stringifyCallTreeFilters;
exports.getCallTreeFilterLabels = getCallTreeFilterLabels;

var _uintarrayEncoding = require('../utils/uintarray-encoding');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseCallTreeFilters() {
  var stringValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  if (!stringValue) {
    return [];
  }
  return stringValue.split('~').map(function (s) {
    var _s$split = s.split('-'),
        _s$split2 = (0, _slicedToArray3.default)(_s$split, 2),
        type = _s$split2[0],
        val = _s$split2[1];

    switch (type) {
      case 'prefix':
        return {
          type: 'prefix',
          matchJSOnly: false,
          prefixFuncs: (0, _uintarrayEncoding.stringToUintArray)(val)
        };
      case 'prefixjs':
        return {
          type: 'prefix',
          matchJSOnly: true,
          prefixFuncs: (0, _uintarrayEncoding.stringToUintArray)(val)
        };
      case 'postfix':
        return {
          type: 'postfix',
          matchJSOnly: false,
          postfixFuncs: (0, _uintarrayEncoding.stringToUintArray)(val)
        };
      case 'postfixjs':
        return {
          type: 'postfix',
          matchJSOnly: true,
          postfixFuncs: (0, _uintarrayEncoding.stringToUintArray)(val)
        };
      default:
        return undefined;
    }
  }).filter(function (f) {
    return f;
  });
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function stringifyCallTreeFilters() {
  var arrayValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  return arrayValue.map(function (filter) {
    switch (filter.type) {
      case 'prefix':
        return (filter.matchJSOnly ? 'prefixjs' : 'prefix') + '-' + (0, _uintarrayEncoding.uintArrayToString)(filter.prefixFuncs);
      case 'postfix':
        return (filter.matchJSOnly ? 'postfixjs' : 'postfix') + '-' + (0, _uintarrayEncoding.uintArrayToString)(filter.postfixFuncs);
      default:
        throw new Error('unknown filter type');
    }
  }).join('~');
}

function getCallTreeFilterLabels(thread, threadName, callTreeFilters) {
  var funcTable = thread.funcTable,
      stringTable = thread.stringTable;

  var labels = callTreeFilters.map(function (filter) {
    function lastFuncString(funcArray) {
      var lastFunc = funcArray[funcArray.length - 1];
      var nameIndex = funcTable.name[lastFunc];
      return stringTable.getString(nameIndex);
    }
    switch (filter.type) {
      case 'prefix':
        return lastFuncString(filter.prefixFuncs);
      case 'postfix':
        return lastFuncString(filter.postfixFuncs);
      default:
        throw new Error('Unexpected filter type');
    }
  });
  labels.unshift('Complete "' + threadName + '"');
  return labels;
}