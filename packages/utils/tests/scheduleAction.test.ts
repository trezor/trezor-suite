import { scheduleAction } from '../src/scheduleAction';

const ERR_SIGNAL = 'Aborted by signal';
const ERR_DEADLINE = 'Aborted by deadline';
const ERR_TIMEOUT = 'Aborted by timeout';

describe('scheduleAction', () => {
    it('delay', done => {
        const spy = jest.fn(() => Promise.resolve());
        scheduleAction(spy, { delay: 1000 });
        expect(spy).toHaveBeenCalledTimes(0);

        setTimeout(() => {
            expect(spy).toHaveBeenCalledTimes(1);
            done();
        }, 1005);
    });

    it('delay aborted', done => {
        const aborter = new AbortController();
        const spy = jest.fn(() => Promise.resolve());
        scheduleAction(spy, { delay: 1000, signal: aborter.signal }).catch(e => {
            expect(e.message).toMatch(ERR_SIGNAL);
            expect(spy).toHaveBeenCalledTimes(0);
            done();
        });

        aborter.abort();
    });

    it('deadline on always failing action', async () => {
        const spy = jest.fn(() => {
            throw new Error('Runtime error');
        });

        // note: allow certain errors?
        await expect(() => scheduleAction(spy, { deadline: Date.now() + 1000 })).rejects.toThrow(
            ERR_DEADLINE,
        );

        // more thant 100 attempts
        expect(spy.mock.calls.length).toBeGreaterThanOrEqual(100);
    });

    it('deadline aborted after 3rd attempt', async () => {
        let i = 0;
        const aborter = new AbortController();
        const spy = jest.fn(() => {
            if (i >= 2) {
                // abort on third attempt
                aborter.abort();
            }
            i++;
            throw new Error('Runtime error');
        });

        // note: allow certain errors?
        await expect(() =>
            scheduleAction(spy, { deadline: Date.now() + 1000, signal: aborter.signal }),
        ).rejects.toThrow(ERR_SIGNAL);

        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('deadline resolved after 3rd attempt', async () => {
        let i = 0;
        const spy = jest.fn(() => {
            if (i >= 2) {
                return Promise.resolve('Foo');
            }
            i++;
            throw new Error('Runtime error');
        });

        // note: allow certain errors?
        const result = await scheduleAction(spy, { deadline: Date.now() + 1000 });

        expect(result).toEqual('Foo');

        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('attempt timeout', async () => {
        const spy = jest.fn(
            (signal?: AbortSignal) =>
                new Promise((_, reject) => {
                    signal?.addEventListener('abort', () => reject(new Error('Runtime error')));
                }),
        );
        await expect(() => scheduleAction(spy, { timeout: 500 })).rejects.toThrow(ERR_TIMEOUT);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('attempt timeout aborted', done => {
        const aborter = new AbortController();
        const spy = jest.fn(
            () =>
                new Promise(resolve => {
                    setTimeout(resolve, 1000);
                }),
        );

        const start = Date.now();
        scheduleAction(spy, { timeout: 300, signal: aborter.signal }).catch(e => {
            expect(e.message).toMatch(ERR_SIGNAL);
            expect(spy).toHaveBeenCalledTimes(1);
            expect(Date.now() - start).toBeLessThanOrEqual(305);

            done();
        });

        // abort before timeout
        setTimeout(() => aborter.abort(), 300);
    });

    it('deadline with attempt timeout', async () => {
        const spy = jest.fn(
            (signal?: AbortSignal) =>
                new Promise<any>((_, reject) => {
                    signal?.addEventListener('abort', () => reject(new Error('Runtime error')));
                }),
        );
        await expect(() =>
            scheduleAction(spy, { deadline: Date.now() + 2000, timeout: 500 }),
        ).rejects.toThrow(ERR_DEADLINE);
        expect(spy).toHaveBeenCalledTimes(4); // 4 attempts till deadline, each timeouted after 500 ms
    });

    it('max attempts', async () => {
        const spy = jest.fn(() => {
            throw new Error('Runtime error');
        });

        await expect(() => scheduleAction(spy, { timeout: 500, attempts: 2 })).rejects.toThrow(
            /Runtime error/,
        );

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("don't abort after success", async () => {
        let signal: AbortSignal | undefined;
        const action = (sig?: AbortSignal) => {
            signal = sig;
            return Promise.resolve(true);
        };
        const result = await scheduleAction(action, {});
        expect(result).toBe(true);
        expect(signal?.aborted).toBe(false);
    });

    it('variable timeouts', async () => {
        const TIMEOUTS = [50, 150, 100];
        const MARGIN = 10;

        const times: number[] = [Date.now()];
        const action = (signal?: AbortSignal) => {
            signal?.addEventListener('abort', () => times.push(Date.now()));
            return new Promise(() => {});
        };

        await expect(() =>
            scheduleAction(action, {
                attempts: TIMEOUTS.map(timeout => ({ timeout })),
            }),
        ).rejects.toThrow(ERR_TIMEOUT);

        expect(times.length).toEqual(TIMEOUTS.length + 1);
        for (let i = 0; i < TIMEOUTS.length; i++) {
            const diff = times[i + 1] - times[i];
            expect(diff).toBeGreaterThanOrEqual(TIMEOUTS[i] - MARGIN);
            expect(diff).toBeLessThanOrEqual(TIMEOUTS[i] + MARGIN);
        }
    });
});
