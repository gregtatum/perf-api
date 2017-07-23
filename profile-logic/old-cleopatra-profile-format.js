'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isOldCleopatraFormat = isOldCleopatraFormat;
exports.convertOldCleopatraProfile = convertOldCleopatraProfile;

var _uniqueStringArray = require('../utils/unique-string-array');

var _profileData = require('./profile-data');

var _geckoProfileVersioning = require('./gecko-profile-versioning.js');

var _taskTracer = require('./task-tracer');

/**
 * The "old cleopatra format" is the profile format that was used by the
 * cleopatra version before the big rewrite. Profiles of this format are still
 * in the profile store, and there are links to those profiles strewn across
 * bugzilla. We want to be able to display those profiles.
 * This file's purpose is to convert "old cleopatra" profiles into
 * processed profiles of "processed profile format" version zero.
 * The result will be run through the processed profile format
 * compatibility conversion. Consequently, when the processed profile
 * format changes, this file does not need to be touched and instead we will
 * automatically take advantage of the process profile format conversion.
 *
 * A lot of this code will remind you of very similar code in
 * process-profile.js. However, we intentionally do not share code with it:
 * We want process-profile to be exclusively concerned with converting the
 * most recent Gecko profile format into the most recent processed profile
 * format.
 * Some of the code below is basically a snapshot of the processing code as
 * it was before the versioning scheme was introduced.
 */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function isOldCleopatraFormat(profile) {
  return 'format' in profile && profile.format === 'profileJSONWithSymbolicationTable,1';
}

function _getRealScriptURI(url) {
  if (url) {
    var urls = url.split(' -> ');
    return urls[urls.length - 1];
  }
  return url;
}

function _cleanFunctionName(functionName) {
  var ignoredPrefix = 'non-virtual thunk to ';
  if (functionName.startsWith && functionName.startsWith(ignoredPrefix)) {
    return functionName.substr(ignoredPrefix.length);
  }
  return functionName;
}

