'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

exports.summarizeProfile = summarizeProfile;
exports.categorizeThreadSamples = categorizeThreadSamples;
exports.summarizeCategories = summarizeCategories;
exports.calculateRollingSummaries = calculateRollingSummaries;

var _timeCode = require('../utils/time-code');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A list of strategies for matching sample names to patterns.
 */
var match = {
  exact: function exact(symbol, pattern) {
    return symbol === pattern;
  },
  prefix: function prefix(symbol, pattern) {
    return symbol.startsWith(pattern);
  },
  substring: function substring(symbol, pattern) {
    return symbol.includes(pattern);
  },
  stem: function stem(symbol, pattern) {
    return symbol === pattern || symbol.startsWith(pattern + '(');
  }
};

/**
 * Categories is a list that includes the necessary information to match a sample to
 * a category. This list will need to be adjusted as the engine implementation switches.
 * Each category definition is a tuple that takes the following form:
 *
 * [
 *   matches, // A function that returns true/false for how the pattern should be matched.
 *   pattern, // The pattern that should match the sample name.
 *   category, // The category to finally label the sample.
 * ]
 */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var categories = [[match.exact, 'js::RunScript', 'script'], [match.stem, 'js::Nursery::collect', 'GC'], [match.stem, 'js::GCRuntime::collect', 'GC'], [match.prefix, 'mozilla::RestyleManager::', 'restyle'], [match.substring, 'RestyleManager', 'restyle'], [match.stem, 'PresShell::ProcessReflowCommands', 'layout'], [match.prefix, 'nsCSSFrameConstructor::', 'frameconstruction'], [match.stem, 'PresShell::DoReflow', 'layout'], [match.substring, '::compileScript(', 'script'], [match.prefix, 'nsCycleCollector', 'CC'], [match.prefix, 'nsPurpleBuffer', 'CC'], [match.substring, 'pthread_mutex_lock', 'wait'], // eg __GI___pthread_mutex_lock
[match.prefix, 'nsRefreshDriver::IsWaitingForPaint', 'paint'], // arguable, I suppose
[match.stem, 'PresShell::Paint', 'paint'], [match.prefix, '__poll', 'wait'], [match.prefix, '__pthread_cond_wait', 'wait'], [match.stem, 'PresShell::DoUpdateApproximateFrameVisibility', 'layout'], // could just as well be paint
[match.substring, 'mozilla::net::', 'network'], [match.stem, 'nsInputStreamReadyEvent::Run', 'network'],

// [match.stem, 'NS_ProcessNextEvent', 'eventloop'],
[match.exact, 'nsJSUtil::EvaluateString', 'script'], [match.prefix, 'js::frontend::Parser', 'script.parse'], [match.prefix, 'js::jit::IonCompile', 'script.compile.ion'], [match.prefix, 'js::jit::BaselineCompiler::compile', 'script.compile.baseline'], [match.prefix, 'CompositorBridgeParent::Composite', 'paint'], [match.prefix, 'mozilla::layers::PLayerTransactionParent::Read(', 'messageread'], [match.prefix, 'mozilla::dom::', 'dom'], [match.prefix, 'nsDOMCSSDeclaration::', 'restyle'], [match.prefix, 'nsHTMLDNS', 'network'], [match.substring, 'IC::update(', 'script.icupdate'], [match.prefix, 'js::jit::CodeGenerator::link(', 'script.link'], [match.exact, 'base::WaitableEvent::Wait()', 'idle'],
// TODO - if mach_msg_trap is called by RunCurrentEventLoopInMode, then it
// should be considered idle time. Add a fourth entry to this tuple
// for child checks?
[match.exact, 'mach_msg_trap', 'wait'],

// Can't do this until we come up with a way of labeling ion/baseline.
[match.prefix, 'Interpret(', 'script.execute.interpreter']];

function summarizeProfile(profile) {
  return (0, _timeCode.timeCode)('summarizeProfile', function () {
    var threadCategories = categorizeThreadSamples(profile);
    var rollingSummaries = calculateRollingSummaries(profile, threadCategories);
    var summaries = summarizeCategories(profile, threadCategories);

    return profile.threads.map(function (thread, i) {
      return {
        threadIndex: i,
        threadName: thread.name,
        rollingSummary: rollingSummaries[i],
        summary: summaries[i]
      };
    });
  });
}

/**
 * Return a function that categorizes a function name. The categories
 * are cached between calls.
 * @returns {function} Function categorizer.
 */
