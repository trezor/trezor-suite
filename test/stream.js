import test from 'tape';

import { Stream } from '../lib/stream';

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

function newStream() {
    return new Stream(() => () => {});
}

function calledWith(t, ...args) {
    return (arg) => {
        t.deepEqual(arg, args.shift());
    };
}
