'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WorkerChannel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('../../../utils/stream');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// will get injected
var WorkerChannel = exports.WorkerChannel = function () {
    function WorkerChannel(f, getPromise, getStream) {
        var _this = this;

        _classCallCheck(this, WorkerChannel);

        this.messageEmitter = new _stream.Emitter();

        this.w = f();
        this.getPromise = getPromise;
        this.getStream = getStream;

        // $FlowIssue
        this.w.onmessage = function (event) {
            var data = event.data;
            _this.messageEmitter.emit(data);
        };
        this.messageEmitter.attach(function (message) {
            if (message.type === 'promiseRequest') {
                _this.handlePromiseRequest(message);
            }
            if (message.type === 'streamRequest') {
                _this.handleStreamRequest(message);
            }
        });
    }

    _createClass(WorkerChannel, [{
        key: 'postToWorker',
        value: function postToWorker(m) {
            this.w.postMessage(m);
        }
    }, {
        key: 'resPromise',
        value: function resPromise(onFinish) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                _this2.messageEmitter.attach(function (message, detach) {
                    if (message.type === 'result') {
                        resolve(message.result);
                        detach();
                        onFinish();
                        _this2.w.terminate();
                    }
                    if (message.type === 'error') {
                        reject(message.error);
                        detach();
                        onFinish();
                        _this2.w.terminate();
                    }
                });
            });
        }
    }, {
        key: 'handlePromiseRequest',
        value: function handlePromiseRequest(request) {
            var _this3 = this;

            var promise = this.getPromise(request.request);

            promise.then(function (result) {
                // $FlowIssue I overload Flow logic a bit here
                var r = {
                    type: request.request.type,
                    response: result
                };
                _this3.postToWorker({
                    type: 'promiseResponseSuccess',
                    id: request.id,
                    response: r
                });
            }, function (error) {
                var message = error.message == null ? error.toString() : error.message.toString();
                _this3.postToWorker({
                    type: 'promiseResponseFailure',
                    failure: message,
                    id: request.id
                });
            });
        }
    }, {
        key: 'handleStreamRequest',
        value: function handleStreamRequest(request) {
            var _this4 = this;

            var stream = this.getStream(request.request);

            stream.values.attach(function (value) {
                _this4.postToWorker({
                    type: 'streamResponseUpdate',
                    id: request.id,
                    update: {
                        type: request.request.type,
                        response: value
                    }
                });
            });
            stream.finish.attach(function (value) {
                _this4.postToWorker({
                    type: 'streamResponseFinish',
                    id: request.id
                });
            });
        }
    }]);

    return WorkerChannel;
}();