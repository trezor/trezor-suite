import { useEvent } from 'react-use';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';
import { KEYBOARD_CODE } from '@trezor/components';

import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { addWalletThunk } from 'src/actions/wallet/addWalletThunk';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';

import { usePassphraseModalContext } from '../../modals/ReduxModal/DeviceContextModal/PassphraseModalContext';

export const AppShortcuts = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const { setPassphraseState, setIsExisting } = usePassphraseModalContext();

    const { getDiscoveryStatus } = useDiscovery();
    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress =
        discoveryStatus !== undefined && discoveryStatus.status === 'loading';

    useEvent('keydown', e => {
        const { altKey, metaKey } = e;
        const isDeviceSelected = selectedDevice !== undefined;
        // press ALT + P to show PassphraseModal
        if (
            selectedDevice?.connected &&
            altKey &&
            e.code === KEYBOARD_CODE.KEY_P &&
            isDeviceSelected
        ) {
            setIsExisting(true);
            setPassphraseState('exists-enter-passphrase');
            dispatch(addWalletThunk({ walletType: WalletType.PASSPHRASE, device: selectedDevice }));
            dispatch(closeModalApp());
            e.preventDefault();
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
