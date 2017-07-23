'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeStore;

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _reduxLogger = require('redux-logger');

var _reducers = require('./reducers');

var _reducers2 = _interopRequireDefault(_reducers);

var _threadMiddleware = require('./utils/thread-middleware');

var _threadMiddleware2 = _interopRequireDefault(_threadMiddleware);

var _messagesContent = require('./profile-logic/summary-worker/messages-content');

var _messagesContent2 = _interopRequireDefault(_messagesContent);

var _messageHandler = require('./utils/message-handler');

var _messageHandler2 = _interopRequireDefault(_messageHandler);

var _workerFactory = require('./utils/worker-factory');

var _workerFactory2 = _interopRequireDefault(_workerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Isolate the store creation into a function, so that it can be used outside of the
 * app's execution context, e.g. for testing.
 * @return {object} Redux store.
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function initializeStore() {
  var worker = new _workerFactory2.default('worker');

  var middlewares = [_reduxThunk2.default, (0, _threadMiddleware2.default)(worker, 'toWorker')];

  if (process.env.NODE_ENV === 'development') {
    middlewares.push((0, _reduxLogger.createLogger)({
      titleFormatter: function titleFormatter(action) {
        return 'content action ' + action.type;
      }
    }));
  }

  var store = (0, _redux.createStore)(_reducers2.default, _redux.applyMiddleware.apply(undefined, middlewares));

  (0, _messageHandler2.default)(worker, store, _messagesContent2.default);

  return store;
}