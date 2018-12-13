/* global it:false, describe:false */

import {Emitter, Stream, StreamWithEnding} from '../src/utils/stream.js';
import {uniqueRandom} from '../src/utils/unique-random.js';
import assert from 'assert';

function test_console_warn(fun, test) {
    const original = console.warn;
    let value;
    console.warn = (something) => {
        value = something;
    };
    fun();
    console.warn = original;
    assert.ok(test(value));
}

describe('emitter', () => {
    it('creates an emitter', () => {
        const emitter = new Emitter();
        assert.ok(emitter.listeners instanceof Array);
        assert.deepStrictEqual(emitter.listeners.length, 0);
        assert.deepStrictEqual(emitter.destroyed, false);
    });

    it('destroys an empty emitter', () => {
        const emitter = new Emitter();
        emitter.destroy();
        assert.ok(emitter.listeners instanceof Array);
        assert.deepStrictEqual(emitter.listeners.length, 0);
        assert.deepStrictEqual(emitter.destroyed, true);
    });

    it('attaching on a destroyed emitter throws', () => {
        const emitter = new Emitter();
        emitter.destroy();
        assert.throws(() => emitter.attach(() => {}), /Attaching on a destroyed emitter/);
    });

    it('emitting on a destroyed emitter writes warning', () => {
        const emitter = new Emitter();
        emitter.destroy();
        test_console_warn(() => emitter.emit(), v => /Emitting on a destroyed emitter/.test(v));
    });

    it('attach+emit works in same tick', () => {
        const emitter = new Emitter();
        let value;
        emitter.attach((v) => { value = v; });
        emitter.emit(3);
        assert.deepStrictEqual(value, 3);
    });

    it('attach+emit works in next-ish tick', (done) => {
        const emitter = new Emitter();
        let value;
        emitter.attach((v) => {
            setTimeout(() => { value = v; }, 1);
        });
        emitter.emit(3);
        setTimeout(() => {
            assert.deepEqual(value, 3);
            done();
        }, 10);
    });

    it('attached function called only once', (done) => {
        const emitter = new Emitter();
        let value = 0;
        emitter.attach((v) => {
            setTimeout(() => { value = value + v; }, 1);
        });
        emitter.emit(3);
        setTimeout(() => {
            assert.deepEqual(value, 3);
            done();
        }, 10);
    });

    it('detach works immediately', (done) => {
        const emitter = new Emitter();
        let value = 0;
        const fun = (v) => {
            setTimeout(() => { value = value + v; }, 1);
        };
        emitter.attach(fun);
        emitter.detach(fun);
        setTimeout(() => {
            assert.deepEqual(value, 0);
            assert.ok(emitter.listeners instanceof Array);
            assert.deepStrictEqual(emitter.listeners.length, 0);
            assert.deepStrictEqual(emitter.destroyed, false);
            done();
        }, 10);
    });

    it('detach works with delay', (done) => {
        const emitter = new Emitter();
        let value = 0;
        const fun = (v) => {
            value = value + v;
        };
        emitter.attach(fun);
        setTimeout(() => {
            emitter.emit(3);
        }, 10);
        setTimeout(() => {
            emitter.detach(fun);
        }, 20);
        setTimeout(() => {
            emitter.emit(3);
        }, 30);
        setTimeout(() => {
            assert.deepEqual(value, 3);
            assert.ok(emitter.listeners instanceof Array);
            assert.deepStrictEqual(emitter.listeners.length, 0);
            assert.deepStrictEqual(emitter.destroyed, false);
            done();
        }, 40);
    });

    it('detach from attached function works', () => {
        const emitter = new Emitter();
        let value = 0;
        emitter.attach((v, detach) => {
            value = value + v;
            detach();
            emitter.emit(3);
        });
        emitter.emit(3);
        assert.deepEqual(value, 3);
        emitter.destroy();
    });

    it('detach from attached function works with other function and delay', (done) => {
        const emitter = new Emitter();
        let value = 0;

        emitter.attach((v) => {
            setTimeout(() => {
                value = value + v;
            }, 10);
        });

        emitter.attach((v, detach) => {
            setTimeout(() => {
                value = value + v;
                detach();
            }, 20);
        });
        emitter.emit(3);
        setTimeout(() => {
            emitter.emit(3);
        }, 30);
        setTimeout(() => {
          // first function runs twice, second runs once
            assert.deepEqual(value, 9);
            assert.ok(emitter.listeners instanceof Array);
            assert.deepStrictEqual(emitter.listeners.length, 1);
            assert.deepStrictEqual(emitter.destroyed, false);
            done();
        }, 60);
    });

    it('attaching the same fuction twice errors', () => {
        const emitter = new Emitter();
        const fun = (v) => {};
        emitter.attach(fun);
        assert.throws(() => emitter.attach(fun), /Cannot attach the same listener twice/);
    });
});

