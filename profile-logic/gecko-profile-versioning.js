'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CURRENT_VERSION = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _upgraders2; /* This Source Code Form is subject to the terms of the Mozilla Public
                  * License, v. 2.0. If a copy of the MPL was not distributed with this
                  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This file deals with old versions of the Gecko profile format, i.e. the
 * format that the Gecko profiler platform outputs. We want to be able to
 * run perf.html on non-Nightly versions of Firefox, and we want to be able
 * to load old saved profiles, so this file upgrades old profiles to the
 * current format.
*/

exports.upgradeGeckoProfileToCurrentVersion = upgradeGeckoProfileToCurrentVersion;

var _uniqueStringArray = require('../utils/unique-string-array');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CURRENT_VERSION = exports.CURRENT_VERSION = 7; // The current version of the 'raw profile' format.

// Gecko profiles before version 1 did not have a profile.meta.version field.
// Treat those as version zero.
var UNANNOTATED_VERSION = 0;

/**
 * Upgrades the supplied profile to the current version, by mutating |profile|.
 * Throws an exception if the profile is too new.
 * @param {object} profile The profile in the "Gecko profile" format.
 */
function upgradeGeckoProfileToCurrentVersion(profile) {
  var profileVersion = profile.meta.version || UNANNOTATED_VERSION;
  if (profileVersion === CURRENT_VERSION) {
    return;
  }

  if (profileVersion > CURRENT_VERSION) {
    throw new Error('Unable to parse a Gecko profile of version ' + profileVersion + ' - are you running an outdated version of perf.html? ' + ('The most recent version understood by this version of perf.html is version ' + CURRENT_VERSION + '.\n') + 'You can try refreshing this page in case perf.html has updated in the meantime.');
  }

  // Convert to CURRENT_VERSION, one step at a time.
  for (var destVersion = profileVersion + 1; destVersion <= CURRENT_VERSION; destVersion++) {
    if (destVersion in _upgraders) {
      _upgraders[destVersion](profile);
    }
  }

  profile.meta.version = CURRENT_VERSION;
}

function _archFromAbi(abi) {
  if (abi === 'x86_64-gcc3') {
    return 'x86_64';
  }
  return abi;
}

