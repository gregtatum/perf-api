"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMessageHandler;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function createMessageHandler(thread, store, handlers) {
  function call(fn) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    store.dispatch(fn.apply(undefined, args));
  }

  thread.onmessage = function messageHandler(event) {
    var message = event.data;
    var handler = handlers[message.type];
    if (!handler) {
      throw new Error("A message of type \"" + message.type + "\" was received that did not have a handler");
    }
    handler(message, call);
  };
}