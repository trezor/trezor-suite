'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StreamWithEnding = exports.Stream = exports.Queue = exports.Emitter = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

// We didn't find any Stream library that would be flow-typed and that we liked.
// So we made our own library for emitters and streams, that was supposed to be simple...
//
// ... well it got big over time. So here it is.
//
// We are probably reinventing the wheel here. But it is OUR wheel.

var _deferred = require('./deferred');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// const MAX_LISTENERS = 50;
var Emitter = exports.Emitter = function () {
    function Emitter() {
        _classCallCheck(this, Emitter);

        this.listeners = [];
    }

    _createClass(Emitter, [{
        key: 'destroy',
        value: function destroy() {
            var _this = this;

            this.listeners.forEach(function (listener) {
                return _this.detach(listener.handler);
            });
            this.listeners = [];
        }

        // `attach` doesn't affect currently running `emit`, so listeners are not
        // modified in place.

    }, {
        key: 'attach',
        value: function attach(handler) {
            this.listeners = this.listeners.concat([{
                handler: handler,
                detached: false
            }]);
            // if (this.listeners.length > MAX_LISTENERS) {
            //     throw new Error('Too many listeners. Memory leak?');
            // }
        }

        // `detach` does affect the `emit` cycle, we mark the listener as `detached`
        // so it can be ignored right away.

    }, {
        key: 'detach',
        value: function detach(handler) {
            this.listeners = this.listeners.filter(function (listener) {
                if (listener.handler === handler) {
                    listener.detached = true;
                    return false;
                } else {
                    return true;
                }
            });
        }
    }, {
        key: 'emit',
        value: function emit(value) {
            var _this2 = this;

            this.listeners.forEach(function (listener) {
                if (!listener.detached) {
                    listener.handler(value, function () {
                        _this2.detach(listener.handler);
                    });
                }
            });
        }
    }]);

    return Emitter;
}();

var Queue = exports.Queue = function () {
    function Queue() {
        _classCallCheck(this, Queue);

        this.buffer = [];
        this.takers = [];
    }

    _createClass(Queue, [{
        key: 'put',
        value: function put(value) {
            this.buffer.push(value);
            this.shift();
        }
    }, {
        key: 'take',
        value: function take(taker) {
            this.takers.push(taker);
            this.shift();
        }
    }, {
        key: 'shift',
        value: function shift() {
            if (this.buffer.length > 0 && this.takers.length > 0) {
                var _value = this.buffer.shift();
                var taker = this.takers.shift();
                taker(_value);
            }
        }
    }]);

    return Queue;
}();

