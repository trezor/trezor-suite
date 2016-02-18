import test from 'tape';

import { Emitter, Stream } from '../lib/stream';

test('Emitter.attach', (t) => {

    // calls in correct order
    let e1 = newEmitter();
    let rec = [0, 0, 0];
    e1.attach((v) => { t.deepEqual(rec, [0, 0, 0]); rec[0] = v; });
    e1.attach((v) => { t.deepEqual(rec, [1, 0, 0]); rec[1] = v; });
    e1.attach((v) => { t.deepEqual(rec, [1, 1, 0]); rec[2] = v; });
    e1.emit(1);
    t.deepEqual(rec, [1, 1, 1]);

    // does not affect current .emit
    let e2 = newEmitter();
    let fn = called();
    e2.attach((arg) => e2.attach(fn));
    e2.emit(2);
    t.deepEqual(fn.counter, 0);
    e2.emit(3);
    t.deepEqual(fn.counter, 1);
    t.deepEqual(fn.args, [3]);

    t.end();
});

test('Emitter.detach', (t) => {

    // doesn't call after detach
    let e1 = newEmitter();
    let fn1 = called();
    e1.attach(fn1);
    e1.emit(1);
    e1.detach(fn1);
    e1.emit(2);
    t.deepEqual(fn1.counter, 1);
    t.deepEqual(fn1.args, [1]);

    // does affect current .emit
    let e2 = newEmitter();
    let fn2 = called();
    e2.attach(() => e2.detach(fn2));
    e2.attach(fn2);
    e2.emit(3);
    t.deepEqual(fn2.counter, 0);

    t.end();
});

test('Stream.combine', (t) => {

    t.plan(5);

    let a = newStream();
    let b = newStream();
    let c = newStream();

    let s = Stream.combine([a, b, c]);

    s.values.attach(calledWith(
        t,
        [1, 2, 3],
        [4, 2, 3],
        [4, 5, 3],
        [4, 5, 6]
    ));

    a.values.emit(1);
    b.values.emit(2);
    c.values.emit(3);
    a.values.emit(4);
    b.values.emit(5);
    c.values.emit(6);

    a.finish.emit();
    b.finish.emit();
    s.finish.attach(calledWith(t));
    c.finish.emit();
});

function newEmitter() {
    return new Emitter();
}

function newStream() {
    return new Stream(() => () => {});
}

function calledWith(t, ...args) {
    return (arg) => {
        t.deepEqual(arg, args.shift());
    };
}

function called(t) {
    let fn = (...args) => {
        fn.args = args;
        fn.counter++;
    };
    fn.counter = 0;
    return fn;
}
