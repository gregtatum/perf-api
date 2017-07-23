'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getImplementationColor = getImplementationColor;
exports.getCategoryByImplementation = getCategoryByImplementation;
exports.getImplementationCategoryIndex = getImplementationCategoryIndex;
exports.getFunctionName = getFunctionName;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var implementationCategoryMap = exports.implementationCategoryMap = {
  'JS Baseline': '#B5ECA8',
  JIT: '#3CCF55',
  'JS Interpreter': 'rgb(200, 200, 200)',
  Platform: 'rgb(240, 240, 240)'
};

var implementationCategories = exports.implementationCategories = _categoriesMapToList(implementationCategoryMap);

var _implementationCategoriesIndexMap = _toIndexMap(implementationCategories);

// TODO - This function is not needed.

function getImplementationColor(thread, frameIndex) {
  return getCategoryByImplementation(thread, frameIndex).color;
}

function getCategoryByImplementation(thread, frameIndex) {
  return implementationCategories[getImplementationCategoryIndex(thread, frameIndex)];
}

// TODO - This function is not needed.

function getImplementationCategoryIndex(thread, frameIndex) {
  var funcIndex = thread.frameTable.func[frameIndex];
  var implementationIndex = thread.frameTable.implementation[frameIndex];
  var implementation = implementationIndex ? thread.stringTable.getString(implementationIndex) : null;
  var categoryName = void 0;
  if (implementation) {
    categoryName = implementation === 'baseline' ? 'JS Baseline' : 'JIT';
  } else {
    categoryName = thread.funcTable.isJS[funcIndex] ? 'JS Interpreter' : 'Platform';
  }
  return _implementationCategoriesIndexMap[categoryName];
}

function _toIndexMap(categories) {
  var indexMap = {};
  for (var i = 0; i < categories.length; i++) {
    indexMap[categories[i].name] = i;
  }
  return indexMap;
}

function _categoriesMapToList(object) {
  var list = [];
  for (var _name in object) {
    if (object.hasOwnProperty(_name)) {
      list.push({ name: _name, color: object[_name] });
    }
  }
  return list;
}

function getFunctionName(thread, stackIndex) {
  var frameIndex = thread.stackTable.frame[stackIndex];
  var funcIndex = thread.frameTable.func[frameIndex];
  return thread.stringTable.getString(thread.funcTable.name[funcIndex]);
}