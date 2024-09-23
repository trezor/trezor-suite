import { scheduleAction } from '../src/scheduleAction';
import { mockTime, unmockTime } from './utils/mockTime';

const ERR_SIGNAL = 'Aborted by signal';
const ERR_DEADLINE = 'Aborted by deadline';
const ERR_TIMEOUT = 'Aborted by timeout';

const MAX_LISTENERS = 6; // scheduleAction should never use more than six abort listeners in parallel

describe('scheduleAction', () => {
    const spyAdd = jest.spyOn(AbortSignal.prototype, 'addEventListener');
    const spyRemove = jest.spyOn(AbortSignal.prototype, 'removeEventListener');

    const checkListeners = () => {
        const addings = spyAdd.mock.invocationCallOrder;
        const removals = spyRemove.mock.invocationCallOrder;

        let [a, r] = [0, 0];
        while (a < addings.length && r < removals.length) {
            if (addings[a] < removals[r]) a++;
            else r++;
            if (a - r > MAX_LISTENERS) return `More than ${MAX_LISTENERS} simultaneous listeners`;
            if (r > a) return `More listeners removed than added (shouldn't happen)`;
        }

        if (addings.length !== removals.length)
            return `${addings.length - removals.length} listeners not cleaned`;
    };

    beforeEach(() => {
        mockTime();
    });

    afterEach(() => {
        unmockTime();
        jest.clearAllMocks();
    });

    it('delay', done => {
        const spy = jest.fn(() => Promise.resolve());
        scheduleAction(spy, { delay: 1000 });
        expect(spy).toHaveBeenCalledTimes(0);

        setTimeout(() => {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(checkListeners()).toBeUndefined();
            done();
        }, 1005);
    });

    it('delay aborted', done => {
        const aborter = new AbortController();
        const spy = jest.fn(() => Promise.resolve());
        scheduleAction(spy, { delay: 1000, signal: aborter.signal }).catch(e => {
            expect(e.message).toMatch(ERR_SIGNAL);
            expect(spy).toHaveBeenCalledTimes(0);
            expect(checkListeners()).toBeUndefined();
            done();
        });

        aborter.abort();
    });

    it('deadline on always failing action', async () => {
        const spy = jest.fn(() => {
            throw new Error('Runtime error');
        });

        await expect(() => scheduleAction(spy, { deadline: Date.now() + 1000 })).rejects.toThrow(
            ERR_DEADLINE,
        );

        // more thant 100 attempts
        expect(spy.mock.calls.length).toBeGreaterThanOrEqual(100);
        expect(checkListeners()).toBeUndefined();
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

        await expect(() =>
            scheduleAction(spy, { deadline: Date.now() + 1000, signal: aborter.signal }),
        ).rejects.toThrow(ERR_SIGNAL);

        expect(spy).toHaveBeenCalledTimes(3);
        await Promise.resolve(); // let the last event listener clear itself
        expect(checkListeners()).toBeUndefined();
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

        const result = await scheduleAction(spy, { deadline: Date.now() + 1000 });

        expect(result).toEqual('Foo');

        expect(spy).toHaveBeenCalledTimes(3);
        expect(checkListeners()).toBeUndefined();
    });

    it('attempt timeout', async () => {
        const spy = jest.fn(
            (signal?: AbortSignal) =>
                new Promise((_, reject) => {
                    const onAbort = () => {
                        signal?.removeEventListener('abort', onAbort);
                        reject(new Error('Runtime error'));
                    };
                    signal?.addEventListener('abort', onAbort);
                }),
        );
        await expect(() => scheduleAction(spy, { timeout: 500 })).rejects.toThrow(ERR_TIMEOUT);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(checkListeners()).toBeUndefined();
    });

    it('attempt timeout aborted', async () => {
        const aborter = new AbortController();
        const spy = jest.fn(
            () =>
                new Promise(resolve => {
                    setTimeout(resolve, 1000);
                }),
        );

        const start = Date.now();
        const promise = scheduleAction(spy, { timeout: 300, signal: aborter.signal });

        // abort before timeout
        setTimeout(() => aborter.abort(), 300);

        await expect(promise).rejects.toThrow(ERR_SIGNAL);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(Date.now() - start).toBeLessThanOrEqual(350);
        expect(checkListeners()).toBeUndefined();
    });

    it('attempt failure handler', async () => {
        const spy = jest.fn(
            (signal?: AbortSignal) =>
                new Promise<any>((_, reject) => {
                    signal?.addEventListener('abort', () => reject(new Error('Runtime error')));
                }),
        );
        let i = 0;
        await expect(() =>
            scheduleAction(spy, {
                timeout: 500,
                attempts: 5,
                attemptFailureHandler: () => {
                    if (i > 1) {
                        // throw on 3rd attempt
                        throw new Error('Unexpected');
                    }
                    i++;
                },
            }),
        ).rejects.toThrow('Unexpected');
        expect(spy).toHaveBeenCalledTimes(3);

        i = 0;
        spy.mockClear();
        await expect(() =>
            scheduleAction(spy, {
                timeout: 500,
                attempts: 5,
                attemptFailureHandler: () => {
                    if (i > 1) {
                        // return error on 3rd attempt
                        return new Error('Unexpected');
                    }
                    i++;
                },
            }),
        ).rejects.toThrow('Unexpected');
        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('deadline with attempt timeout', async () => {
        const spy = jest.fn(
            (signal?: AbortSignal) =>
                new Promise<any>((_, reject) => {
                    const onAbort = () => {
                        signal?.removeEventListener('abort', onAbort);
                        reject(new Error('Runtime error'));
                    };
                    signal?.addEventListener('abort', onAbort);
                }),
        );
        await expect(() =>
            scheduleAction(spy, { deadline: Date.now() + 2000, timeout: 500 }),
        ).rejects.toThrow(ERR_DEADLINE);
        expect(spy).toHaveBeenCalledTimes(4); // 4 attempts till deadline, each timeouted after 500 ms
        await Promise.resolve(); // let the last event listener clear itself
        expect(checkListeners()).toBeUndefined();
    });

    it('max attempts', async () => {
        const spy = jest.fn(() => {
            throw new Error('Runtime error');
        });

        await expect(() => scheduleAction(spy, { timeout: 500, attempts: 2 })).rejects.toThrow(
            /Runtime error/,
        );

        expect(spy).toHaveBeenCalledTimes(2);
        expect(checkListeners()).toBeUndefined();
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
        expect(checkListeners()).toBeUndefined();
    });

    it('variable timeouts', async () => {
        const TIMEOUTS = [50, 150, 100];
        const MARGIN = 10;

        const times: number[] = [Date.now()];
        const action = (signal?: AbortSignal) => {
            const onAbort = () => {
                times.push(Date.now());
                signal?.removeEventListener('abort', onAbort);
            };
            signal?.addEventListener('abort', onAbort);

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
        expect(checkListeners()).toBeUndefined();
    });
});