function functionNameCategorizer() {
  var cache = new Map();
  return function functionNameToCategory(name) {
    var existingCategory = cache.get(name);
    if (existingCategory !== undefined) {
      return existingCategory;
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = categories[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref = _step.value;

        var _ref2 = (0, _slicedToArray3.default)(_ref, 3);

        var matches = _ref2[0];
        var pattern = _ref2[1];
        var category = _ref2[2];

        if (matches(name, pattern)) {
          cache.set(name, category);
          return category;
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

    cache.set(name, false);
    return false;
  };
}

/**
 * A function that categorizes a sample.
 */


/**
 * Given a profile, return a function that categorizes a sample.
 * @param {object} thread Thread from a profile.
 * @return {function} Sample stack categorizer.
 */
function sampleCategorizer(thread) {
  var categorizeFuncName = functionNameCategorizer();

  function computeCategory(stackIndex) {
    if (stackIndex === null) {
      return null;
    }

    var frameIndex = thread.stackTable.frame[stackIndex];
    var implIndex = thread.frameTable.implementation[frameIndex];
    if (implIndex !== null) {
      // script.execute.baseline or script.execute.ion
      return 'script.execute.' + thread.stringTable._array[implIndex];
    }

    var funcIndex = thread.frameTable.func[frameIndex];
    var name = thread.stringTable._array[thread.funcTable.name[funcIndex]];
    var category = categorizeFuncName(name);
    if (category !== false && category !== 'wait') {
      return category;
    }

    var prefixCategory = categorizeSampleStack(thread.stackTable.prefix[stackIndex]);
    if (category === 'wait') {
      if (prefixCategory === null || prefixCategory === 'uncategorized') {
        return 'wait';
      }
      if (prefixCategory.endsWith('.wait') || prefixCategory === 'wait') {
        return prefixCategory;
      }
      return prefixCategory + '.wait';
    }

    return prefixCategory;
  }

  var stackCategoryCache = new Map();

  function categorizeSampleStack(stackIndex) {
    if (stackIndex === null) {
      return null;
    }
    var category = stackCategoryCache.get(stackIndex);
    if (category !== undefined) {
      return category;
    }

    category = computeCategory(stackIndex);
    stackCategoryCache.set(stackIndex, category);
    return category;
  }

  return categorizeSampleStack;
}

/**
 * Count the number of samples in a given category. This will also count subcategories
 * in the case of categories labeled like "script.link", so "script" and "script.link"
 * will each be counted as having a sample.
 * @param {object} summary - Accumulates the counts.
 * @param {string} fullCategoryName - The name of the category.
 * @returns {object} summary
 */
function summarizeSampleCategories(summary, fullCategoryName) {
  if (fullCategoryName !== null) {
    var _categories = fullCategoryName.split('.');

    while (_categories.length > 0) {
      var category = _categories.join('.');
      summary[category] = (summary[category] || 0) + 1;
      _categories.pop();
    }
  }
  return summary;
}

/**
 * Finalize the summary calculation by attaching percentages and sorting the result.
 * @param {object} summary - The object that summarizes the times of the samples.
 * @return {array} The summary with percentages.
 */
function calculateSummaryPercentages(summary) {
  var rows = objectEntries(summary);

  var sampleCount = rows.reduce(function (sum, _ref3) {
    var _ref4 = (0, _slicedToArray3.default)(_ref3, 2),
        name = _ref4[0],
        count = _ref4[1];

    // Only count the sample if it's not a sub-category. For instance "script.link"
    // is a sub-category of "script".
    return sum + (name.includes('.') ? 0 : count);
  }, 0);

  return rows.map(function (_ref5) {
    var _ref6 = (0, _slicedToArray3.default)(_ref5, 2),
        category = _ref6[0],
        samples = _ref6[1];

    var percentage = samples / sampleCount;
    return { category: category, samples: samples, percentage: percentage };
  })
  // Sort by sample count, then by name so that the results are deterministic.
  .sort(function (a, b) {
    if (a.samples === b.samples) {
      return a.category.localeCompare(b.category);
    }
    return b.samples - a.samples;
  });
}

function logStacks(stacksInCategory) {
  var maxLogLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

  var entries = objectEntries(stacksInCategory);
  var data = entries.sort(function (_ref7, _ref8) {
    var _ref10 = (0, _slicedToArray3.default)(_ref7, 2),
        a = _ref10[1].total;

    var _ref9 = (0, _slicedToArray3.default)(_ref8, 2),
        b = _ref9[1].total;

    return b - a;
  }).slice(0, Math.min(maxLogLength, entries.length));

  /* eslint-disable no-console */
  console.log('Top ' + maxLogLength + ' stacks in selected category');
  console.log(data);
  /* eslint-enable no-console */
}

function stackToString(stackIndex, thread) {
  var stackTable = thread.stackTable,
      frameTable = thread.frameTable,
      funcTable = thread.funcTable,
      stringTable = thread.stringTable;

  var stack = [];
  var nextStackIndex = stackIndex;
  while (nextStackIndex !== null) {
    var frameIndex = stackTable.frame[nextStackIndex];
    var funcIndex = frameTable.func[frameIndex];
    var name = stringTable._array[funcTable.name[funcIndex]];
    stack.push(name);
    nextStackIndex = stackTable.prefix[nextStackIndex];
  }
  return stack.join('\n');
}

function incrementPerThreadCount(container, key, threadName) {
  var count = container[key] || (0, _defineProperty3.default)({ total: 0 }, threadName, 0);
  count.total++;
  count[threadName]++;
  container[key] = count;
}

function countStacksInCategory(profile, threadCategories) {
  var category = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'uncategorized';

  var stacksInCategory = {};
  profile.threads.forEach(function (thread, i) {
    var categories = threadCategories[i];
    var samples = thread.samples;

    for (var sampleIndex = 0; sampleIndex < samples.length; sampleIndex++) {
      if (categories[sampleIndex] === category) {
        var _stackIndex = samples.stack[sampleIndex];
        if (_stackIndex !== null) {
          var stringCallStack = stackToString(_stackIndex, thread);
          incrementPerThreadCount(stacksInCategory, stringCallStack, thread.name);
        }
      }
    }
  });
  return stacksInCategory;
}

/**
 * Take a profile and return a summary that categorizes each sample, then calculate
 * a summary of the percentage of time each sample was present.
 * @param {array} profile - The current profile.
 * @returns {array} Stacks mapped to categories.
 */
function categorizeThreadSamples(profile) {
  return (0, _timeCode.timeCode)('categorizeThreadSamples', function () {
    var threadCategories = mapProfileToThreadCategories(profile);

    if (process.env.NODE_ENV === 'development') {
      // Change the constant to display the top stacks of a different category.
      var categoryToDump = 'uncategorized';
      var stacks = countStacksInCategory(profile, threadCategories, categoryToDump);
      console.log(Object.keys(stacks).length + ' stacks labeled \'' + categoryToDump + '\'');
      logStacks(stacks);
    }

    return threadCategories;
  });
}

function mapProfileToThreadCategories(profile) {
  return profile.threads.map(function (thread) {
    var categorizer = sampleCategorizer(thread);
    return thread.samples.stack.map(categorizer);
  });
}

/**
 * Take a profile and return a summary that categorizes each sample, then calculate
 * a summary of the percentage of time each sample was present.
 * @param {object} profile - The profile to summarize.
 * @param {object} threadCategories - Each thread's categories for the samples.
 * @returns {object} The summaries of each thread.
 */
function summarizeCategories(profile, threadCategories) {
  return threadCategories.map(function (categories) {
    return categories.reduce(summarizeSampleCategories, {});
  }).map(calculateSummaryPercentages);
}

function calculateRollingSummaries(profile, threadCategories) {
  var segmentCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 40;
  var rolling = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 4;

  var _profile$threads$map$ = profile.threads.map(function (thread) {
    return [thread.samples.time[0], thread.samples.time[thread.samples.time.length - 1]];
  }).reduce(function (a, b) {
    return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
  }),
      _profile$threads$map$2 = (0, _slicedToArray3.default)(_profile$threads$map$, 2),
      minTime = _profile$threads$map$2[0],
      maxTime = _profile$threads$map$2[1];

  var totalTime = maxTime - minTime;
  var segmentLength = totalTime / segmentCount;
  var segmentHalfLength = segmentLength / 2;
  var rollingLength = segmentLength * rolling;
  var rollingHalfLength = segmentLength * rolling / 2;

  return profile.threads.map(function (thread, threadIndex) {
    var categories = threadCategories[threadIndex];
    var rollingSummary = [];

    var _loop = function _loop(i) {
      var samplesInRange = 0;
      var samples = {};

      var rollingMinTime = minTime + i * segmentLength + segmentHalfLength - rollingHalfLength;
      var rollingMaxTime = rollingMinTime + rollingLength;

      for (var sampleIndex = 0; sampleIndex < thread.samples.time.length; sampleIndex++) {
        var time = thread.samples.time[sampleIndex];
        if (time > rollingMinTime) {
          if (time > rollingMaxTime) {
            break;
          }
          var category = categories[sampleIndex];
          if (category !== null) {
            samples[category] = (samples[category] || 0) + 1;
            samplesInRange++;
          }
        }
      }

      rollingSummary.push({
        samples: samples,
        percentage: mapObj(samples, function (count) {
          return count / samplesInRange;
        })
      });
    };

    for (var i = 0; i < segmentCount; i++) {
      _loop(i);
    }

    return rollingSummary;
  });
}

function mapObj(object, fn) {
  var i = 0;
  var mappedObj = {};
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      i++;
      mappedObj[key] = fn(object[key], key, i);
    }
  }
  return mappedObj;
}

/**
 * Flow requires a type-safe implementation of Object.entries().
 * See: https://github.com/facebook/flow/issues/2174
 */
function objectEntries(object) {
  var entries = [];
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      entries.push([key, object[key]]);
    }
  }
  return entries;
}