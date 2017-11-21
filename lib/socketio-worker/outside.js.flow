'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Socket = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.setLogCommunication = setLogCommunication;

var _stream = require('../utils/stream');

var _deferred = require('../utils/deferred');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logCommunication = false;
function setLogCommunication() {
    logCommunication = true;
}

var Socket = exports.Socket = function () {
    function Socket(workerFactory, endpoint) {
        _classCallCheck(this, Socket);

        this.streams = [];

        this.endpoint = endpoint;
        this.socket = new SocketWorkerHandler(workerFactory);
        this._socketInited = this.socket.init(this.endpoint);
    }

    _createClass(Socket, [{
        key: 'send',
        value: function send(message) {
            var _this = this;

            return this._socketInited.then(function () {
                return _this.socket.send(message);
            });
        }
    }, {
        key: 'close',
        value: function close() {
            var _this2 = this;

            this.streams.forEach(function (stream) {
                return stream.dispose();
            });
            this._socketInited.then(function () {
                return _this2.socket.close();
            }, function () {});
        }
    }, {
        key: 'observe',
        value: function observe(event) {
            var _this3 = this;

            var res = _stream.Stream.fromPromise(this._socketInited.then(function () {
                return _this3.socket.observe(event);
            }));
            this.streams.push(res);
            return res;
        }
    }, {
        key: 'subscribe',
        value: function subscribe(event) {
            var _this4 = this;

            for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                values[_key - 1] = arguments[_key];
            }

            return this._socketInited.then(function () {
                var _socket;

                return (_socket = _this4.socket).subscribe.apply(_socket, [event].concat(values));
            }).catch(function () {});
        }
    }]);

    return Socket;
}();

var errorTypes = ['connect_error', 'reconnect_error', 'error', 'close', 'disconnect'];
var disconnectErrorTypes = ['connect_error', 'reconnect_error', 'close', 'disconnect'];

var SocketWorkerHandler = function () {
    function SocketWorkerHandler(workerFactory) {
        _classCallCheck(this, SocketWorkerHandler);

        this.workerFactory = workerFactory;
        this.counter = 0;
    }

    _createClass(SocketWorkerHandler, [{
        key: '_tryWorker',
        value: function _tryWorker(endpoint, type) {
            var worker = this.workerFactory();
            var dfd = (0, _deferred.deferred)();
            worker.onmessage = function (message) {
                var data = message.data;
                if (typeof data === 'string') {
                    var parsed = JSON.parse(data);
                    if (parsed.type === 'initDone') {
                        dfd.resolve(worker);
                    } else {
                        dfd.reject(new Error('Connection failed.'));
                    }
                }
            };

            worker.postMessage(JSON.stringify({
                type: 'init',
                endpoint: endpoint,
                connectionType: type
            }));
            return dfd.promise;
        }
    }, {
        key: 'init',
        value: function init(endpoint) {
            var _this5 = this;

            return this._tryWorker(endpoint, 'websocket').catch(function () {
                return _this5._tryWorker(endpoint, 'polling');
            }).then(function (worker) {
                _this5._worker = worker;
                var emitter = new _stream.Emitter();
                worker.onmessage = function (message) {
                    var data = message.data;
                    if (typeof data === 'string') {
                        emitter.emit(JSON.parse(data));
                    }
                };
                _this5._emitter = emitter;

                disconnectErrorTypes.forEach(function (type) {
                    _this5.observe(type).map(function () {
                        // almost the same as this.close(),
                        // but doesn't call destroy()
                        // since that would also delete all handlers attached on emitters
                        // and we want to observe errors from more places
                        _this5._sendMessage({
                            type: 'close'
                        });
                        _this5._emitter = null;
                    });
                });

                return;
            });
        }
    }, {
        key: 'close',
        value: function close() {
            this._sendMessage({
                type: 'close'
            });
            if (this._emitter != null) {
                this._emitter.destroy();
                this._emitter = null;
            }
        }
    }, {
        key: 'send',
        value: function send(message) {
            this.counter++;
            var counter = this.counter;
            this._sendMessage({
                type: 'send',
                message: message,
                id: counter
            });
            var dfd = (0, _deferred.deferred)();
            if (this._emitter == null) {
                return Promise.reject(new Error('Server disconnected.'));
            }
            this._emitter.attach(function (message, detach) {
                if (logCommunication) {
                    console.log('[socket.io] in message', message);
                }

                if (message.type === 'sendReply' && message.id === counter) {
                    var _message$reply = message.reply,
                        result = _message$reply.result,
                        error = _message$reply.error;

                    if (error != null) {
                        dfd.reject(error);
                    } else {
                        dfd.resolve(result);
                    }
                    detach();
                }
                // This is not covered by coverage, because it's hard to simulate
                // Happens when the server is disconnected during some long operation
                // It's hard to simulate long operation on regtest (very big transactions)
                // but happens in real life
                if (message.type === 'emit' && errorTypes.indexOf(message.event) !== -1) {
                    dfd.reject(new Error('Server disconnected.'));
                    detach();
                }
            });
            return dfd.promise;
        }
    }, {
        key: 'observe',
        value: function observe(event) {
            var _this6 = this;

            this.counter++;
            var counter = this.counter;
            this._sendMessage({
                type: 'observe',
                event: event,
                id: counter
            });

            // $FlowIssue - this can't be null if used from bitcore.js
            var emitter = this._emitter;

            return _stream.Stream.fromEmitter(emitter, function () {
                _this6._sendMessage({
                    type: 'unobserve',
                    event: event,
                    id: counter
                });
            }).filter(function (message) {
                return message.type === 'emit' && message.event === event;
            }).map(function (message) {
                // $FlowIssue it always have data because of the filtering
                return message.data;
            });
        }
    }, {
        key: 'subscribe',
        value: function subscribe(event) {
            for (var _len2 = arguments.length, values = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                values[_key2 - 1] = arguments[_key2];
            }

            this._sendMessage({
                type: 'subscribe',
                event: event,
                values: values
            });
        }
    }, {
        key: '_sendMessage',
        value: function _sendMessage(message) {
            // $FlowIssue - this can't be null if used from bitcore.js
            var worker = this._worker;
            if (logCommunication) {
                console.log('[socket.io] out message', message);
            }

            worker.postMessage(JSON.stringify(message));
        }
    }]);

    return SocketWorkerHandler;
}();