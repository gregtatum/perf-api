'use strict';

var _symbolStoreDb = require('./symbol-store-db');

var _promiseWorker = require('../utils/promise-worker');

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(0, _promiseWorker.provideWorkerSide)(self, _symbolStoreDb.SymbolStoreDB);