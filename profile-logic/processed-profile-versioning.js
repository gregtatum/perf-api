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
 * This file deals with old versions of the "processed" profile format,
 * i.e. the format that perf.html uses internally. Profiles in this format
 * can be saved out to files or uploaded to the profile store server, and we
 * want to be able to display profiles that were saved at any point in the
 * past, regardless of their version. So this file upgrades old profiles to
 * the current format.
 */

exports.isProcessedProfile = isProcessedProfile;
exports.upgradeProcessedProfileToCurrentVersion = upgradeProcessedProfileToCurrentVersion;

var _dataTableUtils = require('../utils/data-table-utils');

var _profileData = require('./profile-data');

var _uniqueStringArray = require('../utils/unique-string-array');

var _timeCode = require('../utils/time-code');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CURRENT_VERSION = exports.CURRENT_VERSION = 6; // The current version of the 'preprocessed profile' format.

// Processed profiles before version 1 did not have a profile.meta.preprocessedProfileVersion
// field. Treat those as version zero.
var UNANNOTATED_VERSION = 0;

function isProcessedProfile(profile) {
  // If this profile has a .meta.preprocessedProfileVersion field,
  // then it is definitely a preprocessed profile.
  if ('meta' in profile && 'preprocessedProfileVersion' in profile.meta) {
    return true;
  }

  // This could also be a pre-version 1 profile.
  return 'threads' in profile && profile.threads.length >= 1 && 'stringArray' in profile.threads[0];
}

/**
 * Upgrades the supplied profile to the current version, by mutating |profile|.
 * Throws an exception if the profile is too new.
 * @param {object} profile The "serialized" form of a processed profile,
 *                         i.e. stringArray instead of stringTable.
 */
function upgradeProcessedProfileToCurrentVersion(profile) {
  var profileVersion = profile.meta.preprocessedProfileVersion || UNANNOTATED_VERSION;
  if (profileVersion === CURRENT_VERSION) {
    return;
  }

  if (profileVersion > CURRENT_VERSION) {
    throw new Error('Unable to parse a processed profile of version ' + profileVersion + ' - are you running an outdated version of perf.html? ' + ('The most recent version understood by this version of perf.html is version ' + CURRENT_VERSION + '.\n') + 'You can try refreshing this page in case perf.html has updated in the meantime.');
  }

  // Convert to CURRENT_VERSION, one step at a time.
  for (var destVersion = profileVersion + 1; destVersion <= CURRENT_VERSION; destVersion++) {
    if (destVersion in _upgraders) {
      _upgraders[destVersion](profile);
    }
  }

  profile.meta.preprocessedProfileVersion = CURRENT_VERSION;
}

function _archFromAbi(abi) {
  if (abi === 'x86_64-gcc3') {
    return 'x86_64';
  }
  return abi;
}

function _getRealScriptURI(url) {
  if (url) {
    var urls = url.split(' -> ');
    return urls[urls.length - 1];
  }
  return url;
}

