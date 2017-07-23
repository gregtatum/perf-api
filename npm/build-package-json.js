'use strict';

var fs = require('fs');
var path = require('path');
var cpx = require('cpx');

var packageJson = Object.assign({}, require('../../package.json'), {
  name: 'perf-api',
  description: 'A programmatic API for performance data.',
  version: '0.0.0',
  main: 'npm/index.js'
});

deleteFromObject(packageJson, ['scripts', 'devDependencies', 'jest', 'lint-staged', 'babel']);

deleteFromObject(packageJson.dependencies, ['react', 'babel-runtime', 'react', 'react-addons-perf', 'react-contextmenu', 'react-dom', 'react-redux', 'react-transition-group']);

function deleteFromObject(object, keys) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;

      delete object[key];
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
}

var targetPackageJsonPath = path.join(__dirname, '../../dist-npm/package.json');

try {
  fs.writeFileSync(targetPackageJsonPath, JSON.stringify(packageJson, null, 2));
} catch (error) {
  console.log('Could not write out the package.json file');
  console.log(error);
}

console.log('Created the package.json file at ' + targetPackageJsonPath);

var targetReadmePath = path.join(__dirname, '../../dist-npm');

cpx.copy(path.join(__dirname, './README.md'), targetReadmePath, function (error) {
  if (error) {
    console.log('Could not copy the README.md');
    console.log(error);
  } else {
    console.log('Created the README.md file at ' + targetReadmePath + '/README.md');
  }
});