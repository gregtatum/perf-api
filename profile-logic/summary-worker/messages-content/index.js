'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _profileSummary = require('../../../actions/profile-summary');

/**
 * Messages are the translation layer from actions dispatched by the worker
 * thread to the content thread. This de-couples the state of the two threads.
 */
var messages = {}; /* This Source Code Form is subject to the terms of the Mozilla Public
                    * License, v. 2.0. If a copy of the MPL was not distributed with this
                    * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.default = messages;


messages.PROFILE_SUMMARY_PROCESSED = function (message, call) {
  call(_profileSummary.profileSummaryProcessed, message.summary);
};