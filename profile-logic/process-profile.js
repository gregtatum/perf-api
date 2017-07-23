'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProfileProcessorThreaded = exports.ProfileProcessor = exports.processProfile = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.serializeProfile = serializeProfile;
exports.unserializeProfileOfArbitraryFormat = unserializeProfileOfArbitraryFormat;

var _symbolication = require('./symbolication');

var _uniqueStringArray = require('../utils/unique-string-array');

var _profileData = require('./profile-data');

var _promiseWorker = require('../utils/promise-worker');

var _immutableUpdate = require('../utils/immutable-update');

var _immutableUpdate2 = _interopRequireDefault(_immutableUpdate);

var _processedProfileVersioning = require('./processed-profile-versioning');

var _geckoProfileVersioning = require('./gecko-profile-versioning');

var _oldCleopatraProfileFormat = require('./old-cleopatra-profile-format');

var _taskTracer = require('./task-tracer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Module for converting a Gecko profile into the 'processed' format.
 * @module process-profile
 */

/**
 * Turn a data table from the form `{ schema, data }` (as used in the Gecko profile
 * JSON) into a struct of arrays. This isn't very nice to read, but it
 * drastically reduces the number of JS objects the JS engine has to deal with,
 * resulting in fewer GC pauses and hopefully better performance.
 *
 * e.g Take geckoTable A data table of the form
 *   `{ schema, data }`.
 * And turn it into a data table of the form
 *  `{ length: number, field1: array, field2: array }`
 */
function _toStructOfArrays(geckoTable) {
  var result = { length: geckoTable.data.length };

  var _loop = function _loop(fieldName) {
    var fieldIndex = geckoTable.schema[fieldName];
    if (typeof fieldIndex !== 'number') {
      throw new Error('fieldIndex must be a number in the Gecko profile table.');
    }
    result[fieldName] = geckoTable.data.map(function (entry) {
      return fieldIndex in entry ? entry[fieldIndex] : null;
    });
  };

  for (var fieldName in geckoTable.schema) {
    _loop(fieldName);
  }
  return result;
}

/**
 * JS File information sometimes comes with multiple URIs which are chained
 * with " -> ". We only want the last URI in this list.
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


function _getRealScriptURI(url) {
  if (url) {
    var urls = url.split(' -> ');
    return urls[urls.length - 1];
  }
  return url;
}

function _sortByField(fieldName, geckoTable) {
  var fieldIndex = geckoTable.schema[fieldName];
  var sortedData = geckoTable.data.slice(0);
  sortedData.sort(function (a, b) {
    return a[fieldIndex] - b[fieldIndex];
  });
  return Object.assign({}, geckoTable, { data: sortedData });
}

function _cleanFunctionName(functionName) {
  var ignoredPrefix = 'non-virtual thunk to ';
  if (functionName.startsWith && functionName.startsWith(ignoredPrefix)) {
    return functionName.substr(ignoredPrefix.length);
  }
  return functionName;
}

function _extractFuncsAndResourcesFromFrames(geckoFrameStruct, stringTable, libs) {
  var funcTable = {
    length: 0,
    name: [],
    resource: [],
    address: [],
    isJS: [],
    fileName: [],
    lineNumber: []
  };
  var resourceTable = {
    length: 0,
    type: [],
    name: [],
    lib: [],
    icon: [],
    addonId: [],
    host: []
  };
  function addLibResource(name, libIndex) {
    var index = resourceTable.length++;
    resourceTable.type[index] = _profileData.resourceTypes.library;
    resourceTable.name[index] = name;
    resourceTable.lib[index] = libIndex;
  }
  function addWebhostResource(origin, host) {
    var index = resourceTable.length++;
    resourceTable.type[index] = _profileData.resourceTypes.webhost;
    resourceTable.name[index] = origin;
    resourceTable.host[index] = host;
  }
  function addURLResource(url) {
    var index = resourceTable.length++;
    resourceTable.type[index] = _profileData.resourceTypes.url;
    resourceTable.name[index] = url;
  }

  var libToResourceIndex = new Map();
  var originToResourceIndex = new Map();
  var libNameToResourceIndex = new Map();
  var stringTableIndexToNewFuncIndex = new Map();

  var frameFuncs = geckoFrameStruct.location.map(function (locationIndex) {
    var funcIndex = stringTableIndexToNewFuncIndex.get(locationIndex);
    if (funcIndex !== undefined) {
      return funcIndex;
    }

    var funcNameIndex = locationIndex;
    var resourceIndex = -1;
    var addressRelativeToLib = -1;
    var isJS = false;
    var fileName = null;
    var lineNumber = null;
    var locationString = stringTable.getString(funcNameIndex);
    if (locationString.startsWith('0x')) {
      var address = parseInt(locationString.substr(2), 16);
      var lib = (0, _symbolication.getContainingLibrary)(libs, address);
      if (lib) {
        addressRelativeToLib = address - lib.start;
        // Flow doesn't understand Map.prototype.has()
        var maybeResourceIndex = libToResourceIndex.get(lib);
        if (maybeResourceIndex === undefined) {
          resourceIndex = resourceTable.length;
          libToResourceIndex.set(lib, resourceIndex);
          var nameStringIndex = stringTable.indexForString(lib.debugName);
          addLibResource(nameStringIndex, libs.indexOf(lib));
        } else {
          resourceIndex = maybeResourceIndex;
        }
      }
    } else {
      var cppMatch = /^(.*) \(in ([^)]*)\) (\+ [0-9]+)$/.exec(locationString) || /^(.*) \(in ([^)]*)\) (\(.*:.*\))$/.exec(locationString) || /^(.*) \(in ([^)]*)\)$/.exec(locationString);
      if (cppMatch) {
        funcNameIndex = stringTable.indexForString(_cleanFunctionName(cppMatch[1]));
        var libraryNameStringIndex = stringTable.indexForString(cppMatch[2]);
        funcIndex = stringTableIndexToNewFuncIndex.get(funcNameIndex);
        if (funcIndex !== undefined) {
          return funcIndex;
        }
        var _maybeResourceIndex = libNameToResourceIndex.get(libraryNameStringIndex);
        if (_maybeResourceIndex === undefined) {
          resourceIndex = resourceTable.length;
          libNameToResourceIndex.set(libraryNameStringIndex, resourceIndex);
          addLibResource(libraryNameStringIndex, -1);
        } else {
          resourceIndex = _maybeResourceIndex;
        }
      } else {
        var jsMatch = /^(.*) \((.*):([0-9]+)\)$/.exec(locationString) || /^()(.*):([0-9]+)$/.exec(locationString);
        if (jsMatch) {
          isJS = true;
          var scriptURI = _getRealScriptURI(jsMatch[2]);
          var origin = void 0,
              host = void 0;
          try {
            var url = new URL(scriptURI);
            if (!(url.protocol === 'http:' || url.protocol === 'https:')) {
              throw new Error('not a webhost protocol');
            }
            origin = url.origin;
            host = url.host;
          } catch (e) {
            origin = scriptURI;
            host = null;
          }
          var _maybeResourceIndex2 = originToResourceIndex.get(origin);
          if (_maybeResourceIndex2 === undefined) {
            resourceIndex = resourceTable.length;
            originToResourceIndex.set(origin, resourceIndex);
            var originStringIndex = stringTable.indexForString(origin);
            if (host) {
              var hostIndex = stringTable.indexForString(host);
              addWebhostResource(originStringIndex, hostIndex);
            } else {
              var urlStringIndex = stringTable.indexForString(scriptURI);
              addURLResource(urlStringIndex);
            }
          } else {
            resourceIndex = _maybeResourceIndex2;
          }

          if (jsMatch[1]) {
            funcNameIndex = stringTable.indexForString(jsMatch[1]);
          } else {
            // Some JS frames don't have a function because they are for the
            // initial evaluation of the whole JS file. In that case, use the
            // file name itself, prepended by '(root scope) ', as the function
            // name.
            funcNameIndex = stringTable.indexForString('(root scope) ' + scriptURI);
          }
          fileName = stringTable.indexForString(scriptURI);
          lineNumber = parseInt(jsMatch[3], 10);
        }
      }
    }
    funcIndex = funcTable.length;
    {
      // Add the function to the funcTable.
      var index = funcTable.length++;
      funcTable.name[index] = funcNameIndex;
      funcTable.resource[index] = resourceIndex;
      funcTable.address[index] = addressRelativeToLib;
      funcTable.isJS[index] = isJS;
      funcTable.fileName[index] = fileName;
      funcTable.lineNumber[index] = lineNumber;
    }
    stringTableIndexToNewFuncIndex.set(locationIndex, funcIndex);
    return funcIndex;
  });

  return [funcTable, resourceTable, frameFuncs];
}

/**
 * Explicitly recreate the frame table here to help enforce our assumptions about types.
 */
function _processFrameTable(geckoFrameStruct, funcTable, frameFuncs) {
  return {
    address: frameFuncs.map(function (funcIndex) {
      return funcTable.address[funcIndex];
    }),
    category: geckoFrameStruct.category,
    func: frameFuncs,
    implementation: geckoFrameStruct.implementation,
    line: geckoFrameStruct.line,
    optimizations: geckoFrameStruct.optimizations,
    length: geckoFrameStruct.length
  };
}

/**
 * Explicitly recreate the stack table here to help enforce our assumptions about types.
 */
function _processStackTable(geckoStackTable) {
  return {
    frame: geckoStackTable.frame,
    prefix: geckoStackTable.prefix,
    length: geckoStackTable.length
  };
}

/**
 * Explicitly recreate the markers here to help enforce our assumptions about types.
 */
function _processMarkers(geckoMarkers) {
  return {
    data: geckoMarkers.data,
    name: geckoMarkers.name,
    time: geckoMarkers.time,
    length: geckoMarkers.length
  };
}

/**
 * Explicitly recreate the markers here to help enforce our assumptions about types.
 */
function _processSamples(geckoSamples) {
  return {
    responsiveness: geckoSamples.responsiveness,
    stack: geckoSamples.stack,
    time: geckoSamples.time,
    rss: geckoSamples.rss,
    uss: geckoSamples.uss,
    length: geckoSamples.length
  };
}

/**
 * Convert the given thread into processed form. See docs/gecko-profile-format for more
 * information.
 */
function _processThread(thread, libs) {
  var geckoFrameStruct = _toStructOfArrays(thread.frameTable);
  var geckoStackTable = _toStructOfArrays(thread.stackTable);
  var geckoSamples = _toStructOfArrays(thread.samples);
  var geckoMarkers = _toStructOfArrays(_sortByField('time', thread.markers));

  var stringTable = new _uniqueStringArray.UniqueStringArray(thread.stringTable);

  var _extractFuncsAndResou = _extractFuncsAndResourcesFromFrames(geckoFrameStruct, stringTable, libs),
      _extractFuncsAndResou2 = (0, _slicedToArray3.default)(_extractFuncsAndResou, 3),
      funcTable = _extractFuncsAndResou2[0],
      resourceTable = _extractFuncsAndResou2[1],
      frameFuncs = _extractFuncsAndResou2[2];

  var frameTable = _processFrameTable(geckoFrameStruct, funcTable, frameFuncs);
  var stackTable = _processStackTable(geckoStackTable);
  var markers = _processMarkers(geckoMarkers);
  var samples = _processSamples(geckoSamples);

  return {
    name: thread.name,
    processType: thread.processType,
    tid: thread.tid,
    pid: thread.pid,
    libs: libs,
    frameTable: frameTable,
    funcTable: funcTable,
    resourceTable: resourceTable,
    stackTable: stackTable,
    markers: markers,
    stringTable: stringTable,
    samples: samples
  };
}

/**
 * This function is currently un-typed, and should be handled with properly
 * supporting TaskTracer with types and tests. See issue 438:
 * https://github.com/devtools-html/perf.html/issues/438
 */
function _addProcessedTaskTracerData(tasktracer, result, libs, startTime) {
  var data = tasktracer.data,
      start = tasktracer.start,
      threads = tasktracer.threads;
  var taskTable = result.taskTable,
      tasksIdToTaskIndexMap = result.tasksIdToTaskIndexMap,
      stringTable = result.stringTable,
      addressIndicesByLib = result.addressIndicesByLib,
      addressTable = result.addressTable,
      threadTable = result.threadTable,
      tidToThreadIndexMap = result.tidToThreadIndexMap;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {

    for (var _iterator = threads[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var thread = _step.value;

      var threadIndex = threadTable.length++;
      threadTable.tid[threadIndex] = thread.tid;
      threadTable.name[threadIndex] = stringTable.indexForString(thread.name);
      threadTable.start[threadIndex] = start;
      tidToThreadIndexMap.set(thread.tid, threadIndex);
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

  var addressIndicesByAddress = new Map();

  for (var i = 0; i < data.length; i++) {
    var line = data[i];

    // All lines are of the form <digit> ' ' <taskId> [' ' <additional fields>]*
    // <digit> describes the type of the line.
    var firstSpacePos = 1;
    var secondSpacePos = line.indexOf(' ', firstSpacePos + 1);

    // taskIds are stored as JS strings, because they are originally uint64_t.
    var taskId = line.substring(firstSpacePos + 1, secondSpacePos);
    var taskIndex = tasksIdToTaskIndexMap.get(taskId);
    if (taskIndex === undefined) {
      taskIndex = taskTable.length++;
      tasksIdToTaskIndexMap.set(taskId, taskIndex);
    }

    switch (line.charAt(0)) {
      case '0':
        // DISPATCH, '0 taskId dispatchTime sourceEventId sourceEventType parentTaskId'
        {
          var thirdSpacePos = line.indexOf(' ', secondSpacePos + 1);
          var fourthSpacePos = line.indexOf(' ', thirdSpacePos + 1);
          var fifthSpacePos = line.indexOf(' ', fourthSpacePos + 1);
          taskTable.dispatchTime[taskIndex] = Math.round(+line.substring(secondSpacePos + 1, thirdSpacePos) - startTime);
          taskTable.sourceEventId[taskIndex] = line.substring(thirdSpacePos + 1, fourthSpacePos);
          taskTable.sourceEventType[taskIndex] = line.substring(fourthSpacePos + 1, fifthSpacePos) | 0;
          taskTable.parentTaskId[taskIndex] = line.substring(fifthSpacePos + 1);
        }
        break;
      case '1':
        // BEGIN, '1 taskId beginTime processId threadId'
        {
          var _thirdSpacePos = line.indexOf(' ', secondSpacePos + 1);
          var _fourthSpacePos = line.indexOf(' ', _thirdSpacePos + 1);
          taskTable.beginTime[taskIndex] = Math.round(+line.substring(secondSpacePos + 1, _thirdSpacePos) - startTime);
          taskTable.processId[taskIndex] = line.substring(_thirdSpacePos + 1, _fourthSpacePos);
          var tid = +line.substring(_fourthSpacePos + 1);
          var threadIndex = tidToThreadIndexMap.get(tid);
          if (threadIndex === undefined) {
            threadIndex = threadTable.length++;
            threadTable.tid[threadIndex] = tid;
            threadTable.name[threadIndex] = stringTable.indexForString('Thread ' + tid);
            threadTable.start[threadIndex] = start;
            tidToThreadIndexMap.set(tid, threadIndex);
          }
          taskTable.threadIndex[taskIndex] = threadIndex;
        }
        break;
      case '2':
        // END, '2 taskId endTime'
        taskTable.endTime[taskIndex] = Math.round(+line.substring(secondSpacePos + 1) - startTime);
        break;
      case '3':
        // ADD_LABEL, '3 taskId labelTime "label"'
        {
          var _thirdSpacePos2 = line.indexOf(' ', secondSpacePos + 1);
          var label = line.substring(_thirdSpacePos2 + 1 + 1, line.length - 1);
          if (/^P.+::Msg_/.test(label)) {
            taskTable.ipdlMsg[taskIndex] = stringTable.indexForString(label);
          } else if (taskTable.label[taskIndex] === undefined) {
            taskTable.label[taskIndex] = [stringTable.indexForString(label)];
          } else {
            taskTable.label[taskIndex].push(stringTable.indexForString(label));
          }
        }
        break;
      case '4':
        // GET_VTABLE, '4 taskId address'
        {
          var hexAddress = line.substring(secondSpacePos + 1);
          var address = parseInt(hexAddress, 16);
          var addressIndex = addressIndicesByAddress.get(address);
          if (addressIndex === undefined) {
            addressIndex = addressTable.length++;
            var lib = (0, _symbolication.getClosestLibrary)(libs, address);
            var stringIndex = void 0;
            var addressRelativeToLib = -1;
            if (lib) {
              addressRelativeToLib = address - lib.start;
              stringIndex = stringTable.indexForString('<0x' + addressRelativeToLib.toString(16) + ' in ' + lib.debugName + '>');
              var addressIndicesForThisLib = addressIndicesByLib.get(lib);
              if (addressIndicesForThisLib === undefined) {
                addressIndicesForThisLib = [];
                addressIndicesByLib.set(lib, addressIndicesForThisLib);
              }
              addressIndicesForThisLib.push(addressIndex);
            } else {
              stringIndex = stringTable.indexForString('<unknown 0x' + hexAddress + '>');
            }
            addressIndicesByAddress.set(address, addressIndex);
            addressTable.address[addressIndex] = addressRelativeToLib;
            addressTable.className[addressIndex] = stringIndex;
            addressTable.lib[addressIndex] = lib;
          }
          taskTable.address[taskIndex] = addressIndex;
        }
        break;
      default:
        break;
    }
  }
}

/**
 * Adjust the "time" field by the given delta. This is needed when integrating
 * subprocess profiles into the parent process profile; each profile's process
 * has its own timebase, and we don't want to keep converting timestamps when
 * we deal with the integrated profile.
 */
function _adjustSampleTimestamps(samples, delta) {
  return Object.assign({}, samples, {
    time: samples.time.map(function (time) {
      return time + delta;
    })
  });
}

/**
 * Adjust all timestamp fields by the given delta. This is needed when
 * integrating subprocess profiles into the parent process profile; each
 * profile's process has its own timebase, and we don't want to keep
 * converting timestamps when we deal with the integrated profile.
 */
function _adjustMarkerTimestamps(markers, delta) {
  return Object.assign({}, markers, {
    time: markers.time.map(function (time) {
      return time + delta;
    }),
    data: markers.data.map(function (data) {
      if (!data) {
        return data;
      }
      var newData = (0, _immutableUpdate2.default)(data);
      if ('startTime' in newData) {
        newData.startTime += delta;
      }
      if ('endTime' in newData) {
        newData.endTime += delta;
      }
      return newData;
    })
  });
}

/**
 * Convert a profile from the Gecko format into the processed format.
 * Throws an exception if it encounters an incompatible profile.
 * For a description of the processed format, look at docs/gecko-profile-format.md
 */
function _processProfile(geckoProfile) {
  // Handle profiles from older versions of Gecko. This call might throw an
  // exception.
  (0, _geckoProfileVersioning.upgradeGeckoProfileToCurrentVersion)(geckoProfile);

  var libs = geckoProfile.libs;
  var threads = [];
  var tasktracer = (0, _taskTracer.getEmptyTaskTracerData)();

  if (geckoProfile.tasktracer && geckoProfile.tasktracer.threads) {
    _addProcessedTaskTracerData(geckoProfile.tasktracer, tasktracer, libs, geckoProfile.meta.startTime);
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = geckoProfile.threads[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var thread = _step2.value;

      threads.push(_processThread(thread, libs));
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

  var _loop2 = function _loop2(subprocessProfile) {
    var subprocessLibs = subprocessProfile.libs;
    var adjustTimestampsBy = subprocessProfile.meta.startTime - geckoProfile.meta.startTime;
    threads = threads.concat(subprocessProfile.threads.map(function (thread) {
      var newThread = _processThread(thread, subprocessLibs);
      newThread.samples = _adjustSampleTimestamps(newThread.samples, adjustTimestampsBy);
      newThread.markers = _adjustMarkerTimestamps(newThread.markers, adjustTimestampsBy);
      return newThread;
    }));
    if (subprocessProfile.tasktracer && subprocessProfile.tasktracer.threads) {
      _addProcessedTaskTracerData(subprocessProfile.tasktracer, tasktracer, subprocessLibs, geckoProfile.meta.startTime);
    }
  };

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = geckoProfile.processes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var subprocessProfile = _step3.value;

      _loop2(subprocessProfile);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var result = {
    meta: Object.assign({}, geckoProfile.meta, {
      preprocessedProfileVersion: _processedProfileVersioning.CURRENT_VERSION
    }),
    threads: threads,
    tasktracer: tasktracer
  };
  return result;
}

/**
 * Take a processed profile and remove any non-serializable classes such as the
 * StringTable class.
 */
exports.processProfile = _processProfile;
function serializeProfile(profile) {
  // stringTable -> stringArray
  var newProfile = Object.assign({}, profile, {
    threads: profile.threads.map(function (thread) {
      var stringTable = thread.stringTable;
      var newThread = Object.assign({}, thread);
      delete newThread.stringTable;
      newThread.stringArray = stringTable.serializeToArray();
      return newThread;
    })
  });
  if ('tasktracer' in newProfile) {
    var newTasktracer = Object.assign({}, newProfile.tasktracer);
    var stringTable = newTasktracer.stringTable;
    delete newTasktracer.stringTable;
    newTasktracer.stringArray = stringTable.serializeToArray();
    newProfile.tasktracer = newTasktracer;
  }
  return JSON.stringify(newProfile);
}

/**
 * Take a serialized processed profile from some saved source, and re-initialize
 * any non-serializable classes.
 */
function _unserializeProfile(profile) {
  // stringArray -> stringTable
  var newProfile = Object.assign({}, profile, {
    threads: profile.threads.map(function (thread) {
      var stringArray = thread.stringArray;
      var newThread = Object.assign({}, thread);
      delete newThread.stringArray;
      newThread.stringTable = new _uniqueStringArray.UniqueStringArray(stringArray);
      return newThread;
    })
  });
  if ('tasktracer' in newProfile) {
    var newTaskTracer = Object.assign({}, newProfile.tasktracer);
    var stringArray = newTaskTracer.stringArray;
    delete newTaskTracer.stringArray;
    newTaskTracer.stringTable = new _uniqueStringArray.UniqueStringArray(stringArray);
    newProfile.tasktracer = newTaskTracer;
  }
  return newProfile;
}

/**
 * Take some arbitrary profile file from some data source, and turn it into
 * the processed profile format.
 */
function unserializeProfileOfArbitraryFormat(jsonStringOrObject) {
  try {
    var profile = typeof jsonStringOrObject === 'string' ? JSON.parse(jsonStringOrObject) : jsonStringOrObject;
    if ((0, _oldCleopatraProfileFormat.isOldCleopatraFormat)(profile)) {
      profile = (0, _oldCleopatraProfileFormat.convertOldCleopatraProfile)(profile); // outputs preprocessed profile
    }
    if ((0, _processedProfileVersioning.isProcessedProfile)(profile)) {
      (0, _processedProfileVersioning.upgradeProcessedProfileToCurrentVersion)(profile);
      return _unserializeProfile(profile);
    }
    // Else: Treat it as a Gecko profile and just attempt to process it.
    return _processProfile(profile);
  } catch (e) {
    throw new Error('Unserializing the profile failed: ' + e);
  }
}

var ProfileProcessor = exports.ProfileProcessor = function () {
  function ProfileProcessor() {
    (0, _classCallCheck3.default)(this, ProfileProcessor);
  }

  (0, _createClass3.default)(ProfileProcessor, [{
    key: 'processProfile',
    value: function processProfile(geckoProfile) {
      return new Promise(function (resolve) {
        resolve(_processProfile(geckoProfile));
      });
    }
  }]);
  return ProfileProcessor;
}();

var ProfileProcessorThreaded = exports.ProfileProcessorThreaded = (0, _promiseWorker.provideHostSide)('profile-processor-worker.js', ['processProfile']);