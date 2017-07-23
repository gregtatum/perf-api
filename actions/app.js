'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.changeSelectedTab = changeSelectedTab;
exports.profilePublished = profilePublished;
exports.changeTabOrder = changeTabOrder;
function changeSelectedTab(selectedTab) {
  return {
    type: 'CHANGE_SELECTED_TAB',
    selectedTab: selectedTab
  };
} /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function profilePublished(hash) {
  return {
    type: 'PROFILE_PUBLISHED',
    hash: hash
  };
}

function changeTabOrder(tabOrder) {
  return {
    type: 'CHANGE_TAB_ORDER',
    tabOrder: tabOrder
  };
}