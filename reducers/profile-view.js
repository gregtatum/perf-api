'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.selectedThreadSelectors = exports.selectorsForThread = exports.getProfileTaskTracerData = exports.getThreadNames = exports.getThreads = exports.getProfileInterval = exports.getProfile = exports.getTasksByThread = exports.getDisplayRange = exports.getZeroAt = exports.getScrollToSelectionGeneration = exports.getProfileRootRange = exports.getProfileViewOptions = exports.getProfileView = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _symbolication = require('../profile-logic/symbolication');

var _redux = require('redux');

var _reselect = require('reselect');

var _callTreeFilters = require('../profile-logic/call-tree-filters');

var CallTreeFilters = _interopRequireWildcard(_callTreeFilters);

var _urlState = require('./url-state');

var URLState = _interopRequireWildcard(_urlState);

var _profileData = require('../profile-logic/profile-data');

var ProfileData = _interopRequireWildcard(_profileData);

var _stackTiming = require('../profile-logic/stack-timing');

var StackTiming = _interopRequireWildcard(_stackTiming);

var _markerTiming = require('../profile-logic/marker-timing');

var MarkerTiming = _interopRequireWildcard(_markerTiming);

var _profileTree = require('../profile-logic/profile-tree');

var ProfileTree = _interopRequireWildcard(_profileTree);

var _taskTracer = require('../profile-logic/task-tracer');

var TaskTracerTools = _interopRequireWildcard(_taskTracer);

var _flameChart = require('./flame-chart');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function profile() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ProfileData.getEmptyProfile();
  var action = arguments[1];

  switch (action.type) {
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      return action.profile;
    case 'COALESCED_FUNCTIONS_UPDATE':
      {
        if (!state.threads.length) {
          return state;
        }
        var functionsUpdatePerThread = action.functionsUpdatePerThread;

        var threads = state.threads.map(function (thread, threadIndex) {
          if (!functionsUpdatePerThread[threadIndex]) {
            return thread;
          }
          var _functionsUpdatePerTh = functionsUpdatePerThread[threadIndex],
              oldFuncToNewFuncMap = _functionsUpdatePerTh.oldFuncToNewFuncMap,
              funcIndices = _functionsUpdatePerTh.funcIndices,
              funcNames = _functionsUpdatePerTh.funcNames;

          return (0, _symbolication.setFuncNames)((0, _symbolication.applyFunctionMerging)(thread, oldFuncToNewFuncMap), funcIndices, funcNames);
        });
        return Object.assign({}, state, { threads: threads });
      }
    case 'ASSIGN_TASK_TRACER_NAMES':
      {
        if (!state.tasktracer.taskTable.length) {
          return state;
        }
        var addressIndices = action.addressIndices,
            symbolNames = action.symbolNames;

        var tasktracer = (0, _symbolication.setTaskTracerNames)(state.tasktracer, addressIndices, symbolNames);
        return Object.assign({}, state, { tasktracer: tasktracer });
      }
    default:
      return state;
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function funcStackAfterCallTreeFilter(funcArray, filter) {
  if (filter.type === 'prefix' && !filter.matchJSOnly) {
    return removePrefixFromFuncArray(filter.prefixFuncs, funcArray);
  }
  return funcArray;
}

function removePrefixFromFuncArray(prefixFuncs, funcArray) {
  if (prefixFuncs.length > funcArray.length || prefixFuncs.some(function (prefixFunc, i) {
    return prefixFunc !== funcArray[i];
  })) {
    return [];
  }
  return funcArray.slice(prefixFuncs.length - 1);
}

function symbolicationStatus() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'DONE';
  var action = arguments[1];

  switch (action.type) {
    case 'START_SYMBOLICATING':
      return 'SYMBOLICATING';
    case 'DONE_SYMBOLICATING':
      return 'DONE';
    default:
      return state;
  }
}

