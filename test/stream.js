import test from 'tape';

import { Emitter, Stream } from '../lib/stream';

test('Emitter.attach maintains order', (t) => {

    let e = newEmitter();
    let r = [0, 0, 0];

    e.attach((v) => { t.deepEqual(r, [0, 0, 0]); r[0] = v; });
    e.attach((v) => { t.deepEqual(r, [1, 0, 0]); r[1] = v; });
    e.attach((v) => { t.deepEqual(r, [1, 1, 0]); r[2] = v; });
    e.emit(1);
    t.deepEqual(r, [1, 1, 1]);
    t.end();
});

test('Emitter.attach does not affect current .emit', (t) => {

    let e = newEmitter();
    let f = fnRecord();

    e.attach(() => e.attach(f));
    e.emit(1);
    t.deepEqual(f.counter, 0);
    e.emit(2);
    t.deepEqual(f.counter, 1);
    t.deepEqual(f.args, [2]);
    t.end();
});

test('Emitter.detach removes handler', (t) => {

    let e = newEmitter();
    let f = fnRecord();

    e.attach(f);
    e.emit(1);
    e.detach(f);
    e.emit(2);
    t.deepEqual(f.counter, 1);
    t.deepEqual(f.args, [1]);
    t.end();
});

test('Emitter.detach affects current .emit', (t) => {

    let e = newEmitter();
    let f = fnRecord();

    e.attach(() => e.detach(f));
    e.attach(f);
    e.emit(1);
    t.deepEqual(f.counter, 0);
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

function fnRecord(t) {
    let fn = (...args) => {
        fn.args = args;
        fn.counter++;
    };
    fn.counter = 0;
    return fn;
}
