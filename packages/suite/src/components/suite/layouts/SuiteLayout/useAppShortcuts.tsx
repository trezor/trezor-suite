import { selectDevice } from '@suite-common/wallet-core';
import { useEvent } from 'react-use';
import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { addWalletThunk } from 'src/actions/wallet/addWalletThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useAppShortcuts = () => {
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    useEvent('keydown', e => {
        const { altKey } = e;

        // press ALT + P to show PassphraseModal
        if (device?.connected && altKey && e.code === 'KeyP' && device) {
            dispatch(addWalletThunk({ walletType: 'passphrase' }));
            dispatch(closeModalApp());
            e.preventDefault();
        }

        // press ALT + D to show SwitchDevice
        if (altKey && e.code === 'KeyD' && device) {
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
