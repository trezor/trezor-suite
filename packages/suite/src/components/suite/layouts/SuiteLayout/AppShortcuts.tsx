import { useEvent } from 'react-use';

import { selectSelectedDevice, startDiscoveryThunk } from '@suite-common/wallet-core';
import { KEYBOARD_CODE } from '@trezor/components';

import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

export const AppShortcuts = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress =
        discoveryStatus !== undefined && discoveryStatus.status === 'loading';

    useEvent('keydown', e => {
        const { altKey, metaKey } = e;
        const isDeviceSelected = selectedDevice !== undefined;
        // press ALT + P to show PassphraseModal
        if (
            selectedDevice?.connected &&
            (altKey || metaKey) &&
            e.code === KEYBOARD_CODE.KEY_P &&
            isDeviceSelected
        ) {
            dispatch(closeModalApp());
            e.preventDefault();
            dispatch(
                startDiscoveryThunk({
                    device: selectedDevice,
                    isAddingHiddenWallet: true,
                    isAddingExistingWallet: true,
                }),
            );
        }

        // press ALT + D to show SwitchDevice
        if (altKey && e.code === KEYBOARD_CODE.KEY_D && isDeviceSelected) {
            if (!discoveryInProgress) {
                dispatch(goto('suite-switch-device', { params: { cancelable: true } }));
            }

            // Firefox has default ALT+D shortcut to open address bar so we want to prevent that
            // anyway (even when we are doing nothing due to running discovery) to avoid inconsistent behavior
            e.preventDefault();
        }

        // press CMD + , to show Settings
        if (metaKey && e.code === KEYBOARD_CODE.COMMA && isDeviceSelected) {
            dispatch(goto('settings-index'));
            e.preventDefault();
        }
    });

    return null;
};
