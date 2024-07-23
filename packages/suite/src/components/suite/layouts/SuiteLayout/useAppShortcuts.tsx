import { selectDevice } from '@suite-common/wallet-core';
import { useEvent } from 'react-use';
import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { addWalletThunk } from 'src/actions/wallet/addWalletThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { KEYBOARD_CODE } from '@trezor/components';

export const useAppShortcuts = () => {
    const selectedDevice = useSelector(selectDevice);
    const dispatch = useDispatch();

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
            dispatch(addWalletThunk({ walletType: 'passphrase', device: selectedDevice }));
            dispatch(closeModalApp());
            e.preventDefault();
        }

        // press ALT + D to show SwitchDevice
        if (altKey && e.code === KEYBOARD_CODE.KEY_D && isDeviceSelected) {
            dispatch(
                goto('suite-switch-device', {
                    params: {
                        cancelable: true,
                    },
                }),
            );
            e.preventDefault();
        }

        // press CMD + , to show Settings
        if (metaKey && e.code === KEYBOARD_CODE.COMMA && isDeviceSelected) {
            dispatch(goto('settings-index'));
            e.preventDefault();
        }
    });
};