var Stream = function () {
    _createClass(Stream, null, [{
        key: 'fromEmitter',
        value: function fromEmitter(emitter, dispose) {
            return new Stream(function (update, finish) {
                var disposed = false;
                var handler = function handler(t) {
                    if (!disposed) {
                        update(t);
                    }
                };
                emitter.attach(handler);
                return function () {
                    disposed = true;
                    emitter.detach(handler);
                    dispose();
                };
            });
        }
    }, {
        key: 'fromEmitterFinish',
        value: function fromEmitterFinish(emitter, finisher, dispose) {
            return new Stream(function (update, finish) {
                var disposed = false;
                var handler = function handler(t) {
                    if (!disposed) {
                        update(t);
                    }
                };
                emitter.attach(handler);
                finisher.attach(function (nothing, detach) {
                    finish();
                    detach();
                    emitter.detach(handler);
                });
                return function () {
                    disposed = true;
                    emitter.detach(handler);
                    dispose();
                };
            });
        }
    }, {
        key: 'fromArray',
        value: function fromArray(array) {
            return new Stream(function (update, finish) {
                var disposed = false;
                setTimeout(function () {
                    if (!disposed) {
                        array.forEach(function (t) {
                            update(t);
                        });
                        finish();
                    }
                }, 0);
                return function () {
                    disposed = true;
                };
            });
        }
    }, {
        key: 'fromPromise',
        value: function fromPromise(promise) {
            return new Stream(function (update, finish) {
                var stream_ = void 0;
                var disposed = false;
                promise.then(function (stream) {
                    if (!disposed) {
                        stream.values.attach(function (v) {
                            return update(v);
                        });
                        stream.finish.attach(function () {
                            return finish();
                        });
                        stream_ = stream;
                    }
                }, function () {
                    setTimeout(function () {
                        return finish();
                    }, 1);
                });
                return function () {
                    disposed = true;
                    if (stream_ != null) {
                        stream_.dispose();
                    }
                };
            });
        }
    }, {
        key: 'generate',
        value: function generate(initial, _generate, condition) {
            return new Stream(function (update, finish) {
                var disposed = false;
                var iterate = function iterate(state) {
                    _generate(state).then(function (state) {
                        if (disposed) {
                            // stop the iteration
                        } else {
                            update(state);
                            if (condition(state)) {
                                iterate(state);
                            } else {
                                finish();
                            }
                        }
                    });
                };
                iterate(initial);
                return function () {
                    disposed = true;
                };
            });
        }
    }, {
        key: 'setLater',
        value: function setLater() {
            var df = (0, _deferred.deferred)();
            var set = false;
            var setter = function setter(s) {
                if (set) {
                    throw new Error('Setting stream twice.');
                }
                set = true;
                df.resolve(s);
            };
            var stream = new Stream(function (update, finish) {
                var s = null;
                df.promise.then(function (ns) {
                    s = ns;
                    ns.values.attach(function (v) {
                        update(v);
                    });
                    ns.finish.attach(function () {
                        finish();
                    });
                });
                return function () {
                    if (s != null) {
                        s.dispose();
                    }
                };
            });
            return { stream: stream, setter: setter };
        }
    }, {
        key: 'simple',
        value: function simple(value) {
            return new Stream(function (update, finish) {
                var disposed = false;
                setTimeout(function () {
                    if (!disposed) {
                        update(value);
                        setTimeout(function () {
                            if (!disposed) {
                                finish();
                            }
                        }, 1);
                    }
                }, 1);
                return function () {
                    disposed = true;
                };
            });
        }
    }, {
        key: 'combine',
        value: function combine(streams) {
            return new Stream(function (update, finish) {
                var combined = new Array(streams.length);
                var updated = new Set();
                var finished = new Set();
                streams.forEach(function (s, i) {
                    s.values.attach(function (v) {
                        combined[i] = v;
                        updated.add(i);
                        if (updated.size >= streams.length) {
                            update(combined);
                        }
                    });
                    s.finish.attach(function () {
                        finished.add(i);
                        if (finished.size >= streams.length) {
                            finish();
                        }
                    });
                });
                return function () {
                    streams.forEach(function (s) {
                        return s.dispose();
                    });
                };
            });
        }
    }, {
        key: 'combineFlat',
        value: function combineFlat(streams) {
            return new Stream(function (update, finish) {
                var finished = new Set();
                streams.forEach(function (s, i) {
                    s.values.attach(function (v) {
                        update(v);
                    });
                    s.finish.attach(function () {
                        finished.add(i);
                        if (finished.size >= streams.length) {
                            finish();
                        }
                    });
                });
                return function () {
                    streams.forEach(function (s) {
                        return s.dispose();
                    });
                };
            });
        }
    }, {
        key: 'filterNull',
        value: function filterNull(stream) {
            return new Stream(function (update, finish) {
                stream.values.attach(function (value) {
                    if (value != null) {
                        update(value);
                    }
                });
                stream.finish.attach(finish);
                return stream.dispose;
            });
        }
    }]);

    function Stream(controller) {
        var _this3 = this;

        _classCallCheck(this, Stream);

        this.values = new Emitter();
        this.finish = new Emitter();
        this.dispose = controller(function (value) {
            _this3.values.emit(value);
        }, function () {
            _this3.finish.emit();
        });
    }

    _createClass(Stream, [{
        key: 'awaitFirst',
        value: function awaitFirst() {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                var _onFinish = function onFinish() {};
                var onValue = function onValue(value) {
                    _this4.values.detach(onValue);
                    _this4.finish.detach(_onFinish);
                    resolve(value);
                };
                _onFinish = function onFinish() {
                    _this4.values.detach(onValue);
                    _this4.finish.detach(_onFinish);
                    reject(new Error('No first value.'));
                };
                _this4.values.attach(onValue);
                _this4.finish.attach(_onFinish);
            });
        }
    }, {
        key: 'awaitFinish',
        value: function awaitFinish() {
            var _this5 = this;

            return new Promise(function (resolve) {
                var onFinish = function onFinish(finish) {
                    _this5.finish.detach(onFinish);
                    resolve();
                };
                _this5.finish.attach(onFinish);
            });
        }
    }, {
        key: 'awaitLast',
        value: function awaitLast() {
            var _this6 = this;

            return new Promise(function (resolve, reject) {
                var lastValue = void 0;
                var onValue = function onValue(value) {
                    lastValue = value;
                };
                var onFinish = function onFinish(finish) {
                    _this6.values.detach(onValue);
                    _this6.finish.detach(onFinish);
                    if (lastValue == null) {
                        reject(new Error('No last value.'));
                    } else {
                        resolve(lastValue);
                    }
                };
                _this6.values.attach(onValue);
                _this6.finish.attach(onFinish);
            });
        }
    }, {
        key: 'map',
        value: function map(fn) {
            var _this7 = this;

            return new Stream(function (update, finish) {
                _this7.values.attach(function (value) {
                    update(fn(value));
                });
                _this7.finish.attach(finish);
                return _this7.dispose;
            });
        }

        // note: this DOES keep the order

    }, {
        key: 'mapPromise',
        value: function mapPromise(fn) {
            var _this8 = this;

            return new Stream(function (update, finish) {
                var previous = Promise.resolve();
                var disposed = false;
                _this8.values.attach(function (value) {
                    var previousNow = previous;
                    previous = fn(value).then(function (u) {
                        previousNow.then(function () {
                            if (!disposed) {
                                update(u);
                            }
                        });
                    });
                });
                _this8.finish.attach(function () {
                    previous.then(function () {
                        return finish();
                    });
                });
                return function () {
                    disposed = true;
                    _this8.dispose();
                };
            });
        }
    }, {
        key: 'mapPromiseError',
        value: function mapPromiseError(fn) {
            var _this9 = this;

            return new Stream(function (update, finish) {
                var previous = Promise.resolve();
                var disposed = false;
                _this9.values.attach(function (value) {
                    var previousNow = previous;
                    previous = fn(value).then(function (u) {
                        previousNow.then(function () {
                            if (!disposed) {
                                update(u);
                            }
                        });
                    }, function (error) {
                        previousNow.then(function () {
                            if (!disposed) {
                                update(error);
                            }
                        });
                    });
                });
                _this9.finish.attach(function () {
                    previous.then(function () {
                        return finish();
                    });
                });
                return function () {
                    disposed = true;
                    _this9.dispose();
                };
            });
        }
    }, {
        key: 'filter',
        value: function filter(fn) {
            var _this10 = this;

            return new Stream(function (update, finish) {
                _this10.values.attach(function (value) {
                    if (fn(value)) {
                        update(value);
                    }
                });
                _this10.finish.attach(finish);
                return _this10.dispose;
            });
        }
    }, {
        key: 'reduce',
        value: function reduce(fn, initial) {
            var _this11 = this;

            return new Promise(function (resolve, reject) {
                var state = initial;
                _this11.values.attach(function (value) {
                    state = fn(state, value);
                });
                _this11.finish.attach(function () {
                    resolve(state);
                });
            });
        }
    }, {
        key: 'concat',
        value: function concat(other) {
            var _this12 = this;

            return new Stream(function (update, finish) {
                var finished = 0;
                _this12.values.attach(function (value) {
                    update(value);
                });
                other.values.attach(function (value) {
                    update(value);
                });

                var finishOne = function finishOne() {
                    finished++;
                    if (finished === 2) {
                        finish();
                    }
                };

                _this12.finish.attach(finishOne);
                other.finish.attach(finishOne);

                return function () {
                    _this12.dispose();
                    other.dispose();
                };
            });
        }
    }]);

    return Stream;
}();

exports.Stream = Stream;

var StreamWithEnding = exports.StreamWithEnding = function () {
    function StreamWithEnding() {
        _classCallCheck(this, StreamWithEnding);
    }

    _createClass(StreamWithEnding, null, [{
        key: 'fromStreamAndPromise',
        value: function fromStreamAndPromise(s, ending) {
            var res = new StreamWithEnding();
            res.stream = s;

            var def = (0, _deferred.deferred)();
            res.dispose = function (e) {
                def.reject(e);
                s.dispose();
            };
            s.awaitFinish().then(function () {
                def.resolve();
            });

            res.ending = def.promise.then(function () {
                return ending;
            });
            return res;
        } // ending never resolves before stream finishes

    }]);

    return StreamWithEnding;
}();