import {run} from '../test_helpers/_node_client.js';

export function startBitcore() {
    return run('test_helpers/start_bitcore.sh')
        .then(() => promiseTimeout(15 * 1000));
}

export function stopBitcore() {
    return run('pkill bitcored')
          .then(() => promiseTimeout(15 * 1000));
}

export function promiseTimeout(time) {
    return new Promise((resolve) => setTimeout(() => resolve(), time));
}

export function testStreamMultiple(stream, test, timeout, done, times) {
    let ended = false;
    let i = 0;

    const fun = (value, detach) => {
        if (typeof value === 'object' && value instanceof Array) {
            value.forEach(v => fun(v, detach));
        } else {
            if (!ended) {
                try {
                    test(value);
                } catch (e) {
                    if (!ended) {
                        ended = true;
                        done(e);
                    }
                    detach();
                    throw e;
                }
                i++;
                if (i === times) {
                    if (!ended) {
                        ended = true;
                        done();
                    }
                    detach();
                }
            }
        }
    };
    stream.values.attach(fun);
    setTimeout(() => {
        if (!ended) {
            ended = true;
            stream.values.detach(fun);
            done(new Error('Timeout'));
        }
    }, timeout);
}

export function testStream(stream, test, timeout, done) {
    return testStreamMultiple(stream, test, timeout, done, 1);
}

