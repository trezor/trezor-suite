import { getSynchronize } from '../src/getSynchronize';
import { mockTime, unmockTime } from './utils/mockTime';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fail = (reason: string) => {
    throw new Error(reason);
};

describe('getSynchronize', () => {
    let state: any;
    let synchronize: ReturnType<typeof getSynchronize>;

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
        synchronize = getSynchronize();

        mockTime();
    });

    afterEach(() => {
        unmockTime();
    });

    it('basic', async () => {
        await Promise.all([
            synchronize(() => sequence(['init', 3], [42, 9], [null, 3])),
            synchronize(() => sequence(['init', 5], ['boo', 3], [{ foo: 'bar' }, 6])),
            synchronize(() => sequence([undefined, 8], [[1, 2, 3], 4], [NaN, 2])),
        ]);
    });

    it('sync X async', async () => {
        await Promise.all([
            expect(synchronize(() => sync('foo'))).resolves.toBe('foo'),
            synchronize(() => sequence([0, 3], ['a', 5])),
            expect(synchronize(() => sync([null, null]))).resolves.toStrictEqual([null, null]),
        ]);
    });

    it('with errors', async () => {
        await Promise.all([
            synchronize(() => sequence(['a', 9])),
            expect(synchronize(() => delay(5).then(() => fail('err')))).rejects.toThrow('err'),
            synchronize(() => sequence(['b', 11])),
            expect(synchronize(() => fail('err'))).rejects.toThrow('err'),
            synchronize(() => sequence(['c', 7])),
        ]);
    });

    it('nested', done => {
        synchronize(() =>
            sequence(['a', 3]).then(() => {
                // 'c' registers after 'a' ended and while 'b' is running
                delay(2).then(() => synchronize(() => sequence(['c', 3])).then(done));
            }),
        );
        synchronize(() => sequence(['b', 8]));
    });

    it('with keys', async () => {
        let state1: any, state2: any;

        await Promise.all([
            synchronize(async () => {
                state1 = 'a';
                await delay(3);
                expect(state1).toBe('a');

                state1 = 'b';
                await delay(9);
                expect(state1).toBe('b');

                state1 = 'c';
                await delay(3);
                expect(state1).toBe('c');
            }, 'lock1'),
            synchronize(async () => {
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
            }, 'lock2'),
            synchronize(async () => {
                state1 = 'd';
                await delay(8);
                expect(state1).toBe('d');

                state1 = 'e';
                await delay(4);
                expect(state1).toBe('e');

                state1 = 'f';
                await delay(2);
                expect(state1).toBe('f');
            }, 'lock1'),
        ]);
    });
});
