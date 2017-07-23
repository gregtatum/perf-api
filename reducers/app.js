'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIsURLSetupDone = exports.getView = exports.getApp = undefined;

var _redux = require('redux');

function view() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { phase: 'INITIALIZING' };
  var action = arguments[1];

  if (state.phase === 'PROFILE') {
    // Let's not come back at another phase if we're already displaying a profile
    return state;
  }

  switch (action.type) {
    case 'TEMPORARY_ERROR_RECEIVING_PROFILE_FROM_STORE':
    case 'TEMPORARY_ERROR_RECEIVING_PROFILE_FROM_URL':
    case 'TEMPORARY_ERROR_RECEIVING_PROFILE_FROM_ADDON':
      return {
        phase: 'INITIALIZING',
        additionalData: {
          message: action.error.message,
          attempt: action.error.attempt
        }
      };
    case 'ERROR_RECEIVING_PROFILE_FROM_FILE':
    case 'FATAL_ERROR_RECEIVING_PROFILE_FROM_ADDON':
    case 'FATAL_ERROR_RECEIVING_PROFILE_FROM_STORE':
    case 'FATAL_ERROR_RECEIVING_PROFILE_FROM_URL':
      return { phase: 'FATAL_ERROR', error: action.error };
    case 'WAITING_FOR_PROFILE_FROM_ADDON':
      return { phase: 'INITIALIZING' };
    case 'ROUTE_NOT_FOUND':
      return { phase: 'ROUTE_NOT_FOUND' };
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      return { phase: 'PROFILE' };
    default:
      return state;
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function isURLSetupDone() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var action = arguments[1];

  switch (action.type) {
    case '@@urlenhancer/urlSetupDone':
      return true;
    default:
      return state;
  }
}
var appStateReducer = (0, _redux.combineReducers)({
  view: view,
  isURLSetupDone: isURLSetupDone
});
exports.default = appStateReducer;
var getApp = exports.getApp = function getApp(state) {
  return state.app;
};
var getView = exports.getView = function getView(state) {
  return getApp(state).view;
};
var getIsURLSetupDone = exports.getIsURLSetupDone = function getIsURLSetupDone(state) {
  return getApp(state).isURLSetupDone;
};