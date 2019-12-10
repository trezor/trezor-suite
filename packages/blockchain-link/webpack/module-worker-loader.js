// Wraps worker file into a module on the main thread
/* eslint-disable */
module.exports = function (source, map, foo, bar) {
    this.cacheable();
    // disable handshake sent from Worker, handshake will be called from BlockchainLinkWorker module constructor (below)
    var clean = source.replace('common.handshake();', '');

    return `
// BlockchainLinkWorker: wrap whole worker file into function to allow multiple initializations
function initModule(postFn) {
    // create missing references for worker globals
    var onmessage;
    var postMessage = postFn;
    // worker content start
    ${clean}
    // worker content end
    // return worker "onmessage" function to BlockchainLinkWorker module
    return onmessage;
};

// Module with an interface of the Web Worker
var BlockchainLinkWorker = (function () {
    function BlockchainLinkWorker() {
        var _this = this;
        // Names are confusing:
        // _this.onmessage   - listener set by parent who initialize Worker. Reflection of Worker.postMessage. Passes data from Worker to parent
        // _this.postMessage - listener declared inside Worker. Reflection of Worker.onmessage. Passes data from parent to Worker

        // _this.onmessage couldn't be bind at this point yet since it will be set later by parent
        var workerPostMessage = function (data) {
            _this.onmessage({ data: data });
        }
    
        // init Worker module
        // pass custom "postMessage" function to Worker and get Worker.onmessage reference
        var workerOnMessage = initModule(workerPostMessage);
        
        // send message from parent to Worker
        _this.postMessage = function(data) {
            workerOnMessage({ data: data });
        }
        // send handshake to parent
        // timeout is necessary here since Worker.onmessage listener is set after this constructor
        setTimeout(function () {
            workerPostMessage({ id: -1, type: 'm_handshake' });
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