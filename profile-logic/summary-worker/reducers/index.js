'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redux = require('redux');

function profile() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];

  switch (action.type) {
    case 'PROFILE_PROCESSED':
      return action.profile;
    default:
      return state;
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function summary() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];

  switch (action.type) {
    case 'PROFILE_SUMMARY_PROCESSED':
      return action.summary;
    default:
      return state;
  }
}

exports.default = (0, _redux.combineReducers)({
  profile: profile,
  summary: summary
});