'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.getCallTree = getCallTree;

var _timeCode = require('../utils/time-code');

var _profileData = require('./profile-data');

var _uniqueStringArray = require('../utils/unique-string-array');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function extractFaviconFromLibname(libname) {
  var url = new URL('/favicon.ico', libname);
  return url.href;
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var ProfileTree = function () {
  // A table column matching the funcStackTable
  function ProfileTree(funcStackTable, funcStackTimes, funcStackChildCount, funcTable, resourceTable, stringTable, rootTotalTime, rootCount, jsOnly) {
    (0, _classCallCheck3.default)(this, ProfileTree);

    this._funcStackTable = funcStackTable;
    this._funcStackTimes = funcStackTimes;
    this._funcStackChildCount = funcStackChildCount;
    this._funcTable = funcTable;
    this._resourceTable = resourceTable;
    this._stringTable = stringTable;
    this._rootTotalTime = rootTotalTime;
    this._rootCount = rootCount;
    this._nodes = new Map();
    this._children = new Map();
    this._jsOnly = jsOnly;
  }

  (0, _createClass3.default)(ProfileTree, [{
    key: 'getRoots',
    value: function getRoots() {
      return this.getChildren(-1);
    }

    /**
     * Return an array of funcStackIndex for the children of the node with index funcStackIndex.
     * @param  {[type]} funcStackIndex [description]
     * @return {[type]}                [description]
     */

  }, {
    key: 'getChildren',
    value: function getChildren(funcStackIndex) {
      var _this = this;

      var children = this._children.get(funcStackIndex);
      if (children === undefined) {
        var childCount = funcStackIndex === -1 ? this._rootCount : this._funcStackChildCount[funcStackIndex];
        children = [];
        for (var childFuncStackIndex = funcStackIndex + 1; childFuncStackIndex < this._funcStackTable.length && children.length < childCount; childFuncStackIndex++) {
          if (this._funcStackTable.prefix[childFuncStackIndex] === funcStackIndex && this._funcStackTimes.totalTime[childFuncStackIndex] !== 0) {
            children.push(childFuncStackIndex);
          }
        }
        children.sort(function (a, b) {
          return _this._funcStackTimes.totalTime[b] - _this._funcStackTimes.totalTime[a];
        });
        this._children.set(funcStackIndex, children);
      }
      return children;
    }
  }, {
    key: 'hasChildren',
    value: function hasChildren(funcStackIndex) {
      return this.getChildren(funcStackIndex).length !== 0;
    }
  }, {
    key: 'getParent',
    value: function getParent(funcStackIndex) {
      return this._funcStackTable.prefix[funcStackIndex];
    }
  }, {
    key: 'getDepth',
    value: function getDepth(funcStackIndex) {
      return this._funcStackTable.depth[funcStackIndex];
    }
  }, {
    key: 'hasSameNodeIds',
    value: function hasSameNodeIds(tree) {
      return this._funcStackTable === tree._funcStackTable;
    }

    /**
     * Return an object with information about the node with index funcStackIndex.
     * @param  {[type]} funcStackIndex [description]
     * @return {[type]}                [description]
     */

  }, {
    key: 'getNode',
    value: function getNode(funcStackIndex) {
      var node = this._nodes.get(funcStackIndex);
      if (node === undefined) {
        var funcIndex = this._funcStackTable.func[funcStackIndex];
        var funcName = this._stringTable.getString(this._funcTable.name[funcIndex]);
        var resourceIndex = this._funcTable.resource[funcIndex];
        var resourceType = this._resourceTable.type[resourceIndex];
        var isJS = this._funcTable.isJS[funcIndex];
        var libName = this._getOriginAnnotation(funcIndex);

        node = {
          totalTime: this._funcStackTimes.totalTime[funcStackIndex].toFixed(1) + 'ms',
          totalTimePercent: (100 * this._funcStackTimes.totalTime[funcStackIndex] / this._rootTotalTime).toFixed(1) + '%',
          selfTime: this._funcStackTimes.selfTime[funcStackIndex].toFixed(1) + 'ms',
          name: funcName,
          lib: libName,
          // Dim platform pseudo-stacks.
          dim: !isJS && this._jsOnly,
          icon: resourceType === _profileData.resourceTypes.webhost ? extractFaviconFromLibname(libName) : null
        };
        this._nodes.set(funcStackIndex, node);
      }
      return node;
    }
  }, {
    key: '_getOriginAnnotation',
    value: function _getOriginAnnotation(funcIndex) {
      var fileNameIndex = this._funcTable.fileName[funcIndex];
      if (fileNameIndex !== null) {
        var fileName = this._stringTable.getString(fileNameIndex);
        var lineNumber = this._funcTable.lineNumber[funcIndex];
        if (lineNumber !== null) {
          return fileName + ':' + lineNumber;
        }
        return fileName;
      }

      var resourceIndex = this._funcTable.resource[funcIndex];
      var resourceNameIndex = this._resourceTable.name[resourceIndex];
      if (resourceNameIndex !== undefined) {
        return this._stringTable.getString(resourceNameIndex);
      }

      return '';
    }
  }]);
  return ProfileTree;
}();

function getCallTree(thread, interval, funcStackInfo, implementationFilter, invertCallstack) {
  return (0, _timeCode.timeCode)('getCallTree', function () {
    var funcStackTable = funcStackInfo.funcStackTable,
        stackIndexToFuncStackIndex = funcStackInfo.stackIndexToFuncStackIndex;

    var sampleFuncStacks = (0, _profileData.getSampleFuncStacks)(thread.samples, stackIndexToFuncStackIndex);

    var funcStackSelfTime = new Float32Array(funcStackTable.length);
    var funcStackTotalTime = new Float32Array(funcStackTable.length);
    var funcStackLeafTime = void 0;
    var numChildren = new Uint32Array(funcStackTable.length);
    if (invertCallstack) {
      var funcStackToRoot = new Int32Array(funcStackTable.length);
      funcStackLeafTime = new Float32Array(funcStackTable.length);
      for (var funcStackIndex = 0; funcStackIndex < funcStackToRoot.length; funcStackIndex++) {
        var prefixFuncStack = funcStackTable.prefix[funcStackIndex];
        if (prefixFuncStack !== -1) {
          funcStackToRoot[funcStackIndex] = funcStackToRoot[prefixFuncStack];
        } else {
          funcStackToRoot[funcStackIndex] = funcStackIndex;
        }
      }

      for (var sampleIndex = 0; sampleIndex < sampleFuncStacks.length; sampleIndex++) {
        var _funcStackIndex = sampleFuncStacks[sampleIndex];
        if (_funcStackIndex !== null) {
          var rootIndex = funcStackToRoot[_funcStackIndex];
          funcStackSelfTime[rootIndex] += interval;
          funcStackLeafTime[_funcStackIndex] += interval;
        }
      }
    } else {
      funcStackLeafTime = funcStackSelfTime;
      for (var _sampleIndex = 0; _sampleIndex < sampleFuncStacks.length; _sampleIndex++) {
        var _funcStackIndex2 = sampleFuncStacks[_sampleIndex];
        if (_funcStackIndex2 !== null) {
          funcStackSelfTime[_funcStackIndex2] += interval;
        }
      }
    }

    var rootTotalTime = 0;
    var numRoots = 0;
    for (var _funcStackIndex3 = funcStackTotalTime.length - 1; _funcStackIndex3 >= 0; _funcStackIndex3--) {
      funcStackTotalTime[_funcStackIndex3] += funcStackLeafTime[_funcStackIndex3];
      if (funcStackTotalTime[_funcStackIndex3] === 0) {
        continue;
      }
      var _prefixFuncStack = funcStackTable.prefix[_funcStackIndex3];
      if (_prefixFuncStack === -1) {
        rootTotalTime += funcStackTotalTime[_funcStackIndex3];
        numRoots++;
      } else {
        funcStackTotalTime[_prefixFuncStack] += funcStackTotalTime[_funcStackIndex3];
        numChildren[_prefixFuncStack]++;
      }
    }
    var funcStackTimes = {
      selfTime: funcStackSelfTime,
      totalTime: funcStackTotalTime
    };
    var jsOnly = implementationFilter === 'js';
    return new ProfileTree(funcStackTable, funcStackTimes, numChildren, thread.funcTable, thread.resourceTable, thread.stringTable, rootTotalTime, numRoots, jsOnly);
  });
}