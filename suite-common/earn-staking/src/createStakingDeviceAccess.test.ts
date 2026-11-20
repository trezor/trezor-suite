import { mock } from '@trezor/dependency-injection';

import {
    type RunStakingDeviceCall,
    type StakingDeviceAccessDeps,
    createStakingDeviceAccess,
} from './createStakingDeviceAccess';

type PrivilegedConnect = ReturnType<StakingDeviceAccessDeps['getTrezorConnect']>;

const runDirectly: RunStakingDeviceCall = callback => callback();

// Runs one callback at a time in call order, as the mobile device mutex does.
const createSerialRunner = (): RunStakingDeviceCall => {
    let queue: Promise<unknown> = Promise.resolve();

    return callback => {
        const run = queue.then(callback);

        queue = run.catch(() => {});

        return run;
    };
};

const createDeps = (runStakingDeviceCall: RunStakingDeviceCall = runDirectly) => {
    const cancel = mock<PrivilegedConnect['cancel']>(() => {});
    const deps: StakingDeviceAccessDeps = {
        getTrezorConnect: () => ({ cancel }) as unknown as PrivilegedConnect,
        runStakingDeviceCall,
    };

    return { cancel, deps };
};

const createDeviceCall = () => {
    let finish = () => {};
    const callback = () =>
        new Promise<string>(resolve => {
            finish = () => resolve('signed');
        });

    return { callback, finish: () => finish() };
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('createStakingDeviceAccess', () => {
    it('runs the callback through the injected runner', async () => {
        const access = createStakingDeviceAccess(createDeps().deps);

        expect(await access.run('a', () => Promise.resolve('signed'))).toBe('signed');
    });

    it('lets a failing callback throw through', async () => {
        const access = createStakingDeviceAccess(createDeps().deps);

        await expect(access.run('a', () => Promise.reject(new Error('rejected')))).rejects.toThrow(
            'rejected',
        );
    });

    it('cancels the connect call only for the attempt on the device', async () => {
        const { cancel, deps } = createDeps();
        const access = createStakingDeviceAccess(deps);
        const call = createDeviceCall();

        access.cancel('a', 'tx-cancelled');

        expect(cancel).not.toHaveBeenCalled();

        const signing = access.run('a', call.callback);

        access.cancel('b', 'tx-cancelled');

        expect(cancel).not.toHaveBeenCalled();

        access.cancel('a', 'tx-timeout');

        expect(cancel).toHaveBeenCalledWith({ reason: 'tx-timeout' });

        call.finish();
        await signing;
        access.cancel('a', 'tx-cancelled');

        expect(cancel).toHaveBeenCalledTimes(1);
    });

    it('keeps a newer attempt cancellable when an older one finishes late', async () => {
        const { cancel, deps } = createDeps();
        const access = createStakingDeviceAccess(deps);
        const older = createDeviceCall();
        const newer = createDeviceCall();

        const olderSigning = access.run('a', older.callback);
        const newerSigning = access.run('b', newer.callback);

        older.finish();
        await olderSigning;
        access.cancel('a', 'tx-cancelled');

        expect(cancel).not.toHaveBeenCalled();

        access.cancel('b', 'tx-cancelled');

        expect(cancel).toHaveBeenCalledTimes(1);

        newer.finish();
        await newerSigning;
    });

    it('never cancels an attempt still queued behind another device call', async () => {
        const { cancel, deps } = createDeps(createSerialRunner());
        const access = createStakingDeviceAccess(deps);
        const running = createDeviceCall();
        const queued = createDeviceCall();

        const runningSigning = access.run('a', running.callback);
        const queuedSigning = access.run('b', queued.callback);

        await flush();
        access.cancel('b', 'tx-cancelled');

        expect(cancel).not.toHaveBeenCalled();

        running.finish();
        await runningSigning;
        await flush();
        access.cancel('b', 'tx-cancelled');

        expect(cancel).toHaveBeenCalledTimes(1);

        queued.finish();
        await queuedSigning;
    });
});
