'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TemporaryError = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TemporaryError = exports.TemporaryError = function (_Error) {
  (0, _inherits3.default)(TemporaryError, _Error);

  function TemporaryError(message) {
    var attempt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    (0, _classCallCheck3.default)(this, TemporaryError);

    var _this = (0, _possibleConstructorReturn3.default)(this, (TemporaryError.__proto__ || Object.getPrototypeOf(TemporaryError)).call(this, message));

    _this.name = 'TemporaryError';
    _this.attempt = attempt;
    return _this;
  }

  return TemporaryError;
}(Error); /* This Source Code Form is subject to the terms of the Mozilla Public
           * License, v. 2.0. If a copy of the MPL was not distributed with this
           * file, You can obtain one at http://mozilla.org/MPL/2.0/. */