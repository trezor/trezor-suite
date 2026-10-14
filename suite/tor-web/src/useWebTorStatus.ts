import { useEffect } from 'react';

import { TorStatus, getIsTorDomain, torActions } from '@suite/tor';
import { useServices } from '@trezor/dependency-injection';
import { getLocationHostname, isWeb } from '@trezor/env-utils';
import { injectDispatch } from '@trezor/redux-utils';

type UseWebTorStatusParams = {
    onStatusChange: (params: { status: TorStatus }) => void;
};

// On web there is no Tor daemon to control; the status is derived purely from
// whether the app is being served over an `.onion` domain.
export const useWebTorStatus = ({ onStatusChange }: UseWebTorStatusParams) => {
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        if (!isWeb()) {
            return;
        }

        const isTorDomain = getIsTorDomain(getLocationHostname());
        const newTorStatus = isTorDomain ? TorStatus.Enabled : TorStatus.Disabled;

        dispatch(torActions.setTorStatus(newTorStatus));
        onStatusChange({ status: newTorStatus });
    }, [dispatch, onStatusChange]);
};