function viewOptionsPerThread() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      return action.profile.threads.map(function () {
        return {
          selectedFuncStack: [],
          expandedFuncStacks: [],
          selectedMarker: -1
        };
      });
    case 'COALESCED_FUNCTIONS_UPDATE':
      {
        var functionsUpdatePerThread = action.functionsUpdatePerThread;
        // For each thread, apply oldFuncToNewFuncMap to that thread's
        // selectedFuncStack and expandedFuncStacks.

        return state.map(function (threadViewOptions, threadIndex) {
          if (!functionsUpdatePerThread[threadIndex]) {
            return threadViewOptions;
          }
          var oldFuncToNewFuncMap = functionsUpdatePerThread[threadIndex].oldFuncToNewFuncMap;

          return {
            selectedFuncStack: threadViewOptions.selectedFuncStack.map(function (oldFunc) {
              var newFunc = oldFuncToNewFuncMap.get(oldFunc);
              return newFunc === undefined ? oldFunc : newFunc;
            }),
            expandedFuncStacks: threadViewOptions.expandedFuncStacks.map(function (oldFuncArray) {
              return oldFuncArray.map(function (oldFunc) {
                var newFunc = oldFuncToNewFuncMap.get(oldFunc);
                return newFunc === undefined ? oldFunc : newFunc;
              });
            }),
            selectedMarker: threadViewOptions.selectedMarker
          };
        });
      }
    case 'CHANGE_SELECTED_FUNC_STACK':
      {
        var selectedFuncStack = action.selectedFuncStack,
            threadIndex = action.threadIndex;

        var expandedFuncStacks = state[threadIndex].expandedFuncStacks.slice();
        for (var i = 1; i < selectedFuncStack.length; i++) {
          expandedFuncStacks.push(selectedFuncStack.slice(0, i));
        }
        return [].concat((0, _toConsumableArray3.default)(state.slice(0, threadIndex)), [Object.assign({}, state[threadIndex], {
          selectedFuncStack: selectedFuncStack,
          expandedFuncStacks: expandedFuncStacks
        })], (0, _toConsumableArray3.default)(state.slice(threadIndex + 1)));
      }
    case 'CHANGE_EXPANDED_FUNC_STACKS':
      {
        var _threadIndex = action.threadIndex,
            _expandedFuncStacks = action.expandedFuncStacks;

        return [].concat((0, _toConsumableArray3.default)(state.slice(0, _threadIndex)), [Object.assign({}, state[_threadIndex], { expandedFuncStacks: _expandedFuncStacks })], (0, _toConsumableArray3.default)(state.slice(_threadIndex + 1)));
      }
    case 'CHANGE_SELECTED_MARKER':
      {
        var _threadIndex2 = action.threadIndex,
            selectedMarker = action.selectedMarker;

        return [].concat((0, _toConsumableArray3.default)(state.slice(0, _threadIndex2)), [Object.assign({}, state[_threadIndex2], { selectedMarker: selectedMarker })], (0, _toConsumableArray3.default)(state.slice(_threadIndex2 + 1)));
      }
    case 'ADD_CALL_TREE_FILTER':
      {
        var _threadIndex3 = action.threadIndex,
            filter = action.filter;

        var _expandedFuncStacks2 = state[_threadIndex3].expandedFuncStacks.map(function (fs) {
          return funcStackAfterCallTreeFilter(fs, filter);
        });
        var _selectedFuncStack = funcStackAfterCallTreeFilter(state[_threadIndex3].selectedFuncStack, filter);
        return [].concat((0, _toConsumableArray3.default)(state.slice(0, _threadIndex3)), [Object.assign({}, state[_threadIndex3], {
          selectedFuncStack: _selectedFuncStack,
          expandedFuncStacks: _expandedFuncStacks2
        })], (0, _toConsumableArray3.default)(state.slice(_threadIndex3 + 1)));
      }
    default:
      return state;
  }
}

function waitingForLibs() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Set();
  var action = arguments[1];

  switch (action.type) {
    case 'REQUESTING_SYMBOL_TABLE':
      {
        var newState = new Set(state);
        newState.add(action.requestedLib);
        return newState;
      }
    case 'RECEIVED_SYMBOL_TABLE_REPLY':
      {
        var _newState = new Set(state);
        _newState.delete(action.requestedLib);
        return _newState;
      }
    default:
      return state;
  }
}

function selection() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { hasSelection: false, isModifying: false };
  var action = arguments[1];

  // TODO: Rename to timeRangeSelection
  switch (action.type) {
    case 'UPDATE_PROFILE_SELECTION':
      return action.selection;
    default:
      return state;
  }
}

function scrollToSelectionGeneration() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_INVERT_CALLSTACK':
    case 'CHANGE_JS_ONLY':
    case 'CHANGE_SELECTED_FUNC_STACK':
    case 'CHANGE_SELECTED_THREAD':
    case 'HIDE_THREAD':
      return state + 1;
    default:
      return state;
  }
}

function rootRange() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { start: 0, end: 1 };
  var action = arguments[1];

  switch (action.type) {
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      return ProfileData.getTimeRangeIncludingAllThreads(action.profile);
    default:
      return state;
  }
}

