'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIconsWithClassNames = exports.getIconClassNameForNode = exports.getIconForNode = exports.getIcons = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _reselect = require('reselect');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function classNameFromUrl(url) {
  return url.replace(/[/:.+>< ~()#,]/g, '_');
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function favicons() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Set();
  var action = arguments[1];

  switch (action.type) {
    case 'ICON_HAS_LOADED':
      return new Set([].concat((0, _toConsumableArray3.default)(state), [action.icon]));
    case 'ICON_IN_ERROR': // nothing to do
    default:
      return state;
  }
}

var iconsStateReducer = favicons;
exports.default = iconsStateReducer;
var getIcons = exports.getIcons = function getIcons(state) {
  return state.icons;
};

var getIconForNode = exports.getIconForNode = function getIconForNode(state, node) {
  // Without an intermediary variable, flow doesn't seem to be able to refine
  // node.icon type from `string | null` to `string`.
  // See https://github.com/facebook/flow/issues/3715
  var icons = getIcons(state);
  return node.icon !== null && icons.has(node.icon) ? node.icon : null;
};

var getIconClassNameForNode = exports.getIconClassNameForNode = (0, _reselect.createSelector)(getIcons, function (state, node) {
  return node;
}, function (icons, node) {
  return node.icon !== null && icons.has(node.icon) ? classNameFromUrl(node.icon) : null;
});

var getIconsWithClassNames = exports.getIconsWithClassNames = (0, _reselect.createSelector)(getIcons, function (icons) {
  return [].concat((0, _toConsumableArray3.default)(icons)).map(function (icon) {
    return { icon: icon, className: classNameFromUrl(icon) };
  });
});