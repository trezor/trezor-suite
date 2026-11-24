import { type ConnectionMode } from '@suite/device';
import { bluetoothActions } from '@suite-common/bluetooth';
import { createMockDeps } from '@trezor/dependency-injection';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { type BluetoothStopScanDeps, createBluetoothStopScan } from './createBluetoothStopScan';

describe('createBluetoothStopScan', () => {
    const setup = (mode: ConnectionMode, isModalOpen: boolean) => {
        const stopScan = jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });

        const deps = createMockDeps<BluetoothStopScanDeps>({
            dispatch: action => action,
            getDefaultConnectionMode: () => mode,
            getIsConnectionModalOpen: () => isModalOpen,
        });

        return { run: createBluetoothStopScan(deps), deps, stopScan };
    };

    it('keeps scanning when bluetooth mode and connection modal is open', async () => {
        const { run, deps, stopScan } = setup('bluetooth', true);
        await run();
        expect(deps.dispatch).not.toHaveBeenCalled();
        expect(stopScan).not.toHaveBeenCalled();
    });

    it.each([
        ['bluetooth', false],
        ['cable', true],
        ['cable', false],
    ] as const)('stops scanning for mode=%s modalOpen=%s', async (mode, isModalOpen) => {
        const { run, deps, stopScan } = setup(mode, isModalOpen);
        await run();
        expect(deps.dispatch).toHaveBeenCalledWith(
            bluetoothActions.scanStatusAction({ status: 'idle' }),
        );
        expect(stopScan).toHaveBeenCalledWith('ui');
    });
});
