'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uintArrayToString = uintArrayToString;
exports.stringToUintArray = stringToUintArray;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Space-efficient url component compatible encoding for arrays of 32bit
 * unsigned integers. Smaller numbers take up fewer characters.
 */

var encodingChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ._';

function uintToString(value) {
  var x = value;
  var r = encodingChars[x & 31];
  x >>= 5;
  while (x !== 0) {
    r = encodingChars[32 + (x & 31)] + r;
    x >>= 5;
  }
  return r;
}

function uintArrayToString(array) {
  return array.map(uintToString).join('');
}

function encodingCharToNumber(x) {
  switch (x) {
    // encodingChars.split('').map((c, i) => `    case '${c}': return ${i};`).join('\n')
    case '0':
      return 0;
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
    case '5':
      return 5;
    case '6':
      return 6;
    case '7':
      return 7;
    case '8':
      return 8;
    case '9':
      return 9;
    case 'a':
      return 10;
    case 'b':
      return 11;
    case 'c':
      return 12;
    case 'd':
      return 13;
    case 'e':
      return 14;
    case 'f':
      return 15;
    case 'g':
      return 16;
    case 'h':
      return 17;
    case 'i':
      return 18;
    case 'j':
      return 19;
    case 'k':
      return 20;
    case 'l':
      return 21;
    case 'm':
      return 22;
    case 'n':
      return 23;
    case 'o':
      return 24;
    case 'p':
      return 25;
    case 'q':
      return 26;
    case 'r':
      return 27;
    case 's':
      return 28;
    case 't':
      return 29;
    case 'u':
      return 30;
    case 'v':
      return 31;
    case 'w':
      return 32;
    case 'x':
      return 33;
    case 'y':
      return 34;
    case 'z':
      return 35;
    case 'A':
      return 36;
    case 'B':
      return 37;
    case 'C':
      return 38;
    case 'D':
      return 39;
    case 'E':
      return 40;
    case 'F':
      return 41;
    case 'G':
      return 42;
    case 'H':
      return 43;
    case 'I':
      return 44;
    case 'J':
      return 45;
    case 'K':
      return 46;
    case 'L':
      return 47;
    case 'M':
      return 48;
    case 'N':
      return 49;
    case 'O':
      return 50;
    case 'P':
      return 51;
    case 'Q':
      return 52;
    case 'R':
      return 53;
    case 'S':
      return 54;
    case 'T':
      return 55;
    case 'U':
      return 56;
    case 'V':
      return 57;
    case 'W':
      return 58;
    case 'X':
      return 59;
    case 'Y':
      return 60;
    case 'Z':
      return 61;
    case '.':
      return 62;
    case '_':
      return 63;
    default:
      return 0;
  }
}

function stringToUintArray(s) {
  var array = [];
  var val = 0;
  for (var i = 0; i < s.length; i++) {
    var x = encodingCharToNumber(s[i]);
    val = (val << 5) + (x & 31);
    if ((x & 32) === 0) {
      array.push(val);
      val = 0;
    }
  }
  return array;
}