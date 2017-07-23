'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFunctionName = getFunctionName;
exports.getImplementationName = getImplementationName;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function getFunctionName(thread, stackIndex) {
  var frameIndex = thread.stackTable.frame[stackIndex];
  var funcIndex = thread.frameTable.func[frameIndex];
  return thread.stringTable.getString(thread.funcTable.name[funcIndex]);
}

function getImplementationName(thread, stackIndex) {
  var frameIndex = thread.stackTable.frame[stackIndex];
  var implementation = thread.frameTable.implementation[frameIndex];
  if (implementation) {
    return implementation === 'baseline' ? 'JS Baseline' : 'JS Ion';
  }
  var funcIndex = thread.frameTable.func[frameIndex];
  return thread.funcTable.isJS[funcIndex] ? 'JS Interpreter' : 'Platform';
}