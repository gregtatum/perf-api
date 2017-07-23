'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _actions = require('../actions');

/**
 * Messages are the translation layer from actions dispatched by the content
 * thread to the worker thread. This de-couples the state of the two threads.
 * In the worker this is the only place that actions can be dispatched.
 */
var messages = {}; /* This Source Code Form is subject to the terms of the Mozilla Public
                    * License, v. 2.0. If a copy of the MPL was not distributed with this
                    * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.default = messages;


messages.PROFILE_PROCESSED = function (message, call) {
  call(_actions.profileProcessed, message.profile);
};

messages.SUMMARIZE_PROFILE = function (message, call) {
  call(_actions.processProfileSummary);
};