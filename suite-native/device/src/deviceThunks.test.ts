import { deviceInitialState } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import TrezorConnect from '@trezor/connect';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { recoverWalletThunk } from './deviceThunks';

jest.mock('@suite-native/device-mutex', () => ({
    ...jest.requireActual('@suite-native/device-mutex'),
    requestPrioritizedDeviceAccess: async (deviceCallback: () => unknown) => ({
        success: true,
        payload: await deviceCallback(),
    }),
}));

const device = mockSuiteDevice({ id: 'device-id', path: '1' });
const clearXPubHashesAction = persistentDeviceDataActions.clearEntropyCheckXPubHashes({
    deviceId: 'device-id',
});

const recoverWallet = async () => {
    const state = {
        device: { ...deviceInitialState, devices: [device], selectedDevice: device },
    };
    const getState = () => state;
    const { actions, dispatch } = createMockDispatch({ getState, extra: undefined });

    await dispatch(recoverWalletThunk());

    return actions;
};

describe(recoverWalletThunk.typePrefix, () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('clears entropy check xpub hashes before discovery after a successful recovery', async () => {
        jest.spyOn(TrezorConnect, 'recoveryDevice').mockResolvedValue({
            success: true,
            payload: { message: 'Success' },
        });
        const actions = await recoverWallet();

        const clearIndex = actions.findIndex(
            action => (action as { type: string }).type === clearXPubHashesAction.type,
        );
        const fulfilledIndex = actions.findIndex(
            action => (action as { type: string }).type === recoverWalletThunk.fulfilled.type,
        );
        expect(actions[clearIndex]).toEqual(clearXPubHashesAction);
        expect(clearIndex).toBeLessThan(fulfilledIndex);
    });

    it('keeps entropy check xpub hashes after a failed recovery', async () => {
        jest.spyOn(TrezorConnect, 'recoveryDevice').mockResolvedValue({
            success: false,
            error: { code: 'Failure_ActionCancelled', message: 'Cancelled' },
        });
        const actions = await recoverWallet();

        expect(actions).not.toContainEqual(clearXPubHashesAction);
    });
});
