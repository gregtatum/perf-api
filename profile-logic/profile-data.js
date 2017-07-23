'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resourceTypes = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.getFuncStackInfo = getFuncStackInfo;
exports.getSampleFuncStacks = getSampleFuncStacks;
exports.getTimeRangeIncludingAllThreads = getTimeRangeIncludingAllThreads;
exports.defaultThreadOrder = defaultThreadOrder;
exports.filterThreadByImplementation = filterThreadByImplementation;
exports.collapsePlatformStackFrames = collapsePlatformStackFrames;
exports.filterThreadToSearchString = filterThreadToSearchString;
exports.filterThreadToPrefixStack = filterThreadToPrefixStack;
exports.filterThreadToPostfixStack = filterThreadToPostfixStack;
exports.filterThreadToRange = filterThreadToRange;
exports.getFuncStackFromFuncArray = getFuncStackFromFuncArray;
exports.getStackAsFuncArray = getStackAsFuncArray;
exports.invertCallstack = invertCallstack;
exports.getSampleIndexClosestToTime = getSampleIndexClosestToTime;
exports.getJankInstances = getJankInstances;
exports.getTracingMarkers = getTracingMarkers;
exports.filterTracingMarkersToRange = filterTracingMarkersToRange;
exports.getFriendlyThreadName = getFriendlyThreadName;
exports.getThreadProcessDetails = getThreadProcessDetails;
exports.getEmptyProfile = getEmptyProfile;

var _timeCode = require('../utils/time-code');