// _upgraders[i] converts from version i - 1 to version i.
// Every "upgrader" takes the profile as its single argument and mutates it.
/* eslint-disable no-useless-computed-key */
var _upgraders = (_upgraders2 = {}, (0, _defineProperty3.default)(_upgraders2, 1, function _() {
  throw new Error('Gecko profiles without version numbers are very old and no conversion code has been written for that version of the profile format.');
}), (0, _defineProperty3.default)(_upgraders2, 2, function _() {
  throw new Error('Gecko profile version 1 is very old and no conversion code has been written for that version of the profile format.');
}), (0, _defineProperty3.default)(_upgraders2, 3, function _() {
  throw new Error('Gecko profile version 2 is very old and no conversion code has been written for that version of the profile format.');
}), (0, _defineProperty3.default)(_upgraders2, 4, function _(profile) {
  function convertToVersionFourRecursive(p) {
    // In version < 3, p.libs was a JSON string.
    // Starting with version 4, libs is an actual array, each lib has
    // "debugName", "debugPath", "breakpadId" and "path" fields, and the
    // array is sorted by start address.
    p.libs = JSON.parse(p.libs).map(function (lib) {
      if ('breakpadId' in lib) {
        lib.debugName = lib.name.substr(lib.name.lastIndexOf('/') + 1);
        lib.breakpadId = lib.breakpadId;
      } else {
        lib.debugName = lib.pdbName;
        var pdbSig = lib.pdbSignature.replace(/[{}-]/g, '').toUpperCase();
        lib.breakpadId = pdbSig + lib.pdbAge;
      }
      delete lib.pdbName;
      delete lib.pdbAge;
      delete lib.pdbSignature;
      lib.path = lib.name;
      lib.name = lib.debugName.endsWith('.pdb') ? lib.debugName.substr(0, lib.debugName.length - 4) : lib.debugName;
      lib.arch = _archFromAbi(p.meta.abi);
      lib.debugPath = '';
      return lib;
    }).sort(function (a, b) {
      return a.start - b.start;
    });

    for (var threadIndex = 0; threadIndex < p.threads.length; threadIndex++) {
      if (typeof p.threads[threadIndex] === 'string') {
        // Also do the modification to embedded subprocess profiles.
        var subprocessProfile = JSON.parse(p.threads[threadIndex]);
        convertToVersionFourRecursive(subprocessProfile);
        p.threads[threadIndex] = JSON.stringify(subprocessProfile);
      } else {
        // At the beginning of format version 3, the thread name for any
        // threads in a "tab" process was "Content", and the processType
        // field did not exist. When this was changed, the version was not
        // updated, so we handle both cases here.
        var thread = p.threads[threadIndex];
        if (!('processType' in thread)) {
          if (thread.name === 'Content') {
            thread.processType = 'tab';
            thread.name = 'GeckoMain';
          } else if (thread.name === 'Plugin') {
            thread.processType = 'plugin';
          } else {
            thread.processType = 'default';
          }
        }
      }
    }

    p.meta.version = 4;
  }
  convertToVersionFourRecursive(profile);
}), (0, _defineProperty3.default)(_upgraders2, 5, function _(profile) {
  // In version 4, profiles from other processes were embedded as JSON
  // strings in the threads array. Version 5 breaks those out into a
  // separate "processes" array and no longer stringifies them.
  function convertToVersionFiveRecursive(p) {
    var allThreadsAndProcesses = p.threads.map(function (threadOrProcess) {
      if (typeof threadOrProcess === 'string') {
        var processProfile = JSON.parse(threadOrProcess);
        convertToVersionFiveRecursive(processProfile);
        return {
          type: 'process',
          data: processProfile
        };
      }
      return {
        type: 'thread',
        data: threadOrProcess
      };
    });
    p.processes = allThreadsAndProcesses.filter(function (x) {
      return x.type === 'process';
    }).map(function (p) {
      return p.data;
    });
    p.threads = allThreadsAndProcesses.filter(function (x) {
      return x.type === 'thread';
    }).map(function (t) {
      return t.data;
    });
    p.meta.version = 5;
  }
  convertToVersionFiveRecursive(profile);
}), (0, _defineProperty3.default)(_upgraders2, 6, function _(profile) {
  // The frameNumber column was removed from the samples table.
  function convertToVersionSixRecursive(p) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = p.threads[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var thread = _step.value;

        delete thread.samples.schema.frameNumber;
        for (var sampleIndex = 0; sampleIndex < thread.samples.data.length; sampleIndex++) {
          // Truncate the array to a maximum length of 5.
          // The frameNumber used to be the last item, at index 5.
          thread.samples.data[sampleIndex].splice(5);
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

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = p.processes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var subprocessProfile = _step2.value;

        convertToVersionSixRecursive(subprocessProfile);
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
  }
  convertToVersionSixRecursive(profile);
}), (0, _defineProperty3.default)(_upgraders2, 7, function _(profile) {
  // The type field for DOMEventMarkerPayload was renamed to eventType.
  function convertToVersionSevenRecursive(p) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = p.threads[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var thread = _step3.value;

        var stringTable = new _uniqueStringArray.UniqueStringArray(thread.stringTable);
        var nameIndex = thread.markers.schema.name;
        var dataIndex = thread.markers.schema.data;
        for (var i = 0; i < thread.markers.data.length; i++) {
          var name = stringTable.getString(thread.markers.data[i][nameIndex]);
          if (name === 'DOMEvent') {
            var data = thread.markers.data[i][dataIndex];
            data.eventType = data.type;
            data.type = 'DOMEvent';
          }
        }
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

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = p.processes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var subprocessProfile = _step4.value;

        convertToVersionSevenRecursive(subprocessProfile);
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  }
  convertToVersionSevenRecursive(profile);
}), _upgraders2);
/* eslint-enable no-useless-computed-key */