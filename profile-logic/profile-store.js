'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadBinaryProfileData = uploadBinaryProfileData;
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function uploadBinaryProfileData(data) {
  var progressChangeCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(xhr.responseText);
      } else {
        reject(new Error('xhr onload with status != 200, xhr.statusText: ' + xhr.statusText));
      }
    };

    xhr.onerror = function () {
      reject(new Error('xhr onerror was called, xhr.statusText: ' + xhr.statusText));
    };

    xhr.upload.onprogress = function (e) {
      if (progressChangeCallback && e.lengthComputable) {
        progressChangeCallback(e.loaded / e.total);
      }
    };

    xhr.open('POST', 'https://profile-store.appspot.com/compressed-store');
    xhr.send(data);
  });
}