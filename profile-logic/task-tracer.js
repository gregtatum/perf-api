'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTasksByThread = getTasksByThread;
exports.getEmptyTaskTracerData = getEmptyTaskTracerData;

var _uniqueStringArray = require('../utils/unique-string-array');

function getTasksByThread(taskTable, threadTable) {
  var threadIndexToTaskIndicesMap = new Map();

  var _loop = function _loop(threadIndex) {
    var taskIndices = [];
    for (var taskIndex = 0; taskIndex < taskTable.length; taskIndex++) {
      if (taskTable.threadIndex[taskIndex] === threadIndex) {
        taskIndices.push(taskIndex);
      }
    }
    var afterEnd = 1477254572877 * 2;
    taskIndices.sort(function (a, b) {
      return (taskTable.beginTime[a] || afterEnd) - (taskTable.beginTime[b] || afterEnd);
    });
    threadIndexToTaskIndicesMap.set(threadIndex, taskIndices);
  };

  for (var threadIndex = 0; threadIndex < threadTable.length; threadIndex++) {
    _loop(threadIndex);
  }
  return threadIndexToTaskIndicesMap;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function getEmptyTaskTracerData() {
  return {
    taskTable: {
      length: 0,
      dispatchTime: [],
      sourceEventId: [],
      sourceEventType: [],
      parentTaskId: [],
      beginTime: [],
      processId: [],
      threadIndex: [],
      endTime: [],
      ipdlMsg: [],
      label: [],
      address: []
    },
    tasksIdToTaskIndexMap: new Map(),
    stringTable: new _uniqueStringArray.UniqueStringArray(),
    addressTable: {
      length: 0,
      address: [],
      className: [],
      lib: []
    },
    addressIndicesByLib: new Map(),
    threadTable: {
      length: 0,
      tid: [],
      name: [],
      start: []
    },
    tidToThreadIndexMap: new Map()
  };
}