describe('stream', () => {
    describe('from emitter', () => {
        it('creates a stream', () => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('streams values on emit (this tick)', () => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            let value = 0;
            stream.values.attach((v) => { value = v; });
            emitter.emit(3);
            assert.deepStrictEqual(value, 3);
        });

        it('streams values on emit (delay)', (done) => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            let value = 0;
            stream.values.attach((v) => { value = v; });
            setTimeout(() => {
                emitter.emit(3);
            }, 10);
            setTimeout(() => {
                assert.deepStrictEqual(value, 3);
                done();
            }, 20);
        });

        it('calls provided dispose function', () => {
            const emitter = new Emitter();
            let disposed = false;
            const stream = Stream.fromEmitter(emitter, () => {
                disposed = true;
            });
            stream.dispose();
            assert.deepStrictEqual(disposed, true);
            assert.deepStrictEqual(stream.disposed, true);
        });

        it('does not call provided dispose function twice', () => {
            const emitter = new Emitter();
            let disposed = 0;
            const stream = Stream.fromEmitter(emitter, () => {
                disposed++;
            });
            stream.dispose();
            stream.dispose();
            assert.deepStrictEqual(disposed, 1);
            assert.deepStrictEqual(stream.disposed, true);
        });

        it('stops emitting values after dispose (this tick)', () => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            let value = 0;
            stream.values.attach((v) => { value = value + v; });
            emitter.emit(3);
            emitter.emit(3);
            stream.dispose();
            emitter.emit(3);
            assert.deepStrictEqual(value, 6);
        });

        it('stops emitting values after dispose (delay)', (done) => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            let value = 0;
            stream.values.attach((v) => { value = value + v; });
            setTimeout(() => emitter.emit(3), 10);
            setTimeout(() => emitter.emit(3), 20);
            setTimeout(() => stream.dispose(), 30);
            setTimeout(() => emitter.emit(4), 40);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(value, 6);
                done();
            }, 50);
        });
    });

    describe('from emitter finish', () => {
        it('creates a stream', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('streams values on emit (this tick)', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let value = 0;
            stream.values.attach((v) => { value = v; });
            emitter.emit(3);
            assert.deepStrictEqual(value, 3);
        });

        it('streams values on emit (delay)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let value = 0;
            stream.values.attach((v) => { value = v; });
            setTimeout(() => {
                emitter.emit(3);
            }, 10);
            setTimeout(() => {
                assert.deepStrictEqual(value, 3);
                done();
            }, 20);
        });

        it('calls provided dispose function', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {
                disposed = true;
            });
            stream.dispose();
            assert.deepStrictEqual(disposed, true);
            assert.deepStrictEqual(stream.disposed, true);
        });

        it('does not call provided dispose function twice', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = 0;
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {
                disposed++;
            });
            stream.dispose();
            stream.dispose();
            assert.deepStrictEqual(disposed, 1);
            assert.deepStrictEqual(stream.disposed, true);
        });

        it('stops emitting values after dispose (this tick)', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let value = 0;
            stream.values.attach((v) => { value = value + v; });
            emitter.emit(3);
            emitter.emit(3);
            stream.dispose();
            emitter.emit(3);
            assert.deepStrictEqual(value, 6);
        });

        it('stops emitting values after dispose (delay)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let value = 0;
            stream.values.attach((v) => { value = value + v; });
            setTimeout(() => emitter.emit(3), 10);
            setTimeout(() => emitter.emit(3), 20);
            setTimeout(() => stream.dispose(), 30);
            setTimeout(() => emitter.emit(4), 40);
            setTimeout(() => {
                assert.deepStrictEqual(value, 6);
                done();
            }, 50);
        });

        it('stops emitting values after finish (this tick)', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let value = 0;
            stream.values.attach((v) => { value = value + v; });
            emitter.emit(3);
            emitter.emit(3);
            finish.emit();
            emitter.emit(3);
            assert.deepStrictEqual(value, 6);
        });

        it('stops emitting values after finish (delay)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let value = 0;
            stream.values.attach((v) => { value = value + v; });
            setTimeout(() => emitter.emit(3), 10);
            setTimeout(() => emitter.emit(3), 20);
            setTimeout(() => finish.emit(), 30);
            setTimeout(() => emitter.emit(4), 40);
            setTimeout(() => {
                assert.deepStrictEqual(value, 6);
                done();
            }, 50);
        });

        it('emitting finish twice does not throw anything', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            emitter.emit(3);
            emitter.emit(3);
            finish.emit();
            finish.emit();
            stream.dispose();
        });

        it('finish notification called (this tick)', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let finished = false;
            stream.finish.attach(() => { finished = true; });
            finish.emit();
            assert.deepEqual(finished, true);
        });

        it('finish notification called (next tick)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let finished = false;
            stream.finish.attach(() => { finished = true; });

            setTimeout(() => {
                finish.emit();
            }, 10);
            setTimeout(() => {
                assert.deepEqual(finished, true);
                done();
            }, 20);
        });

        it('calls provided dispose function even after finish', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {
                disposed = true;
            });
            finish.emit();
            stream.dispose();
            assert.deepStrictEqual(disposed, true);
            assert.deepStrictEqual(stream.disposed, true);
        });

        it('finish notification called only once (this tick)', () => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let finished = 0;
            stream.finish.attach(() => { finished++; });

            finish.emit();
            finish.emit();
            assert.deepEqual(finished, 1);
        });

        it('finish notification called only once (next tick)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let finished = 0;
            stream.finish.attach(() => { finished++; });

            setTimeout(() => {
                finish.emit();
            }, 10);
            setTimeout(() => {
                finish.emit();
            }, 20);
            setTimeout(() => {
                assert.deepEqual(finished, 1);
                done();
            }, 30);
        });
    });
    describe('empty', () => {
        it('creates a stream', () => {
            const stream = Stream.empty();
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });
        it('no value', (done) => {
            const stream = Stream.empty();
            let seen = false;
            stream.values.attach(() => { seen = true; });
            setTimeout(() => {
                assert.deepStrictEqual(seen, false);
                done();
            }, 10);
        });
        it('calls finish once', (done) => {
            const stream = Stream.empty();
            let seen = 0;
            stream.finish.attach(() => { seen++; });
            setTimeout(() => {
                assert.deepStrictEqual(seen, 1);
                done();
            }, 10);
        });
        it('does not call finish after dispose', (done) => {
            const stream = Stream.empty();
            let seen = 0;
            stream.finish.attach(() => { seen++; });
            stream.dispose();
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(seen, 0);
                done();
            }, 10);
        });
    });

    describe('fromPromise', () => {
        it('creates a stream', () => {
            // intentionally does not resolve or reject
            const stream = Stream.fromPromise(new Promise(() => {}));
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('stream emits as the promised stream emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostream);
                }, 10);
            });
            const stream = Stream.fromPromise(promise);
            let seen = false;
            stream.values.attach(() => { seen = true; });
            setTimeout(() => emitter.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });

        it('stream emits, twice, as the promised stream emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostream);
                }, 10);
            });
            const stream = Stream.fromPromise(promise);
            let seen = 0;
            stream.values.attach(() => { seen++; });
            setTimeout(() => emitter.emit(), 30);
            setTimeout(() => emitter.emit(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(seen, 2);
                done();
            }, 70);
        });

        it('calls provided dispose function of promised stream', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostream);
                }, 10);
            });
            const stream = Stream.fromPromise(promise);
            setTimeout(() => stream.dispose(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(disposed, true);
                done();
            }, 70);
        });

        it('stream finishes as the promised stream finishes', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostream);
                }, 10);
            });
            const stream = Stream.fromPromise(promise);
            let seen = false;
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => finish.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });

        it('ignores resolved promise if disposed called before', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostream);
                }, 50);
            });
            const stream = Stream.fromPromise(promise);
            let seen = false;
            stream.values.attach(() => { seen = true; });
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => emitter.emit(), 70);
            setTimeout(() => stream.dispose(), 20);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(seen, false);
                done();
            }, 90);
        });

        it('emits error that equals the rejection', (done) => {
            const e = new Error('rej');
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(e);
                }, 20);
            });
            const stream = Stream.fromPromise(promise);
            let seen = false;
            stream.values.attach((ee) => { seen = (e === ee); });
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 40);
        });

        it('ignores rejection if ignore requested', (done) => {
            const e = new Error('rej');
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(e);
                }, 20);
            });
            const stream = Stream.fromPromise(promise, true);
            let seen = false;
            stream.values.attach((ee) => { seen = (e === ee); });
            setTimeout(() => {
                assert.deepStrictEqual(seen, false);
                done();
            }, 40);
        });

        it('ignores rejected promise if disposed called before', (done) => {
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('abc'));
                }, 50);
            });
            const stream = Stream.fromPromise(promise);
            let seen = false;
            stream.values.attach(() => { seen = true; });
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => stream.dispose(), 20);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(seen, false);
                done();
            }, 90);
        });

        it('everything works when the promised stream is disposed already', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            ostream.dispose();
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostream);
                }, 20);
            });
            const stream = Stream.fromPromise(promise);
            setTimeout(() => {
                // I am not sure what to check really....
                // just see if there are no errors anywhere?
                assert.deepStrictEqual(stream.disposed, false);
                done();
            }, 40);
        });

        it('ignores finish() when dispose() called after error emitted', (done) => {
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('abc'));
                }, 50);
            });
            const stream = Stream.fromPromise(promise);
            let seen = false;
            stream.values.attach(() => { stream.dispose(); });
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(seen, false);
                done();
            }, 90);
        });
    });

    describe('setLater', () => {
        it('creates a stream', () => {
            const sstream = Stream.setLater();
            assert.ok(sstream);
            assert.ok(sstream.stream.values instanceof Emitter);
            assert.ok(sstream.stream.finish instanceof Emitter);
            assert.ok(typeof sstream.stream.dispose === 'function');
            assert.ok(typeof sstream.setter === 'function');
            assert.deepStrictEqual(sstream.stream.disposed, false);
        });

        it('stream emits as the set stream emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const sstream = Stream.setLater();
            setTimeout(() => {
                sstream.setter(ostream);
            }, 10);
            let seen = false;
            sstream.stream.values.attach(() => { seen = true; });
            setTimeout(() => emitter.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });

        it('stream emits, twice, as the setLater stream emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const sstream = Stream.setLater();
            setTimeout(() => {
                sstream.setter(ostream);
            }, 10);
            let seen = 0;
            sstream.stream.values.attach(() => { seen++; });
            setTimeout(() => emitter.emit(), 30);
            setTimeout(() => emitter.emit(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(seen, 2);
                done();
            }, 70);
        });

        it('calls provided dispose function of set stream', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const sstream = Stream.setLater();
            setTimeout(() => {
                sstream.setter(ostream);
            }, 10);
            setTimeout(() => sstream.stream.dispose(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(sstream.stream.disposed, true);
                assert.deepStrictEqual(disposed, true);
                done();
            }, 70);
        });

        it('stream finishes as the set stream finishes', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const sstream = Stream.setLater();
            setTimeout(() => {
                sstream.setter(ostream);
            }, 10);

            let seen = false;
            sstream.stream.finish.attach(() => { seen = true; });
            setTimeout(() => finish.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });

        it('ignores set stream if disposed called before', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const sstream = Stream.setLater();
            setTimeout(() => {
                sstream.setter(ostream);
            }, 10);

            let seen = false;
            sstream.stream.values.attach(() => { seen = true; });
            sstream.stream.finish.attach(() => { seen = true; });
            setTimeout(() => emitter.emit(), 70);
            setTimeout(() => sstream.stream.dispose(), 20);
            setTimeout(() => {
                assert.deepStrictEqual(seen, false);
                done();
            }, 90);
        });

        it('throws error if set two times', () => {
            const ostream = Stream.empty();
            const sstream = Stream.setLater();
            sstream.setter(ostream);
            assert.throws(() => sstream.setter(ostream), /Setting stream twice/);
        });
    });

    describe('generate', () => {
        it('creates a stream', () => {
            const stream = Stream.generate(null, () => Promise.resolve(2), () => false);
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('iterates through three states (this tick)', (done) => {
            const stream = Stream.generate(0, (state) => {
                return Promise.resolve(state + 1);
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.finish.attach((nothing, detach) => {
                assert.deepEqual(res, [1, 2, 3]);
                done();
            });
        });

        it('iterates through three states (next tick)', (done) => {
            const stream = Stream.generate(0, (state) => {
                return new Promise(resolve => {
                    setTimeout(() => resolve(state + 1), 10);
                });
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.finish.attach((nothing, detach) => {
                assert.deepEqual(res, [1, 2, 3]);
                done();
            });
        });

        it('emits error in the generating function and finishes', (done) => {
            const foobar = new Error('Foobar');
            const stream = Stream.generate(0, (state) => {
                throw foobar;
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.finish.attach((nothing, detach) => {
                assert.deepEqual(res, [foobar]);
                done();
            });
        });

        it('emits formatted error in the generating function and finishes', (done) => {
            const foobar = 'Foobar';
            const stream = Stream.generate(0, (state) => {
                throw foobar;
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.finish.attach((nothing, detach) => {
                assert.deepEqual(res[0].message, '"Foobar"');
                done();
            });
        });

        it('ignores error if disposed first', (done) => {
            const foobar = new Error('Foobar');
            const stream = Stream.generate(0, (state) => {
                throw foobar;
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.dispose();
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepEqual(res, []);
                done();
            }, 10);
        });

        it('ignores value if disposed first', (done) => {
            const stream = Stream.generate(0, (state) => {
                return new Promise(resolve => {
                    setTimeout(() => resolve(state + 1), 10);
                });
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.dispose();
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepEqual(res, []);
                done();
            }, 10);
        });

        it('emits promise rejection and finishes', (done) => {
            const foobar = new Error('Foobar');
            const stream = Stream.generate(0, (state) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => reject(foobar), 10);
                });
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.finish.attach((nothing, detach) => {
                assert.deepEqual(res, [foobar]);
                done();
            });
        });

        it('ignores promise rejection if disposed first', (done) => {
            const foobar = new Error('Foobar');
            const stream = Stream.generate(0, (state) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => reject(foobar), 10);
                });
            }, state => state < 3);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.dispose();
            setTimeout(() => {
                assert.deepEqual(res, []);
                done();
            }, 10);
        });
    });

    describe('simple', () => {
        it('creates a stream', () => {
            const stream = Stream.simple(1);
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
        });

        it('emits value', (done) => {
            const stream = Stream.simple(0);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.finish.attach((nothing, detach) => {
                assert.deepEqual(res, [0]);
                done();
            });
        });

        it('ignores value if disposed first', (done) => {
            const stream = Stream.simple(0);
            const res = [];
            stream.values.attach((v) => res.push(v));
            stream.dispose();
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepEqual(res, []);
                done();
            }, 10);
        });
    });

    describe('combineFlat', () => {
        it('creates a stream', () => {
            const streamA = Stream.simple(1);
            const streamB = Stream.simple(2);
            const stream = Stream.combineFlat([streamA, streamB]);
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('stream finishes when there is empty array', (done) => {
            const stream = Stream.combineFlat([]);
            let seen = 0;
            let finished = 0;
            stream.values.attach(() => seen++);
            stream.finish.attach(() => finished++);
            setTimeout(() => {
                assert.deepStrictEqual(seen, 0);
                assert.deepStrictEqual(finished, 1);
                done();
            }, 20);
        });

        it('correctly concats two from emitters', (done) => {
            const emitterA = new Emitter();
            const finishA = new Emitter();
            const streamA = Stream.fromEmitterFinish(emitterA, finishA, () => {});

            const emitterB = new Emitter();
            const finishB = new Emitter();
            const streamB = Stream.fromEmitterFinish(emitterB, finishB, () => {});
            const stream = Stream.combineFlat([streamA, streamB]);
            const seen = [];
            let finished = 0;
            stream.values.attach((v) => seen.push(v));
            stream.finish.attach(() => finished++);
            setTimeout(() => emitterB.emit(1), 10);
            setTimeout(() => finishB.emit(), 20);
            setTimeout(() => emitterA.emit(2), 30);
            setTimeout(() => finishA.emit(), 40);
            setTimeout(() => {
                assert.deepStrictEqual(seen, [1, 2]);
                assert.deepStrictEqual(finished, 1);
                done();
            }, 50);
        });

        it('calls both dispose functions on dispose', (done) => {
            let disposedA = 0;
            const emitterA = new Emitter();
            const streamA = Stream.fromEmitter(emitterA, () => { disposedA++; });

            let disposedB = 0;
            const emitterB = new Emitter();
            const streamB = Stream.fromEmitter(emitterB, () => { disposedB++; });
            const stream = Stream.combineFlat([streamA, streamB]);
            setTimeout(() => {
                stream.dispose();
            }, 20);

            setTimeout(() => {
                assert.deepStrictEqual(disposedA, 1);
                assert.deepStrictEqual(disposedB, 1);
                done();
            }, 50);
        });
    });

    describe('filterError', () => {
        it('creates a stream', () => {
            const streamA = Stream.simple(1);
            const stream = Stream.filterError(streamA);
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('stream emits as the filtered emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = Stream.filterError(ostream);
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit('foo'), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, ['foo']);
                done();
            }, 60);
        });

        it('stream emits, twice, as the filtered emits, ignores error', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = Stream.filterError(ostream);
            let seen = 0;
            stream.values.attach(() => { seen++; });
            setTimeout(() => emitter.emit(), 30);
            setTimeout(() => emitter.emit(new Error('fii')), 40);
            setTimeout(() => emitter.emit(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(seen, 2);
                done();
            }, 70);
        });

        it('calls provided dispose function of filtered stream', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const stream = Stream.filterError(ostream);

            setTimeout(() => stream.dispose(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(disposed, true);
                done();
            }, 70);
        });

        it('stream finishes as the filtered finishes', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = Stream.filterError(ostream);
            let seen = false;
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => finish.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });
    });

    describe('awaitFirst', () => {
        it('creates a promise', () => {
            const stream = Stream.simple(1);
            const promise = stream.awaitFirst();
            assert.ok(promise instanceof Promise);
        });

        it('resolves with first one on simple', (done) => {
            const stream = Stream.simple(1);
            const promise = stream.awaitFirst();
            promise.then(r => {
                assert.deepStrictEqual(r, 1);
                done();
            });
        });

        it('rejects on empty', (done) => {
            const stream = Stream.empty();
            const promise = stream.awaitFirst();
            promise.catch(r => {
                assert.deepStrictEqual(r.message, 'No first value.');
                done();
            });
        });

        it('resolves on first value', (done) => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            setTimeout(() => {
                emitter.emit(1);
            }, 10);
            setTimeout(() => {
                emitter.emit(2);
            }, 20);
            stream.awaitFirst().then(r => {
                assert.deepStrictEqual(r, 1);
                done();
            });
        });
    });

    describe('awaitFinish', () => {
        it('creates a promise', () => {
            const stream = Stream.simple(1);
            const promise = stream.awaitFinish();
            assert.ok(promise instanceof Promise);
        });

        it('resolves imediately-ish on simple', (done) => {
            const stream = Stream.simple(1);
            const promise = stream.awaitFinish();
            let finished = false;
            promise.then(r => {
                finished = true;
            });
            setTimeout(() => {
                assert.deepStrictEqual(finished, true);
                done();
            }, 20);
        });

        it('resolves imediately-ish on empty', (done) => {
            const stream = Stream.empty();
            const promise = stream.awaitFinish();
            let finished = false;
            promise.then(r => {
                finished = true;
            });
            setTimeout(() => {
                assert.deepStrictEqual(finished, true);
                done();
            }, 20);
        });

        it('never resolves on fromEmitter', (done) => {
            const emitter = new Emitter();
            const stream = Stream.fromEmitter(emitter, () => {});
            const promise = stream.awaitFinish();
            let finished = false;
            // this promise hangs forever
            promise.then(r => {
                finished = true;
            });
            setTimeout(() => {
                assert.deepStrictEqual(finished, false);
                done();
            }, 20);
        });

        it('does not resolve before actual finish', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            let firstTimeout = false;
            setTimeout(() => {
                firstTimeout = true;
                setTimeout(() => {
                    finish.emit();
                }, 10);
            }, 10);
            const promise = stream.awaitFinish();
            promise.then(() => {
                assert.deepStrictEqual(firstTimeout, true);
                done();
            });
        });
    });

    describe('map', () => {
        it('creates a stream', () => {
            const ostream = Stream.simple(1);
            const stream = ostream.map(k => k);
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('stream emits mapped values', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.map(k => k * 3);
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(1), 30);
            setTimeout(() => emitter.emit(2), 40);
            setTimeout(() => emitter.emit(3), 50);
            setTimeout(() => {
                assert.deepStrictEqual(seen, [3, 6, 9]);
                done();
            }, 60);
        });

        it('calls provided dispose function of mapped stream', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const stream = ostream.map(k => k * 3);

            setTimeout(() => stream.dispose(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(disposed, true);
                done();
            }, 70);
        });

        it('stream finishes as the mapped one finishes', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.map(k => k * 3);
            let seen = false;
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => finish.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });
    });

    describe('mapPromise', () => {
        it('creates a stream', () => {
            const ostream = Stream.simple(1);
            const stream = ostream.mapPromise(k => Promise.resolve(k));
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('stream emits mapped values and finishes', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(k * 2);
                    }, k);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 10);
            setTimeout(() => emitter.emit(20), 20);
            setTimeout(() => emitter.emit(10), 30);
            setTimeout(() => finish.emit(), 40);
            stream.finish.attach(() => {
                assert.deepStrictEqual(seen, [60, 40, 20]);
                done();
            });
        });

        it('stream emits mapped values and finishes, diff order', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(k * 2);
                    }, k);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(10), 10);
            setTimeout(() => emitter.emit(20), 20);
            setTimeout(() => emitter.emit(30), 30);
            setTimeout(() => finish.emit(), 40);
            stream.finish.attach(() => {
                assert.deepStrictEqual(seen, [20, 40, 60]);
                done();
            });
        });
        it('calls provided dispose function of mapped stream', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const stream = ostream.mapPromise(k => Promise.resolve(k * 3));

            setTimeout(() => stream.dispose(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(disposed, true);
                done();
            }, 70);
        });

        it('stream emits error when function errors', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                if (k === 20) {
                    throw new Error('40');
                }
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(k * 2);
                    }, k);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 10);
            setTimeout(() => emitter.emit(20), 20);
            setTimeout(() => emitter.emit(10), 30);
            setTimeout(() => finish.emit(), 40);
            stream.finish.attach(() => {
                assert.deepStrictEqual(seen[0], 60);
                assert.deepStrictEqual(seen[1].message, '40');
                assert.deepStrictEqual(seen[2], 20);
                done();
            });
        });
        it('stream emits error when function errors (diff order)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                if (k === 20) {
                    throw new Error('40');
                }
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(k * 2);
                    }, k);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(10), 10);
            setTimeout(() => emitter.emit(20), 20);
            setTimeout(() => emitter.emit(30), 30);
            setTimeout(() => finish.emit(), 40);
            stream.finish.attach(() => {
                assert.deepStrictEqual(seen[0], 20);
                assert.deepStrictEqual(seen[1].message, '40');
                assert.deepStrictEqual(seen[2], 60);
                done();
            });
        });
        it('stream emits error when function rejects', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (k === 20) {
                            reject(new Error('40'));
                        } else {
                            resolve(k * 2);
                        }
                    }, k);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 10);
            setTimeout(() => emitter.emit(20), 20);
            setTimeout(() => emitter.emit(10), 30);
            setTimeout(() => finish.emit(), 40);
            stream.finish.attach(() => {
                assert.deepStrictEqual(seen[0], 60);
                assert.deepStrictEqual(seen[1].message, '40');
                assert.deepStrictEqual(seen[2], 20);
                done();
            });
        });

        it('stream emits error when function rejects (diff order)', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (k === 20) {
                            reject(new Error('40'));
                        } else {
                            resolve(k * 2);
                        }
                    }, k);
                });
            });

            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(10), 10);
            setTimeout(() => emitter.emit(20), 20);
            setTimeout(() => emitter.emit(30), 30);
            setTimeout(() => finish.emit(), 40);
            stream.finish.attach(() => {
                assert.deepStrictEqual(seen[0], 20);
                assert.deepStrictEqual(seen[1].message, '40');
                assert.deepStrictEqual(seen[2], 60);
                done();
            });
        });

        it('stream stops emitting after dispose', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(k * 2);
                    }, 30);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 1);
            // dispose the stream WHILE the first promise
            // is hapenning
            setTimeout(() => {
                stream.dispose();
                emitter.emit(20);
            }, 10);
            setTimeout(() => emitter.emit(10), 50);
            setTimeout(() => finish.emit(), 60);
            let finished = false;
            stream.finish.attach(() => { finished = true; });
            setTimeout(() => {
                assert.deepStrictEqual(seen, []);
                assert.deepStrictEqual(finished, false);
                done();
            }, 100);
        });

        it('stream stops emitting error after dispose', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('foo'));
                    }, 30);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 1);
            // dispose the stream WHILE the first promise
            // is hapenning
            setTimeout(() => {
                stream.dispose();
                emitter.emit(20);
            }, 10);
            setTimeout(() => emitter.emit(10), 50);
            setTimeout(() => finish.emit(), 60);
            let finished = false;
            stream.finish.attach(() => { finished = true; });
            setTimeout(() => {
                assert.deepStrictEqual(seen, []);
                assert.deepStrictEqual(finished, false);
                done();
            }, 100);
        });

        it('stream stops emitting finish after dispose', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.mapPromise(k => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('foo'));
                    }, 30);
                });
            });
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 1);
            // dispose the stream WHILE the first promise
            // is hapenning
            setTimeout(() => {
                finish.emit();
                stream.dispose();
            }, 10);
            let finished = false;
            stream.finish.attach(() => { finished = true; });
            setTimeout(() => {
                assert.deepStrictEqual(seen, []);
                assert.deepStrictEqual(finished, false);
                done();
            }, 100);
        });
    });

    describe('filter', () => {
        it('creates a stream', () => {
            const streamA = Stream.simple(1);
            const stream = streamA.filter(() => true);
            assert.ok(stream instanceof Stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
            assert.deepStrictEqual(stream.disposed, false);
        });

        it('stream emits as the filtered emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.filter(() => true);
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit('foo'), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, ['foo']);
                done();
            }, 60);
        });

        it('stream emits, twice, as the filtered emits, ignores when fun false', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.filter(k => k !== 40);
            const seen = [];
            stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit(30), 30);
            setTimeout(() => emitter.emit(40), 40);
            setTimeout(() => emitter.emit(50), 50);
            setTimeout(() => {
                assert.deepStrictEqual(seen, [30, 50]);
                done();
            }, 70);
        });

        it('calls provided dispose function of filtered stream', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const stream = ostream.filter(() => true);

            setTimeout(() => stream.dispose(), 50);
            setTimeout(() => {
                assert.deepStrictEqual(stream.disposed, true);
                assert.deepStrictEqual(disposed, true);
                done();
            }, 70);
        });

        it('stream finishes as the filtered finishes', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const stream = ostream.filter(() => true);
            let seen = false;
            stream.finish.attach(() => { seen = true; });
            setTimeout(() => finish.emit(), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, true);
                done();
            }, 60);
        });
    });

    describe('reduce', () => {
        it('creates a promise', () => {
            const stream = Stream.simple(1);
            const promise = stream.reduce(() => {}, 0);
            assert.ok(promise instanceof Promise);
        });

        it('reduces', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            setTimeout(() => emitter.emit(30), 10);
            setTimeout(() => emitter.emit(40), 20);
            setTimeout(() => emitter.emit(50), 30);
            setTimeout(() => finish.emit(), 40);
            const res = stream.reduce((prev, value) => {
                return [...prev, value];
            }, []);
            res.then(v => {
                assert.deepStrictEqual(v, [30, 40, 50]);
                done();
            });
        });

        it('never resolves if no finish', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const stream = Stream.fromEmitterFinish(emitter, finish, () => {});
            setTimeout(() => emitter.emit(30), 10);
            setTimeout(() => emitter.emit(40), 20);
            setTimeout(() => emitter.emit(50), 30);
            const res = stream.reduce((prev, value) => {
                return [...prev, value];
            }, []);
            let resolved = false;
            res.then(v => {
                resolved = true;
            });
            setTimeout(() => {
                assert.deepStrictEqual(resolved, false);
                done();
            }, 50);
        });
    });
});

