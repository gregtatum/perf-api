'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iconHasLoaded = iconHasLoaded;
exports.iconIsInError = iconIsInError;
exports.iconStartLoading = iconStartLoading;
function iconHasLoaded(icon) {
  return {
    type: 'ICON_HAS_LOADED',
    icon: icon
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function iconIsInError(icon) {
  return {
    type: 'ICON_IN_ERROR',
    icon: icon
  };
}

var icons = new Set();

function _getIcon(icon) {
  if (icons.has(icon)) {
    return Promise.resolve('cached');
  }

  icons.add(icon);

  var result = new Promise(function (resolve) {
    var image = new Image();
    image.src = icon;
    image.referrerPolicy = 'no-referrer';
    image.onload = function () {
      resolve('loaded');
    };
    image.onerror = function () {
      resolve('error');
    };
  });

  return result;
}

function iconStartLoading(icon) {
  return function (dispatch) {
    return _getIcon(icon).then(function (result) {
      switch (result) {
        case 'loaded':
          dispatch(iconHasLoaded(icon));
          break;
        case 'error':
          dispatch(iconIsInError(icon));
          break;
        case 'cached':
          // nothing to do
          break;
        default:
          throw new Error('Unknown icon load result ' + result);
      }
    });
  };
}