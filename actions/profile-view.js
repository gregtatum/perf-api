'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changeSelectedFuncStack = changeSelectedFuncStack;
exports.changeSelectedThread = changeSelectedThread;
exports.changeThreadOrder = changeThreadOrder;
exports.hideThread = hideThread;
exports.showThread = showThread;
exports.changeCallTreeSearchString = changeCallTreeSearchString;
exports.changeExpandedFuncStacks = changeExpandedFuncStacks;
exports.changeSelectedMarker = changeSelectedMarker;
exports.changeImplementationFilter = changeImplementationFilter;
exports.changeInvertCallstack = changeInvertCallstack;
exports.changeHidePlatformDetails = changeHidePlatformDetails;
exports.updateProfileSelection = updateProfileSelection;
exports.addRangeFilter = addRangeFilter;
exports.addRangeFilterAndUnsetSelection = addRangeFilterAndUnsetSelection;
exports.popRangeFilters = popRangeFilters;
exports.popRangeFiltersAndUnsetSelection = popRangeFiltersAndUnsetSelection;
exports.addCallTreeFilter = addCallTreeFilter;
exports.popCallTreeFilters = popCallTreeFilters;


/**
 * The actions that pertain to changing the view on the profile, including searching
 * and filtering. Currently the call tree's actions are in this file, but should be
 * split apart. These actions should most likely affect every panel.
 */
function changeSelectedFuncStack(threadIndex, selectedFuncStack) {
  return {
    type: 'CHANGE_SELECTED_FUNC_STACK',
    selectedFuncStack: selectedFuncStack,
    threadIndex: threadIndex
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function changeSelectedThread(selectedThread) {
  return {
    type: 'CHANGE_SELECTED_THREAD',
    selectedThread: selectedThread
  };
}

function changeThreadOrder(threadOrder) {
  return {
    type: 'CHANGE_THREAD_ORDER',
    threadOrder: threadOrder
  };
}

function hideThread(threadIndex, threadOrder, hiddenThreads) {
  return function (dispatch) {
    // Do not allow hiding the last thread.
    if (hiddenThreads.length + 1 === threadOrder.length) {
      return;
    }

    dispatch({
      type: 'HIDE_THREAD',
      threadIndex: threadIndex,
      threadOrder: threadOrder,
      hiddenThreads: hiddenThreads
    });
  };
}

function showThread(threadIndex) {
  return {
    type: 'SHOW_THREAD',
    threadIndex: threadIndex
  };
}

function changeCallTreeSearchString(searchString) {
  return {
    type: 'CHANGE_CALL_TREE_SEARCH_STRING',
    searchString: searchString
  };
}

function changeExpandedFuncStacks(threadIndex, expandedFuncStacks) {
  return {
    type: 'CHANGE_EXPANDED_FUNC_STACKS',
    threadIndex: threadIndex,
    expandedFuncStacks: expandedFuncStacks
  };
}

function changeSelectedMarker(threadIndex, selectedMarker) {
  return {
    type: 'CHANGE_SELECTED_MARKER',
    selectedMarker: selectedMarker,
    threadIndex: threadIndex
  };
}

function changeImplementationFilter(implementation) {
  return {
    type: 'CHANGE_IMPLEMENTATION_FILTER',
    implementation: implementation
  };
}

function changeInvertCallstack(invertCallstack) {
  return {
    type: 'CHANGE_INVERT_CALLSTACK',
    invertCallstack: invertCallstack
  };
}

function changeHidePlatformDetails(hidePlatformDetails) {
  return {
    type: 'CHANGE_HIDE_PLATFORM_DETAILS',
    hidePlatformDetails: hidePlatformDetails
  };
}

function updateProfileSelection(selection) {
  return {
    type: 'UPDATE_PROFILE_SELECTION',
    selection: selection
  };
}

function addRangeFilter(start, end) {
  return {
    type: 'ADD_RANGE_FILTER',
    start: start,
    end: end
  };
}

function addRangeFilterAndUnsetSelection(start, end) {
  return function (dispatch) {
    dispatch(addRangeFilter(start, end));
    dispatch(updateProfileSelection({ hasSelection: false, isModifying: false }));
  };
}

function popRangeFilters(firstRemovedFilterIndex) {
  return {
    type: 'POP_RANGE_FILTERS',
    firstRemovedFilterIndex: firstRemovedFilterIndex
  };
}

function popRangeFiltersAndUnsetSelection(firstRemovedFilterIndex) {
  return function (dispatch) {
    dispatch(popRangeFilters(firstRemovedFilterIndex));
    dispatch(updateProfileSelection({ hasSelection: false, isModifying: false }));
  };
}

function addCallTreeFilter(threadIndex, filter) {
  return {
    type: 'ADD_CALL_TREE_FILTER',
    threadIndex: threadIndex,
    filter: filter
  };
}

function popCallTreeFilters(threadIndex, firstRemovedFilterIndex) {
  return {
    type: 'POP_CALL_TREE_FILTERS',
    threadIndex: threadIndex,
    firstRemovedFilterIndex: firstRemovedFilterIndex
  };
}