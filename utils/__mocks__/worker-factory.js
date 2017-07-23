'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

exports.shutdownWorkers = shutdownWorkers;

var _workerjs = require('workerjs');

var _workerjs2 = _interopRequireDefault(_workerjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var workerFiles = {
  // Paths are relative to workerjs' requireworker.js file
  'zee-worker': '../../res/zee-worker.js',
  worker: '../../src/profile-logic/summary-worker/index.js'
};

var workerInstances = [];

var _class = function _class(file) {
  (0, _classCallCheck3.default)(this, _class);

  var worker = new _workerjs2.default(workerFiles[file]);
  workerInstances.push(worker);
  return worker;
};

exports.default = _class;
function shutdownWorkers() {
  workerInstances.forEach(function (worker) {
    return worker.terminate();
  });
  workerInstances.length = 0;
}