function zeroAt() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var action = arguments[1];

  switch (action.type) {
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      return ProfileData.getTimeRangeIncludingAllThreads(action.profile).start;
    default:
      return state;
  }
}

function tabOrder() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [0, 1, 2, 3, 4];
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_TAB_ORDER':
      return action.tabOrder;
    default:
      return state;
  }
}

var profileViewReducer = (0, _redux.combineReducers)({
  viewOptions: (0, _redux.combineReducers)({
    perThread: viewOptionsPerThread,
    symbolicationStatus: symbolicationStatus,
    waitingForLibs: waitingForLibs,
    selection: selection,
    scrollToSelectionGeneration: scrollToSelectionGeneration,
    rootRange: rootRange,
    zeroAt: zeroAt,
    tabOrder: tabOrder
  }),
  profile: profile
});
exports.default = profileViewReducer;
var getProfileView = exports.getProfileView = function getProfileView(state) {
  return state.profileView;
};

/**
 * Profile View Options
 */
var getProfileViewOptions = exports.getProfileViewOptions = function getProfileViewOptions(state) {
  return getProfileView(state).viewOptions;
};
var getProfileRootRange = exports.getProfileRootRange = function getProfileRootRange(state) {
  return getProfileViewOptions(state).rootRange;
};

var getScrollToSelectionGeneration = exports.getScrollToSelectionGeneration = (0, _reselect.createSelector)(getProfileViewOptions, function (viewOptions) {
  return viewOptions.scrollToSelectionGeneration;
});

var getZeroAt = exports.getZeroAt = (0, _reselect.createSelector)(getProfileViewOptions, function (viewOptions) {
  return viewOptions.zeroAt;
});

var getDisplayRange = exports.getDisplayRange = (0, _reselect.createSelector)(function (state) {
  return getProfileViewOptions(state).rootRange;
}, function (state) {
  return getProfileViewOptions(state).zeroAt;
}, URLState.getRangeFilters, function (rootRange, zeroAt, rangeFilters) {
  if (rangeFilters.length > 0) {
    var _rangeFilters = rangeFilters[rangeFilters.length - 1],
        start = _rangeFilters.start,
        end = _rangeFilters.end;

    start += zeroAt;
    end += zeroAt;
    return { start: start, end: end };
  }
  return rootRange;
});

var getTasksByThread = exports.getTasksByThread = (0, _reselect.createSelector)(function (state) {
  return getProfileTaskTracerData(state).taskTable;
}, function (state) {
  return getProfileTaskTracerData(state).threadTable;
}, TaskTracerTools.getTasksByThread);

/**
 * Profile
 */
var getProfile = exports.getProfile = function getProfile(state) {
  return getProfileView(state).profile;
};
var getProfileInterval = exports.getProfileInterval = function getProfileInterval(state) {
  return getProfile(state).meta.interval;
};
var getThreads = exports.getThreads = function getThreads(state) {
  return getProfile(state).threads;
};
var getThreadNames = exports.getThreadNames = function getThreadNames(state) {
  return getProfile(state).threads.map(function (t) {
    return t.name;
  });
};
var getProfileTaskTracerData = exports.getProfileTaskTracerData = function getProfileTaskTracerData(state) {
  return getProfile(state).tasktracer;
};

var selectorsForThreads = {};

