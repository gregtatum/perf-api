'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* stolen from the light theme at devtools/client/themes/variables.css */
var themeHighlightGreen = '#2cbb0f';
var themeHighlightBlue = '#0088cc';
var themeHighlightBluegrey = '#0072ab';
var themeHighlightPurple = '#5b5fff';
var themeHighlightOrange = '#f13c00';
var themeHighlightRed = '#ed2655';
var themeHighlightPink = '#b82ee5';
var themeHighlightGray = '#b4babf'; /* except for this one, I made this one darker */

var styles = exports.styles = {
  default: {
    top: 0,
    height: 6,
    background: 'black',
    squareCorners: false,
    borderLeft: null,
    borderRight: null
  },
  RefreshDriverTick: {
    background: 'hsla(0,0%,0%,0.05)',
    height: 18,
    squareCorners: true
  },
  RD: {
    background: 'hsla(0,0%,0%,0.05)',
    height: 18,
    squareCorners: true
  },
  Scripts: {
    background: themeHighlightOrange,
    top: 6
  },
  Styles: {
    background: themeHighlightBluegrey,
    top: 7
  },
  FireScrollEvent: {
    background: themeHighlightOrange,
    top: 7
  },
  Reflow: {
    background: themeHighlightBlue,
    top: 7
  },
  DispatchSynthMouseMove: {
    background: themeHighlightOrange,
    top: 8
  },
  DisplayList: {
    background: themeHighlightPurple,
    top: 9
  },
  LayerBuilding: {
    background: themeHighlightPink,
    top: 9
  },
  Rasterize: {
    background: themeHighlightGreen,
    top: 10
  },
  ForwardTransaction: {
    background: themeHighlightRed,
    top: 11
  },
  NotifyDidPaint: {
    background: themeHighlightGray,
    top: 12
  },
  LayerTransaction: {
    background: themeHighlightRed
  },
  Composite: {
    background: themeHighlightBlue
  },
  Vsync: {
    background: 'rgb(255, 128, 0)'
  },
  LayerContentGPU: {
    background: 'rgba(0,200,0,0.5)'
  },
  LayerCompositorGPU: {
    background: 'rgba(0,200,0,0.5)'
  },
  LayerOther: {
    background: 'rgb(200,0,0)'
  },
  Jank: {
    background: 'hsl(0,90%,70%)',
    borderLeft: 'hsl(0,90%,50%)',
    borderRight: 'hsl(0,90%,50%)',
    squareCorners: true
  }
};

for (var name in styles) {
  if (name !== 'default') {
    styles[name] = Object.assign({}, styles.default, styles[name]);
  }
}

var overlayFills = exports.overlayFills = {
  HOVERED: 'hsla(0,0%,100%,0.3)',
  PRESSED: 'rgba(0,0,0,0.3)'
};