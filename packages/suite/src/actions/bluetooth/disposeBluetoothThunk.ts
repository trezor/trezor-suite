import { BLUETOOTH_PREFIX } from '@suite-common/bluetooth';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import TrezorConnect from '@trezor/connect';
import { bluetoothIpc } from '@trezor/transport-bluetooth';

export const disposeBluetoothThunk = createThunk<void, void, void>(
    `${BLUETOOTH_PREFIX}/bluetoothDisposeThunk`,
    async (_, { getState, dispatch, extra }) => {
        bluetoothIpc.removeAllListeners();
        const result = await bluetoothIpc.dispose();

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Unable to dispose Bluetooth Module.',
                }),
            );

            return;
        }

        // Reset transports so Connect can remove BluetoothTransport; TODO move to Connect somehow
        TrezorConnect.setTransports(extra.selectors.selectDebugSettings(getState()).transports);
    },
);
