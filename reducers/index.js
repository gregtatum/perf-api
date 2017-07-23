'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _profileView = require('./profile-view');

var _profileView2 = _interopRequireDefault(_profileView);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _summaryView = require('./summary-view');

var _summaryView2 = _interopRequireDefault(_summaryView);

var _urlState = require('./url-state');

var _urlState2 = _interopRequireDefault(_urlState);

var _flameChart = require('./flame-chart');

var _flameChart2 = _interopRequireDefault(_flameChart);

var _timelineView = require('./timeline-view');

var _timelineView2 = _interopRequireDefault(_timelineView);

var _icons = require('./icons');

var _icons2 = _interopRequireDefault(_icons);

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.default = (0, _redux.combineReducers)({
  app: _app2.default,
  profileView: _profileView2.default,
  summaryView: _summaryView2.default,
  urlState: _urlState2.default,
  flameChart: _flameChart2.default,
  timelineView: _timelineView2.default,
  icons: _icons2.default
});