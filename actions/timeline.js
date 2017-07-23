'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changeFlameChartColorStrategy = changeFlameChartColorStrategy;
exports.changeFlameChartLabelingStrategy = changeFlameChartLabelingStrategy;
exports.changeTimelineFlameChartExpandedThread = changeTimelineFlameChartExpandedThread;
exports.changeTimelineMarkersExpandedThread = changeTimelineMarkersExpandedThread;
exports.setHasZoomedViaMousewheel = setHasZoomedViaMousewheel;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function changeFlameChartColorStrategy(getCategory) {
  return {
    type: 'CHANGE_FLAME_CHART_COLOR_STRATEGY',
    getCategory: getCategory
  };
}

function changeFlameChartLabelingStrategy(getLabel) {
  return {
    type: 'CHANGE_FLAME_CHART_LABELING_STRATEGY',
    getLabel: getLabel
  };
}

function changeTimelineFlameChartExpandedThread(threadIndex, isExpanded) {
  var type = 'CHANGE_TIMELINE_FLAME_CHART_EXPANDED_THREAD';
  return { type: type, threadIndex: threadIndex, isExpanded: isExpanded };
}

function changeTimelineMarkersExpandedThread(threadIndex, isExpanded) {
  var type = 'CHANGE_TIMELINE_MARKERS_EXPANDED_THREAD';
  return { type: type, threadIndex: threadIndex, isExpanded: isExpanded };
}

function setHasZoomedViaMousewheel() {
  return { type: 'HAS_ZOOMED_VIA_MOUSEWHEEL' };
}