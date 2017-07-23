'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.profileSummaryProcessed = profileSummaryProcessed;
exports.expandProfileSummaryThread = expandProfileSummaryThread;
exports.collapseProfileSummaryThread = collapseProfileSummaryThread;
function profileSummaryProcessed(summary) {
  return {
    type: 'PROFILE_SUMMARY_PROCESSED',
    summary: summary
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function expandProfileSummaryThread(threadIndex) {
  return {
    type: 'PROFILE_SUMMARY_EXPAND',
    threadIndex: threadIndex
  };
}

function collapseProfileSummaryThread(threadIndex) {
  return {
    type: 'PROFILE_SUMMARY_COLLAPSE',
    threadIndex: threadIndex
  };
}