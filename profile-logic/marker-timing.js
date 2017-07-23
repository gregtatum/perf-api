'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.getMarkerTiming = getMarkerTiming;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Arbitrarily set an upper limit for adding marker depths, avoiding an infinite loop.
var MAX_STACKING_DEPTH = 300;

/**
 * This function computes the timing information for laying out the markers in the
 * TimelineMarkers component. Each marker is put into a single row based on its name.
 *
 * e.g. An array of 15 markers named either "A", "B", or "C" would be translated into
 *      something that looks like:
 *
 *  [
 *    {
 *      name: "A",
 *      start: [0, 23, 35, 65, 75],
 *      end: [1, 25, 37, 67, 77],
 *      index: [0, 2, 5, 6, 8],
 *      label: ["Aye", "Aye", "Aye", "Aye", "Aye"]
 *    }
 *    {
 *      name: "B",
 *      start: [1, 28, 39, 69, 70],
 *      end: [2, 29, 49, 70, 77],
 *      index: [1, 3, 7, 9, 10],
 *      label: ["Bee", "Bee", "Bee", "Bee", "Bee"]
 *    }
 *    {
 *      name: "C",
 *      start: [10, 33, 45, 75, 85],
 *      end: [11, 35, 47, 77, 87],
 *      index: [4, 11, 12, 13, 14],
 *      label: ["Sea", "Sea", "Sea", "Sea", "Sea"]
 *    }
 *  ]
 *
 * If a marker of a name has timings that overlap in a single row, then it is broken
 * out into multiple rows, with the overlapping timings going in the next rows. The
 * getMarkerTiming tests show the behavior of how this works in practice.
 *
 * This structure allows the markers to easily be laid out like this example below:
 *    ____________________________________________
 *   | GC           | *--*       *--*        *--* |
 *   |              |                             |
 *   | Scripts      | *---------------------*     |
 *   |              |                             |
 *   | User Timings |    *----------------*       |
 *   | User Timings |       *------------*        |
 *   | User Timings |       *--*     *---*        |
 *   |______________|_____________________________|
 */
function getMarkerTiming(tracingMarkers) {
  var _ref;

  // Each marker type will have it's own timing information, later collapse these into
  var markerTimingsMap = new Map();

  // Go through all of the markers.
  for (var tracingMarkerIndex = 0; tracingMarkerIndex < tracingMarkers.length; tracingMarkerIndex++) {
    var marker = tracingMarkers[tracingMarkerIndex];
    var markerTimingsByName = markerTimingsMap.get(marker.name);
    if (markerTimingsByName === undefined) {
      markerTimingsByName = [];
      markerTimingsMap.set(marker.name, markerTimingsByName);
    }

    // Place the marker in the closest row that is empty.
    for (var i = 0; i < MAX_STACKING_DEPTH; i++) {
      // Get or create a row for marker timings.
      var markerTimingsRow = markerTimingsByName[i];
      if (!markerTimingsRow) {
        markerTimingsRow = {
          start: [],
          end: [],
          index: [],
          label: [],
          name: marker.name,
          length: 0
        };
        markerTimingsByName.push(markerTimingsRow);
      }

      var continueSearching = false;

      // Search for a spot not already taken up by another marker of this type.
      for (var j = 0; j < markerTimingsRow.length; j++) {
        var otherStart = markerTimingsRow.start[j];
        var otherEnd = markerTimingsRow.end[j];
        if (otherStart > marker.start + marker.dur) {
          break;
        }
        if (otherEnd > marker.start) {
          continueSearching = true;
          break;
        }
      }

      if (!continueSearching) {
        // An empty spot was found, fill the values in the table.
        markerTimingsRow.start.push(marker.start);
        markerTimingsRow.end.push(marker.start + marker.dur);
        markerTimingsRow.label.push(computeMarkerLabel(marker.data));
        markerTimingsRow.index.push(tracingMarkerIndex);
        markerTimingsRow.length++;
        break;
      }
    }
  }

  // Flatten out the map into a single array.
  return (_ref = []).concat.apply(_ref, (0, _toConsumableArray3.default)(markerTimingsMap.values()));
}

function computeMarkerLabel(data) {
  // Satisfy flow's type checker.
  if (data !== null && (typeof data === 'undefined' ? 'undefined' : (0, _typeof3.default)(data)) === 'object') {
    // Handle different marker payloads.
    switch (data.type) {
      case 'UserTiming':
        return data.name;
      case 'DOMEvent':
        return data.eventType;
      default:
    }
  }

  return '';
}