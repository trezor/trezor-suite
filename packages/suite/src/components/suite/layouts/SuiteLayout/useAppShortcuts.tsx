import { selectDevice } from '@suite-common/wallet-core';
import { useEvent } from 'react-use';
import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { addWalletThunk } from 'src/actions/wallet/addWalletThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useAppShortcuts = () => {
    const selectedDevice = useSelector(selectDevice);
    const dispatch = useDispatch();

    useEvent('keydown', e => {
        const { altKey } = e;

        // press ALT + P to show PassphraseModal
        if (selectedDevice?.connected && altKey && e.code === 'KeyP' && selectedDevice) {
            dispatch(addWalletThunk({ walletType: 'passphrase', device: selectedDevice }));
            dispatch(closeModalApp());
            e.preventDefault();
        }

        // press ALT + D to show SwitchDevice
        if (altKey && e.code === 'KeyD' && selectedDevice) {
            dispatch(
                goto('suite-switch-device', {
                    params: {
                        cancelable: true,
                    },
                }),
            );
            e.preventDefault();
        }
    });
};
