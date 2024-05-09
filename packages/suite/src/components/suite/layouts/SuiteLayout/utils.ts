import { createDeviceInstance, selectDevice } from '@suite-common/wallet-core';
import { useEvent } from 'react-use';
import { goto } from 'src/actions/suite/routerActions';
import { useCustomBackends } from 'src/hooks/settings/backends';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const customBackends = useCustomBackends();

    return customBackends.filter(backend => enabledNetworks.includes(backend.coin));
};

export const useAppShortcuts = () => {
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    useEvent('keydown', e => {
        const modKey = e.metaKey; // CMD or Ctrl key

        // press CMD + P to show PassphraseModal
        if (modKey && e.key === 'p' && device) {
            dispatch(createDeviceInstance({ device }));
            e.preventDefault(); // prevent default behaviour
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
            e.preventDefault(); // prevent default behaviour
        }
    });
};
