// Wraps worker file into a module on the main thread

module.exports = function (source, map, foo, bar) {
    this.cacheable();
    // prevent handshake
    var clean = source.replace('common.handshake', '// common.handshake');

    return `
// BlockchainLinkWorker: pack worker file into function
function initModule(postFn) {
    var onmessage;
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