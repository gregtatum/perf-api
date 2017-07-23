'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRangeFilterLabels = exports.getURLPredictor = exports.getVisibleThreadOrder = exports.getHiddenThreads = exports.getThreadOrder = exports.getCallTreeFilters = exports.getSelectedThreadIndex = exports.getSelectedTab = exports.getSearchString = exports.getInvertCallstack = exports.getHidePlatformDetails = exports.getImplementationFilter = exports.getRangeFilters = exports.getProfileURL = exports.getHash = exports.getDataSource = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _redux = require('redux');

var _profileData = require('../profile-logic/profile-data');

var _reselect = require('reselect');

var _urlHandling = require('../url-handling');

var _rangeFilters = require('../profile-logic/range-filters');

var RangeFilters = _interopRequireWildcard(_rangeFilters);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dataSource() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'none';
  var action = arguments[1];

  switch (action.type) {
    case 'WAITING_FOR_PROFILE_FROM_FILE':
      return 'from-file';
    case 'PROFILE_PUBLISHED':
      return 'public';
    default:
      return state;
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function hash() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var action = arguments[1];

  switch (action.type) {
    case 'PROFILE_PUBLISHED':
      return action.hash;
    default:
      return state;
  }
}

function profileURL() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var action = arguments[1];

  switch (action.type) {
    default:
      return state;
  }
}

function selectedTab() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'calltree';
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_SELECTED_TAB':
      return action.selectedTab;
    default:
      return state;
  }
}

function rangeFilters() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case 'ADD_RANGE_FILTER':
      {
        var start = action.start,
            end = action.end;

        return [].concat((0, _toConsumableArray3.default)(state), [{ start: start, end: end }]);
      }
    case 'POP_RANGE_FILTERS':
      return state.slice(0, action.firstRemovedFilterIndex);
    default:
      return state;
  }
}

function selectedThread() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var action = arguments[1];

  function findDefaultThreadIndex(threads) {
    var contentThreadId = threads.findIndex(function (thread) {
      return thread.name === 'GeckoMain' && thread.processType === 'tab';
    });
    return contentThreadId !== -1 ? contentThreadId : (0, _profileData.defaultThreadOrder)(threads)[0];
  }

  switch (action.type) {
    case 'CHANGE_SELECTED_THREAD':
      return action.selectedThread;
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_FILE':
      {
        // When loading in a brand new profile, select either the GeckoMain [tab] thread,
        // or the first thread in the thread order. For profiles from the Web, the
        // selectedThread has already been initialized from the URL and does not require
        // looking at the profile.
        return findDefaultThreadIndex(action.profile.threads);
      }
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
      {
        // For profiles from the web, we only need to ensure the selected thread
        // is actually valid.
        if (state < action.profile.threads.length) {
          return state;
        }
        return findDefaultThreadIndex(action.profile.threads);
      }
    case 'HIDE_THREAD':
      {
        var threadIndex = action.threadIndex,
            _hiddenThreads = action.hiddenThreads,
            _threadOrder = action.threadOrder;
        // If the currently selected thread is being hidden, then re-select a new one.

        if (state === threadIndex) {
          var index = _threadOrder.find(function (index) {
            return index !== threadIndex && !_hiddenThreads.includes(index);
          });
          if (index === undefined) {
            throw new Error('A new thread index must be found');
          }
          return index;
        }
        return state;
      }
    default:
      return state;
  }
}

function callTreeSearchString() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_CALL_TREE_SEARCH_STRING':
      return action.searchString;
    default:
      return state;
  }
}

function callTreeFilters() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];

  switch (action.type) {
    case 'ADD_CALL_TREE_FILTER':
      {
        var threadIndex = action.threadIndex,
            filter = action.filter;

        var oldFilters = state[threadIndex] || [];
        return Object.assign({}, state, (0, _defineProperty3.default)({}, threadIndex, [].concat((0, _toConsumableArray3.default)(oldFilters), [filter])));
      }
    case 'POP_CALL_TREE_FILTERS':
      {
        var _threadIndex = action.threadIndex,
            firstRemovedFilterIndex = action.firstRemovedFilterIndex;

        var _oldFilters = state[_threadIndex] || [];
        return Object.assign({}, state, (0, _defineProperty3.default)({}, _threadIndex, _oldFilters.slice(0, firstRemovedFilterIndex)));
      }
    default:
      return state;
  }
}

/**
 * Represents the current filter applied to the stack frames, where it will show
 * frames only by implementation.
 */
function implementation() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'combined';
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_IMPLEMENTATION_FILTER':
      return action.implementation;
    default:
      return state;
  }
}

function invertCallstack() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_INVERT_CALLSTACK':
      return action.invertCallstack;
    default:
      return state;
  }
}

function hidePlatformDetails() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var action = arguments[1];

  switch (action.type) {
    case 'CHANGE_HIDE_PLATFORM_DETAILS':
      return action.hidePlatformDetails;
    default:
      return state;
  }
}

