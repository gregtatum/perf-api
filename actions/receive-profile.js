'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _taggedTemplateLiteral2 = require('babel-runtime/helpers/taggedTemplateLiteral');

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var getProfileFromAddon = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(dispatch, geckoProfiler) {
    var rawGeckoProfile, profile;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dispatch(waitingForProfileFromAddon());

            // XXX update state to show that we're connected to the profiler addon
            _context.next = 3;
            return geckoProfiler.getProfile();

          case 3:
            rawGeckoProfile = _context.sent;
            profile = (0, _processProfile.processProfile)(_unpackGeckoProfileFromAddon(rawGeckoProfile));

            dispatch(receiveProfileFromAddon(profile));

            return _context.abrupt('return', profile);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getProfileFromAddon(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var getSymbolStore = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(dispatch, geckoProfiler) {
    var _this2 = this;

    var symbolStore;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            symbolStore = new _symbolStore.SymbolStore('perf-html-async-storage', {
              requestSymbolTable: function () {
                var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(debugName, breakpadId) {
                  var requestedLib, symbolTable;
                  return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          requestedLib = { debugName: debugName, breakpadId: breakpadId };

                          dispatch(requestingSymbolTable(requestedLib));
                          _context2.prev = 2;
                          _context2.next = 5;
                          return geckoProfiler.getSymbolTable(debugName, breakpadId);

                        case 5:
                          symbolTable = _context2.sent;

                          dispatch(receivedSymbolTableReply(requestedLib));
                          return _context2.abrupt('return', symbolTable);

                        case 10:
                          _context2.prev = 10;
                          _context2.t0 = _context2['catch'](2);

                          dispatch(receivedSymbolTableReply(requestedLib));
                          throw _context2.t0;

                        case 14:
                        case 'end':
                          return _context2.stop();
                      }
                    }
                  }, _callee2, _this2, [[2, 10]]);
                }));

                function requestSymbolTable(_x5, _x6) {
                  return _ref3.apply(this, arguments);
                }

                return requestSymbolTable;
              }()
            });
            return _context3.abrupt('return', symbolStore);

          case 2:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getSymbolStore(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

var doSymbolicateProfile = function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(dispatch, profile, symbolStore) {
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            dispatch(startSymbolicating());
            _context4.next = 3;
            return (0, _symbolication.symbolicateProfile)(profile, symbolStore, {
              onMergeFunctions: function onMergeFunctions(threadIndex, oldFuncToNewFuncMap) {
                dispatch(mergeFunctions(threadIndex, oldFuncToNewFuncMap));
              },
              onGotFuncNames: function onGotFuncNames(threadIndex, funcIndices, funcNames) {
                dispatch(assignFunctionNames(threadIndex, funcIndices, funcNames));
              },
              onGotTaskTracerNames: function onGotTaskTracerNames(addressIndices, symbolNames) {
                dispatch(assignTaskTracerNames(addressIndices, symbolNames));
              }
            });

          case 3:
            _context4.next = 5;
            return gCoalescedFunctionsUpdateDispatcher.scheduledUpdatesDone;

          case 5:

            dispatch(doneSymbolicating());

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function doSymbolicateProfile(_x7, _x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Tries to fetch a profile on `url`. If the profile is not found,
 * `onTemporaryError` is called with an appropriate error, we wait 1 second, and
 * then tries again. If we still can't find the profile after 11 tries, the
 * returned promise is rejected with a fatal error.
 * If we can retrieve the profile properly, the returned promise is resolved
 * with the JSON.parsed profile.
 */
var _fetchProfile = function () {
  var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(_ref8) {
    var url = _ref8.url,
        onTemporaryError = _ref8.onTemporaryError;
    var MAX_WAIT_SECONDS, i, response, json;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            MAX_WAIT_SECONDS = 10;
            i = 0;

          case 2:
            if (!true) {
              _context6.next = 20;
              break;
            }

            _context6.next = 5;
            return fetch(url);

          case 5:
            response = _context6.sent;

            if (!response.ok) {
              _context6.next = 11;
              break;
            }

            _context6.next = 9;
            return response.json();

          case 9:
            json = _context6.sent;
            return _context6.abrupt('return', json);

          case 11:
            if (!(response.status !== 404)) {
              _context6.next = 13;
              break;
            }

            throw new Error((0, _commonTags.oneLine)(_templateObject2, response.status, response.statusText));

          case 13:
            if (!(i++ === MAX_WAIT_SECONDS)) {
              _context6.next = 15;
              break;
            }

            return _context6.abrupt('break', 20);

          case 15:

            onTemporaryError(new _errors.TemporaryError('Profile not found on remote server.', { count: i, total: MAX_WAIT_SECONDS + 1 // 11 tries during 10 seconds
            }));

            _context6.next = 18;
            return _wait(1000);

          case 18:
            _context6.next = 2;
            break;

          case 20:
            throw new Error((0, _commonTags.oneLine)(_templateObject3, MAX_WAIT_SECONDS));

          case 21:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function _fetchProfile(_x11) {
    return _ref9.apply(this, arguments);
  };
}();

var _templateObject = (0, _taggedTemplateLiteral3.default)(['\n            We were unable to connect to the Gecko profiler add-on within thirty seconds.\n            This might be because the profile is big or your machine is slower than usual.\n            Still waiting...\n          '], ['\n            We were unable to connect to the Gecko profiler add-on within thirty seconds.\n            This might be because the profile is big or your machine is slower than usual.\n            Still waiting...\n          ']),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(['\n        Could not fetch the profile on remote server.\n        Response was: ', ' ', '.\n      '], ['\n        Could not fetch the profile on remote server.\n        Response was: ', ' ', '.\n      ']),
    _templateObject3 = (0, _taggedTemplateLiteral3.default)(['\n    Could not fetch the profile on remote server:\n    still not found after ', ' seconds.\n  '], ['\n    Could not fetch the profile on remote server:\n    still not found after ', ' seconds.\n  ']); /* This Source Code Form is subject to the terms of the Mozilla Public
                                                                                                                                                                                                                                                                          * License, v. 2.0. If a copy of the MPL was not distributed with this
                                                                                                                                                                                                                                                                          * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.waitingForProfileFromAddon = waitingForProfileFromAddon;
exports.receiveProfileFromAddon = receiveProfileFromAddon;
exports.requestingSymbolTable = requestingSymbolTable;
exports.receivedSymbolTableReply = receivedSymbolTableReply;
exports.startSymbolicating = startSymbolicating;
exports.doneSymbolicating = doneSymbolicating;
exports.coalescedFunctionsUpdate = coalescedFunctionsUpdate;
exports.mergeFunctions = mergeFunctions;
exports.assignFunctionNames = assignFunctionNames;
exports.assignTaskTracerNames = assignTaskTracerNames;
exports.temporaryErrorReceivingProfileFromAddon = temporaryErrorReceivingProfileFromAddon;
exports.fatalErrorReceivingProfileFromAddon = fatalErrorReceivingProfileFromAddon;
exports.retrieveProfileFromAddon = retrieveProfileFromAddon;
exports.waitingForProfileFromStore = waitingForProfileFromStore;
exports.waitingForProfileFromUrl = waitingForProfileFromUrl;
exports.receiveProfileFromStore = receiveProfileFromStore;
exports.receiveProfileFromUrl = receiveProfileFromUrl;
exports.temporaryErrorReceivingProfileFromStore = temporaryErrorReceivingProfileFromStore;
exports.fatalErrorReceivingProfileFromStore = fatalErrorReceivingProfileFromStore;
exports.temporaryErrorReceivingProfileFromUrl = temporaryErrorReceivingProfileFromUrl;
exports.fatalErrorReceivingProfileFromUrl = fatalErrorReceivingProfileFromUrl;
exports.retrieveProfileFromStore = retrieveProfileFromStore;
exports.retrieveProfileFromUrl = retrieveProfileFromUrl;
exports.waitingForProfileFromFile = waitingForProfileFromFile;
exports.receiveProfileFromFile = receiveProfileFromFile;
exports.errorReceivingProfileFromFile = errorReceivingProfileFromFile;
exports.retrieveProfileFromFile = retrieveProfileFromFile;

var _commonTags = require('common-tags');

var _profileView = require('../reducers/profile-view');

var _processProfile = require('../profile-logic/process-profile');

var _symbolStore = require('../profile-logic/symbol-store');

var _symbolication = require('../profile-logic/symbolication');

var _gz = require('../utils/gz');

var _profileData = require('../profile-logic/profile-data');

var _errors = require('../utils/errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This file collects all the actions that are used for receiving the profile in the
 * client and getting it into the processed format.
 */

function waitingForProfileFromAddon() {
  return {
    type: 'WAITING_FOR_PROFILE_FROM_ADDON'
  };
}

function receiveProfileFromAddon(profile) {
  return {
    type: 'RECEIVE_PROFILE_FROM_ADDON',
    profile: profile
  };
}

function requestingSymbolTable(requestedLib) {
  return {
    type: 'REQUESTING_SYMBOL_TABLE',
    requestedLib: requestedLib
  };
}

function receivedSymbolTableReply(requestedLib) {
  return {
    type: 'RECEIVED_SYMBOL_TABLE_REPLY',
    requestedLib: requestedLib
  };
}

function startSymbolicating() {
  return {
    type: 'START_SYMBOLICATING'
  };
}

function doneSymbolicating() {
  return function (dispatch, getState) {
    dispatch({ type: 'DONE_SYMBOLICATING' });

    // TODO - Do not use selectors here.
    dispatch({
      toWorker: true,
      type: 'PROFILE_PROCESSED',
      profile: (0, _profileView.getProfile)(getState())
    });

    dispatch({
      toWorker: true,
      type: 'SUMMARIZE_PROFILE'
    });
  };
}

function coalescedFunctionsUpdate(functionsUpdatePerThread) {
  return {
    type: 'COALESCED_FUNCTIONS_UPDATE',
    functionsUpdatePerThread: functionsUpdatePerThread
  };
}

var requestIdleCallbackPolyfill = (typeof window === 'undefined' ? 'undefined' : (0, _typeof3.default)(window)) === 'object' && window.requestIdleCallback ? window.requestIdleCallback : function (callback) {
  return setTimeout(callback, 0);
};

var ColascedFunctionsUpdateDispatcher = function () {
  function ColascedFunctionsUpdateDispatcher() {
    (0, _classCallCheck3.default)(this, ColascedFunctionsUpdateDispatcher);

    this._updates = {};
    this._requestedUpdate = false;
    this._requestIdleTimeout = { timeout: 2000 };
    this.scheduledUpdatesDone = Promise.resolve();
  }

  (0, _createClass3.default)(ColascedFunctionsUpdateDispatcher, [{
    key: '_scheduleUpdate',
    value: function _scheduleUpdate(dispatch) {
      var _this = this;

      // Only request an update if one hasn't already been schedule.
      if (!this._requestedUpdate) {
        // Let any consumers of this class be able to know when all scheduled updates
        // are done.
        this.scheduledUpdatesDone = new Promise(function (resolve) {
          requestIdleCallbackPolyfill(function () {
            _this._dispatchUpdate(dispatch);
            resolve();
          }, _this._requestIdleTimeout);
        });
        this._requestedUpdate = true;
      }
    }
  }, {
    key: '_dispatchUpdate',
    value: function _dispatchUpdate(dispatch) {
      var updates = this._updates;
      this._updates = {};
      this._requestedUpdate = false;
      dispatch(coalescedFunctionsUpdate(updates));
    }
  }, {
    key: 'mergeFunctions',
    value: function mergeFunctions(dispatch, threadIndex, oldFuncToNewFuncMap) {
      this._scheduleUpdate(dispatch);
      if (!this._updates[threadIndex]) {
        this._updates[threadIndex] = {
          oldFuncToNewFuncMap: oldFuncToNewFuncMap,
          funcIndices: [],
          funcNames: []
        };
      } else {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = oldFuncToNewFuncMap.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var oldFunc = _step.value;

            var funcIndex = oldFuncToNewFuncMap.get(oldFunc);
            if (funcIndex === undefined) {
              throw new Error('Unable to merge functions together, an undefined funcIndex was returned.');
            }
            this._updates[threadIndex].oldFuncToNewFuncMap.set(oldFunc, funcIndex);
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
    }
  }, {
    key: 'assignFunctionNames',
    value: function assignFunctionNames(dispatch, threadIndex, funcIndices, funcNames) {
      this._scheduleUpdate(dispatch);
      if (!this._updates[threadIndex]) {
        this._updates[threadIndex] = {
          funcIndices: funcIndices,
          funcNames: funcNames,
          oldFuncToNewFuncMap: new Map()
        };
      } else {
        this._updates[threadIndex].funcIndices = this._updates[threadIndex].funcIndices.concat(funcIndices);
        this._updates[threadIndex].funcNames = this._updates[threadIndex].funcNames.concat(funcNames);
      }
    }
  }]);
  return ColascedFunctionsUpdateDispatcher;
}();

var gCoalescedFunctionsUpdateDispatcher = new ColascedFunctionsUpdateDispatcher();

function mergeFunctions(threadIndex, oldFuncToNewFuncMap) {
  return function (dispatch) {
    gCoalescedFunctionsUpdateDispatcher.mergeFunctions(dispatch, threadIndex, oldFuncToNewFuncMap);
  };
}

function assignFunctionNames(threadIndex, funcIndices, funcNames) {
  return function (dispatch) {
    gCoalescedFunctionsUpdateDispatcher.assignFunctionNames(dispatch, threadIndex, funcIndices, funcNames);
  };
}

function assignTaskTracerNames(addressIndices, symbolNames) {
  return {
    type: 'ASSIGN_TASK_TRACER_NAMES',
    addressIndices: addressIndices,
    symbolNames: symbolNames
  };
}

/**
 * If the profile object we got from the add-on is an ArrayBuffer, convert it
 * to a gecko profile object by parsing the JSON.
 */
function _unpackGeckoProfileFromAddon(profile) {
  if (profile instanceof ArrayBuffer) {
    var textDecoder = new TextDecoder();
    return JSON.parse(textDecoder.decode(profile));
  }
  return profile;
}

function temporaryErrorReceivingProfileFromAddon(error) {
  return {
    type: 'TEMPORARY_ERROR_RECEIVING_PROFILE_FROM_ADDON',
    error: error
  };
}

function fatalErrorReceivingProfileFromAddon(error) {
  return {
    type: 'FATAL_ERROR_RECEIVING_PROFILE_FROM_ADDON',
    error: error
  };
}

function retrieveProfileFromAddon() {
  var _this3 = this;

  return function () {
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(dispatch) {
      var timeoutId, geckoProfiler, _ref6, _ref7, profile, symbolStore;

      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              timeoutId = setTimeout(function () {
                dispatch(temporaryErrorReceivingProfileFromAddon(new _errors.TemporaryError((0, _commonTags.oneLine)(_templateObject))));
              }, 30000);
              _context5.next = 4;
              return window.geckoProfilerPromise;

            case 4:
              geckoProfiler = _context5.sent;

              clearTimeout(timeoutId);

              _context5.next = 8;
              return Promise.all([getProfileFromAddon(dispatch, geckoProfiler), getSymbolStore(dispatch, geckoProfiler)]);

            case 8:
              _ref6 = _context5.sent;
              _ref7 = (0, _slicedToArray3.default)(_ref6, 2);
              profile = _ref7[0];
              symbolStore = _ref7[1];
              _context5.next = 14;
              return doSymbolicateProfile(dispatch, profile, symbolStore);

            case 14:
              _context5.next = 20;
              break;

            case 16:
              _context5.prev = 16;
              _context5.t0 = _context5['catch'](0);

              dispatch(fatalErrorReceivingProfileFromAddon(_context5.t0));
              throw _context5.t0;

            case 20:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this3, [[0, 16]]);
    }));

    return function (_x10) {
      return _ref5.apply(this, arguments);
    };
  }();
}

function waitingForProfileFromStore() {
  return {
    type: 'WAITING_FOR_PROFILE_FROM_STORE'
  };
}

function waitingForProfileFromUrl() {
  return {
    type: 'WAITING_FOR_PROFILE_FROM_URL'
  };
}

function receiveProfileFromStore(profile) {
  return function (dispatch) {
    dispatch({
      type: 'RECEIVE_PROFILE_FROM_STORE',
      profile: profile
    });
    dispatch({
      toWorker: true,
      type: 'PROFILE_PROCESSED',
      profile: profile
    });
    dispatch({
      toWorker: true,
      type: 'SUMMARIZE_PROFILE'
    });
  };
}

function receiveProfileFromUrl(profile) {
  return function (dispatch) {
    dispatch({
      type: 'RECEIVE_PROFILE_FROM_URL',
      profile: profile
    });
    dispatch({
      toWorker: true,
      type: 'PROFILE_PROCESSED',
      profile: profile
    });
    dispatch({
      toWorker: true,
      type: 'SUMMARIZE_PROFILE'
    });
  };
}

function temporaryErrorReceivingProfileFromStore(error) {
  return {
    type: 'TEMPORARY_ERROR_RECEIVING_PROFILE_FROM_STORE',
    error: error
  };
}

function fatalErrorReceivingProfileFromStore(error) {
  return {
    type: 'FATAL_ERROR_RECEIVING_PROFILE_FROM_STORE',
    error: error
  };
}

function temporaryErrorReceivingProfileFromUrl(error) {
  return {
    type: 'TEMPORARY_ERROR_RECEIVING_PROFILE_FROM_URL',
    error: error
  };
}

function fatalErrorReceivingProfileFromUrl(error) {
  return {
    type: 'FATAL_ERROR_RECEIVING_PROFILE_FROM_URL',
    error: error
  };
}

function _wait(delayMs) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, delayMs);
  });
}