function _convertThread(thread, interval, symbolicationTable) {
  var stringTable = new _uniqueStringArray.UniqueStringArray(symbolicationTable);
  var frameTable = {
    length: 0,
    category: [],
    location: [],
    implementation: [],
    line: [],
    optimizations: [],
    func: undefined,
    address: undefined
  };
  var stackTable = {
    length: 0,
    frame: [],
    prefix: []
  };
  var samples = {
    length: 0,
    responsiveness: [],
    rss: [],
    stack: [],
    time: [],
    uss: []
  };
  var markers = {
    length: 0,
    data: [],
    name: [],
    time: []
  };

  var frameMap = new Map();
  var stackMap = new Map();

  var lastSampleTime = 0;

  for (var i = 0; i < thread.samples.length; i++) {
    var sample = thread.samples[i];
    // sample has the shape: {
    //   frames: [symbolicationTableIndices for the stack frames]
    //   extraInfo: {
    //     responsiveness,
    //     time,
    //   }
    // }
    //
    // We map every stack frame to a frame.
    // Then we walk the stack, creating "stacks" (= (prefix stack, frame) pairs)
    // as needed, and arrive at the sample's stackIndex.
    var _frames = sample.frames;
    var prefix = null;
    for (var _i = 0; _i < _frames.length; _i++) {
      var frameSymbolicationTableIndex = _frames[_i];
      var frameIndex = frameMap.get(frameSymbolicationTableIndex);
      if (frameIndex === undefined) {
        frameIndex = frameTable.length++;
        frameTable.location[frameIndex] = frameSymbolicationTableIndex;
        frameTable.category[frameIndex] = null;
        frameTable.implementation[frameIndex] = null;
        frameTable.line[frameIndex] = null;
        frameTable.optimizations[frameIndex] = null;
        frameMap.set(frameSymbolicationTableIndex, frameIndex);
      }
      var stackMapKey = prefix !== null ? prefix + ':' + frameIndex : ':' + frameIndex;
      var stackIndex = stackMap.get(stackMapKey);
      if (stackIndex === undefined) {
        stackIndex = stackTable.length++;
        stackTable.prefix[stackIndex] = prefix;
        stackTable.frame[stackIndex] = frameIndex;
        stackMap.set(stackMapKey, stackIndex);
      }
      prefix = stackIndex;
    }
    var sampleIndex = samples.length++;
    samples.stack[sampleIndex] = prefix;
    var hasTime = 'time' in sample.extraInfo && typeof sample.extraInfo.time === 'number';
    var sampleTime = hasTime ? sample.extraInfo.time : lastSampleTime + interval;
    samples.time[sampleIndex] = sampleTime;
    lastSampleTime = sampleTime;
    samples.responsiveness[sampleIndex] = 'responsiveness' in sample.extraInfo ? sample.extraInfo.responsiveness : null;
    samples.rss[sampleIndex] = 'rss' in sample.extraInfo ? sample.extraInfo.rss : null;
    samples.uss[sampleIndex] = 'uss' in sample.extraInfo ? sample.extraInfo.uss : null;
  }

  for (var _i2 = 0; _i2 < thread.markers.length; _i2++) {
    var marker = thread.markers[_i2];
    var markerIndex = markers.length++;
    markers.data[markerIndex] = marker.data;
    markers.name[markerIndex] = stringTable.indexForString(marker.name);
    markers.time[markerIndex] = marker.time;
  }

  var funcTable = {
    length: 0,
    name: [],
    resource: [],
    address: [],
    isJS: []
  };
  function addFunc(name, resource, address, isJS) {
    var index = funcTable.length++;
    funcTable.name[index] = name;
    funcTable.resource[index] = resource;
    funcTable.address[index] = address;
    funcTable.isJS[index] = isJS;
  }
  var resourceTable = {
    length: 0,
    type: [],
    name: [],
    lib: [],
    icon: [],
    addonId: []
  };
  function addLibResource(name, lib) {
    var index = resourceTable.length++;
    resourceTable.type[index] = _profileData.resourceTypes.library;
    resourceTable.name[index] = name;
    resourceTable.lib[index] = lib;
  }
  function addURLResource(urlStringIndex) {
    var index = resourceTable.length++;
    resourceTable.type[index] = _profileData.resourceTypes.url;
    resourceTable.name[index] = urlStringIndex;
  }

  var libNameToResourceIndex = new Map();
  var urlToResourceIndex = new Map();
  var stringTableIndexToNewFuncIndex = new Map();

  frameTable.func = frameTable.location.map(function (locationIndex) {
    var funcNameIndex = locationIndex;
    var funcIndex = stringTableIndexToNewFuncIndex.get(funcNameIndex);
    if (funcIndex !== undefined) {
      return funcIndex;
    }

    var resourceIndex = -1;
    var addressRelativeToLib = -1;
    var isJS = false;
    var locationString = stringTable.getString(funcNameIndex);
    if (!locationString.startsWith('0x')) {
      var cppMatch = /^(.*) \(in ([^)]*)\) (\+ [0-9]+)$/.exec(locationString) || /^(.*) \(in ([^)]*)\) (\(.*:.*\))$/.exec(locationString) || /^(.*) \(in ([^)]*)\)$/.exec(locationString);
      if (cppMatch) {
        funcNameIndex = stringTable.indexForString(_cleanFunctionName(cppMatch[1]));
        var libraryNameStringIndex = stringTable.indexForString(cppMatch[2]);
        funcIndex = stringTableIndexToNewFuncIndex.get(funcNameIndex);
        if (funcIndex !== undefined) {
          return funcIndex;
        }
        if (libNameToResourceIndex.has(libraryNameStringIndex)) {
          resourceIndex = libNameToResourceIndex.get(libraryNameStringIndex);
        } else {
          resourceIndex = resourceTable.length;
          libNameToResourceIndex.set(libraryNameStringIndex, resourceIndex);
          addLibResource(libraryNameStringIndex, -1);
        }
      } else {
        var jsMatch = /^(.*) \((.*):([0-9]+)\)$/.exec(locationString) || /^()(.*):([0-9]+)$/.exec(locationString);
        if (jsMatch) {
          isJS = true;
          var scriptURI = _getRealScriptURI(jsMatch[2]);
          if (urlToResourceIndex.has(scriptURI)) {
            resourceIndex = urlToResourceIndex.get(scriptURI);
          } else {
            resourceIndex = resourceTable.length;
            urlToResourceIndex.set(scriptURI, resourceIndex);
            var urlStringIndex = scriptURI ? stringTable.indexForString(scriptURI) : null;
            addURLResource(urlStringIndex);
          }
        }
      }
    }
    funcIndex = funcTable.length;
    addFunc(funcNameIndex, resourceIndex, addressRelativeToLib, isJS);
    stringTableIndexToNewFuncIndex.set(funcNameIndex, funcIndex);
    return funcIndex;
  });
  frameTable.address = frameTable.func.map(function (funcIndex) {
    return funcTable.address[funcIndex];
  });
  delete frameTable.location;

  var threadName = thread.name;
  var processType = void 0;
  if (threadName === 'Content') {
    processType = 'tab';
  } else if (threadName === 'Plugin') {
    processType = 'plugin';
  } else {
    processType = 'default';
  }

  if (threadName === 'Content') {
    threadName = 'GeckoMain';
  }

  return {
    libs: [],
    name: threadName,
    processType: processType,
    frameTable: frameTable,
    funcTable: funcTable,
    resourceTable: resourceTable,
    stackTable: stackTable,
    markers: markers,
    samples: samples,
    stringArray: stringTable.serializeToArray()
  };
}

function arrayFromArrayLikeObject(obj) {
  var result = [];
  for (var _index in obj) {
    result[+_index] = obj[_index];
  }
  return result;
}

function _extractThreadList(profileJSON) {
  if (Array.isArray(profileJSON)) {
    // Ancient versions of the old cleopatra format did not have a threads list
    // or markers. Instead, profileJSON was just the list of samples.
    var oneThread = {
      name: 'GeckoMain',
      markers: [],
      samples: profileJSON
    };

    return [oneThread];
  }

  return arrayFromArrayLikeObject(profileJSON.threads);
}

/**
 * Convert the old cleopatra format into the serialized processed format
 * version zero.
 * @param {object} profile The input profile.
 * @returns A "processed" profile that needs to be run through the
 *          "processed format" compatibility conversion.
 */
function convertOldCleopatraProfile(profile) {
  var meta = profile.meta,
      profileJSON = profile.profileJSON;


  var threads = _extractThreadList(profileJSON);
  var symbolicationTable = arrayFromArrayLikeObject(profile.symbolicationTable);

  return {
    meta: Object.assign({}, meta, { version: _geckoProfileVersioning.CURRENT_VERSION }),
    threads: threads.map(function (t) {
      return _convertThread(t, meta.interval, symbolicationTable);
    }),
    tasktracer: (0, _taskTracer.getEmptyTaskTracerData)()
  };
}