'use strict';

var _processProfile = require('./process-profile');

var _promiseWorker = require('../utils/promise-worker');

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(0, _promiseWorker.provideWorkerSide)(self, _processProfile.ProfileProcessor);