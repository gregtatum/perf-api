'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.urlFromState = urlFromState;
exports.stateFromLocation = stateFromLocation;

var _queryString = require('query-string');

var _queryString2 = _interopRequireDefault(_queryString);

var _rangeFilters = require('./profile-logic/range-filters');

var _callTreeFilters2 = require('./profile-logic/call-tree-filters');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// {
//   // general:
//   dataSource: 'from-addon', 'from-file', 'local', 'public',
//   hash: '' or 'aoeurschsaoeuch',
//   selectedTab: 'summary' or 'calltree' or ...,
//   rangeFilters: [] or [{ start, end }, ...],
//   selectedThread: 0 or 1 or ...,
//
//   // only when selectedTab === 'calltree':
//   callTreeSearchString: '' or '::RunScript' or ...,
//   callTreeFilters: [[], [{type:'prefix', matchJSOnly:true, prefixFuncs:[1,3,7]}, {}, ...], ...], // one per thread
//   jsOnly: false or true,
//   invertCallstack: false or true,
// }

function dataSourceDirs(urlState) {
  var dataSource = urlState.dataSource;

  switch (dataSource) {
    case 'from-addon':
      return ['from-addon'];
    case 'from-file':
      return ['from-file'];
    case 'local':
      return ['local', urlState.hash];
    case 'public':
      return ['public', urlState.hash];
    case 'from-url':
      return ['from-url', encodeURIComponent(urlState.profileURL)];
    default:
      return [];
  }
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function urlFromState(urlState) {
  var dataSource = urlState.dataSource;

  if (dataSource === 'none') {
    return '/';
  }
  var pathname = '/' + [].concat((0, _toConsumableArray3.default)(dataSourceDirs(urlState)), [urlState.selectedTab]).join('/') + '/';

  // Start with the query parameters that are shown regardless of the active tab.
  var query = {
    range: (0, _rangeFilters.stringifyRangeFilters)(urlState.rangeFilters) || undefined,
    thread: '' + urlState.selectedThread,
    threadOrder: urlState.threadOrder.join('-'),
    hiddenThreads: urlState.hiddenThreads.join('-')
  };

  if (process.env.NODE_ENV === 'development') {
    /* eslint-disable camelcase */
    query.react_perf = null;
    /* eslint-enable camelcase */
  }

  // Depending on which tab is active, also show tab-specific query parameters.
  switch (urlState.selectedTab) {
    case 'calltree':
      query.search = urlState.callTreeSearchString || undefined;
      query.invertCallstack = urlState.invertCallstack ? null : undefined;
      query.implementation = urlState.implementation === 'combined' ? undefined : urlState.implementation;
      query.callTreeFilters = (0, _callTreeFilters2.stringifyCallTreeFilters)(urlState.callTreeFilters[urlState.selectedThread]) || undefined;
      break;
    case 'timeline':
      query.search = urlState.callTreeSearchString || undefined;
      query.invertCallstack = urlState.invertCallstack ? null : undefined;
      query.hidePlatformDetails = urlState.hidePlatformDetails ? null : undefined;
      break;
    default:
  }
  var qString = _queryString2.default.stringify(query);
  return pathname + (qString ? '?' + qString : '');
}

function toDataSourceEnum(str) {
  // With this switch, flow is able to understand that we return a valid value
  switch (str) {
    case 'none':
    case 'from-addon':
    case 'from-file':
    case 'local':
    case 'public':
    case 'from-url':
      return str;
    default:
      throw new Error('Unexpected data source ' + str);
  }
}

/**
 * Define only the properties of the window.location object that the function uses
 * so that it can be mocked in tests.
 */
function stateFromLocation(location) {
  var pathname = location.pathname;
  var qString = location.search.substr(1);
  var hash = location.hash;
  var query = _queryString2.default.parse(qString);

  if (pathname === '/') {
    var legacyQuery = Object.assign({}, query, _queryString2.default.parse(hash));
    if ('report' in legacyQuery) {
      if ('filter' in legacyQuery) {
        var filters = JSON.parse(legacyQuery.filter);
        // We can't convert these parameters to the new URL parameters here
        // because they're relative to different things - the legacy range
        // filters were relative to profile.meta.startTime, and the new
        // rangeFilters param is relative to
        // getTimeRangeIncludingAllThreads(profile).start.
        // So we stuff this information into a global here, and then later,
        // once we have the profile, we convert that information into URL params
        // again. This is not pretty.
        window.legacyRangeFilters = filters.filter(function (f) {
          return f.type === 'RangeSampleFilter';
        }).map(function (_ref) {
          var start = _ref.start,
              end = _ref.end;
          return { start: start, end: end };
        });
      }
      return {
        dataSource: 'public',
        hash: legacyQuery.report,
        profileURL: '',
        selectedTab: 'calltree',
        rangeFilters: [],
        selectedThread: 0,
        callTreeSearchString: '',
        callTreeFilters: {},
        implementation: 'combined',
        invertCallstack: false,
        hidePlatformDetails: false,
        threadOrder: [],
        hiddenThreads: []
      };
    }
  }

  var dirs = pathname.split('/').filter(function (d) {
    return d;
  });
  var dataSource = toDataSourceEnum(dirs[0] || 'none');

  var needHash = ['local', 'public'].includes(dataSource);
  var needProfileURL = ['from-url'].includes(dataSource);
  var selectedThread = query.thread !== undefined ? +query.thread : 0;

  var implementation = 'combined';
  if (query.implementation === 'js' || query.implementation === 'cpp') {
    implementation = query.implementation;
  } else if (query.jsOnly !== undefined) {
    // Support the old URL structure that had a jsOnly flag.
    implementation = 'js';
  }

  return {
    dataSource: dataSource,
    hash: needHash ? dirs[1] : '',
    profileURL: needProfileURL ? decodeURIComponent(dirs[1]) : '',
    selectedTab: (needHash || needProfileURL ? dirs[2] : dirs[1]) || 'calltree',
    rangeFilters: query.range ? (0, _rangeFilters.parseRangeFilters)(query.range) : [],
    selectedThread: selectedThread,
    callTreeSearchString: query.search || '',
    callTreeFilters: (0, _defineProperty3.default)({}, selectedThread, query.callTreeFilters ? (0, _callTreeFilters2.parseCallTreeFilters)(query.callTreeFilters) : []),
    implementation: implementation,
    invertCallstack: query.invertCallstack !== undefined,
    hidePlatformDetails: query.hidePlatformDetails !== undefined,
    hiddenThreads: query.hiddenThreads ? query.hiddenThreads.split('-').map(function (index) {
      return Number(index);
    }) : [],
    threadOrder: query.threadOrder ? query.threadOrder.split('-').map(function (index) {
      return Number(index);
    }) : []
  };
}