function threadOrder() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      {
        // When receiving a new profile, try to use the thread order specified in the URL,
        // but ensure that the IDs are correct.
        var threads = (0, _profileData.defaultThreadOrder)(action.profile.threads);
        var validURLThreads = state.filter(function (index) {
          return threads.includes(index);
        });
        var missingThreads = threads.filter(function (index) {
          return !state.includes(index);
        });
        return validURLThreads.concat(missingThreads);
      }
    case 'CHANGE_THREAD_ORDER':
      return action.threadOrder;
    default:
      return state;
  }
}

function hiddenThreads() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];

  switch (action.type) {
    case 'RECEIVE_PROFILE_FROM_ADDON':
    case 'RECEIVE_PROFILE_FROM_STORE':
    case 'RECEIVE_PROFILE_FROM_URL':
    case 'RECEIVE_PROFILE_FROM_FILE':
      {
        // When receiving a new profile, try to use the hidden threads specified in the URL,
        // but ensure that the IDs are correct.
        var threads = action.profile.threads.map(function (_, threadIndex) {
          return threadIndex;
        });
        return state.filter(function (index) {
          return threads.includes(index);
        });
      }
    case 'HIDE_THREAD':
      return [].concat((0, _toConsumableArray3.default)(state), [action.threadIndex]);
    case 'SHOW_THREAD':
      {
        var threadIndex = action.threadIndex;

        return state.filter(function (index) {
          return index !== threadIndex;
        });
      }
    default:
      return state;
  }
}

var urlStateReducer = function (regularUrlStateReducer) {
  return function (state, action) {
    switch (action.type) {
      case '@@urlenhancer/updateURLState':
        return action.urlState;
      default:
        return regularUrlStateReducer(state, action);
    }
  };
}((0, _redux.combineReducers)({
  dataSource: dataSource,
  hash: hash,
  profileURL: profileURL,
  selectedTab: selectedTab,
  rangeFilters: rangeFilters,
  selectedThread: selectedThread,
  callTreeSearchString: callTreeSearchString,
  callTreeFilters: callTreeFilters,
  implementation: implementation,
  invertCallstack: invertCallstack,
  hidePlatformDetails: hidePlatformDetails,
  threadOrder: threadOrder,
  hiddenThreads: hiddenThreads
}));
exports.default = urlStateReducer;


var getURLState = function getURLState(state) {
  return state.urlState;
};

var getDataSource = exports.getDataSource = function getDataSource(state) {
  return getURLState(state).dataSource;
};
var getHash = exports.getHash = function getHash(state) {
  return getURLState(state).hash;
};
var getProfileURL = exports.getProfileURL = function getProfileURL(state) {
  return getURLState(state).profileURL;
};
var getRangeFilters = exports.getRangeFilters = function getRangeFilters(state) {
  return getURLState(state).rangeFilters;
};
var getImplementationFilter = exports.getImplementationFilter = function getImplementationFilter(state) {
  return getURLState(state).implementation;
};
var getHidePlatformDetails = exports.getHidePlatformDetails = function getHidePlatformDetails(state) {
  return getURLState(state).hidePlatformDetails;
};
var getInvertCallstack = exports.getInvertCallstack = function getInvertCallstack(state) {
  return getURLState(state).invertCallstack;
};
var getSearchString = exports.getSearchString = function getSearchString(state) {
  return getURLState(state).callTreeSearchString;
};
var getSelectedTab = exports.getSelectedTab = function getSelectedTab(state) {
  return getURLState(state).selectedTab;
};
var getSelectedThreadIndex = exports.getSelectedThreadIndex = function getSelectedThreadIndex(state) {
  return getURLState(state).selectedThread;
};
var getCallTreeFilters = exports.getCallTreeFilters = function getCallTreeFilters(state, threadIndex) {
  return getURLState(state).callTreeFilters[threadIndex] || [];
};
var getThreadOrder = exports.getThreadOrder = function getThreadOrder(state) {
  return getURLState(state).threadOrder;
};
var getHiddenThreads = exports.getHiddenThreads = function getHiddenThreads(state) {
  return getURLState(state).hiddenThreads;
};
var getVisibleThreadOrder = exports.getVisibleThreadOrder = (0, _reselect.createSelector)(getThreadOrder, getHiddenThreads, function (threadOrder, hiddenThreads) {
  return threadOrder.filter(function (index) {
    return !hiddenThreads.includes(index);
  });
});
var getURLPredictor = exports.getURLPredictor = (0, _reselect.createSelector)(getURLState, function (oldURLState) {
  return function (actionOrActionList) {
    var actionList = 'type' in actionOrActionList ? [actionOrActionList] : actionOrActionList;
    var newURLState = actionList.reduce(urlStateReducer, oldURLState);
    return (0, _urlHandling.urlFromState)(newURLState);
  };
});

var getRangeFilterLabels = exports.getRangeFilterLabels = (0, _reselect.createSelector)(getRangeFilters, RangeFilters.getRangeFilterLabels);