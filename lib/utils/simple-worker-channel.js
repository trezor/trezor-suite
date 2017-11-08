'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// requires an exclusive access to worker.
// requires worker to reply in a linear manner (strict FIFO).
var WorkerChannel = exports.WorkerChannel = function () {
    function WorkerChannel(worker) {
        _classCallCheck(this, WorkerChannel);

        this.worker = worker;
        this.pending = [];
        this.onMessage = this.receiveMessage.bind(this);
        // this.onError = this.receiveError.bind(this);
        this.open();
    }

    _createClass(WorkerChannel, [{
        key: 'open',
        value: function open() {
            this.worker.addEventListener('message', this.onMessage);
        }
    }, {
        key: 'postMessage',
        value: function postMessage(msg) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                _this.pending.push({ resolve: resolve, reject: reject });
                _this.worker.postMessage(msg);
            });
        }
    }, {
        key: 'receiveMessage',
        value: function receiveMessage(event) {
            var dfd = this.pending.shift();
            if (dfd) {
                dfd.resolve(event.data);
            }
        }
    }]);

    return WorkerChannel;
}();

// Super simple webworker interface.
// Used ONLY for the address generation;
// socket worker + discovery workers have more complicated protocols