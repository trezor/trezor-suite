import { bluetoothActions } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { createBluetoothForgetDevice } from './createBluetoothForgetDevice';
import { setIsUnpairingDevice } from './desktopBluetoothReducer';

const bluetoothId = asBluetoothDeviceId('bt-id');

describe('createBluetoothForgetDevice', () => {
    const setup = (forgetSuccess: boolean) => {
        const dispatch = jest.fn();
        const disconnectDevice = jest.fn().mockResolvedValue(undefined);
        jest.spyOn(bluetoothIpc, 'forgetDevice').mockResolvedValue(
            forgetSuccess ? { success: true } : ({ success: false, error: 'x' } as any),
        );
        const forget = createBluetoothForgetDevice(createMockDeps({ dispatch, disconnectDevice }));

        return { forget, dispatch, disconnectDevice };
    };

    afterEach(() => jest.restoreAllMocks());

    it('disconnects first unless skipDisconnect is set', async () => {
        const a = setup(true);
        await a.forget({ bluetoothId });
        expect(a.disconnectDevice).toHaveBeenCalledWith(bluetoothId);

        const b = setup(true);
        await b.forget({ bluetoothId, skipDisconnect: true });
        expect(b.disconnectDevice).not.toHaveBeenCalled();
    });

    it('toggles unpairing flag and removes the known device on success', async () => {
        const { forget, dispatch } = setup(true);
        await forget({ bluetoothId });
        expect(dispatch.mock.calls.map(c => c[0])).toEqual([
            setIsUnpairingDevice({ isUnpairing: true }),
            setIsUnpairingDevice({ isUnpairing: false }),
            bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }),
        ]);
    });

    it('requires OS unpairing when forget fails and OS unpairing is not finished', async () => {
        const { forget, dispatch } = setup(false);
        await forget({ bluetoothId, skipToggleModalConnection: true });
        expect(dispatch).toHaveBeenCalledWith(
            bluetoothActions.setIsDeviceOsUnpairingRequired(true, {
                skipToggleModalConnection: true,
            }),
        );
        expect(dispatch).toHaveBeenCalledWith(
            bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }),
        );
    });

    it('does not require OS unpairing when forget fails but OS unpairing is finished', async () => {
        const { forget, dispatch } = setup(false);
        await forget({ bluetoothId, isOsUnpairingFinished: true });
        expect(dispatch).not.toHaveBeenCalledWith(
            bluetoothActions.setIsDeviceOsUnpairingRequired(true, expect.anything()),
        );
        expect(dispatch).toHaveBeenCalledWith(
            bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }),
        );
    });
});
