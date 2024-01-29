import { getSynchronize } from '../src/getSynchronize';

const delay = (ms: number) =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const fail = (reason: string) => {
    throw new Error(reason);
};

describe('getSynchronize', () => {
    let state: any;
    let synchronize: ReturnType<typeof getSynchronize>;

    const sequence = async (...seq: [any, number][]) => {
        // eslint-disable-next-line no-restricted-syntax
        for (const [str, ms] of seq) {
            state = str;
            // eslint-disable-next-line no-await-in-loop
            await delay(ms);
            expect(state).toBe(str);
        }
    };

    const sync = (value: any) => (state = value);

    beforeEach(() => {
        state = 'init';
        synchronize = getSynchronize();
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
                delay(2).then(() => synchronize(() => sequence(['c', 3])));
            }),
        );
        synchronize(() => sequence(['b', 8]).then(done));
    });
});