describe('stream with ending', () => {
    describe('from stream and promise', () => {
        it('creates a stream with ending', () => {
            const stream = Stream.simple(1);
            const promise = new Promise(() => {});
            const streame = StreamWithEnding.fromStreamAndPromise(stream, promise);
            assert.ok(streame instanceof StreamWithEnding);
        });
        it('emits as the stream emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = new Promise(() => {});
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const streame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            const seen = [];
            streame.stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit('foo'), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, ['foo']);
                done();
            }, 60);
        });

        it('ending resolves only after finish', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = Promise.resolve(3);
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const streame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            let resolved = false;
            streame.ending.then((v) => { resolved = v; });
            setTimeout(() => {
                // check that it is not resolved before finish
                assert.deepStrictEqual(resolved, false);
            }, 10);
            setTimeout(() => {
                finish.emit();
            }, 20);
            setTimeout(() => {
                // check that it is resolved after finish
                assert.deepStrictEqual(resolved, 3);
                done();
            }, 40);
        });

        it('ending rejects only after finish', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const error = new Error('FOO');
            const promise = Promise.reject(error);
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const streame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            let rejected = false;
            streame.ending.catch((v) => { rejected = v; });
            setTimeout(() => {
                // check that it is not resolved before finish
                assert.deepStrictEqual(rejected, false);
            }, 10);
            setTimeout(() => {
                finish.emit();
            }, 20);
            setTimeout(() => {
                // check that it is resolved after finish
                assert.deepStrictEqual(rejected, error);
                done();
            }, 40);
        });

        it('calls stream\'s dispose', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = Promise.resolve(3);
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const streame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            streame.dispose();
            setTimeout(() => {
                assert.deepStrictEqual(disposed, true);
                done();
            }, 10);
        });

        it('rejects with dispose error even when promise resolved', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = Promise.resolve(3);
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const streame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            const error = new Error('FOO');
            let rejected = false;
            let resolved = false;
            streame.ending.then((v) => { resolved = v; }, e => { rejected = e; });
            setTimeout(() => {
                assert.deepStrictEqual(rejected, false);
                assert.deepStrictEqual(resolved, false);
            }, 10);
            setTimeout(() => {
                streame.dispose(error);
            }, 20);
            setTimeout(() => {
                assert.deepStrictEqual(resolved, false);
                assert.deepStrictEqual(rejected, error);
                done();
            }, 40);
        });
    });
    describe('from promise', () => {
        it('creates a stream with ending', () => {
            const stream = Stream.simple(1);
            const promise = new Promise(() => {});
            const ostream = StreamWithEnding.fromStreamAndPromise(stream, promise);
            const streame = StreamWithEnding.fromPromise(Promise.resolve(ostream));
            assert.ok(streame instanceof StreamWithEnding);
        });
        it('emits as the stream emits', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = new Promise(() => {});
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const ostreame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            const streame = StreamWithEnding.fromPromise(Promise.resolve(ostreame));
            const seen = [];
            streame.stream.values.attach((v) => { seen.push(v); });
            setTimeout(() => emitter.emit('foo'), 30);
            setTimeout(() => {
                assert.deepStrictEqual(seen, ['foo']);
                done();
            }, 60);
        });

        it('ending resolves only after finish', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = Promise.resolve(3);
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const ostreame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            const streame = StreamWithEnding.fromPromise(Promise.resolve(ostreame));
            let resolved = false;
            streame.ending.then((v) => { resolved = v; });
            setTimeout(() => {
                // check that it is not resolved before finish
                assert.deepStrictEqual(resolved, false);
            }, 10);
            setTimeout(() => {
                finish.emit();
            }, 20);
            setTimeout(() => {
                // check that it is resolved after finish
                assert.deepStrictEqual(resolved, 3);
                done();
            }, 40);
        });

        it('ending rejects only after finish', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const error = new Error('FOO');
            const promise = Promise.reject(error);
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const ostreame = StreamWithEnding.fromStreamAndPromise(ostream, promise);

            const streame = StreamWithEnding.fromPromise(Promise.resolve(ostreame));
            let rejected = false;
            streame.ending.catch((v) => { rejected = v; });
            setTimeout(() => {
                // check that it is not resolved before finish
                assert.deepStrictEqual(rejected, false);
            }, 10);
            setTimeout(() => {
                finish.emit();
            }, 20);
            setTimeout(() => {
                // check that it is resolved after finish
                assert.deepStrictEqual(rejected, error);
                done();
            }, 40);
        });

        it('calls stream\'s dispose', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = Promise.resolve(3);
            let disposed = false;
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => { disposed = true; });
            const ostreame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            const streame = StreamWithEnding.fromPromise(Promise.resolve(ostreame));
            setTimeout(() => {
                streame.dispose();
            }, 10);
            setTimeout(() => {
                assert.deepStrictEqual(disposed, true);
                done();
            }, 20);
        });

        it('rejects with dispose error even when promise resolved', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const promise = Promise.resolve(3);
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const ostreame = StreamWithEnding.fromStreamAndPromise(ostream, promise);
            const streame = StreamWithEnding.fromPromise(Promise.resolve(ostreame));
            const error = new Error('FOO');
            let rejected = false;
            let resolved = false;
            streame.ending.then((v) => { resolved = v; }, e => { rejected = e; });
            setTimeout(() => {
                assert.deepStrictEqual(rejected, false);
                assert.deepStrictEqual(resolved, false);
            }, 10);
            setTimeout(() => {
                streame.dispose(error);
            }, 20);
            setTimeout(() => {
                assert.deepStrictEqual(resolved, false);
                assert.deepStrictEqual(rejected, error);
                done();
            }, 40);
        });
        it('ignores resolved promise if disposed called before', (done) => {
            const emitter = new Emitter();
            const finish = new Emitter();
            const ostream = Stream.fromEmitterFinish(emitter, finish, () => {});
            const rpromise = Promise.resolve(3);
            const ostreame = StreamWithEnding.fromStreamAndPromise(ostream, rpromise);
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve(ostreame);
                }, 50);
            });
            const streame = StreamWithEnding.fromPromise(promise);

            let seen = false;
            streame.stream.values.attach(() => { seen = true; });
            streame.ending.then(() => { seen = true; });
            setTimeout(() => emitter.emit(), 70);
            setTimeout(() => streame.dispose(), 20);
            setTimeout(() => {
                assert.deepStrictEqual(seen, false);
                done();
            }, 90);
        });
    });
});

