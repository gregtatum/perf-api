'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFriendlyThreadName = exports.getCallTree = exports.processProfile = undefined;

var _processProfile = require('../profile-logic/process-profile');

var _profileTree = require('../profile-logic/profile-tree');

var _profileData = require('../profile-logic/profile-data');

function getCallTreePublic(profile, thread) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  return (0, _profileTree.getCallTree)(thread, profile.meta.interval, options.funcStackInfo || (0, _profileData.getFuncStackInfo)(thread.stackTable, thread.frameTable, thread.funcTable), options.implementationFilter || 'combined', options.invert || false);
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.processProfile = _processProfile.unserializeProfileOfArbitraryFormat;
exports.getCallTree = getCallTreePublic;
exports.getFriendlyThreadName = _profileData.getFriendlyThreadName;