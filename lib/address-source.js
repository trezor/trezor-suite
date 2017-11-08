'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WorkerAddressSource = exports.WorkerAddressSource = function () {
    function WorkerAddressSource(channel, node, version, segwit) {
        _classCallCheck(this, WorkerAddressSource);

        this.channel = channel;
        this.node = {
            depth: node.depth,
            child_num: node.index,
            fingerprint: node.parentFingerprint,
            chain_code: Array.prototype.slice.call(node.chainCode),
            public_key: Array.prototype.slice.call(node.keyPair.getPublicKeyBuffer())
        };
        this.version = version;
        this.segwit = segwit;
    }

    _createClass(WorkerAddressSource, [{
        key: 'derive',
        value: function derive(firstIndex, lastIndex) {
            var request = {
                type: 'deriveAddressRange',
                node: this.node,
                version: this.version,
                firstIndex: firstIndex,
                lastIndex: lastIndex,
                addressFormat: this.segwit === 'p2sh' ? 1 : 0
            };
            return this.channel.postMessage(request).then(function (_ref) {
                var addresses = _ref.addresses;
                return addresses;
            });
        }
    }]);

    return WorkerAddressSource;
}(); /* 
      * Derivation of addresses from HD nodes
      */