function retrieveProfileFromStore(hash) {
  return function () {
    var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(dispatch) {
      var serializedProfile, profile, zeroAt;
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              dispatch(waitingForProfileFromStore());

              _context7.prev = 1;
              _context7.next = 4;
              return _fetchProfile({
                url: 'https://profile-store.commondatastorage.googleapis.com/' + hash,
                onTemporaryError: function onTemporaryError(e) {
                  dispatch(temporaryErrorReceivingProfileFromStore(e));
                }
              });

            case 4:
              serializedProfile = _context7.sent;
              profile = (0, _processProfile.unserializeProfileOfArbitraryFormat)(serializedProfile);

              if (!(profile === undefined)) {
                _context7.next = 8;
                break;
              }

              throw new Error('Unable to parse the profile.');

            case 8:

              if (typeof window !== 'undefined' && window.legacyRangeFilters) {
                zeroAt = (0, _profileData.getTimeRangeIncludingAllThreads)(profile).start;

                window.legacyRangeFilters.forEach(function (_ref11) {
                  var start = _ref11.start,
                      end = _ref11.end;
                  return dispatch({
                    type: 'ADD_RANGE_FILTER',
                    start: start - zeroAt,
                    end: end - zeroAt
                  });
                });
              }

              dispatch(receiveProfileFromStore(profile));
              _context7.next = 15;
              break;

            case 12:
              _context7.prev = 12;
              _context7.t0 = _context7['catch'](1);

              dispatch(fatalErrorReceivingProfileFromStore(_context7.t0));

            case 15:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, this, [[1, 12]]);
    }));

    return function (_x12) {
      return _ref10.apply(this, arguments);
    };
  }();
}

