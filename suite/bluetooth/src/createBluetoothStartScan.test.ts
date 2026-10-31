import { bluetoothActions } from '@suite-common/bluetooth';
import { createMockDeps } from '@trezor/dependency-injection';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

import { createBluetoothStartScan } from './createBluetoothStartScan';

describe('createBluetoothStartScan', () => {
    const setup = (success: boolean) => {
        const dispatch = jest.fn();
        const startScan = jest
            .spyOn(bluetoothIpc, 'startScan')
            .mockResolvedValue(
                success ? { success: true } : ({ success: false, error: 'x' } as any),
            );

        return { run: createBluetoothStartScan(createMockDeps({ dispatch })), dispatch, startScan };
    };

    afterEach(() => jest.restoreAllMocks());

    it('sets scan status to running after successful IPC start', async () => {
        const { run, dispatch, startScan } = setup(true);
        await run();
        expect(startScan).toHaveBeenCalledWith('ui');
        expect(dispatch).toHaveBeenCalledWith(
            bluetoothActions.scanStatusAction({ status: 'running' }),
        );
    });

    it('does not change scan status when IPC start fails', async () => {
        const { run, dispatch } = setup(false);
        await run();
        expect(dispatch).not.toHaveBeenCalled();
    });
});
