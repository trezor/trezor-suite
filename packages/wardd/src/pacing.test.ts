import { InMemoryWardDb } from '@trezor/ward';

import { forwardingDelay, pacedStorage } from './pacing';

afterEach(() => jest.useRealTimers());

it('holds a storage call and its reply for one second at each forwarding boundary', async () => {
    jest.useFakeTimers();
    const calls: string[] = [];
    class Storage extends InMemoryWardDb {
        getTreeState(wardId: string) {
            calls.push('read');

            return super.getTreeState(wardId);
        }
    }
    const log: unknown[][] = [];
    const storage = pacedStorage(new Storage(), (...messages) => log.push(messages), true);
    let finished = false;
    const pending = Promise.resolve(storage.getTreeState('wallet')).then(() => {
        finished = true;
    });
    await jest.advanceTimersByTimeAsync(999);
    expect(calls).toEqual([]);
    await jest.advanceTimersByTimeAsync(1);
    expect(calls).toEqual(['read']);
    expect(finished).toBe(false);
    await jest.advanceTimersByTimeAsync(999);
    expect(finished).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(finished).toBe(true);
    expect(log).toHaveLength(2);
    expect(log[0]?.[1]).toMatchObject({ delayMs: 1000 });
});

it('does not add timers or alter synchronous storage when disabled', async () => {
    jest.useFakeTimers();
    const storage = new InMemoryWardDb();
    expect(pacedStorage(storage, () => {}, false)).toBe(storage);
    await forwardingDelay(() => {}, 'test', false);
    expect(jest.getTimerCount()).toBe(0);
});

it('keeps disposal bound to the underlying provider and does not delay its internal functions', async () => {
    const disposed: string[] = [];
    class Storage extends InMemoryWardDb {
        private readonly runtime = Object.assign(() => {}, {
            [Symbol.asyncDispose]: () => Promise.resolve(disposed.push('closed')),
        });

        async dispose() {
            await this.runtime[Symbol.asyncDispose]();
        }
    }
    const storage = pacedStorage(new Storage(), () => {}, true);
    await storage.dispose?.();
    expect(disposed).toEqual(['closed']);
});