var selectorsForThread = exports.selectorsForThread = function selectorsForThread(threadIndex) {
  if (!(threadIndex in selectorsForThreads)) {
    var _getThread = function _getThread(state) {
      return getProfile(state).threads[threadIndex];
    };
    var _getViewOptions = function _getViewOptions(state) {
      return getProfileViewOptions(state).perThread[threadIndex];
    };
    var _getCallTreeFilters = function _getCallTreeFilters(state) {
      return URLState.getCallTreeFilters(state, threadIndex);
    };
    var _getFriendlyThreadName = (0, _reselect.createSelector)(getThreads, _getThread, ProfileData.getFriendlyThreadName);
    var _getThreadProcessDetails = (0, _reselect.createSelector)(_getThread, ProfileData.getThreadProcessDetails);
    var _getCallTreeFilterLabels = (0, _reselect.createSelector)(_getThread, _getFriendlyThreadName, _getCallTreeFilters, CallTreeFilters.getCallTreeFilterLabels);
    var _getRangeFilteredThread = (0, _reselect.createSelector)(_getThread, getDisplayRange, function (thread, range) {
      var start = range.start,
          end = range.end;

      return ProfileData.filterThreadToRange(thread, start, end);
    });
    var _getRangeFilteredThreadSamples = (0, _reselect.createSelector)(_getRangeFilteredThread, function (thread) {
      return thread.samples;
    });
    var _getJankInstances = (0, _reselect.createSelector)(_getRangeFilteredThreadSamples, _getFriendlyThreadName, function (samples, threadName) {
      return ProfileData.getJankInstances(samples, threadName, 50);
    });
    var _getTracingMarkers = (0, _reselect.createSelector)(_getThread, ProfileData.getTracingMarkers);
    var _getMarkerTiming = (0, _reselect.createSelector)(_getTracingMarkers, MarkerTiming.getMarkerTiming);
    var _getRangeSelectionFilteredTracingMarkers = (0, _reselect.createSelector)(_getTracingMarkers, getDisplayRange, function (markers, range) {
      var start = range.start,
          end = range.end;

      return ProfileData.filterTracingMarkersToRange(markers, start, end);
    });
    var _getRangeAndCallTreeFilteredThread = (0, _reselect.createSelector)(_getRangeFilteredThread, _getCallTreeFilters, function (thread, callTreeFilters) {
      var result = callTreeFilters.reduce(function (t, filter) {
        switch (filter.type) {
          case 'prefix':
            return ProfileData.filterThreadToPrefixStack(t, filter.prefixFuncs, filter.matchJSOnly);
          case 'postfix':
            return ProfileData.filterThreadToPostfixStack(t, filter.postfixFuncs, filter.matchJSOnly);
          default:
            throw new Error('unhandled call tree filter');
        }
      }, thread);
      return result;
    });
    var _getImplementationFilteredThread = (0, _reselect.createSelector)(_getRangeAndCallTreeFilteredThread, URLState.getImplementationFilter, ProfileData.filterThreadByImplementation);
    var _getImplementationAndSearchFilteredThread = (0, _reselect.createSelector)(_getImplementationFilteredThread, URLState.getSearchString, function (thread, searchString) {
      return ProfileData.filterThreadToSearchString(thread, searchString);
    });
    var _getFilteredThread = (0, _reselect.createSelector)(_getImplementationAndSearchFilteredThread, URLState.getInvertCallstack, function (thread, shouldInvertCallstack) {
      return shouldInvertCallstack ? ProfileData.invertCallstack(thread) : thread;
    });
    var _getRangeSelectionFilteredThread = (0, _reselect.createSelector)(_getFilteredThread, getProfileViewOptions, function (thread, viewOptions) {
      if (!viewOptions.selection.hasSelection) {
        return thread;
      }
      var _viewOptions$selectio = viewOptions.selection,
          selectionStart = _viewOptions$selectio.selectionStart,
          selectionEnd = _viewOptions$selectio.selectionEnd;

      return ProfileData.filterThreadToRange(thread, selectionStart, selectionEnd);
    });
    var _getFuncStackInfo = (0, _reselect.createSelector)(_getFilteredThread, function (_ref) {
      var stackTable = _ref.stackTable,
          frameTable = _ref.frameTable,
          funcTable = _ref.funcTable;

      return ProfileData.getFuncStackInfo(stackTable, frameTable, funcTable);
    });
    var _getSelectedFuncStackAsFuncArray = (0, _reselect.createSelector)(_getViewOptions, function (threadViewOptions) {
      return threadViewOptions.selectedFuncStack;
    });
    var _getSelectedFuncStack = (0, _reselect.createSelector)(_getFuncStackInfo, _getSelectedFuncStackAsFuncArray, function (funcStackInfo, funcArray) {
      return ProfileData.getFuncStackFromFuncArray(funcArray, funcStackInfo.funcStackTable);
    });
    var _getExpandedFuncStacksAsFuncArrays = (0, _reselect.createSelector)(_getViewOptions, function (threadViewOptions) {
      return threadViewOptions.expandedFuncStacks;
    });
    var _getExpandedFuncStacks = (0, _reselect.createSelector)(_getFuncStackInfo, _getExpandedFuncStacksAsFuncArrays, function (funcStackInfo, funcArrays) {
      return funcArrays.map(function (funcArray) {
        return ProfileData.getFuncStackFromFuncArray(funcArray, funcStackInfo.funcStackTable);
      });
    });
    var _getCallTree = (0, _reselect.createSelector)(_getRangeSelectionFilteredThread, getProfileInterval, _getFuncStackInfo, URLState.getImplementationFilter, URLState.getInvertCallstack, ProfileTree.getCallTree);

    // The selectors below diverge from the thread filtering that's done above;
    // they respect the "hidePlatformDetails" setting instead of the "jsOnly"
    // setting. This type of filtering is needed for the flame chart.
    // This divergence is hopefully temporary, as we figure out how to filter
    // out unneeded detail from stacks in a way that satisfy both the flame
    // chart and the call tree.
    var _getFilteredThreadForFlameChart = (0, _reselect.createSelector)(_getRangeFilteredThread, URLState.getHidePlatformDetails, URLState.getInvertCallstack, URLState.getSearchString, function (thread, shouldHidePlatformDetails, shouldInvertCallstack, searchString) {
      // Unlike for the call tree filtered profile, the individual steps of
      // this filtering are not memoized. I hope it's not too bad.
      var filteredThread = thread;
      filteredThread = ProfileData.filterThreadToSearchString(filteredThread, searchString);
      if (shouldHidePlatformDetails) {
        filteredThread = ProfileData.collapsePlatformStackFrames(filteredThread);
      }
      if (shouldInvertCallstack) {
        filteredThread = ProfileData.invertCallstack(filteredThread);
      }
      return filteredThread;
    });
    var _getFuncStackInfoOfFilteredThreadForFlameChart = (0, _reselect.createSelector)(_getFilteredThreadForFlameChart, function (_ref2) {
      var stackTable = _ref2.stackTable,
          frameTable = _ref2.frameTable,
          funcTable = _ref2.funcTable;

      return ProfileData.getFuncStackInfo(stackTable, frameTable, funcTable);
    });
    var _getFuncStackMaxDepthForFlameChart = (0, _reselect.createSelector)(_getFilteredThreadForFlameChart, _getFuncStackInfoOfFilteredThreadForFlameChart, StackTiming.computeFuncStackMaxDepth);
    var _getStackTimingByDepthForFlameChart = (0, _reselect.createSelector)(_getFilteredThreadForFlameChart, _getFuncStackInfoOfFilteredThreadForFlameChart, _getFuncStackMaxDepthForFlameChart, getProfileInterval, StackTiming.getStackTimingByDepth);
    var _getLeafCategoryStackTimingForFlameChart = (0, _reselect.createSelector)(_getFilteredThreadForFlameChart, getProfileInterval, _flameChart.getCategoryColorStrategy, StackTiming.getLeafCategoryStackTiming);

    selectorsForThreads[threadIndex] = {
      getThread: _getThread,
      getViewOptions: _getViewOptions,
      getCallTreeFilters: _getCallTreeFilters,
      getCallTreeFilterLabels: _getCallTreeFilterLabels,
      getRangeFilteredThread: _getRangeFilteredThread,
      getJankInstances: _getJankInstances,
      getTracingMarkers: _getTracingMarkers,
      getMarkerTiming: _getMarkerTiming,
      getRangeSelectionFilteredTracingMarkers: _getRangeSelectionFilteredTracingMarkers,
      getFilteredThread: _getFilteredThread,
      getRangeSelectionFilteredThread: _getRangeSelectionFilteredThread,
      getFuncStackInfo: _getFuncStackInfo,
      getSelectedFuncStack: _getSelectedFuncStack,
      getExpandedFuncStacks: _getExpandedFuncStacks,
      getCallTree: _getCallTree,
      getFilteredThreadForFlameChart: _getFilteredThreadForFlameChart,
      getFuncStackInfoOfFilteredThreadForFlameChart: _getFuncStackInfoOfFilteredThreadForFlameChart,
      getFuncStackMaxDepthForFlameChart: _getFuncStackMaxDepthForFlameChart,
      getStackTimingByDepthForFlameChart: _getStackTimingByDepthForFlameChart,
      getLeafCategoryStackTimingForFlameChart: _getLeafCategoryStackTimingForFlameChart,
      getFriendlyThreadName: _getFriendlyThreadName,
      getThreadProcessDetails: _getThreadProcessDetails
    };
  }
  return selectorsForThreads[threadIndex];
};

var selectedThreadSelectors = exports.selectedThreadSelectors = function () {
  var anyThreadSelectors = selectorsForThread(0);
  var result = {};

  var _loop = function _loop(_key) {
    result[_key] = function (state) {
      return selectorsForThread(URLState.getSelectedThreadIndex(state))[_key](state);
    };
  };

  for (var _key in anyThreadSelectors) {
    _loop(_key);
  }
  var result2 = result;
  return result2;
}();