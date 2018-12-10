/* global it:false, describe:false */

import {Emitter, Stream} from '../src/utils/stream.js';
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
            assert.ok(stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
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
            assert.ok(stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
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
            assert.ok(stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
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
                assert.deepStrictEqual(seen, 0);
                done();
            }, 10);
        });
    });

    describe('fromPromise', () => {
        it('creates a stream', () => {
            // intentionally does not resolve or reject
            const stream = Stream.fromPromise(new Promise(() => {}));
            assert.ok(stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
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
            assert.ok(stream);
            assert.ok(stream.values instanceof Emitter);
            assert.ok(stream.finish instanceof Emitter);
            assert.ok(typeof stream.dispose === 'function');
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
            assert.ok(stream);
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
                assert.deepEqual(res, []);
                done();
            }, 10);
        });
    });
});
