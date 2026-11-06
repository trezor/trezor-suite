import { bluetoothActions } from '@suite-common/bluetooth';
import { createMockDeps } from '@trezor/dependency-injection';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { createBluetoothStopScan } from './createBluetoothStopScan';

describe('createBluetoothStopScan', () => {
    const setup = (mode: 'cable' | 'bluetooth', isModalOpen: boolean) => {
        const dispatch = jest.fn();
        const stopScan = jest.spyOn(bluetoothIpc, 'stopScan').mockResolvedValue({ success: true });
        const run = createBluetoothStopScan(
            createMockDeps({
                dispatch,
                getDefaultConnectionMode: () => mode,
                getIsConnectionModalOpen: () => isModalOpen,
            }),
        );

        return { run, dispatch, stopScan };
    };

    afterEach(() => jest.restoreAllMocks());

    it('keeps scanning when bluetooth mode and connection modal is open', async () => {
        const { run, dispatch, stopScan } = setup('bluetooth', true);
        await run();
        expect(dispatch).not.toHaveBeenCalled();
        expect(stopScan).not.toHaveBeenCalled();
    });

    it.each([
        ['bluetooth', false],
        ['cable', true],
        ['cable', false],
    ] as const)('stops scanning for mode=%s modalOpen=%s', async (mode, isModalOpen) => {
        const { run, dispatch, stopScan } = setup(mode, isModalOpen);
        await run();
        expect(dispatch).toHaveBeenCalledWith(
            bluetoothActions.scanStatusAction({ status: 'idle' }),
        );
        expect(stopScan).toHaveBeenCalledWith('ui');
    });
});
