'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processProfileSummary = processProfileSummary;
exports.profileProcessed = profileProcessed;

var _summarizeProfile = require('../../../profile-logic/summarize-profile');

function processProfileSummary() {
  return function (dispatch, getState) {
    dispatch({
      toContent: true,
      type: 'PROFILE_SUMMARY_PROCESSED',
      summary: (0, _summarizeProfile.summarizeProfile)(getState().profile)
    });
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function profileProcessed(profile) {
  return {
    type: 'PROFILE_PROCESSED',
    profile: profile
  };
}