import { createDeviceInstanceThunk, selectDevice } from '@suite-common/wallet-core';
import { useEvent } from 'react-use';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useAppShortcuts = () => {
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    useEvent('keydown', e => {
        const modKey = e.metaKey; // CMD or Ctrl key

        // press CMD + P to show PassphraseModal
        if (modKey && e.key === 'p' && device) {
            dispatch(createDeviceInstanceThunk({ device, useEmptyPassphrase: false }));
            e.preventDefault(); // prevent default behavior
        }

        // press CMD + D to show SwitchDevice
        if (modKey && e.key === 'd' && device) {
            dispatch(
                goto('suite-switch-device', {
                    params: {
                        cancelable: true,
                    },
                }),
            );
            e.preventDefault(); // prevent default behavior
        }
    });
};
