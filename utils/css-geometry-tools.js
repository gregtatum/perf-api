'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getContentRect = getContentRect;
exports.getMarginRect = getMarginRect;

var _domRect = require('./dom-rect');

var _domRect2 = _interopRequireDefault(_domRect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Return a float number for the number of CSS pixels from the computed style
 * of the supplied CSS property on the supplied element.
 */

// Imported interfaces incorrectly throw an error in eslint:
// https://github.com/benmosher/eslint-plugin-import/issues/726
function getFloatStyle(element, cssProperty) {
  // flow doesn't know about getComputedStyle.
  var getComputedStyle = window.getComputedStyle;
  return parseFloat(getComputedStyle(element).getPropertyValue(cssProperty)) || 0;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


function subtractBorder(element, rect) {
  var borderTop = getFloatStyle(element, 'border-top-width');
  var borderRight = getFloatStyle(element, 'border-right-width');
  var borderBottom = getFloatStyle(element, 'border-bottom-width');
  var borderLeft = getFloatStyle(element, 'border-left-width');

  return new _domRect2.default(rect.left + borderLeft, rect.top + borderTop, rect.width - borderLeft - borderRight, rect.height - borderTop - borderBottom);
}

function subtractPadding(element, rect) {
  var paddingTop = getFloatStyle(element, 'padding-top');
  var paddingRight = getFloatStyle(element, 'padding-right');
  var paddingBottom = getFloatStyle(element, 'padding-bottom');
  var paddingLeft = getFloatStyle(element, 'padding-left');
  return new _domRect2.default(rect.left + paddingLeft, rect.top + paddingTop, rect.width - paddingLeft - paddingRight, rect.height - paddingTop - paddingBottom);
}

function addMargin(element, rect) {
  var marginTop = getFloatStyle(element, 'margin-top');
  var marginRight = getFloatStyle(element, 'margin-right');
  var marginBottom = getFloatStyle(element, 'margin-bottom');
  var marginLeft = getFloatStyle(element, 'margin-left');
  return new _domRect2.default(rect.left - marginLeft, rect.top - marginTop, rect.width + marginLeft + marginRight, rect.height + marginTop + marginBottom);
}

/**
 * Returns a DOMRect for the content rect of the element, in float CSS pixels.
 * Returns an empty rect if the object has zero or more than one client rects.
 */
function getContentRect(element) {
  var clientRects = element.getClientRects();
  if (clientRects.length !== 1) {
    return new _domRect2.default();
  }

  var borderRect = clientRects[0];
  return subtractPadding(element, subtractBorder(element, borderRect));
}

/**
 * Returns a DOMRect for the margin rect of the element, in float CSS pixels.
 * Returns an empty rect if the object has zero or more than one client rects.
 */
function getMarginRect(element) {
  var clientRects = element.getClientRects();
  if (clientRects.length !== 1) {
    return new _domRect2.default();
  }

  var borderRect = clientRects[0];
  return addMargin(element, borderRect);
}