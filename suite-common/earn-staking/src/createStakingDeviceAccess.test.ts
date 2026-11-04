import { mock } from '@trezor/dependency-injection';

import {
    type StakingDeviceAccessDeps,
    createStakingDeviceAccess,
} from './createStakingDeviceAccess';

type PrivilegedConnect = ReturnType<StakingDeviceAccessDeps['getTrezorConnect']>;

const createDeps = () => {
    const cancel = mock<PrivilegedConnect['cancel']>(() => {});
    const deps: StakingDeviceAccessDeps = {
        getTrezorConnect: () => ({ cancel }) as unknown as PrivilegedConnect,
    };

    return { cancel, deps };
};

describe('createStakingDeviceAccess', () => {
    it('runs the callback as it is', async () => {
        const access = createStakingDeviceAccess(createDeps().deps);

        expect(await access.run(() => Promise.resolve('signed'))).toBe('signed');
    });

    it('lets a failing callback throw through', async () => {
        const access = createStakingDeviceAccess(createDeps().deps);

        await expect(access.run(() => Promise.reject(new Error('rejected')))).rejects.toThrow(
            'rejected',
        );
    });

    it('cancels the connect call only while a callback is on the device', async () => {
        const { cancel, deps } = createDeps();
        const access = createStakingDeviceAccess(deps);
        let finishSigning = () => {};

        access.cancel('tx-cancelled');

        expect(cancel).not.toHaveBeenCalled();

        const signing = access.run(
            () =>
                new Promise<string>(resolve => {
                    finishSigning = () => resolve('signed');
                }),
        );

        access.cancel('tx-timeout');

        expect(cancel).toHaveBeenCalledWith({ reason: 'tx-timeout' });

        finishSigning();
        await signing;
        access.cancel('tx-cancelled');

        expect(cancel).toHaveBeenCalledTimes(1);
    });
});