function retrieveProfileFromUrl(profileURL) {
  return function () {
    var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(dispatch) {
      var serializedProfile, profile, zeroAt;
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              dispatch(waitingForProfileFromUrl());

              _context8.prev = 1;
              _context8.next = 4;
              return _fetchProfile({
                url: profileURL,
                onTemporaryError: function onTemporaryError(e) {
                  dispatch(temporaryErrorReceivingProfileFromUrl(e));
                }
              });

            case 4:
              serializedProfile = _context8.sent;
              profile = (0, _processProfile.unserializeProfileOfArbitraryFormat)(serializedProfile);

              if (!(profile === undefined)) {
                _context8.next = 8;
                break;
              }

              throw new Error('Unable to parse the profile.');

            case 8:

              if (typeof window !== 'undefined' && window.legacyRangeFilters) {
                zeroAt = (0, _profileData.getTimeRangeIncludingAllThreads)(profile).start;

                window.legacyRangeFilters.forEach(function (_ref13) {
                  var start = _ref13.start,
                      end = _ref13.end;
                  return dispatch({
                    type: 'ADD_RANGE_FILTER',
                    start: start - zeroAt,
                    end: end - zeroAt
                  });
                });
              }

              dispatch(receiveProfileFromUrl(profile));
              _context8.next = 15;
              break;

            case 12:
              _context8.prev = 12;
              _context8.t0 = _context8['catch'](1);

              dispatch(fatalErrorReceivingProfileFromUrl(_context8.t0));

            case 15:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, this, [[1, 12]]);
    }));

    return function (_x13) {
      return _ref12.apply(this, arguments);
    };
  }();
}

