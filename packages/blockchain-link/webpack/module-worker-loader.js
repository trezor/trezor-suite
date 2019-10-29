// Wraps worker file into a module on the main thread
/* eslint-disable */
module.exports = function (source, map, foo, bar) {
    this.cacheable();
    // prevent handshake
    var clean = source.replace('"use strict"', '').replace('common.handshake', '// common.handshake');

    return `
// BlockchainLinkWorker: pack worker file into function
function initModule(postFn) {
    // create references for global methods used in worker
    var onmessage;
    var postMessage = function() {};
    // worker content
    ${clean}
    // use BlockchainLinkWorker callback
    common.post = postFn;
    // return this onmessage method
    return onmessage;
};

// prepare Worker class
var BlockchainLinkWorker = (function () {
    function BlockchainLinkWorker() {
        var _this = this;
        // pass worker postMessage to parent
        // _this.onmessage couldn't be bind at this point
        // this function is provided after this constructor
        var onMessage = initModule(function (data) {
            _this.onmessage({ data: data });
        });
        // pass parent message to worker
        this.postMessage = function(data) {
            onMessage({ data: data });
        }
        // init communication
        setTimeout(function () {
            _this.onmessage({ data: { id: -1, type: 'm_handshake' } });
        }, 100);
    }
    BlockchainLinkWorker.prototype.postMessage = function (message) {};
    BlockchainLinkWorker.prototype.onmessage = function (message) {};
    BlockchainLinkWorker.prototype.terminate = function () {
        this.postMessage({ type: 'terminate' });
    };
    return BlockchainLinkWorker;
}());
exports.default = BlockchainLinkWorker;

`;
};