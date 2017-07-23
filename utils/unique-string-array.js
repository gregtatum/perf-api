'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UniqueStringArray = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UniqueStringArray = exports.UniqueStringArray = function () {
  function UniqueStringArray() {
    var originalArray = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    (0, _classCallCheck3.default)(this, UniqueStringArray);

    this._array = originalArray.slice(0);
    this._stringToIndex = new Map();
    for (var i = 0; i < originalArray.length; i++) {
      this._stringToIndex.set(originalArray[i], i);
    }
  }

  (0, _createClass3.default)(UniqueStringArray, [{
    key: 'getString',
    value: function getString(index) {
      if (!(index in this._array)) {
        throw new Error('index ' + index + ' not in UniqueStringArray');
      }
      return this._array[index];
    }
  }, {
    key: 'indexForString',
    value: function indexForString(s) {
      var index = this._stringToIndex.get(s);
      if (index === undefined) {
        index = this._array.length;
        this._stringToIndex.set(s, index);
        this._array.push(s);
      }
      return index;
    }
  }, {
    key: 'serializeToArray',
    value: function serializeToArray() {
      return this._array.slice(0);
    }
  }]);
  return UniqueStringArray;
}(); /* This Source Code Form is subject to the terms of the Mozilla Public
      * License, v. 2.0. If a copy of the MPL was not distributed with this
      * file, You can obtain one at http://mozilla.org/MPL/2.0/. */