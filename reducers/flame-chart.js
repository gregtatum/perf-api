'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLabelingStrategy = exports.getCategoryColorStrategy = exports.getFlameChart = undefined;

var _redux = require('redux');

var _colorCategories = require('../profile-logic/color-categories');

var _labelingStrategies = require('../profile-logic/labeling-strategies');

function categoryColorStrategy() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _colorCategories.getCategoryByImplementation;
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_FLAME_CHART_COLOR_STRATEGY':
      return action.getCategory;
    default:
      return state;
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


function labelingStrategy() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _labelingStrategies.getFunctionName;
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_FLAME_CHART_LABELING_STRATEGY':
      return action.getLabel;
    default:
      return state;
  }
}

exports.default = (0, _redux.combineReducers)({ categoryColorStrategy: categoryColorStrategy, labelingStrategy: labelingStrategy });
var getFlameChart = exports.getFlameChart = function getFlameChart(state) {
  return state.flameChart;
};
var getCategoryColorStrategy = exports.getCategoryColorStrategy = function getCategoryColorStrategy(state) {
  return getFlameChart(state).categoryColorStrategy;
};
var getLabelingStrategy = exports.getLabelingStrategy = function getLabelingStrategy(state) {
  return getFlameChart(state).labelingStrategy;
};