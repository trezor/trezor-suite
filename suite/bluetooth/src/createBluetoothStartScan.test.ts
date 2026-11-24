import { bluetoothActions } from '@suite-common/bluetooth';
import { createMockDeps } from '@trezor/dependency-injection';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type BluetoothStartScanDeps, createBluetoothStartScan } from './createBluetoothStartScan';

describe('createBluetoothStartScan', () => {
    const setup = (success: boolean) => {
        const startScan = jest
            .spyOn(bluetoothIpc, 'startScan')
            .mockResolvedValue(
                success ? { success: true } : ({ success: false, error: 'x' } as any),
            );

        const deps = createMockDeps<BluetoothStartScanDeps>({
            dispatch: action => action,
        });

        return { run: createBluetoothStartScan(deps), deps, startScan };
    };

    it('sets scan status to running after successful IPC start', async () => {
        const { run, deps, startScan } = setup(true);
        await run();
        expect(startScan).toHaveBeenCalledWith('ui');
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.scanStatusAction({ status: 'running' }),
        );
    });
});
