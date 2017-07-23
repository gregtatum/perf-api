'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsPerf = require('react-addons-perf');

var _reactAddonsPerf2 = _interopRequireDefault(_reactAddonsPerf);

var _reactDom = require('react-dom');

var _Root = require('./components/app/Root');

var _Root2 = _interopRequireDefault(_Root);

var _createStore = require('./create-store');

var _createStore2 = _interopRequireDefault(_createStore);

require('../res/style.css');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (process.env.NODE_ENV === 'production') {
  var runtime = require('offline-plugin/runtime');
  runtime.install({
    onUpdateReady: function onUpdateReady() {
      runtime.applyUpdate();
    }
  });
}

window.geckoProfilerPromise = new Promise(function (resolve) {
  window.connectToGeckoProfiler = resolve;
});

var store = (0, _createStore2.default)();

(0, _reactDom.render)(_react2.default.createElement(_Root2.default, { store: store }), document.getElementById('root'));

window.Perf = _reactAddonsPerf2.default;