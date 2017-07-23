'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SymbolStoreDB = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var kTwoWeeksInMilliseconds = 2 * 7 * 24 * 60 * 60 * 1000;

/**
 * A wrapper around an IndexedDB table that stores symbol tables.
 * @class SymbolStoreDB
 * @classdesc Where does this description show up?
 */

var SymbolStoreDB = exports.SymbolStoreDB = function () {
  // in milliseconds

  /**
   * @param {string} dbName   The name of the indexedDB database that's used
   *                          to store the symbol tables.
   * @param {number} maxCount The maximum number of symbol tables to have in
   *                          storage at the same time.
   * @param {number} maxAge   The maximum age, in milliseconds, before stored
   *                          symbol tables should get evicted.
   */
  function SymbolStoreDB(dbName) {
    var maxCount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 200;
    var maxAge = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : kTwoWeeksInMilliseconds;
    (0, _classCallCheck3.default)(this, SymbolStoreDB);

    this._dbPromise = this._setupDB(dbName);
    this._maxCount = maxCount;
    this._maxAge = maxAge;
  }

  (0, _createClass3.default)(SymbolStoreDB, [{
    key: '_getDB',
    value: function _getDB() {
      if (this._dbPromise) {
        return this._dbPromise;
      }
      return Promise.reject(new Error('The database is closed.'));
    }
  }, {
    key: '_setupDB',
    value: function _setupDB(dbName) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var indexedDB = window.indexedDB;
        var openReq = indexedDB.open(dbName, 2);
        openReq.onerror = function () {
          if (openReq.error.name === 'VersionError') {
            // This error fires if the database already exists, and the existing
            // database has a higher version than what we requested. So either
            // this version of perf.html is outdated, or somebody briefly tried
            // to change this database format (and increased the version number)
            // and then downgraded to a version of perf.html without those
            // changes.
            // We delete the database and try again.
            var deleteDBReq = indexedDB.deleteDatabase(dbName);
            deleteDBReq.onerror = function () {
              return reject(deleteDBReq.error);
            };
            deleteDBReq.onsuccess = function () {
              // Try to open the database again.
              _this._setupDB(dbName).then(resolve, reject);
            };
          } else {
            reject(openReq.error);
          }
        };
        openReq.onupgradeneeded = function (_ref) {
          var oldVersion = _ref.oldVersion;

          var db = openReq.result;
          db.onerror = reject;

          if (oldVersion === 1) {
            db.deleteObjectStore('symbol-tables');
          }
          var store = db.createObjectStore('symbol-tables', {
            keyPath: ['debugName', 'breakpadId']
          });
          store.createIndex('lastUsedDate', 'lastUsedDate');
        };

        openReq.onblocked = function () {
          reject(new Error('The symbol store database could not be upgraded because it is ' + 'open in another tab. Please close all your other perf-html.io ' + 'tabs and refresh.'));
        };

        openReq.onsuccess = function () {
          var db = openReq.result;
          db.onversionchange = function () {
            db.close();
          };
          resolve(db);
          _this._deleteAllBeforeDate(db, new Date(+new Date() - _this._maxAge)).catch(function (e) {
            console.error('Encountered error while cleaning out database:', e);
          });
        };
      });
    }

    /**
     * Store the symbol table for a given library.
     * @param {string}      The debugName of the library.
     * @param {string}      The breakpadId of the library.
     * @param {symbolTable} The symbol table, in SymbolTableAsTuple format.
     * @return              A promise that resolves (with nothing) once storage
     *                      has succeeded.
     */

  }, {
    key: 'storeSymbolTable',
    value: function storeSymbolTable(debugName, breakpadId, _ref2) {
      var _this2 = this;

      var _ref3 = (0, _slicedToArray3.default)(_ref2, 3),
          addrs = _ref3[0],
          index = _ref3[1],
          buffer = _ref3[2];

      return this._getDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var transaction = db.transaction('symbol-tables', 'readwrite');
          transaction.onerror = function () {
            return reject(transaction.error);
          };
          var store = transaction.objectStore('symbol-tables');
          _this2._deleteLeastRecentlyUsedUntilCountIsNoMoreThanN(store, _this2._maxCount - 1, function () {
            var lastUsedDate = new Date();
            var addReq = store.add({
              debugName: debugName,
              breakpadId: breakpadId,
              addrs: addrs,
              index: index,
              buffer: buffer,
              lastUsedDate: lastUsedDate
            });
            addReq.onsuccess = function () {
              return resolve();
            };
          });
        });
      });
    }

    /**
     * Retrieve the symbol table for the given library.
     * @param {string}      The debugName of the library.
     * @param {string}      The breakpadId of the library.
     * @return              A promise that resolves with the symbol table (in
     *                      SymbolTableAsTuple format), or fails if we couldn't
     *                      find a symbol table for the requested library.
     */

  }, {
    key: 'getSymbolTable',
    value: function getSymbolTable(debugName, breakpadId) {
      return this._getDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var transaction = db.transaction('symbol-tables', 'readwrite');
          transaction.onerror = function () {
            return reject(transaction.error);
          };
          var store = transaction.objectStore('symbol-tables');
          var req = store.openCursor([debugName, breakpadId]);
          req.onsuccess = function () {
            var cursor = req.result;
            if (cursor) {
              var value = cursor.value;
              value.lastUsedDate = new Date();
              var updateDateReq = cursor.update(value);
              var _addrs = value.addrs,
                  _index = value.index,
                  _buffer = value.buffer;

              updateDateReq.onsuccess = function () {
                return resolve([_addrs, _index, _buffer]);
              };
            } else {
              reject(new Error('The requested library does not exist in the database.'));
            }
          };
        });
      });
    }
  }, {
    key: 'close',
    value: function close() {
      var _this3 = this;

      // Close the database and make all methods uncallable.
      return this._getDB().then(function (db) {
        db.close();
        _this3._dbPromise = null;
      });
    }

    // Many of the utility functions below use callback functions instead of
    // promises. That's because IndexedDB transactions auto-close at the end of
    // the current event tick if there hasn't been a new request after the last
    // success event. So we need to synchronously add more work inside the
    // onsuccess handler, and we do that by calling the callback function.
    // Resolving a promise only calls any then() callback at the next microtask,
    // and by that time the transaction will already have closed.
    // We don't propagate errors because those will be caught by the onerror
    // handler of the transaction that we got `store` from.

  }, {
    key: '_deleteAllBeforeDate',
    value: function _deleteAllBeforeDate(db, beforeDate) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var transaction = db.transaction('symbol-tables', 'readwrite');
        transaction.onerror = function () {
          return reject(transaction.error);
        };
        var store = transaction.objectStore('symbol-tables');
        _this4._deleteRecordsLastUsedBeforeDate(store, beforeDate, resolve);
      });
    }
  }, {
    key: '_deleteRecordsLastUsedBeforeDate',
    value: function _deleteRecordsLastUsedBeforeDate(store, beforeDate, callback) {
      var lastUsedDateIndex = store.index('lastUsedDate');
      // Get a cursor that walks all records whose lastUsedDate is less than beforeDate.
      var cursorReq = lastUsedDateIndex.openCursor(window.IDBKeyRange.upperBound(beforeDate, true));
      // Iterate over all records in this cursor and delete them.
      cursorReq.onsuccess = function () {
        var cursor = cursorReq.result;
        if (cursor) {
          cursor.delete().onsuccess = function () {
            cursor.continue();
          };
        } else {
          callback();
        }
      };
    }
  }, {
    key: '_deleteNLeastRecentlyUsedRecords',
    value: function _deleteNLeastRecentlyUsedRecords(store, n, callback) {
      // Get a cursor that walks the records from oldest to newest
      var lastUsedDateIndex = store.index('lastUsedDate');
      var cursorReq = lastUsedDateIndex.openCursor();
      var deletedCount = 0;
      cursorReq.onsuccess = function () {
        var cursor = cursorReq.result;
        if (cursor) {
          var deleteReq = cursor.delete();
          deleteReq.onsuccess = function () {
            deletedCount++;
            if (deletedCount < n) {
              cursor.continue();
            } else {
              callback();
            }
          };
        } else {
          callback();
        }
      };
    }
  }, {
    key: '_count',
    value: function _count(store, callback) {
      var countReq = store.count();
      countReq.onsuccess = function () {
        return callback(countReq.result);
      };
    }
  }, {
    key: '_deleteLeastRecentlyUsedUntilCountIsNoMoreThanN',
    value: function _deleteLeastRecentlyUsedUntilCountIsNoMoreThanN(store, n, callback) {
      var _this5 = this;

      this._count(store, function (symbolTableCount) {
        if (symbolTableCount > n) {
          // We'll need to remove at least one symbol table.
          var needToRemoveCount = symbolTableCount - n;
          _this5._deleteNLeastRecentlyUsedRecords(store, needToRemoveCount, callback);
        } else {
          callback();
        }
      });
    }
  }]);
  return SymbolStoreDB;
}();