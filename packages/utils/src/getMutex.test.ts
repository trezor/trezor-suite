import { getMutex } from './getMutex';
import { mockTime, unmockTime } from '../mocks/mockTime';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fail = (reason: string) => {
    throw new Error(reason);
};

describe('getMutex', () => {
    let state: any;
    let lock: ReturnType<typeof getMutex>;

    const sequence = async (...seq: [any, number][]) => {
        for (const [str, ms] of seq) {
            state = str;

            await delay(ms);
            expect(state).toBe(str);
        }
    };

    const sync = (value: any) => (state = value);

    beforeEach(() => {
        state = 'init';
        lock = getMutex();

        mockTime();
    });

    afterEach(() => {
        unmockTime();
    });

    it('basic', async () => {
        await Promise.all([
            lock().then(unlock => sequence(['init', 3], [42, 9], [null, 3]).finally(unlock)),
            lock().then(unlock =>
                sequence(['init', 5], ['boo', 3], [{ foo: 'bar' }, 6]).finally(unlock),
            ),
            lock().then(unlock =>
                sequence([undefined, 8], [[1, 2, 3], 4], [NaN, 2]).finally(unlock),
            ),
        ]);
    });

    it('sync X async', async () => {
        await Promise.all([
            expect(
                lock().then(unlock => {
                    try {
                        return sync('foo');
                    } finally {
                        unlock();
                    }
                }),
            ).resolves.toBe('foo'),
            lock().then(unlock => sequence([0, 3], ['a', 5]).finally(unlock)),
            expect(
                lock().then(unlock => {
                    try {
                        return sync([null, null]);
                    } finally {
                        unlock();
                    }
                }),
            ).resolves.toStrictEqual([null, null]),
        ]);
    });

    it('with errors', async () => {
        await Promise.all([
            lock().then(unlock => sequence(['a', 9]).finally(unlock)),
            expect(
                lock().then(unlock =>
                    delay(5)
                        .then(() => fail('err'))
                        .finally(unlock),
                ),
            ).rejects.toThrow('err'),
            lock().then(unlock => sequence(['b', 11]).finally(unlock)),
            expect(
                lock().then(unlock => {
                    try {
                        fail('err');
                    } finally {
                        unlock();
                    }
                }),
            ).rejects.toThrow('err'),
            lock().then(unlock => sequence(['c', 7]).finally(unlock)),
        ]);
    });

    it('nested', () =>
        new Promise<void>(done => {
            lock().then(unlock =>
                sequence(['a', 3])
                    .then(() => {
                        // 'c' registers after 'a' ended and while 'b' is running
                        delay(2).then(() =>
                            lock()
                                .then(unlock2 => sequence(['c', 3]).finally(unlock2))
                                .then(done),
                        );
                    })
                    .finally(unlock),
            );
            lock().then(unlock => sequence(['b', 8]).finally(unlock));
        }));

    it('with keys', async () => {
        let state1: any, state2: any;

        await Promise.all([
            lock('lock1').then(async unlock => {
                state1 = 'a';
                await delay(3);
                expect(state1).toBe('a');

                state1 = 'b';
                await delay(9);
                expect(state1).toBe('b');

                state1 = 'c';
                await delay(3);
                expect(state1).toBe('c');

                unlock();
            }),
            lock('lock2').then(async unlock => {
                expect(state1).toBe('a');

                state2 = 'g';
                await delay(8);
                expect(state2).toBe('g');
                expect(state1).toBe('b');

                state2 = 'h';
                await delay(11);
                expect(state2).toBe('h');
                expect(state1).toBe('d');

                state2 = 'i';
                await delay(12);
                expect(state2).toBe('i');
                expect(state1).toBe('f');

                unlock();
            }),
            lock('lock1').then(async unlock => {
                state1 = 'd';
                await delay(8);
                expect(state1).toBe('d');

                state1 = 'e';
                await delay(4);
                expect(state1).toBe('e');

                state1 = 'f';
                await delay(2);
                expect(state1).toBe('f');

                unlock();
            }),
        ]);
    });

    // lockIds come from the outside world (e.g. transport uses USB serial numbers),
    // so keys inherited from Object.prototype must behave like any other key and
    // not read as an always-pending lock
    it('inherited object keys as lockId', async () => {
        for (const lockId of ['toString', 'constructor', '__proto__']) {
            const unlock = await lock(lockId);
            unlock();

            // and the lock is reusable after unlock
            const unlockAgain = await lock(lockId);
            unlockAgain();
        }
    });
});
