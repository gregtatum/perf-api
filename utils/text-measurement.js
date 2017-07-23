'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Measure the size of text for drawing within a 2d context. This will allow text
 * to be drawn in a constrained space. This class uses a variety of heuristics and
 * caching to make this process fast.
 */
var TextMeasurement = function () {
  function TextMeasurement(ctx) {
    (0, _classCallCheck3.default)(this, TextMeasurement);

    this._ctx = ctx;
    this._cache = {};
    this._averageCharWidth = this._calcAverageCharWidth();

    // TODO - L10N
    this.overflowChar = '…';
    this.minWidth = this.getTextWidth(this.overflowChar);
  }

  /**
   * Gets the average letter width in the English alphabet, for the current
   * context state (font size, family etc.). This provides a close enough
   * value to use in `getTextWidthApprox`.
   *
   * @return {number} The average letter width.
   */


  (0, _createClass3.default)(TextMeasurement, [{
    key: '_calcAverageCharWidth',
    value: function _calcAverageCharWidth() {
      var string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.()< /:-_';
      return this.getTextWidth(string) / string.length;
    }

    /**
     * Gets the width of the specified text, for the current context state
     * (font size, family etc.).
     *
     * @param {string} text - The text to analyze.
     * @return {number} The text width.
     */

  }, {
    key: 'getTextWidth',
    value: function getTextWidth(text) {
      var cachedWidth = this._cache[text];
      if (cachedWidth) {
        return cachedWidth;
      }
      var metrics = this._ctx.measureText(text);
      this._cache[text] = metrics.width;
      return metrics.width;
    }

    /**
     * Gets an approximate width of the specified text. This is much faster
     * than `_getTextWidth`, but inexact.
     *
     * @param {string} text - The text to analyze.
     * @return {number} The approximate text width.
     */

  }, {
    key: 'getTextWidthApprox',
    value: function getTextWidthApprox(text) {
      return text.length * this._averageCharWidth;
    }

    /**
     * Massage a text to fit inside a given width. This clamps the string
     * at the end to avoid overflowing.
     *
     * @param {string} text -The text to fit inside the given width.
     * @param {number} maxWidth - The available width for the given text.
     * @return {string} The fitted text.
     */

  }, {
    key: 'getFittedText',
    value: function getFittedText(text, maxWidth) {
      if (this.minWidth > maxWidth) {
        return '';
      }
      var textWidth = this.getTextWidth(text);
      if (textWidth < maxWidth) {
        return text;
      }
      for (var i = 1, len = text.length; i <= len; i++) {
        var trimmedText = text.substring(0, len - i);
        var trimmedWidth = this.getTextWidthApprox(trimmedText) + this.minWidth;
        if (trimmedWidth < maxWidth) {
          return trimmedText + this.overflowChar;
        }
      }
      return '';
    }
  }]);
  return TextMeasurement;
}();

exports.default = TextMeasurement;