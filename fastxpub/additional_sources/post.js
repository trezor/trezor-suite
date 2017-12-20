    /*
    typedef struct {
    uint32_t depth;
    uint32_t fingerprint;
    uint32_t child_num;
    uint8_t chain_code[32];
    uint8_t private_key[32];
    uint8_t public_key[33];
    } HDNode;
    */

    var readyDfd = deferred();

    Module['onRuntimeInitialized'] = function() {
        var HEAPU8 = Module['HEAPU8'];

        var _malloc = Module['_malloc'];
        var _hdnode_public_ckd_xpub_optimized = Module['_hdnode_public_ckd_xpub_optimized'];
        var _hdnode_public_ckd_address_optimized = Module['_hdnode_public_ckd_address_optimized'];
        var _hdnode_deserialize = Module['_hdnode_deserialize'];
        var _hdnode_fingerprint = Module['_hdnode_fingerprint'];
        var _hdnode_public_ckd = Module['_hdnode_public_ckd'];
        var _hdnode_serialize_public = Module['_hdnode_serialize_public'];
        var _ecdsa_read_pubkey = Module['_ecdsa_read_pubkey'];
        var Pointer_stringify = Module['Pointer_stringify'];

        // HDNode structs global
        var PUBPOINT_SIZE = 2 * 9 * 4; // (2 * bignum256 =  2 * 9 * uint32_t)
        var _pubpoint = _malloc(PUBPOINT_SIZE);
        var PUBKEY_SIZE = 33;
        var _pubkey = _malloc(PUBKEY_SIZE);
        var CHAINCODE_SIZE = 32;
        var _chaincode = _malloc(CHAINCODE_SIZE);

        var HDNODE_SIZE = 3 * 4 + 32 + 32 + 33;
        var _hdnode = _malloc(HDNODE_SIZE);

        // address string global
        var ADDRESS_SIZE = 60; // maximum size
        var _address = _malloc(ADDRESS_SIZE);

        var XPUB_SIZE = 200; // maximum size
        var _xpub = _malloc(XPUB_SIZE);

        var fingerprint = 0;

        /*
        * public library interface
        */

        function loadNodeStruct(xpub, version_public) {
            stringToUTF8(xpub, _xpub, XPUB_SIZE);
            if (_hdnode_deserialize(_xpub, version_public, 0, _hdnode, 0) != 0) {
                throw new Error("Wrong XPUB type!!"); // abort everything (should not happen, should be catched already outside of asm.js, but this is emergency)
            };
            fingerprint = _hdnode_fingerprint(_hdnode);
        }

        /**
        * @param {HDNode} node  HDNode struct, see the definition above
        */
        function loadNode(node) {
            var u8_pubkey = new Uint8Array(PUBKEY_SIZE);
            u8_pubkey.set(node['public_key'], 0);
            HEAPU8.set(u8_pubkey, _pubkey);

            var u8_chaincode = new Uint8Array(CHAINCODE_SIZE);
            u8_chaincode.set(node['chain_code'], 0);
            HEAPU8.set(u8_chaincode, _chaincode);

            _ecdsa_read_pubkey(0, _pubkey, _pubpoint);
        }

        function deriveNodeFromStruct(index, version_public) {
            _hdnode_public_ckd(_hdnode, index);
            _hdnode_serialize_public(_hdnode, fingerprint, version_public, _xpub, XPUB_SIZE);
            return UTF8ToString(_xpub);
        }

        function deriveNode(xpub, index, version_public) {
            loadNodeStruct(xpub, version_public);
            return deriveNodeFromStruct(index, version_public);
        }

        /**
        * @param {Number} index          BIP32 index of the address
        * @param {Number} version        address version byte
        * @param {Number} addressFormat  address format (0 = normal, 1 = segwit-in-p2sh)
        * @return {String}
        */
        function deriveAddress(index, version, addressFormat) {
            _hdnode_public_ckd_address_optimized(_pubpoint, _chaincode, index, version, _address, ADDRESS_SIZE, addressFormat);
            return Pointer_stringify(_address);
        }

        /**
        * @param {HDNode} node           HDNode struct, see the definition above
        * @param {Number} firstIndex     index of the first address
        * @param {Number} lastIndex      index of the last address
        * @param {Number} version        address version byte
        * @param {Number} addressFormat  address format (0 = normal, 1 = segwit-in-p2sh)
        * @return {Array<String>}
        */
        function deriveAddressRange(node, firstIndex, lastIndex, version, addressFormat) {
            var addresses = [];
            loadNode(node);
            for (var i = firstIndex; i <= lastIndex; i++) {
                addresses.push(deriveAddress(i, version, addressFormat));
            }
            return addresses;
        }

        /*
        * Web worker processing
        */

        function processMessage(event) {
            var data = event['data'];
            var type = data['type'];

            switch (type) {
            case 'deriveAddressRange':
                var addresses = deriveAddressRange(
                    data['node'],
                    data['firstIndex'],
                    data['lastIndex'],
                    data['version'],
                    data['addressFormat']
                );
                self.postMessage({
                    'addresses': addresses,
                    'firstIndex': data['firstIndex'],
                    'lastIndex': data['lastIndex'],
                    'i': data['i']
                });
                break;
            case 'deriveNode':
                var node = deriveNode(
                    data['xpub'],
                    data['index'],
                    data['version']
                );
                self.postMessage({
                    'xpub': node,
                    'i': data['i']
                });
                break;
            default:
                throw new Error('Unknown message type: ' + type);
            }
        }
        readyDfd.resolve({
            'processMessage': processMessage,
            'loadNode': loadNode,
            'deriveAddress': deriveAddress,
            'deriveNode': deriveNode,
            'deriveAddressRange': deriveAddressRange,
        });
    }
    return readyDfd.promise;
}


// ------ asynchronous wasm file setup ------

// setting up calls for webworker
// (not for browserify/node import)
// init() loads the wasm file; unless the wasm file is loaded, the other functions wait

var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
if (ENVIRONMENT_IS_WORKER) {

    // callsDfd is resolved when init is finished
    var callsDfd = deferred();

    self.onmessage = function(event) {
        var data = event['data'];
        var type = data['type'];

        // type is either init or something else
        // init inits right away, else it waits for init
        if (type === 'init') {
            var binary = data['binary'];
            prepareModule(binary).then(function (result) {
                callsDfd.resolve(result);
            });
        } else {
            callsDfd.promise.then(function (calls) {
                // self.postMessage is called in the processMessage call
                calls['processMessage'](event);
            });
        };
    };
}

// setting up exports for node / browserify import
// (not in webworker environment)
// init() loads the wasm file; unless the wasm file is loaded, the other functions return error
// init() returns promise, resolved when init is done
if (typeof module !== 'undefined') {
    var calls = null;

    // this is a function that is exported and that loads the binary
    var init = function(binary) {
        return prepareModule(binary).then(function(retCalls) {
            calls = retCalls;
        })
    }

    function callFunctionIfInited(name) {
        return function () {
            if (calls === null) {
                throw new Error('fastxpub not yet inited.');
            } else {
                return calls[name].apply(undefined, arguments);
            }
        }
    }

    module['exports'] = {
        'deriveNode': callFunctionIfInited('deriveNode'),
        'loadNode': callFunctionIfInited('loadNode'),
        'deriveAddress': callFunctionIfInited('deriveAddress'),
        'deriveAddressRange': callFunctionIfInited('deriveAddressRange'),
        'init': init
    }
}