// _upgraders[i] converts from version i - 1 to version i.
// Every "upgrader" takes the profile as its single argument and mutates it.
/* eslint-disable no-useless-computed-key */
var _upgraders = (_upgraders2 = {}, (0, _defineProperty3.default)(_upgraders2, 1, function _(profile) {
  // Starting with version 1, markers are sorted.
  (0, _timeCode.timeCode)('sorting thread markers', function () {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = profile.threads[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var thread = _step.value;

        (0, _dataTableUtils.sortDataTable)(thread.markers, thread.markers.time, function (a, b) {
          return a - b;
        });
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
  });

  // And threads have proper names and processType fields.
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = profile.threads[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var thread = _step2.value;

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
}), (0, _defineProperty3.default)(_upgraders2, 2, function _(profile) {
  // pdbName -> debugName, add arch
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = profile.threads[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var thread = _step3.value;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = thread.libs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var lib = _step4.value;

          if (!('debugName' in lib)) {
            lib.debugName = lib.pdbName;
            lib.path = lib.name;
            lib.name = lib.debugName.endsWith('.pdb') ? lib.debugName.substr(0, lib.debugName.length - 4) : lib.debugName;
            lib.arch = _archFromAbi(profile.meta.abi);
            delete lib.pdbName;
            delete lib.pdbAge;
            delete lib.pdbSignature;
          }
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
}), (0, _defineProperty3.default)(_upgraders2, 3, function _(profile) {
  // Make sure every lib has a debugPath property. We can't infer this
  // value from the other properties on the lib so we just set it to the
  // empty string.
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = profile.threads[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var thread = _step5.value;
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = thread.libs[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var lib = _step6.value;

          lib.debugPath = lib.debugPath || '';
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }
}), (0, _defineProperty3.default)(_upgraders2, 4, function _(profile) {
  profile.threads.forEach(function (thread) {
    var funcTable = thread.funcTable,
        stringArray = thread.stringArray,
        resourceTable = thread.resourceTable;

    var stringTable = new _uniqueStringArray.UniqueStringArray(stringArray);

    // resourceTable gains a new field ("host") and a new resourceType:
    // "webhost". Resources from http and https URLs are now grouped by
    // origin (protocol + host) into one webhost resource, instead of being
    // separate per-URL resources.
    // That means that multiple old resources can collapse into one new
    // resource. We need to keep track of such collapsing (using the
    // oldResourceToNewResourceMap) and then execute apply the changes to
    // the resource pointers in the funcTable.
    var newResourceTable = {
      length: 0,
      type: [],
      name: [],
      lib: [],
      icon: [],
      addonId: [],
      host: []
    };
    function addLibResource(name, lib) {
      var index = newResourceTable.length++;
      newResourceTable.type[index] = _profileData.resourceTypes.library;
      newResourceTable.name[index] = name;
      newResourceTable.lib[index] = lib;
    }
    function addWebhostResource(origin, host) {
      var index = newResourceTable.length++;
      newResourceTable.type[index] = _profileData.resourceTypes.webhost;
      newResourceTable.name[index] = origin;
      newResourceTable.host[index] = host;
    }
    function addURLResource(url) {
      var index = newResourceTable.length++;
      newResourceTable.type[index] = _profileData.resourceTypes.url;
      newResourceTable.name[index] = url;
    }
    var oldResourceToNewResourceMap = new Map();
    var originToResourceIndex = new Map();
    for (var resourceIndex = 0; resourceIndex < resourceTable.length; resourceIndex++) {
      if (resourceTable.type[resourceIndex] === _profileData.resourceTypes.library) {
        oldResourceToNewResourceMap.set(resourceIndex, newResourceTable.length);
        addLibResource(resourceTable.name[resourceIndex], resourceTable.lib[resourceIndex]);
      } else if (resourceTable.type[resourceIndex] === _profileData.resourceTypes.url) {
        var scriptURI = stringTable.getString(resourceTable.name[resourceIndex]);
        var newResourceIndex = null;
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
        if (originToResourceIndex.has(origin)) {
          newResourceIndex = originToResourceIndex.get(origin);
        } else {
          newResourceIndex = newResourceTable.length;
          originToResourceIndex.set(origin, newResourceIndex);
          var originStringIndex = stringTable.indexForString(origin);
          if (host) {
            var hostIndex = stringTable.indexForString(host);
            addWebhostResource(originStringIndex, hostIndex);
          } else {
            var urlStringIndex = stringTable.indexForString(scriptURI);
            addURLResource(urlStringIndex);
          }
        }
        oldResourceToNewResourceMap.set(resourceIndex, newResourceIndex);
      }
    }

    // funcTable gains two new fields: fileName and lineNumber. For C++ and
    // pseudo stack funcs, these fields are null. For JS funcs, they contain
    // the URL and the line number of the JS function.
    funcTable.fileName = [];
    funcTable.lineNumber = [];
    for (var funcIndex = 0; funcIndex < funcTable.length; funcIndex++) {
      var oldResourceIndex = funcTable.resource[funcIndex];
      if (oldResourceToNewResourceMap.has(oldResourceIndex)) {
        funcTable.resource[funcIndex] = oldResourceToNewResourceMap.get(oldResourceIndex);
      }
      var fileName = null;
      var lineNumber = null;
      if (funcTable.isJS[funcIndex]) {
        var funcName = stringTable.getString(funcTable.name[funcIndex]);
        var match = /^(.*) \((.*):([0-9]+)\)$/.exec(funcName) || /^()(.*):([0-9]+)$/.exec(funcName);
        if (match) {
          var _scriptURI = _getRealScriptURI(match[2]);
          if (match[1]) {
            funcTable.name[funcIndex] = stringTable.indexForString(match[1]);
          } else {
            funcTable.name[funcIndex] = stringTable.indexForString(_scriptURI);
          }
          fileName = stringTable.indexForString(_scriptURI);
          lineNumber = match[3] | 0;
        }
      }
      funcTable.fileName[funcIndex] = fileName;
      funcTable.lineNumber[funcIndex] = lineNumber;
    }

    thread.resourceTable = newResourceTable;
    thread.stringArray = stringTable.serializeToArray();
  });
}), (0, _defineProperty3.default)(_upgraders2, 5, function _(profile) {
  // The "frameNumber" column was removed from the samples table.
  var _iteratorNormalCompletion7 = true;
  var _didIteratorError7 = false;
  var _iteratorError7 = undefined;

  try {
    for (var _iterator7 = profile.threads[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
      var thread = _step7.value;

      delete thread.samples.frameNumber;
    }
  } catch (err) {
    _didIteratorError7 = true;
    _iteratorError7 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion7 && _iterator7.return) {
        _iterator7.return();
      }
    } finally {
      if (_didIteratorError7) {
        throw _iteratorError7;
      }
    }
  }
}), (0, _defineProperty3.default)(_upgraders2, 6, function _(profile) {
  var _iteratorNormalCompletion8 = true;
  var _didIteratorError8 = false;
  var _iteratorError8 = undefined;

  try {
    for (var _iterator8 = profile.threads[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
      var thread = _step8.value;
      var stringArray = thread.stringArray,
          markers = thread.markers;

      var stringTable = new _uniqueStringArray.UniqueStringArray(stringArray);
      var newDataArray = [];
      for (var i = 0; i < markers.length; i++) {
        var name = stringTable.getString(markers.name[i]);
        var data = markers.data[i];
        if (name === 'DOMEvent') {
          newDataArray[i] = {
            type: 'DOMEvent',
            startTime: data.startTime,
            endTime: data.endTime,
            eventType: data.type,
            phase: data.phase
          };
        } else {
          newDataArray[i] = data;
        }
      }
      thread.markers.data = newDataArray;
    }
  } catch (err) {
    _didIteratorError8 = true;
    _iteratorError8 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion8 && _iterator8.return) {
        _iterator8.return();
      }
    } finally {
      if (_didIteratorError8) {
        throw _iteratorError8;
      }
    }
  }
}), _upgraders2);
/* eslint-enable no-useless-computed-key */