function waitingForProfileFromFile() {
  return {
    type: 'WAITING_FOR_PROFILE_FROM_FILE'
  };
}

function receiveProfileFromFile(profile) {
  return function (dispatch) {
    dispatch({
      type: 'RECEIVE_PROFILE_FROM_FILE',
      profile: profile
    });
    dispatch({
      toWorker: true,
      type: 'PROFILE_PROCESSED',
      profile: profile
    });
    dispatch({
      toWorker: true,
      type: 'SUMMARIZE_PROFILE'
    });
  };
}

function errorReceivingProfileFromFile(error) {
  return {
    type: 'ERROR_RECEIVING_PROFILE_FROM_FILE',
    error: error
  };
}

function _fileReader(input) {
  var reader = new FileReader();
  var promise = new Promise(function (resolve, reject) {
    reader.onload = function () {
      return resolve(reader.result);
    };
    reader.onerror = function () {
      return reject(reader.error);
    };
  });

  return {
    asText: function asText() {
      reader.readAsText(input);
      return promise;
    },
    asArrayBuffer: function asArrayBuffer() {
      reader.readAsArrayBuffer(input);
      return promise;
    }
  };
}

function retrieveProfileFromFile(file) {
  var _this4 = this;

  return function () {
    var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(dispatch) {
      var text, profile, buffer, arrayBuffer, decompressedArrayBuffer, textDecoder, _text, _profile;

      return _regenerator2.default.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              dispatch(waitingForProfileFromFile());

              _context9.prev = 1;
              _context9.next = 4;
              return _fileReader(file).asText();

            case 4:
              text = _context9.sent;
              profile = (0, _processProfile.unserializeProfileOfArbitraryFormat)(text);

              if (!(profile === undefined)) {
                _context9.next = 8;
                break;
              }

              throw new Error('Unable to parse the profile.');

            case 8:

              dispatch(receiveProfileFromFile(profile));
              return _context9.abrupt('return');

            case 12:
              _context9.prev = 12;
              _context9.t0 = _context9['catch'](1);

            case 14:
              _context9.prev = 14;
              _context9.next = 17;
              return _fileReader(file).asArrayBuffer();

            case 17:
              buffer = _context9.sent;
              arrayBuffer = new Uint8Array(buffer);
              _context9.next = 21;
              return (0, _gz.decompress)(arrayBuffer);

            case 21:
              decompressedArrayBuffer = _context9.sent;
              textDecoder = new TextDecoder();
              _context9.next = 25;
              return textDecoder.decode(decompressedArrayBuffer);

            case 25:
              _text = _context9.sent;
              _profile = (0, _processProfile.unserializeProfileOfArbitraryFormat)(_text);

              if (!(_profile === undefined)) {
                _context9.next = 29;
                break;
              }

              throw new Error('Unable to parse the profile.');

            case 29:

              dispatch(receiveProfileFromFile(_profile));
              _context9.next = 35;
              break;

            case 32:
              _context9.prev = 32;
              _context9.t1 = _context9['catch'](14);

              dispatch(errorReceivingProfileFromFile(_context9.t1));

            case 35:
            case 'end':
              return _context9.stop();
          }
        }
      }, _callee9, _this4, [[1, 12], [14, 32]]);
    }));

    return function (_x14) {
      return _ref14.apply(this, arguments);
    };
  }();
}