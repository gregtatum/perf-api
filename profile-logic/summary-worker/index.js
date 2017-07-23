'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _redux = require('redux');

var _threadMiddleware = require('../../utils/thread-middleware');

var _threadMiddleware2 = _interopRequireDefault(_threadMiddleware);

var _messageHandler = require('../../utils/message-handler');

var _messageHandler2 = _interopRequireDefault(_messageHandler);

var _messagesWorker = require('./messages-worker');

var _messagesWorker2 = _interopRequireDefault(_messagesWorker);

var _reducers = require('./reducers');

var _reducers2 = _interopRequireDefault(_reducers);

var _reduxLogger = require('redux-logger');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var store = (0, _redux.createStore)(
// Reducers:
_reducers2.default,
// Initial State:
{},
// Enhancers:
_redux.applyMiddleware.apply(undefined, (0, _toConsumableArray3.default)([_reduxThunk2.default, (0, _threadMiddleware2.default)(self, 'toContent'), process.env.NODE_ENV === 'development' ? (0, _reduxLogger.createLogger)({
  titleFormatter: function titleFormatter(action) {
    return 'worker action ' + action.type;
  }
}) : null].filter(function (fn) {
  return fn;
})))); /* This Source Code Form is subject to the terms of the Mozilla Public
        * License, v. 2.0. If a copy of the MPL was not distributed with this
        * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(0, _messageHandler2.default)(self, store, _messagesWorker2.default);