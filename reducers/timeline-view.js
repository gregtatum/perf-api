'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHasZoomedViaMousewheel = exports.getAreMarkersExpanded = exports.getIsFlameChartExpanded = exports.getTimelineView = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isFlameChartExpanded() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Map();
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_TIMELINE_FLAME_CHART_EXPANDED_THREAD':
      {
        var newState = new Map(state);
        // For now only allow one thread to be open at a time, evaluate whether or not do
        // more than one.
        if (action.isExpanded) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = state[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var _ref = _step.value;

              var _ref2 = (0, _slicedToArray3.default)(_ref, 2);

              var threadIndex = _ref2[0];
              var isExpanded = _ref2[1];

              if (isExpanded) {
                newState.set(threadIndex, false);
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
        newState.set(action.threadIndex, action.isExpanded);
        return newState;
      }
    default:
      return state;
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function areMarkersExpanded() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Map();
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_TIMELINE_MARKERS_EXPANDED_THREAD':
      {
        var newState = new Map(state);
        newState.set(action.threadIndex, action.isExpanded);
        return newState;
      }
    default:
      return state;
  }
}

function hasZoomedViaMousewheel() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var action = arguments[1];

  switch (action.type) {
    case 'HAS_ZOOMED_VIA_MOUSEWHEEL':
      {
        return true;
      }
    default:
      return state;
  }
}

exports.default = (0, _redux.combineReducers)({
  isFlameChartExpanded: isFlameChartExpanded,
  areMarkersExpanded: areMarkersExpanded,
  hasZoomedViaMousewheel: hasZoomedViaMousewheel
});
var getTimelineView = exports.getTimelineView = function getTimelineView(state) {
  return state.timelineView;
};
var getIsFlameChartExpanded = exports.getIsFlameChartExpanded = function getIsFlameChartExpanded(state, threadIndex) {
  return Boolean(getTimelineView(state).isFlameChartExpanded.get(threadIndex));
};
var getAreMarkersExpanded = exports.getAreMarkersExpanded = function getAreMarkersExpanded(state, threadIndex) {
  // Default to being expanded by checking if not equal to false.
  return getTimelineView(state).areMarkersExpanded.get(threadIndex) !== false;
};
var getHasZoomedViaMousewheel = exports.getHasZoomedViaMousewheel = function getHasZoomedViaMousewheel(state) {
  return getTimelineView(state).hasZoomedViaMousewheel;
};