import { type ConnectionMode } from '@suite/device';
import { bluetoothActions } from '@suite-common/bluetooth';
import { createMockDeps } from '@trezor/dependency-injection';

import { type BluetoothStopScanDeps, createBluetoothStopScan } from './createBluetoothStopScan';

describe('createBluetoothStopScan', () => {
    const setup = (mode: ConnectionMode, isModalOpen: boolean) => {
        const deps = createMockDeps<BluetoothStopScanDeps>({
            dispatch: action => action,
            bluetoothIpc: {
                stopScan: () => Promise.resolve({ success: true }),
            },
            getDefaultConnectionMode: () => mode,
            getIsConnectionModalOpen: () => isModalOpen,
        });

        return { run: createBluetoothStopScan(deps), deps };
    };

    it('keeps scanning when bluetooth mode and connection modal is open', async () => {
        const { run, deps } = setup('bluetooth', true);
        await run();
        expect(deps.dispatch).not.toHaveBeenCalled();
        expect(deps.bluetoothIpc.stopScan).not.toHaveBeenCalled();
    });

    it.each([
        ['bluetooth', false],
        ['cable', true],
        ['cable', false],
    ] as const)('stops scanning for mode=%s modalOpen=%s', async (mode, isModalOpen) => {
        const { run, deps } = setup(mode, isModalOpen);
        await run();
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.scanStatusAction({ status: 'idle' }),
        );
        expect(deps.bluetoothIpc.stopScan).toHaveBeenCalledWith('ui');
    });
});
