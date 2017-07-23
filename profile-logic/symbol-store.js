'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SymbolStore = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _symbolStoreDb = require('./symbol-store-db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Lets you get symbol tables and only requests them from the symbol provider once.
 * @class SymbolStore
 * @classdesc A broker that lets you request stuff as often as you want.
 */
var SymbolStore = exports.SymbolStore = function () {

  /**
   * SymbolStore constructor.
   * @param {string} dbNamePrefix   A prefix for the indexedDB database which the SymbolStore
   *                                uses internally (using asyncStorage) to store symbol tables.
   * @param {object} symbolProvider An object with a method 'requestSymbolTable(debugName, breakpadId)'
   *                                which will be called whenever we need a symbol table. This method
   *                                needs to return a promise of [addr, syms] (the symbol table).
   */
  function SymbolStore(dbNamePrefix, symbolProvider) {
    (0, _classCallCheck3.default)(this, SymbolStore);

    this._symbolProvider = symbolProvider;
    this._db = new _symbolStoreDb.SymbolStoreDB(dbNamePrefix + '-symbol-tables');

    // A set of strings identifying libraries that we have requested
    // symbols for but gotten an error back.
    this._failedRequests = new Set();

    // A map with one entry for each library that we have requested (but not yet
    // received) symbols for. The keys are strings (libid), and the values are
    // promises that resolve to [ addrs, index, buffer ] symbol tables.
    this._requestedSymbolTables = new Map();
  }

  (0, _createClass3.default)(SymbolStore, [{
    key: '_getSymbolTable',
    value: function _getSymbolTable(lib) {
      var _this = this;

      var debugName = lib.debugName,
          breakpadId = lib.breakpadId;

      var libid = debugName + '/' + breakpadId;

      if (this._failedRequests.has(libid)) {
        return Promise.reject(new Error("We've tried to request a symbol table for this library before and failed, so we're not trying again."));
      }

      var existingRequest = this._requestedSymbolTables.get(libid);
      if (existingRequest !== undefined) {
        // We've already requested a symbol table for this library and are
        // waiting for the result, so just return the promise for the existing
        // request.
        return existingRequest;
      }

      // Try to get the symbol table from the database
      var symbolTablePromise = this._db.getSymbolTable(debugName, breakpadId).catch(function () {
        // Request the symbol table from the symbol provider.
        var symbolTablePromise = _this._symbolProvider.requestSymbolTable(debugName, breakpadId).catch(function (error) {
          console.error('Failed to symbolicate library ' + debugName, error);
          _this._failedRequests.add(libid);
          _this._requestedSymbolTables.delete(libid);
          throw error;
        });

        // Once the symbol table comes in, store it in the database, but don't
        // let that block the promise that we return to our caller.
        symbolTablePromise.then(function (symbolTable) {
          _this._db.storeSymbolTable(debugName, breakpadId, symbolTable).then(function () {
            _this._requestedSymbolTables.delete(libid);
          }, function (error) {
            console.error('Failed to store the symbol table for ' + debugName + ' ' + breakpadId + ' in the database:', error);
            // We'll keep the symbolTablePromise in _requestedSymbolTables so
            // that we'll the symbolTable around for future requests even though
            // we failed to put it into the database.
          });
        });

        return symbolTablePromise;
      });
      this._requestedSymbolTables.set(libid, symbolTablePromise);
      return symbolTablePromise;
    }

    /**
     * Get the array of symbol addresses for the given library.
     * @param  {Library} lib A library object with the properties `debugName` and `breakpadId`.
     * @return {Promise<number[]>} A promise of the array of addresses.
     */

  }, {
    key: 'getFuncAddressTableForLib',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(lib) {
        var _ref2, _ref3, addrs;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._getSymbolTable(lib);

              case 2:
                _ref2 = _context.sent;
                _ref3 = (0, _slicedToArray3.default)(_ref2, 1);
                addrs = _ref3[0];
                return _context.abrupt('return', addrs);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getFuncAddressTableForLib(_x) {
        return _ref.apply(this, arguments);
      }

      return getFuncAddressTableForLib;
    }()

    /**
     * Get an array of symbol strings for the given symbol indices.
     * @param  {number[]} requestedAddressesIndices An array where each element is the index of the symbol whose string should be looked up.
     * @param  {Library} lib A library object with the properties `debugName` and `breakpadId`.
     * @return {Promise<string[]>} An promise array of strings, in the order as requested.
     */

  }, {
    key: 'getSymbolsForAddressesInLib',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(requestedAddressesIndices, lib) {
        var _ref5, _ref6, index, buffer, decoder;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._getSymbolTable(lib);

              case 2:
                _ref5 = _context2.sent;
                _ref6 = (0, _slicedToArray3.default)(_ref5, 3);
                index = _ref6[1];
                buffer = _ref6[2];
                decoder = new TextDecoder();
                return _context2.abrupt('return', requestedAddressesIndices.map(function (addrIndex) {
                  var startOffset = index[addrIndex];
                  var endOffset = index[addrIndex + 1];
                  var subarray = buffer.subarray(startOffset, endOffset);
                  return decoder.decode(subarray);
                }));

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getSymbolsForAddressesInLib(_x2, _x3) {
        return _ref4.apply(this, arguments);
      }

      return getSymbolsForAddressesInLib;
    }()
  }]);
  return SymbolStore;
}(); /* This Source Code Form is subject to the terms of the Mozilla Public
      * License, v. 2.0. If a copy of the MPL was not distributed with this
      * file, You can obtain one at http://mozilla.org/MPL/2.0/. */