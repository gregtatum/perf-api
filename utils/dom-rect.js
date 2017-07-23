"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var DOMRectPolyfill = function DOMRectPolyfill() {
  var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var w = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var h = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  (0, _classCallCheck3.default)(this, DOMRectPolyfill);

  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
  this.left = x;
  this.top = y;
  this.right = x + w;
  this.bottom = y + h;
};

exports.default = window.DOMRect ? window.DOMRect : DOMRectPolyfill;