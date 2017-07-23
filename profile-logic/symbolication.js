'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * Symbolicate the given thread. Calls the symbolication handlers `onMergeFunctions`
 * and `onGotFuncNames` after each bit of symbolication, and resolves the returned
 * promise once completely done.
 */
var symbolicateThread = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(thread, threadIndex, symbolStore, symbolicationHandlers) {
    var foundFuncMap;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            foundFuncMap = gatherFuncsInThread(thread);
            _context.next = 3;
            return Promise.all(Array.from(foundFuncMap).map(function (_ref2) {
              var _ref3 = (0, _slicedToArray3.default)(_ref2, 2),
                  lib = _ref3[0],
                  funcsToSymbolicate = _ref3[1];

              // lib is a lib object from thread.libs.
              // funcsToSymbolicate is an array of funcIndex.
              return symbolStore.getFuncAddressTableForLib(lib).then(function (funcAddressTable) {
                // We now have the func address table for lib. This lets us merge funcs
                // that are actually the same function.
                // We don't have any symbols yet. We'll request those after we've merged
                // the functions.
                var _findFunctionsToMerge = findFunctionsToMergeAndSymbolicationAddresses(funcAddressTable, funcsToSymbolicate, thread.funcTable),
                    funcAddrIndices = _findFunctionsToMerge.funcAddrIndices,
                    funcIndices = _findFunctionsToMerge.funcIndices,
                    oldFuncToNewFuncMap = _findFunctionsToMerge.oldFuncToNewFuncMap;

                symbolicationHandlers.onMergeFunctions(threadIndex, oldFuncToNewFuncMap);

                // Now list the func addresses that we want symbols for, and request them.
                return symbolStore.getSymbolsForAddressesInLib(funcAddrIndices, lib).then(function (funcNames) {
                  symbolicationHandlers.onGotFuncNames(threadIndex, funcIndices, funcNames);
                });
              }).catch(function () {
                // We could not find symbols for this library.
                // Don't throw, so that the resulting promise will be resolved, thereby
                // indicating that we're done symbolicating with lib.
              });
            }));

          case 3:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function symbolicateThread(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

var symbolicateTaskTracer = function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(tasktracer, symbolStore, symbolicationHandlers) {
    var addressTable, addressIndicesByLib;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            addressTable = tasktracer.addressTable, addressIndicesByLib = tasktracer.addressIndicesByLib;
            _context2.next = 3;
            return Promise.all(Array.from(addressIndicesByLib).map(function (_ref5) {
              var _ref6 = (0, _slicedToArray3.default)(_ref5, 2),
                  lib = _ref6[0],
                  addressIndices = _ref6[1];

              return symbolStore.getFuncAddressTableForLib(lib).then(function (funcAddressTable) {
                addressIndices.sort(function (a, b) {
                  return addressTable.address[a] - addressTable.address[b];
                });
                var funcAddrIndices = [];
                var addressIndicesToSymbolicate = [];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                  for (var _iterator2 = addressIndices[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var addressIndex = _step2.value;

                    var address = addressTable.address[addressIndex];
                    var funcAddressIndex = _bisection2.default.right(funcAddressTable, address, 0) - 1;
                    if (funcAddressIndex >= 0) {
                      funcAddrIndices.push(funcAddressIndex);
                      addressIndicesToSymbolicate.push(addressIndex);
                    }
                  }
                } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                      _iterator2.return();
                    }
                  } finally {
                    if (_didIteratorError2) {
                      throw _iteratorError2;
                    }
                  }
                }

                return symbolStore.getSymbolsForAddressesInLib(funcAddrIndices, lib).then(function (symbolNames) {
                  symbolicationHandlers.onGotTaskTracerNames(addressIndicesToSymbolicate, symbolNames);
                });
              });
            }));

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function symbolicateTaskTracer(_x5, _x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Modify certain known symbol names for cleaner presentations.
 */


exports.getContainingLibrary = getContainingLibrary;
exports.getClosestLibrary = getClosestLibrary;
exports.setFuncNames = setFuncNames;
exports.applyFunctionMerging = applyFunctionMerging;
exports.setTaskTracerNames = setTaskTracerNames;
exports.symbolicateProfile = symbolicateProfile;

var _bisection = require('bisection');

var _bisection2 = _interopRequireDefault(_bisection);

var _profileData = require('./profile-data');

var _immutableUpdate = require('../utils/immutable-update');

var _immutableUpdate2 = _interopRequireDefault(_immutableUpdate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Return the library object that contains the address such that
 * rv.start <= address < rv.end, or null if no such lib object exists.
 */
function getContainingLibrary(libs, address) {
  if (isNaN(address)) {
    return null;
  }

  var left = 0;
  var right = libs.length - 1;
  while (left <= right) {
    var mid = (left + right) / 2 | 0;
    if (address >= libs[mid].end) {
      left = mid + 1;
    } else if (address < libs[mid].start) {
      right = mid - 1;
    } else {
      return libs[mid];
    }
  }
  return null;
}

/**
 * Given a memory address, find the nearest library.
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


function getClosestLibrary(libs, address) {
  if (isNaN(address)) {
    return null;
  }

  var startAddresses = libs.map(function (lib) {
    return lib.start;
  });
  var libIndex = _bisection2.default.right(startAddresses, address, 0) - 1;
  if (libIndex < 0) {
    return null;
  }
  return libs[libIndex];
}

/**
 * Find the functions in this thread's funcTable that we need symbols for. The map
 * that is returned is keyed off the Lib objects, and has a list of IndexIntoFuncTable
 * for the still unsymbolicated functions.
 */
function gatherFuncsInThread(thread) {
  var libs = thread.libs,
      funcTable = thread.funcTable,
      stringTable = thread.stringTable,
      resourceTable = thread.resourceTable;

  var foundAddresses = new Map();
  for (var funcIndex = 0; funcIndex < funcTable.length; funcIndex++) {
    var resourceIndex = funcTable.resource[funcIndex];
    if (resourceIndex === -1) {
      continue;
    }
    var resourceType = resourceTable.type[resourceIndex];
    if (resourceType !== _profileData.resourceTypes.library) {
      continue;
    }

    var name = stringTable.getString(funcTable.name[funcIndex]);
    if (!name.startsWith('0x')) {
      // Somebody already symbolicated this function for us.
      continue;
    }

    var libIndex = resourceTable.lib[resourceIndex];
    if (libIndex === null || libIndex === undefined) {
      throw new Error('libIndex must be a valid index.');
    }
    var lib = libs[libIndex];
    if (lib === undefined) {
      throw new Error('Did not find a lib.');
    }
    var libFuncs = foundAddresses.get(lib);
    if (libFuncs === undefined) {
      libFuncs = [];
      foundAddresses.set(lib, libFuncs);
    }
    libFuncs.push(funcIndex);
  }
  return foundAddresses;
}

/**
 * Using the provided func address table, find out which funcs are actually the
 * same function, and make a list of the real func addresses that we need
 * symbols for.
 *
 * Before we had the func address table for this library, we weren't able to
 * tell whether two frames are the same function, so we naively created one
 * function per frame, giving each function the address of the frame.
 * Now that we know at which address each function truly starts, we can find
 * out which of the naively-created funcs are the same function and collapse
 * those into just one func. This information is returned in the
 * oldFuncToNewFuncMap.
 *
 * Before we can request symbols, we need to make a list of func addresses for
 * the symbols we need. These addresses need to be the true function start
 * addresses from the func address table. This information is returned in the
 * return value - the return value is a map whose keys are the true func
 * addresses that we need symbols for. The value of each map entry is the
 * funcIndex for the func that has become the "one true func" for this function.
 */
function findFunctionsToMergeAndSymbolicationAddresses(funcAddressTable, funcsToSymbolicate, funcTable) {
  var oldFuncToNewFuncMap = new Map();
  var funcAddrIndices = [];
  var funcIndices = [];

  // Sort funcsToSymbolicate by address.
  funcsToSymbolicate.sort(function (i1, i2) {
    var address1 = funcTable.address[i1];
    var address2 = funcTable.address[i2];
    if (address1 === address2) {
      // Two funcs had the same address? This shouldn't happen.
      return i1 - i2;
    }
    return address1 - address2;
  });

  var lastFuncIndex = -1;
  var nextFuncAddress = 0;
  var nextFuncAddressIndex = 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = funcsToSymbolicate[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var funcIndex = _step.value;

      var funcAddress = funcTable.address[funcIndex];
      if (funcAddress < nextFuncAddress) {
        // The address of the func at funcIndex is still inside the
        // lastFuncIndex func. So those are actually the same function.
        // Collapse them into each other.
        oldFuncToNewFuncMap.set(funcIndex, lastFuncIndex);
        continue;
      }

      // Now funcAddress >= nextFuncAddress.
      // Find the index in funcAddressTable of the function that funcAddress is
      // inside of.
      var funcAddressIndex = _bisection2.default.right(funcAddressTable, funcAddress, nextFuncAddressIndex) - 1;
      if (funcAddressIndex >= 0) {
        // TODO: Take realFuncAddress and put it into the func table.
        // const realFuncAddress = funcAddressTable[funcAddressIndex];
        nextFuncAddressIndex = funcAddressIndex + 1;
        nextFuncAddress = nextFuncAddressIndex < funcAddressTable.length ? funcAddressTable[nextFuncAddressIndex] : Infinity;
        lastFuncIndex = funcIndex;
        funcAddrIndices.push(funcAddressIndex);
        funcIndices.push(funcIndex);
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

  return { funcAddrIndices: funcAddrIndices, funcIndices: funcIndices, oldFuncToNewFuncMap: oldFuncToNewFuncMap };
}

/**
 * Modify the symbolicated funcs to point to the new func name strings.
 * This function adds the func names to the thread's string table and
 * adjusts the funcTable to point to those strings.
 */
function setFuncNames(thread, funcIndices, funcNames) {
  var funcTable = Object.assign({}, thread.funcTable);
  funcTable.name = funcTable.name.slice();
  var stringTable = thread.stringTable;
  funcIndices.forEach(function (funcIndex, i) {
    var symbolName = funcNames[i];
    var symbolIndex = stringTable.indexForString(symbolName);
    funcTable.name[funcIndex] = symbolIndex;
  });
  return Object.assign({}, thread, { funcTable: funcTable, stringTable: stringTable });
}

/**
 * Correctly collapse a function into another function and return a consistent
 * profile that no longer refers to the collapsed-away function.
 * The new frameTable has an updated func column, where all indices
 * to old funcs have been replaced to the corresponding new func.
 * "Functions" in a profile are created before the library's function table is
 * known, by creating one function per frame address. Once the function table
 * is known, different addresses that are inside the same function need to be
 * merged into that same function.
 */
function applyFunctionMerging(thread, oldFuncToNewFuncMap) {
  var frameTable = Object.assign({}, thread.frameTable, {
    func: thread.frameTable.func.map(function (oldFunc) {
      var newFunc = oldFuncToNewFuncMap.get(oldFunc);
      return newFunc === undefined ? oldFunc : newFunc;
    })
  });
  return Object.assign({}, thread, { frameTable: frameTable });
}function classNameFromSymbolName(symbolName) {
  var className = symbolName;

  var vtablePrefix = 'vtable for ';
  if (className.startsWith(vtablePrefix)) {
    className = className.substring(vtablePrefix.length);
  }

  var sourceEventMarkerPos = className.indexOf('SourceEventType)::CreateSourceEvent');
  if (sourceEventMarkerPos !== -1) {
    return className.substring(sourceEventMarkerPos + 'SourceEventType)::Create'.length);
  }

  var runnableFunctionMarker = 'mozilla::detail::RunnableFunction<';
  if (className.startsWith(runnableFunctionMarker)) {
    var parenPos = className.indexOf('(', runnableFunctionMarker.length + 1);
    var functionName = className.substring(runnableFunctionMarker.length, parenPos);
    return 'RunnableFunction(' + functionName + ')';
  }

  var runnableMethodMarker = 'mozilla::detail::RunnableMethodImpl<';
  if (className.startsWith(runnableMethodMarker)) {
    var _parenPos = className.indexOf('(', runnableMethodMarker.length);
    var endPos = className.indexOf('::*)', _parenPos + 1);
    className = className.substring(_parenPos + 1, endPos);
    return 'RunnableMethod(' + className + ')';
  }

  return className;
}

function setTaskTracerNames(tasktracer, addressIndices, symbolNames) {
  var stringTable = tasktracer.stringTable,
      addressTable = tasktracer.addressTable;

  var className = addressTable.className.slice();
  for (var i = 0; i < addressIndices.length; i++) {
    var addressIndex = addressIndices[i];
    var classNameString = classNameFromSymbolName(symbolNames[i]);
    className[addressIndex] = stringTable.indexForString(classNameString);
  }
  return (0, _immutableUpdate2.default)(tasktracer, {
    addressTable: (0, _immutableUpdate2.default)(tasktracer.addressTable, { className: className })
  });
}

/**
 * When collecting profile samples, the profiler only collects raw memory addresses
 * of the program's functions. This function takes the list of memory addresses, and
 * uses a symbol store to look up the symbols (names) of all of the functions. Initially
 * each memory address is a assigned a function in the profile, but these addresses may
 * actually point to the same function. During the processes of symbolication, any memory
 * addresses that share the same function have their FrameTable and FuncTable updated
 * to point to same function.
 */
function symbolicateProfile(profile, symbolStore, symbolicationHandlers) {
  var symbolicationPromises = profile.threads.map(function (thread, threadIndex) {
    return symbolicateThread(thread, threadIndex, symbolStore, symbolicationHandlers);
  });
  if ('tasktracer' in profile) {
    symbolicationPromises.push(symbolicateTaskTracer(profile.tasktracer, symbolStore, symbolicationHandlers));
  }
  return Promise.all(symbolicationPromises).then(function () {
    return undefined;
  });
}