// this mocks all the window and process properties
// so it works in both karma and in mocha or whatever we use
function mockProcessNavigatorOffset(processVersion, navigatorLanguage, navigatorLanguages, navigatorUserAgent, offset, fun) {
    const originalOffset = Date.prototype.getTimezoneOffset;
    let funAfter;
    if (typeof global.process !== 'undefined') {
        // node
        const originalProcessVersion = global.process.version;
        Object.defineProperty(global.process, 'version', {value: processVersion, configurable: true});

        global.process = process;
        global.navigator = {
            language: navigatorLanguage,
            languages: navigatorLanguages,
            userAgent: navigatorUserAgent,
        };

        // eslint-disable-next-line no-extend-native
        Date.prototype.getTimezoneOffset = () => offset;
        funAfter = () => {
            Object.defineProperty(global.process, 'version', {value: originalProcessVersion, configurable: true});
            global.navigator = undefined;
            // eslint-disable-next-line no-extend-native
            Date.prototype.getTimezoneOffset = originalOffset;
        };
    } else {
        // we are in karma, it injects its own process, but without version
        Object.defineProperty(process, 'version', {value: processVersion, configurable: true});
        const originalNavigatorLanguage = navigator.language;
        const originalNavigatorLanguages = navigator.languages;
        const originalNavigatorUserAgent = navigator.userAgent;
        Object.defineProperty(window.navigator, 'language', {value: navigatorLanguage, configurable: true});
        Object.defineProperty(window.navigator, 'languages', {value: navigatorLanguages, configurable: true});
        Object.defineProperty(window.navigator, 'userAgent', {value: navigatorUserAgent, configurable: true});
        // eslint-disable-next-line no-extend-native
        Date.prototype.getTimezoneOffset = () => offset;
        funAfter = () => {
            Object.defineProperty(process, 'version', {value: undefined, configurable: true});
            Object.defineProperty(window.navigator, 'language', {value: originalNavigatorLanguage, configurable: true});
            Object.defineProperty(window.navigator, 'languages', {value: originalNavigatorLanguages, configurable: true});
            Object.defineProperty(window.navigator, 'userAgent', {value: originalNavigatorUserAgent, configurable: true});
            // eslint-disable-next-line no-extend-native
            Date.prototype.getTimezoneOffset = originalOffset;
        };
    }
    try {
        fun();
    } finally {
        funAfter();
    }
}

