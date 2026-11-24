import { bluetoothActions } from '@suite-common/bluetooth';
import { createMockDeps } from '@trezor/dependency-injection';

import { type BluetoothStartScanDeps, createBluetoothStartScan } from './createBluetoothStartScan';

describe('createBluetoothStartScan', () => {
    const setup = (success: boolean) => {
        const deps = createMockDeps<BluetoothStartScanDeps>({
            dispatch: action => action,
            bluetoothIpc: {
                startScan: () =>
                    Promise.resolve(
                        success
                            ? { success: true }
                            : { success: false, error: { message: 'x', code: 'x' } },
                    ),
            },
        });

        return { run: createBluetoothStartScan(deps), deps };
    };

    it('sets scan status to running after successful IPC start', async () => {
        const { run, deps } = setup(true);
        await run();
        expect(deps.bluetoothIpc.startScan).toHaveBeenCalledWith('ui');
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.scanStatusAction({ status: 'running' }),
        );
    });

    it('does not change scan status when IPC start fails', async () => {
        const { run, deps } = setup(false);
        await run();
        expect(deps.dispatch).not.toHaveBeenCalled();
    });
});
