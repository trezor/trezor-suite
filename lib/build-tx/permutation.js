"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Helper class for permutation
var Permutation = exports.Permutation = function () {
    function Permutation(sorted, permutation) {
        _classCallCheck(this, Permutation);

        this.sorted = [];

        this.sorted = sorted;
        this._permutation = permutation;
    }

    // Permutation is an array,
    // where on Ith position is J, which means that Jth element in the original, unsorted
    // output array
    // is Ith in the new array.


    _createClass(Permutation, [{
        key: "forEach",
        value: function forEach(f) {
            this._permutation.forEach(f);
        }
    }, {
        key: "map",
        value: function map(fun) {
            var original = this.sorted.map(fun);
            var perm = this._permutation;
            var res = new Permutation(original, perm);
            return res;
        }
    }], [{
        key: "fromFunction",
        value: function fromFunction(original, sort) {
            var range = [].concat(_toConsumableArray(original.keys()));

            // I am "sorting range" - (0,1,2,3,...)
            // so I got the indexes and not the actual values inside
            var permutation = range.sort(function (a, b) {
                return sort(original[a], original[b]);
            });
            var res = new Permutation([], permutation);

            res.forEach(function (originalIx, newIx) {
                res.sorted[newIx] = original[originalIx];
            });
            return res;
        }
    }]);

    return Permutation;
}();