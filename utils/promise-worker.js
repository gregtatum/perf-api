'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.provideHostSide = provideHostSide;
exports.provideWorkerSide = provideWorkerSide;

var _workerFactory = require('./worker-factory');

var _workerFactory2 = _interopRequireDefault(_workerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function provideHostSide(workerFilename, methods) {
  return function HostClass() {
    for (var _len = arguments.length, constructorArguments = Array(_len), _key = 0; _key < _len; _key++) {
      constructorArguments[_key] = arguments[_key];
    }

    var worker = new _workerFactory2.default(workerFilename);
    var callbacks = new Map(); // msgID -> { resolve, reject }
    var nextMessageID = 0;

    worker.onmessage = function (_ref) {
      var data = _ref.data;
      var msgID = data.msgID,
          type = data.type;

      var _callbacks$get = callbacks.get(msgID),
          resolve = _callbacks$get.resolve,
          reject = _callbacks$get.reject;

      callbacks.delete(msgID);
      if (type === 'success') {
        resolve(data.result);
      } else if (type === 'error') {
        reject(data.error);
      }
    };

    function makeMethod(method) {
      return function () {
        for (var _len2 = arguments.length, paramArray = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          paramArray[_key2] = arguments[_key2];
        }

        var msgID = nextMessageID++;
        worker.postMessage({ msgID: msgID, type: 'method', method: method, paramArray: paramArray });
        return new Promise(function (resolve, reject) {
          callbacks.set(msgID, { resolve: resolve, reject: reject });
        });
      };
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = methods[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var method = _step.value;

        this[method] = makeMethod(method);
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

    worker.postMessage({ type: 'constructor', constructorArguments: constructorArguments });
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
function provideWorkerSide(workerGlobal, theClass) {
  var theObject = null;
  workerGlobal.onmessage = function (_ref2) {
    var data = _ref2.data;

    if (data.type === 'constructor') {
      theObject = new (Function.prototype.bind.apply(theClass, [null].concat((0, _toConsumableArray3.default)(data.constructorArguments))))();
    } else if (data.type === 'method') {
      var _theObject;

      var msgID = data.msgID,
          method = data.method,
          paramArray = data.paramArray;

      (_theObject = theObject)[method].apply(_theObject, (0, _toConsumableArray3.default)(paramArray)).then(function (result) {
        workerGlobal.postMessage({ msgID: msgID, type: 'success', result: result });
      }, function (error) {
        workerGlobal.postMessage({
          msgID: msgID,
          type: 'error',
          error: error.toString()
        });
      });
    }
  };
}