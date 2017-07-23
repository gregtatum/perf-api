'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = summaryViewReducer;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function summaryViewReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { summary: null, expanded: null };
  var action = arguments[1];

  switch (action.type) {
    case 'PROFILE_SUMMARY_PROCESSED':
      {
        return Object.assign({}, state, {
          summary: action.summary,
          expanded: new Set()
        });
      }
    case 'PROFILE_SUMMARY_EXPAND':
      {
        var expanded = new Set(state.expanded);
        expanded.add(action.threadIndex);
        return Object.assign({}, state, { expanded: expanded });
      }
    case 'PROFILE_SUMMARY_COLLAPSE':
      {
        var _expanded = new Set(state.expanded);
        _expanded.delete(action.threadIndex);
        return Object.assign({}, state, { expanded: _expanded });
      }
    default:
      return state;
  }
}

var getSummaryView = exports.getSummaryView = function getSummaryView(state) {
  return state.summaryView;
};

var getProfileSummaries = exports.getProfileSummaries = function getProfileSummaries(state) {
  return getSummaryView(state).summary;
};

var getProfileExpandedSummaries = exports.getProfileExpandedSummaries = function getProfileExpandedSummaries(state) {
  return getSummaryView(state).expanded;
};