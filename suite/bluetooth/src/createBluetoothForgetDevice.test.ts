import { bluetoothActions } from '@suite-common/bluetooth';
import { asBluetoothDeviceId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import {
    type BluetoothForgetDeviceDeps,
    createBluetoothForgetDevice,
} from './createBluetoothForgetDevice';
import { setIsUnpairingDevice } from './desktopBluetoothReducer';

const bluetoothId = asBluetoothDeviceId('bt-id');

describe('createBluetoothForgetDevice', () => {
    const setup = (
        forgetSuccess: boolean,
        disconnectDevice: BluetoothForgetDeviceDeps['disconnectDevice'] = () => Promise.resolve(),
    ) => {
        const deps = createMockDeps<BluetoothForgetDeviceDeps>({
            dispatch: action => action,
            disconnectDevice,
            bluetoothIpc: {
                forgetDevice: () =>
                    Promise.resolve(
                        forgetSuccess
                            ? { success: true }
                            : { success: false, error: { message: 'x', code: 'x' } },
                    ),
            },
        });

        return { forget: createBluetoothForgetDevice(deps), deps };
    };

    it('waits for disconnect before forgetting unless skipDisconnect is set', async () => {
        const disconnect = createDeferred<void>();
        const a = setup(true, () => disconnect.promise);
        const pendingForget = a.forget({ bluetoothId });

        expect(a.deps.disconnectDevice).toHaveBeenCalledWith(bluetoothId);
        expect(a.deps.bluetoothIpc.forgetDevice).not.toHaveBeenCalled();

        disconnect.resolve();
        await pendingForget;
        expect(a.deps.bluetoothIpc.forgetDevice).toHaveBeenCalledWith(bluetoothId);

        const b = setup(true);
        await b.forget({ bluetoothId, skipDisconnect: true });
        expect(b.deps.disconnectDevice).not.toHaveBeenCalled();
        expect(b.deps.bluetoothIpc.forgetDevice).toHaveBeenCalledWith(bluetoothId);
    });

    it('toggles unpairing flag and removes the known device on success', async () => {
        const { forget, deps } = setup(true);
        await forget({ bluetoothId });
        expect(deps.dispatch.mock.calls.map(c => c[0])).toEqual([
            setIsUnpairingDevice({ isUnpairing: true }),
            setIsUnpairingDevice({ isUnpairing: false }),
            bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }),
        ]);
    });

    it('requires OS unpairing when forget fails and OS unpairing is not finished', async () => {
        const { forget, deps } = setup(false);
        await forget({ bluetoothId, skipToggleModalConnection: true });
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.setIsDeviceOsUnpairingRequired(true, {
                skipToggleModalConnection: true,
            }),
        );
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }),
        );
    });

    it('does not require OS unpairing when forget fails but OS unpairing is finished', async () => {
        const { forget, deps } = setup(false);
        await forget({ bluetoothId, isOsUnpairingFinished: true });
        expect(deps.dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: bluetoothActions.setIsDeviceOsUnpairingRequired.type,
            }),
        );
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.removeKnownDeviceAction({ id: bluetoothId }),
        );
    });
});