describe('random', () => {
    it('works in node', () => {
        mockProcessNavigatorOffset(
            'foo', // version
            undefined, // language
            undefined, // languages
            undefined, // userAgent
            -123, // offset
            () => {
                assert.deepStrictEqual(uniqueRandom(3), 1);
                assert.deepStrictEqual(uniqueRandom(3), 1);
                assert.deepStrictEqual(uniqueRandom(300), 31);
                assert.deepStrictEqual(uniqueRandom(300), 31);
            });
    });

    it('works in browser (language)', () => {
        mockProcessNavigatorOffset(
            undefined, // version
            'foo', // language
            undefined, // languages
            'JamesBond', // agent
            -123,
            () => {
                assert.deepStrictEqual(uniqueRandom(3), 2);
                assert.deepStrictEqual(uniqueRandom(3), 2);
                assert.deepStrictEqual(uniqueRandom(300), 89);
                assert.deepStrictEqual(uniqueRandom(300), 89);
            });
    });
    it('works in browser (languages)', () => {
        mockProcessNavigatorOffset(
            undefined, // version
            'foo', // language
            ['foo', 'bar'], // languages
            'JamesBond', // agent
            -123,
            () => {
                assert.deepStrictEqual(uniqueRandom(3), 2);
                assert.deepStrictEqual(uniqueRandom(3), 2);
                assert.deepStrictEqual(uniqueRandom(300), 23);
                assert.deepStrictEqual(uniqueRandom(300), 23);
            });
    });

});