var _taskTracer = require('./task-tracer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Various helpers for dealing with the profile as a data structure.
 * @module profile-data
 */

var resourceTypes = exports.resourceTypes = {
  unknown: 0,
  library: 1,
  addon: 2,
  webhost: 3,
  otherhost: 4,
  url: 5
};

/**
 * Generate the FuncStackInfo which contains the FuncStackTable, and a map to convert
 * an IndexIntoStackTable to a IndexIntoFuncStackTable. This function runs through
 * a stackTable, and de-duplicates stacks that have frames that point to the same
 * function.
 *
 * See `src/types/profile-derived.js` for the type definitions.
 * See `docs/func-stacks.md` for a detailed explanation of funcStacks.
 */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function getFuncStackInfo(stackTable, frameTable, funcTable) {
  return (0, _timeCode.timeCode)('getFuncStackInfo', function () {
    var stackIndexToFuncStackIndex = new Uint32Array(stackTable.length);
    var funcCount = funcTable.length;
    // Maps can't key off of two items, so combine the prefixFuncStack and the funcIndex
    // using the following formula: prefixFuncStack * funcCount + funcIndex => funcStack
    var prefixFuncStackAndFuncToFuncStackMap = new Map();

    // The funcStackTable components.
    var prefix = [];
    var func = [];
    var depth = [];
    var length = 0;

    function addFuncStack(prefixIndex, funcIndex) {
      var index = length++;
      prefix[index] = prefixIndex;
      func[index] = funcIndex;
      if (prefixIndex === -1) {
        depth[index] = 0;
      } else {
        depth[index] = depth[prefixIndex] + 1;
      }
    }

    // Go through each stack, and create a new funcStack table, which is based off of
    // functions rather than frames.
    for (var stackIndex = 0; stackIndex < stackTable.length; stackIndex++) {
      var prefixStack = stackTable.prefix[stackIndex];
      // We know that at this point the following condition holds:
      // assert(prefixStack === null || prefixStack < stackIndex);
      var prefixFuncStack = prefixStack === null ? -1 : stackIndexToFuncStackIndex[prefixStack];
      var frameIndex = stackTable.frame[stackIndex];
      var funcIndex = frameTable.func[frameIndex];
      var prefixFuncStackAndFuncIndex = prefixFuncStack * funcCount + funcIndex;
      var funcStackIndex = prefixFuncStackAndFuncToFuncStackMap.get(prefixFuncStackAndFuncIndex);
      if (funcStackIndex === undefined) {
        funcStackIndex = length;
        addFuncStack(prefixFuncStack, funcIndex);
        prefixFuncStackAndFuncToFuncStackMap.set(prefixFuncStackAndFuncIndex, funcStackIndex);
      }
      stackIndexToFuncStackIndex[stackIndex] = funcStackIndex;
    }

    var funcStackTable = {
      prefix: new Int32Array(prefix),
      func: new Int32Array(func),
      depth: depth,
      length: length
    };

    return { funcStackTable: funcStackTable, stackIndexToFuncStackIndex: stackIndexToFuncStackIndex };
  });
}

function getSampleFuncStacks(samples, stackIndexToFuncStackIndex) {
  return samples.stack.map(function (stack) {
    return stack === null ? null : stackIndexToFuncStackIndex[stack];
  });
}

function _getTimeRangeForThread(thread, interval) {
  if (thread.samples.length === 0) {
    return { start: Infinity, end: -Infinity };
  }
  return {
    start: thread.samples.time[0],
    end: thread.samples.time[thread.samples.length - 1] + interval
  };
}

function getTimeRangeIncludingAllThreads(profile) {
  var completeRange = { start: Infinity, end: -Infinity };
  profile.threads.forEach(function (thread) {
    var threadRange = _getTimeRangeForThread(thread, profile.meta.interval);
    completeRange.start = Math.min(completeRange.start, threadRange.start);
    completeRange.end = Math.max(completeRange.end, threadRange.end);
  });
  return completeRange;
}

function defaultThreadOrder(threads) {
  // Put the compositor/renderer thread last.
  var threadOrder = threads.map(function (thread, i) {
    return i;
  });
  threadOrder.sort(function (a, b) {
    var nameA = threads[a].name;
    var nameB = threads[b].name;
    if (nameA === nameB) {
      return a - b;
    }
    return nameA === 'Compositor' || nameA === 'Renderer' ? 1 : -1;
  });
  return threadOrder;
}

function filterThreadByImplementation(thread, implementation) {
  var funcTable = thread.funcTable,
      stringTable = thread.stringTable;


  switch (implementation) {
    case 'cpp':
      return _filterThreadByFunc(thread, function (funcIndex) {
        // Return quickly if this is a JS frame.
        if (funcTable.isJS[funcIndex]) {
          return false;
        }
        // Regular C++ functions are associated with a resource that describes the
        // shared library that these C++ functions were loaded from. Jitcode is not
        // loaded from shared libraries but instead generated at runtime, so Jitcode
        // frames are not associated with a shared library and thus have no resource
        var locationString = stringTable.getString(funcTable.name[funcIndex]);
        var isProbablyJitCode = funcTable.resource[funcIndex] === -1 && locationString.startsWith('0x');
        return !isProbablyJitCode;
      });
    case 'js':
      return _filterThreadByFunc(thread, function (funcIndex) {
        return funcTable.isJS[funcIndex];
      });
    default:
      return thread;
  }
}

function _filterThreadByFunc(thread, filter) {
  return (0, _timeCode.timeCode)('filterThread', function () {
    var stackTable = thread.stackTable,
        frameTable = thread.frameTable,
        samples = thread.samples;


    var newStackTable = {
      length: 0,
      frame: [],
      prefix: []
    };

    var oldStackToNewStack = new Map();
    var frameCount = frameTable.length;
    var prefixStackAndFrameToStack = new Map(); // prefixNewStack * frameCount + frame => newStackIndex

    function convertStack(stackIndex) {
      if (stackIndex === null) {
        return null;
      }
      var newStack = oldStackToNewStack.get(stackIndex);
      if (newStack === undefined) {
        var prefixNewStack = convertStack(stackTable.prefix[stackIndex]);
        var frameIndex = stackTable.frame[stackIndex];
        var funcIndex = frameTable.func[frameIndex];
        if (filter(funcIndex)) {
          var prefixStackAndFrameIndex = (prefixNewStack === null ? -1 : prefixNewStack) * frameCount + frameIndex;
          newStack = prefixStackAndFrameToStack.get(prefixStackAndFrameIndex);
          if (newStack === undefined) {
            newStack = newStackTable.length++;
            newStackTable.prefix[newStack] = prefixNewStack;
            newStackTable.frame[newStack] = frameIndex;
          }
          oldStackToNewStack.set(stackIndex, newStack);
          prefixStackAndFrameToStack.set(prefixStackAndFrameIndex, newStack);
        } else {
          newStack = prefixNewStack;
        }
      }
      return newStack;
    }

    var newSamples = Object.assign({}, samples, {
      stack: samples.stack.map(function (oldStack) {
        return convertStack(oldStack);
      })
    });

    return Object.assign({}, thread, {
      samples: newSamples,
      stackTable: newStackTable
    });
  });
}

/**
 * Given a thread with stacks like below, collapse together the platform stack frames into
 * a single pseudo platform stack frame. In the diagram "J" represents JavaScript stack
 * frame timing, and "P" Platform stack frame timing. New psuedo-stack frames are created
 * for the platform stacks.
 *
 * JJJJJJJJJJJJJJJJ  --->  JJJJJJJJJJJJJJJJ
 * PPPPPPPPPPPPPPPP        PPPPPPPPPPPPPPPP
 *     PPPPPPPPPPPP            JJJJJJJJ
 *     PPPPPPPP                JJJ  PPP
 *     JJJJJJJJ                     JJJ
 *     JJJ  PPP
 *          JJJ
 *
 * @param {Object} thread - A thread.
 * @returns {Object} The thread with collapsed samples.
 */
function collapsePlatformStackFrames(thread) {
  return (0, _timeCode.timeCode)('collapsePlatformStackFrames', function () {
    var stackTable = thread.stackTable,
        funcTable = thread.funcTable,
        frameTable = thread.frameTable,
        samples = thread.samples,
        stringTable = thread.stringTable;

    // Create new tables for the data.

    var newStackTable = {
      length: 0,
      frame: [],
      prefix: []
    };
    var newFrameTable = {
      length: frameTable.length,
      implementation: frameTable.implementation.slice(),
      optimizations: frameTable.optimizations.slice(),
      line: frameTable.line.slice(),
      category: frameTable.category.slice(),
      func: frameTable.func.slice(),
      address: frameTable.address.slice()
    };
    var newFuncTable = {
      length: funcTable.length,
      name: funcTable.name.slice(),
      resource: funcTable.resource.slice(),
      address: funcTable.address.slice(),
      isJS: funcTable.isJS.slice(),
      fileName: funcTable.fileName.slice(),
      lineNumber: funcTable.lineNumber.slice()
    };

    // Create a Map that takes a prefix and frame as input, and maps it to the new stack
    // index. Since Maps can't be keyed off of two values, do a little math to key off
    // of both values: newStackPrefix * potentialFrameCount + frame => newStackIndex
    var prefixStackAndFrameToStack = new Map();
    var potentialFrameCount = newFrameTable.length * 2;
    var oldStackToNewStack = new Map();

    function convertStack(oldStack) {
      if (oldStack === null) {
        return null;
      }
      var newStack = oldStackToNewStack.get(oldStack);
      if (newStack === undefined) {
        // No stack was found, generate a new one.
        var oldStackPrefix = stackTable.prefix[oldStack];
        var newStackPrefix = convertStack(oldStackPrefix);
        var frameIndex = stackTable.frame[oldStack];
        var funcIndex = newFrameTable.func[frameIndex];
        var oldStackIsPlatform = !newFuncTable.isJS[funcIndex];
        var keepStackFrame = true;

        if (oldStackIsPlatform) {
          if (oldStackPrefix !== null) {
            // Only keep the platform stack frame if the prefix is JS.
            var prefixFrameIndex = stackTable.frame[oldStackPrefix];
            var prefixFuncIndex = newFrameTable.func[prefixFrameIndex];
            keepStackFrame = newFuncTable.isJS[prefixFuncIndex];
          }
        }

        if (keepStackFrame) {
          // Convert the old JS stack to a new JS stack.
          var prefixStackAndFrameIndex = (newStackPrefix === null ? -1 : newStackPrefix) * potentialFrameCount + frameIndex;
          newStack = prefixStackAndFrameToStack.get(prefixStackAndFrameIndex);
          if (newStack === undefined) {
            newStack = newStackTable.length++;
            newStackTable.prefix[newStack] = newStackPrefix;
            if (oldStackIsPlatform) {
              // Create a new platform frame
              var newFuncIndex = newFuncTable.length++;
              newFuncTable.name.push(stringTable.indexForString('Platform'));
              newFuncTable.resource.push(-1);
              newFuncTable.address.push(-1);
              newFuncTable.isJS.push(false);
              newFuncTable.fileName.push(null);
              newFuncTable.lineNumber.push(null);
              if (newFuncTable.name.length !== newFuncTable.length) {
                console.error('length is not correct', newFuncTable.name.length, newFuncTable.length);
              }

              newFrameTable.implementation.push(null);
              newFrameTable.optimizations.push(null);
              newFrameTable.line.push(null);
              newFrameTable.category.push(null);
              newFrameTable.func.push(newFuncIndex);
              newFrameTable.address.push(-1);

              newStackTable.frame[newStack] = newFrameTable.length++;
            } else {
              newStackTable.frame[newStack] = frameIndex;
            }
          }
          oldStackToNewStack.set(oldStack, newStack);
          prefixStackAndFrameToStack.set(prefixStackAndFrameIndex, newStack);
        }

        // If the the stack frame was not kept, use the prefix.
        if (newStack === undefined) {
          newStack = newStackPrefix;
        }
      }
      return newStack;
    }

    var newSamples = Object.assign({}, samples, {
      stack: samples.stack.map(function (oldStack) {
        return convertStack(oldStack);
      })
    });

    return Object.assign({}, thread, {
      samples: newSamples,
      stackTable: newStackTable,
      frameTable: newFrameTable,
      funcTable: newFuncTable
    });
  });
}

function filterThreadToSearchString(thread, searchString) {
  return (0, _timeCode.timeCode)('filterThreadToSearchString', function () {
    if (searchString === '') {
      return thread;
    }
    var lowercaseSearchString = searchString.toLowerCase();
    var samples = thread.samples,
        funcTable = thread.funcTable,
        frameTable = thread.frameTable,
        stackTable = thread.stackTable,
        stringTable = thread.stringTable,
        resourceTable = thread.resourceTable;


    function computeFuncMatchesFilter(func) {
      var nameIndex = funcTable.name[func];
      var nameString = stringTable.getString(nameIndex);
      if (nameString.toLowerCase().includes(lowercaseSearchString)) {
        return true;
      }

      var fileNameIndex = funcTable.fileName[func];
      if (fileNameIndex !== null) {
        var fileNameString = stringTable.getString(fileNameIndex);
        if (fileNameString.toLowerCase().includes(lowercaseSearchString)) {
          return true;
        }
      }

      var resourceIndex = funcTable.resource[func];
      var resourceNameIndex = resourceTable.name[resourceIndex];
      if (resourceNameIndex !== undefined) {
        var resourceNameString = stringTable.getString(resourceNameIndex);
        if (resourceNameString.toLowerCase().includes(lowercaseSearchString)) {
          return true;
        }
      }

      return false;
    }

    var funcMatchesFilterCache = new Map();
    function funcMatchesFilter(func) {
      var result = funcMatchesFilterCache.get(func);
      if (result === undefined) {
        result = computeFuncMatchesFilter(func);
        funcMatchesFilterCache.set(func, result);
      }
      return result;
    }

    var stackMatchesFilterCache = new Map();
    function stackMatchesFilter(stackIndex) {
      if (stackIndex === null) {
        return false;
      }
      var result = stackMatchesFilterCache.get(stackIndex);
      if (result === undefined) {
        var prefix = stackTable.prefix[stackIndex];
        if (stackMatchesFilter(prefix)) {
          result = true;
        } else {
          var frame = stackTable.frame[stackIndex];
          var func = frameTable.func[frame];
          result = funcMatchesFilter(func);
        }
        stackMatchesFilterCache.set(stackIndex, result);
      }
      return result;
    }

    return Object.assign({}, thread, {
      samples: Object.assign({}, samples, {
        stack: samples.stack.map(function (s) {
          return stackMatchesFilter(s) ? s : null;
        })
      })
    });
  });
}

/**
 * Filter thread to only contain stacks which start with |prefixFuncs|, and
 * only samples witth those stacks. The new stacks' roots will be frames whose
 * func is the last element of the prefix func array.
 * @param  {object} thread      The thread.
 * @param  {array} prefixFuncs  The prefix stack, as an array of funcs.
 * @param  {bool} matchJSOnly   Ignore non-JS frames during matching.
 * @return {object}             The filtered thread.
 */
function filterThreadToPrefixStack(thread, prefixFuncs, matchJSOnly) {
  return (0, _timeCode.timeCode)('filterThreadToPrefixStack', function () {
    var stackTable = thread.stackTable,
        frameTable = thread.frameTable,
        funcTable = thread.funcTable,
        samples = thread.samples;

    var prefixDepth = prefixFuncs.length;
    var stackMatches = new Int32Array(stackTable.length);
    var oldStackToNewStack = new Map();
    oldStackToNewStack.set(null, null);
    var newStackTable = {
      length: 0,
      prefix: [],
      frame: []
    };
    for (var stackIndex = 0; stackIndex < stackTable.length; stackIndex++) {
      var prefix = stackTable.prefix[stackIndex];
      var prefixMatchesUpTo = prefix !== null ? stackMatches[prefix] : 0;
      var stackMatchesUpTo = -1;
      if (prefixMatchesUpTo !== -1) {
        var frame = stackTable.frame[stackIndex];
        if (prefixMatchesUpTo === prefixDepth) {
          stackMatchesUpTo = prefixDepth;
        } else {
          var func = frameTable.func[frame];
          if (func === prefixFuncs[prefixMatchesUpTo]) {
            stackMatchesUpTo = prefixMatchesUpTo + 1;
          } else if (matchJSOnly && !funcTable.isJS[func]) {
            stackMatchesUpTo = prefixMatchesUpTo;
          }
        }
        if (stackMatchesUpTo === prefixDepth) {
          var newStackIndex = newStackTable.length++;
          var newStackPrefix = oldStackToNewStack.get(prefix);
          newStackTable.prefix[newStackIndex] = newStackPrefix !== undefined ? newStackPrefix : null;
          newStackTable.frame[newStackIndex] = frame;
          oldStackToNewStack.set(stackIndex, newStackIndex);
        }
      }
      stackMatches[stackIndex] = stackMatchesUpTo;
    }
    var newSamples = Object.assign({}, samples, {
      stack: samples.stack.map(function (oldStack) {
        if (oldStack === null || stackMatches[oldStack] !== prefixDepth) {
          return null;
        }
        var newStack = oldStackToNewStack.get(oldStack);
        if (newStack === undefined) {
          throw new Error('Converting from the old stack to a new stack cannot be undefined');
        }
        return newStack;
      })
    });
    return Object.assign({}, thread, {
      stackTable: newStackTable,
      samples: newSamples
    });
  });
}

/**
 * Filter thread to only contain stacks which end with |postfixFuncs|, and
 * only samples witth those stacks. The new stacks' leaf frames will be
 * frames whose func is the last element of the postfix func array.
 * @param  {object} thread      The thread.
 * @param  {array} postfixFuncs The postfix stack, as an array of funcs,
 *                              starting from the leaf func.
 * @param  {bool} matchJSOnly   Ignore non-JS frames during matching.
 * @return {object}             The filtered thread.
 */
function filterThreadToPostfixStack(thread, postfixFuncs, matchJSOnly) {
  return (0, _timeCode.timeCode)('filterThreadToPostfixStack', function () {
    var postfixDepth = postfixFuncs.length;
    var stackTable = thread.stackTable,
        frameTable = thread.frameTable,
        funcTable = thread.funcTable,
        samples = thread.samples;


    function convertStack(leaf) {
      var matchesUpToDepth = 0; // counted from the leaf
      for (var stack = leaf; stack !== null; stack = stackTable.prefix[stack]) {
        var frame = stackTable.frame[stack];
        var func = frameTable.func[frame];
        if (func === postfixFuncs[matchesUpToDepth]) {
          matchesUpToDepth++;
          if (matchesUpToDepth === postfixDepth) {
            return stack;
          }
        } else if (!matchJSOnly || funcTable.isJS[func]) {
          return null;
        }
      }
      return null;
    }

    var oldStackToNewStack = new Map();
    oldStackToNewStack.set(null, null);
    var newSamples = Object.assign({}, samples, {
      stack: samples.stack.map(function (stackIndex) {
        var newStackIndex = oldStackToNewStack.get(stackIndex);
        if (newStackIndex === undefined) {
          newStackIndex = convertStack(stackIndex);
          oldStackToNewStack.set(stackIndex, newStackIndex);
        }
        return newStackIndex;
      })
    });
    return Object.assign({}, thread, {
      samples: newSamples
    });
  });
}

function _getSampleIndexRangeForSelection(samples, rangeStart, rangeEnd) {
  // TODO: This should really use bisect. samples.time is sorted.
  var firstSample = samples.time.findIndex(function (t) {
    return t >= rangeStart;
  });
  if (firstSample === -1) {
    return [samples.length, samples.length];
  }
  var afterLastSample = samples.time.slice(firstSample).findIndex(function (t) {
    return t >= rangeEnd;
  });
  if (afterLastSample === -1) {
    return [firstSample, samples.length];
  }
  return [firstSample, firstSample + afterLastSample];
}

function _getMarkerIndexRangeForSelection(markers, rangeStart, rangeEnd) {
  // TODO: This should really use bisect. samples.time is sorted.
  var firstMarker = markers.time.findIndex(function (t) {
    return t >= rangeStart;
  });
  if (firstMarker === -1) {
    return [markers.length, markers.length];
  }
  var afterLastSample = markers.time.slice(firstMarker).findIndex(function (t) {
    return t >= rangeEnd;
  });
  if (afterLastSample === -1) {
    return [firstMarker, markers.length];
  }
  return [firstMarker, firstMarker + afterLastSample];
}

function filterThreadToRange(thread, rangeStart, rangeEnd) {
  var samples = thread.samples,
      markers = thread.markers;

  var _getSampleIndexRangeF = _getSampleIndexRangeForSelection(samples, rangeStart, rangeEnd),
      _getSampleIndexRangeF2 = (0, _slicedToArray3.default)(_getSampleIndexRangeF, 2),
      sBegin = _getSampleIndexRangeF2[0],
      sEnd = _getSampleIndexRangeF2[1];

  var newSamples = {
    length: sEnd - sBegin,
    time: samples.time.slice(sBegin, sEnd),
    stack: samples.stack.slice(sBegin, sEnd),
    responsiveness: samples.responsiveness.slice(sBegin, sEnd),
    rss: samples.rss.slice(sBegin, sEnd),
    uss: samples.uss.slice(sBegin, sEnd)
  };

  var _getMarkerIndexRangeF = _getMarkerIndexRangeForSelection(markers, rangeStart, rangeEnd),
      _getMarkerIndexRangeF2 = (0, _slicedToArray3.default)(_getMarkerIndexRangeF, 2),
      mBegin = _getMarkerIndexRangeF2[0],
      mEnd = _getMarkerIndexRangeF2[1];

  var newMarkers = {
    length: mEnd - mBegin,
    time: markers.time.slice(mBegin, mEnd),
    name: markers.name.slice(mBegin, mEnd),
    data: markers.data.slice(mBegin, mEnd)
  };
  return Object.assign({}, thread, {
    samples: newSamples,
    markers: newMarkers
  });
}

function getFuncStackFromFuncArray(funcArray, funcStackTable) {
  var fs = -1;
  for (var i = 0; i < funcArray.length; i++) {
    var func = funcArray[i];
    var nextFS = -1;
    for (var funcStackIndex = fs + 1; funcStackIndex < funcStackTable.length; funcStackIndex++) {
      if (funcStackTable.prefix[funcStackIndex] === fs && funcStackTable.func[funcStackIndex] === func) {
        nextFS = funcStackIndex;
        break;
      }
    }
    if (nextFS === -1) {
      return null;
    }
    fs = nextFS;
  }
  return fs;
}

function getStackAsFuncArray(funcStackIndex, funcStackTable) {
  if (funcStackIndex === null) {
    return [];
  }
  if (funcStackIndex * 1 !== funcStackIndex) {
    console.log('bad funcStackIndex in getStackAsFuncArray:', funcStackIndex);
    return [];
  }
  var funcArray = [];
  var fs = funcStackIndex;
  while (fs !== -1) {
    funcArray.push(funcStackTable.func[fs]);
    fs = funcStackTable.prefix[fs];
  }
  funcArray.reverse();
  return funcArray;
}

function invertCallstack(thread) {
  return (0, _timeCode.timeCode)('invertCallstack', function () {
    var stackTable = thread.stackTable,
        frameTable = thread.frameTable,
        samples = thread.samples;


    var newStackTable = {
      length: 0,
      frame: [],
      prefix: []
    };
    // Create a Map that keys off of two values, both the prefix and frame combination
    // by using a bit of math: prefix * frameCount + frame => stackIndex
    var prefixAndFrameToStack = new Map();
    var frameCount = frameTable.length;

    function stackFor(prefix, frame) {
      var prefixAndFrameIndex = (prefix === null ? -1 : prefix) * frameCount + frame;
      var stackIndex = prefixAndFrameToStack.get(prefixAndFrameIndex);
      if (stackIndex === undefined) {
        stackIndex = newStackTable.length++;
        newStackTable.prefix[stackIndex] = prefix;
        newStackTable.frame[stackIndex] = frame;
        prefixAndFrameToStack.set(prefixAndFrameIndex, stackIndex);
      }
      return stackIndex;
    }

    var oldStackToNewStack = new Map();

    function convertStack(stackIndex) {
      if (stackIndex === null) {
        return null;
      }
      var newStack = oldStackToNewStack.get(stackIndex);
      if (newStack === undefined) {
        newStack = null;
        for (var currentStack = stackIndex; currentStack !== null; currentStack = stackTable.prefix[currentStack]) {
          newStack = stackFor(newStack, stackTable.frame[currentStack]);
        }
        oldStackToNewStack.set(stackIndex, newStack);
      }
      return newStack;
    }

    var newSamples = Object.assign({}, samples, {
      stack: samples.stack.map(function (oldStack) {
        return convertStack(oldStack);
      })
    });

    return Object.assign({}, thread, {
      samples: newSamples,
      stackTable: newStackTable
    });
  });
}

function getSampleIndexClosestToTime(samples, time) {
  // TODO: This should really use bisect. samples.time is sorted.
  for (var i = 0; i < samples.length; i++) {
    if (samples.time[i] >= time) {
      if (i === 0) {
        return 0;
      }
      var distanceToThis = samples.time[i] - time;
      var distanceToLast = time - samples.time[i - 1];
      return distanceToThis < distanceToLast ? i : i - 1;
    }
  }
  return samples.length - 1;
}

function getJankInstances(samples, threadName, thresholdInMs) {
  var addTracingMarker = function addTracingMarker() {
    return jankInstances.push({
      start: lastTimestamp - lastResponsiveness,
      dur: lastResponsiveness,
      title: lastResponsiveness.toFixed(2) + 'ms event processing delay on ' + threadName,
      name: 'Jank',
      data: null
    });
  };

  var lastResponsiveness = 0;
  var lastTimestamp = 0;
  var jankInstances = [];
  for (var i = 0; i < samples.length; i++) {
    var currentResponsiveness = samples.responsiveness[i];
    if (currentResponsiveness < lastResponsiveness) {
      if (lastResponsiveness >= thresholdInMs) {
        addTracingMarker();
      }
    }
    lastResponsiveness = currentResponsiveness;
    lastTimestamp = samples.time[i];
  }
  if (lastResponsiveness >= thresholdInMs) {
    addTracingMarker();
  }
  return jankInstances;
}

function getTracingMarkers(thread) {
  var stringTable = thread.stringTable,
      markers = thread.markers;

  var tracingMarkers = [];
  var openMarkers = new Map();
  for (var i = 0; i < markers.length; i++) {
    var data = markers.data[i];
    if (!data) {
      continue;
    }
    if (data.type === 'tracing') {
      var time = markers.time[i];
      var nameStringIndex = markers.name[i];
      if (data.interval === 'start') {
        openMarkers.set(nameStringIndex, {
          start: time,
          name: stringTable.getString(nameStringIndex),
          dur: 0,
          title: null,
          data: data
        });
      } else if (data.interval === 'end') {
        var marker = openMarkers.get(nameStringIndex);
        if (marker === undefined) {
          continue;
        }
        if (marker.start !== undefined) {
          marker.dur = time - marker.start;
        }
        tracingMarkers.push(marker);
      }
    } else if ('startTime' in data && 'endTime' in data) {
      var startTime = data.startTime,
          endTime = data.endTime;

      if (typeof startTime === 'number' && typeof endTime === 'number') {
        var name = stringTable.getString(markers.name[i]);
        var duration = endTime - startTime;
        tracingMarkers.push({
          start: startTime,
          dur: duration,
          name: name,
          data: data,
          title: null
        });
      }
    }
  }
  tracingMarkers.sort(function (a, b) {
    return a.start - b.start;
  });
  return tracingMarkers;
}

function filterTracingMarkersToRange(tracingMarkers, rangeStart, rangeEnd) {
  return tracingMarkers.filter(function (tm) {
    return tm.start < rangeEnd && tm.start + tm.dur >= rangeStart;
  });
}

function getFriendlyThreadName(threads, thread) {
  var label = void 0;
  switch (thread.name) {
    case 'GeckoMain':
      switch (thread.processType) {
        case 'default':
          label = 'Main Thread';
          break;
        case 'tab':
          {
            var contentThreads = threads.filter(function (thread) {
              return thread.name === 'GeckoMain' && thread.processType === 'tab';
            });
            if (contentThreads.length > 1) {
              var index = 1 + contentThreads.indexOf(thread);
              label = 'Content (' + index + ' of ' + contentThreads.length + ')';
            } else {
              label = 'Content';
            }
            break;
          }
        case 'plugin':
          label = 'Plugin';
          break;
        default:
        // should we throw here ?
      }
      break;
    default:
  }

  if (!label) {
    label = thread.name;
  }
  return label;
}

function getThreadProcessDetails(thread) {
  var label = 'thread: "' + thread.name + '"';
  if (thread.tid !== undefined) {
    label += ' (' + thread.tid + ')';
  }

  if (thread.processType) {
    label += '\nprocess: "' + thread.processType + '"';
    if (thread.pid !== undefined) {
      label += ' (' + thread.pid + ')';
    }
  }

  return label;
}

function getEmptyProfile() {
  return {
    meta: { interval: 1 },
    threads: [],
    tasktracer: (0, _taskTracer.getEmptyTaskTracerData)()
  };
}